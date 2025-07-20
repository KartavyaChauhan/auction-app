
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

    const auction = new Auction({
      title,
      description,
      basePrice,
      currentPrice: basePrice,
      expirationTime,
      seller: req.user.id
    });

    await auction.save();

    // ✅ Schedule job to auto-end the auction at expirationTime
    const delay = new Date(auction.expirationTime) - new Date();
    await auctionQueue.add('checkAuction', { auctionId: auction._id }, { delay: Math.max(delay, 0) });
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
    } else {
      filter.status = 'active'; // Only show active auctions to buyers
    }
    const auctions = await Auction.find(filter)
      .populate('seller', 'username email');
    res.json(auctions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Auction by ID
const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'username email');
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }
    res.json(auction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createAuction, getAllAuctions, getAuctionById };
