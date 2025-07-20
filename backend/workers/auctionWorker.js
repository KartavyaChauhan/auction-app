const { Queue, Worker } = require("bullmq");
const Auction = require("../models/Auction");
const { io } = require("../server");

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
};

const auctionQueue = new Queue("auctionQueue", { connection: redisConnection });

const worker = new Worker(
  "auctionQueue",
  async (job) => {
    try {
      const { auctionId } = job.data;
      console.log(`Processing job for auction ${auctionId} at ${new Date()}`);      const auction = await Auction.findById(auctionId);
      console.log(`📄 Auction data:`, {
        id: auction?._id,
        currentPrice: auction?.currentPrice,
        highestBidder: auction?.highestBidder,
        status: auction?.status
      });
      
      if (!auction) {
        console.warn(`Auction ${auctionId} not found`);
        return;
      }

      const now = new Date();
      console.log(`Expiration check: ${auction.expirationTime} <= ${now}`);
      if (
        new Date(auction.expirationTime) <= now &&
        auction.status === "active"
      ) {
        auction.status = "ended";
        const winner = auction.highestBidder || 'No winner';
        await auction.save();        console.log(`Auction ${auctionId} ended. Winner: ${winner}`);

        try {
          // Get a fresh reference to io to avoid circular dependency issues
          const server = require('../server');
          if (server && server.io) {
            server.io.to(`auction_${auctionId}`).emit("auctionEnded", {
              auctionId,
              status: "ended",
              winner,
              finalPrice: auction.currentPrice,
              title: auction.title
            });
            console.log(`✅ Notified clients about auction end`);
          } else {
            console.log(`⚠️ Socket.IO not available`);
          }
        } catch (ioError) {
          console.log(`⚠️ Could not notify clients: ${ioError.message}`);
        }
      }
    } catch (error) {
      console.error(`Error processing job for auction ${job.data.auctionId}: ${error.message}`);
    }
  },
  { connection: redisConnection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed for auction ${job.data.auctionId}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed for auction ${job.data.auctionId}: ${err.message}`);
});

const scheduleAuctionChecks = async () => {
  try {
    console.log('🔄 Starting to schedule auction checks...');
    const activeAuctions = await Auction.find({ status: "active" });
    console.log(`📋 Found ${activeAuctions.length} active auctions`);
    
    // FOR TESTING: Also check ended auctions to test winner display
    const endedAuctions = await Auction.find({ status: "ended" });
    console.log(`📋 Found ${endedAuctions.length} ended auctions for testing`);
    
    for (const auction of activeAuctions) {
      const delay = new Date(auction.expirationTime) - new Date();
      console.log(`⏰ Auction ${auction._id} expires in ${delay}ms`);
      
      if (delay > 0) {
        await auctionQueue.add('checkAuction', { auctionId: auction._id }, { delay });
        console.log(`Scheduled check for auction ${auction._id} in ${delay}ms`);
      } else {
        await auctionQueue.add('checkAuction', { auctionId: auction._id }, { delay: 0 }); // Immediate for expired
        console.log(`Immediate check for expired auction ${auction._id}`);
      }
    }
  } catch (error) {
    console.error(`Error scheduling auction checks: ${error.message}`);
  }
};

// Initial scheduling
(async () => {
  await scheduleAuctionChecks(); // Run on startup
})();

module.exports = { auctionQueue, scheduleAuctionChecks };
