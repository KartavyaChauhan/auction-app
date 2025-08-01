const User = require('../models/User');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { Parser } = require('json2csv');

const blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { blocked: true }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User blocked', user });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
};

const unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { blocked: false }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User unblocked', user });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

const blockAuction = async (req, res) => {
  try {
    const auction = await Auction.findByIdAndUpdate(
      req.params.id,
      { status: 'blocked' },
      { new: true }
    );
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    res.json({ message: 'Auction blocked', auction });
  } catch (error) {
    console.error('Error blocking auction:', error);
    res.status(500).json({ error: 'Failed to block auction' });
  }
};

const unblockAuction = async (req, res) => {
  try {
    const auction = await Auction.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    );
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    res.json({ message: 'Auction unblocked', auction });
  } catch (error) {
    console.error('Error unblocking auction:', error);
    res.status(500).json({ error: 'Failed to unblock auction' });
  }
};

const siteStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAuctions = await Auction.countDocuments();
    const activeAuctions = await Auction.countDocuments({ status: 'active' });
    const endedAuctions = await Auction.countDocuments({ status: 'ended' });
    const blockedAuctions = await Auction.countDocuments({ status: 'blocked' });
    const blockedUsers = await User.countDocuments({ blocked: true });
    const totalBids = await Bid.countDocuments();

    res.json({
      totalUsers,
      totalAuctions,
      activeAuctions,
      endedAuctions,
      blockedAuctions,
      blockedUsers,
      totalBids
    });
  } catch (error) {
    console.error('Error fetching site stats:', error);
    res.status(500).json({ error: 'Failed to fetch site statistics' });
  }
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
    const auctions = await Auction.find({})
      .populate('seller', 'username')
      .populate('highestBidder', 'username')
      .lean();

    // Transform the populated fields to just their username strings for compatibility with the frontend
    const formattedAuctions = auctions.map((auction) => ({
      ...auction,
      seller: auction.seller ? auction.seller.username : 'Unknown',
      highestBidder: auction.highestBidder ? auction.highestBidder.username : null
    }));

    res.json(formattedAuctions);
  } catch (error) {
    console.error('Error fetching auctions:', error);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
};

// Export all bids as CSV (for admin)
const exportAllBidsCSV = async (req, res) => {
  try {
    const bids = await Bid.find({}).populate('auction', 'title').populate('bidder', 'email').lean();
    if (!bids.length) {
      return res.status(404).json({ error: 'No bids found' });
    }
    const rows = bids.map((bid) => ({
      'Auction Title': bid.auction?.title || '',
      'Auction ID': bid.auction?._id?.toString() || '',
      'Bid Amount': bid.amount,
      'Bidder Email': bid.bidder?.email || '',
      Timestamp: bid.createdAt
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
  exportAllBidsCSV
};
