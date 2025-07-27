const Auction = require('../models/Auction');

// Shared logic to end an auction, emit socket event, and finalize winner
async function endAuction(auctionId, io) {
  const auction = await Auction.findById(auctionId);
  if (!auction) return;
  if (auction.status === 'ended') return;
  auction.status = 'ended';
  await auction.save();
  const winner = auction.highestBidder || 'No winner';
  if (io) {
    io.to(`auction_${auctionId}`).emit('auctionEnded', {
      auctionId,
      status: 'ended',
      winner,
      finalPrice: auction.currentPrice,
      title: auction.title
    });
  }
}

module.exports = endAuction;
