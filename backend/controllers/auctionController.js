const { auctionQueue } = require('../workers/auctionWorker');

const Auction = require('../models/Auction');

const createAuction = async (req, res) => {
  const { title, description, basePrice, expirationTime } = req.body;
  try {
    // Basic validation
    if (!title || !description || !basePrice || !expirationTime) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (basePrice < 0) {
      return res.status(400).json({ error: 'Base price must be non-negative' });
    }
    if (new Date(expirationTime) <= Date.now()) {
      return res.status(400).json({ error: 'Expiration time must be in the future' });
    }

    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }
    const auction = new Auction({
      title,
      description,
      basePrice,
      currentPrice: basePrice,
      expirationTime,
      seller: req.user.id,
      image: imagePath
    });

    await auction.save();

    // ✅ Schedule job to auto-end the auction at expirationTime
    const delay = new Date(auction.expirationTime) - new Date();
    await auctionQueue.add(
      'checkAuction',
      { auctionId: auction._id },
      { delay: Math.max(delay, 0) }
    );
    console.log(`✅ Scheduled end job for auction ${auction._id} in ${delay} ms`);

    res.status(201).json(auction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Auctions, or by Seller if query param is present
const getAllAuctions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.seller) {
      // Accept both ObjectId and string for seller
      filter.seller = req.query.seller;
    }
    // No status filter: return all auctions (active and ended)
    const auctions = await Auction.find(filter).populate('seller', 'username email');
    res.json(auctions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Auction by ID
const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id).populate('seller', 'username email');
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    res.json(auction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/auctions/:id
const updateAuction = async (req, res) => {
  try {
    const { expirationTime, status } = req.body;
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    // Only the seller can update their own auction
    if (auction.seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this auction' });
    }
    let endedNow = false;
    const oldExpiration = auction.expirationTime;
    const oldStatus = auction.status;
    if (expirationTime) auction.expirationTime = expirationTime;
    if (status && status === 'ended' && auction.status !== 'ended') {
      auction.status = 'ended';
      endedNow = true;
    } else if (status) {
      auction.status = status;
    }
    // Handle image update
    if (req.file) {
      auction.image = `/uploads/${req.file.filename}`;
    }
    await auction.save();

    // --- BullMQ: Remove any existing scheduled job for this auction ---
    const { auctionQueue } = require('../workers/auctionWorker');
    // Remove all jobs for this auction (by job data.auctionId)
    const jobs = await auctionQueue.getDelayed();
    for (const job of jobs) {
      if (
        job.data &&
        job.data.auctionId &&
        job.data.auctionId.toString() === auction._id.toString()
      ) {
        await job.remove();
      }
    }

    // --- Reschedule job if auction is still active and expiration is in the future ---
    if (auction.status === 'active' && new Date(auction.expirationTime) > new Date()) {
      const delay = new Date(auction.expirationTime) - new Date();
      await auctionQueue.add(
        'checkAuction',
        { auctionId: auction._id },
        { delay: Math.max(delay, 0) }
      );
      console.log(`🔄 Rescheduled end job for auction ${auction._id} in ${delay} ms`);
    }

    // If auction is ended by PATCH, run end logic (emit socket event, finalize winner)
    if (endedNow) {
      // Dynamically require io from server to avoid circular dependency
      const server = require('../server');
      const io = server && server.io ? server.io : null;
      const endAuction = require('../utils/endAuction');
      await endAuction(auction._id, io);
    }

    res.json({ message: 'Auction updated', auction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createAuction, getAllAuctions, getAuctionById, updateAuction };
