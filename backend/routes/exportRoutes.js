const express = require('express');
const { exportSellerAuctions, exportBiddingHistory } = require('../controllers/exportController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/auctions/:sellerId', authMiddleware(['Seller']), exportSellerAuctions);
router.get('/bidding-history/:sellerId', authMiddleware(['Seller']), exportBiddingHistory);

module.exports = router;
