const Auction = require('../models/Auction');
const { auctionQueue } = require('../workers/auctionWorker'); // Added import for auctionQueue

const logger = require('../utils/logger');
const setupAuctionSockets = (io) => {
  io.on('connection', (socket) => {
    socket.on('joinAuction', async (auctionId) => {
      socket.join(`auction_${auctionId}`);
      logger.info(`User ${socket.id} joined auction ${auctionId}`);

      try {
        const auction = await Auction.findById(auctionId).lean();
        if (!auction) return;

        // Ensure the correct auction details are emitted only to the specific client
        if (auction.status === 'ended') {
          socket.emit('auctionEnded', {
            auctionId: auction._id,
            title: auction.title, // send the correct auction name
            winner: auction.highestBidder || 'No bids',
            finalPrice: auction.currentPrice || auction.basePrice,
          });
        }
      } catch (err) {
        logger.error('Error checking auction on join: ' + err.message);
      }
    });

    const Bid = require('../models/Bid');
    socket.on('placeBid', async ({ auctionId, amount, userId }) => {
      logger.info(`Received placeBid: auctionId=${auctionId}, amount=${amount}, userId=${userId}`);
      try {
        const auction = await Auction.findById(auctionId);
        logger.info('Found auction: ' + JSON.stringify(auction));
        if (!auction || auction.status === 'ended') {
          socket.emit('bidError', 'Auction not found or has ended');
          return;
        }
        if (new Date(auction.expirationTime) <= Date.now()) {
          socket.emit('bidError', 'Auction has expired');
          return;
        }
        const currentPrice = auction.currentPrice || auction.basePrice;
        if (amount <= currentPrice) {
          socket.emit('bidError', 'Bid must be higher than current price');
          return;
        }
        if (amount > currentPrice + 100) {
          socket.emit('bidError', 'Bid increment exceeds maximum of $100');
          return;
        }

        auction.currentPrice = amount;
        auction.highestBidder = userId; // Update highest bidder
        await auction.save();
        logger.info('Auction saved: ' + JSON.stringify({ currentPrice: auction.currentPrice, highestBidder: auction.highestBidder }));

        // Save the bid to the bids collection
        const bidDoc = new Bid({
          auction: auctionId,
          bidder: userId, // If you have user ObjectId, use that instead
          amount: amount,
          createdAt: new Date()
        });
        await bidDoc.save();
        logger.info('Bid saved: ' + JSON.stringify(bidDoc));

        // Re-schedule job to end the auction (avoid duplicates using jobId)
        const delay = new Date(auction.expirationTime) - new Date();
        if (delay > 0) {
          await auctionQueue.add(
            'checkAuction',
            { auctionId: auction._id },
            {
              delay,
              jobId: auction._id.toString(), // Prevent duplicate jobs
            }
          );
          logger.info(`✅ Re-scheduled end job for auction ${auction._id} in ${delay} ms`);
        }

        io.to(`auction_${auctionId}`).emit('bidUpdate', {
          auctionId,
          currentPrice: amount,
          bidder: userId
        });
        socket.broadcast.to(`auction_${auctionId}`).emit('outbid', {
          auctionId,
          currentPrice: amount
        });
        socket.emit('highestBid', {
          auctionId,
          currentPrice: amount
        });
      } catch (error) {
        logger.error('Error in placeBid: ' + error.message);
        socket.emit('bidError', 'Error placing bid');
      }
    });
  });
};

module.exports = { setupAuctionSockets };