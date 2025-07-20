const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { Parser } = require('json2csv');

const exportSellerAuctions = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    const auctions = await Auction.find({ seller: sellerId }).lean();

    if (!auctions || auctions.length === 0) {
      return res.status(404).json({ error: 'No auctions found for this seller' });
    }

    const fields = ['_id', 'title', 'description', 'basePrice', 'currentPrice', 'expirationTime', 'status'];
    const parser = new Parser({ fields });
    const csv = parser.parse(auctions);

    res.header('Content-Type', 'text/csv');
    res.attachment('auctions.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportBiddingHistory = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    // Get all auctions for this seller
    const auctions = await Auction.find({ seller: sellerId }).select('_id title').lean();
    if (!auctions.length) {
      return res.status(404).json({ error: 'No auctions found for this seller' });
    }
    const auctionIds = auctions.map(a => a._id);
    // Get all bids for these auctions
    const bids = await Bid.find({ auction: { $in: auctionIds } })
      .populate('auction', 'title')
      .populate('bidder', 'email')
      .lean();
    if (!bids.length) {
      return res.status(404).json({ error: 'No bids found for this seller' });
    }
    // Format for CSV
    const rows = bids.map(bid => ({
      'Auction Title': bid.auction?.title || '',
      'Auction ID': bid.auction?._id?.toString() || '',
      'Bid Amount': bid.amount,
      'Bidder ID (or email)': bid.bidder?.email || bid.bidder?._id?.toString() || '',
      'Timestamp': bid.createdAt
    }));
    const fields = ['Auction Title', 'Auction ID', 'Bid Amount', 'Bidder ID (or email)', 'Timestamp'];
    const parser = new Parser({ fields });
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('bidding-history.csv');
    return res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error exporting bidding history' });
  }
};

module.exports = { exportSellerAuctions, exportBiddingHistory };
