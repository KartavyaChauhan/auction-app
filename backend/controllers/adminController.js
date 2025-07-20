const User = require('../models/User');
const Auction = require('../models/Auction');

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

module.exports = {
  blockUser,
  unblockUser,
  blockAuction,
  unblockAuction,
  siteStats,
};
