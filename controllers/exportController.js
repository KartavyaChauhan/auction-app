const Auction = require('../models/Auction');
const { Parser } = require('json2csv');

const exportSellerAuctions = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const auctions = await Auction.find({ seller: sellerId });

    if (auctions.length === 0) {
      return res.status(404).json({ error: 'No auctions found for this seller' });
    }

    const fields = ['_id', 'title', 'description', 'basePrice', 'currentPrice', 'status', 'expirationTime'];
    const json2csv = new Parser({ fields });
    const csv = json2csv.parse(auctions);

    res.header('Content-Type', 'text/csv');
    res.attachment('auctions.csv');
    res.send(csv);
  } catch (err) {
    console.error('CSV export error:', err.message);
    res.status(500).json({ error: 'Failed to export auctions' });
  }
};

module.exports = { exportSellerAuctions };
