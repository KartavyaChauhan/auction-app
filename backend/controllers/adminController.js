const User = require('../models/User');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { Parser } = require('json2csv');

const blockUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { blocked: true });
  res.json({ message: 'User blocked' });
};

const unblockUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { blocked: false });
  res.json({ message: 'User unblocked' });
};

const blockAuction = async (req, res) => {
  await Auction.findByIdAndUpdate(req.params.id, { status: 'blocked' });
  res.json({ message: 'Auction blocked' });
};

const unblockAuction = async (req, res) => {
  await Auction.findByIdAndUpdate(req.params.id, { status: 'active' });
  res.json({ message: 'Auction unblocked' });
};

const siteStats = async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalAuctions = await Auction.countDocuments();
  const activeAuctions = await Auction.countDocuments({ status: 'active' });
  const endedAuctions = await Auction.countDocuments({ status: 'ended' });

  res.json({ totalUsers, totalAuctions, activeAuctions, endedAuctions });
};

// Get all users (for admin dashboard)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password field
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get all auctions (for admin dashboard)
const getAllAuctions = async (req, res) => {
  try {
    const auctions = await Auction.find({});
    res.json(auctions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
};

// Export all bids as CSV (for admin)
const exportAllBidsCSV = async (req, res) => {
  try {
    const bids = await Bid.find({})
      .populate('auction', 'title')
      .populate('bidder', 'email')
      .lean();
    if (!bids.length) {
      return res.status(404).json({ error: 'No bids found' });
    }
    const rows = bids.map(bid => ({
      'Auction Title': bid.auction?.title || '',
      'Auction ID': bid.auction?._id?.toString() || '',
      'Bid Amount': bid.amount,
      'Bidder Email': bid.bidder?.email || '',
      'Timestamp': bid.createdAt
    }));
    const fields = ['Auction Title', 'Auction ID', 'Bid Amount', 'Bidder Email', 'Timestamp'];
    const parser = new Parser({ fields });
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('bids.csv');
    return res.send(csv);
  } catch (error) {
    console.error('ExportAllBidsCSV error:', error);
    res.status(500).json({ error: 'Server error exporting bids', details: error.message });
  }
};

module.exports = {
  blockUser,
  unblockUser,
  blockAuction,
  unblockAuction,
  siteStats,
  getAllUsers,
  getAllAuctions,
  exportAllBidsCSV,
};
