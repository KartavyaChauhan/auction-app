const express = require('express');
const router = express.Router();

const { createAuction, getAllAuctions, getAuctionById } = require('../controllers/auctionController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateAuction } = require('../middleware/validators');
// Create a new auction (Sellers only)
router.post('/', authMiddleware(['Seller']), createAuction);

// Get all auctions (Buyers & Sellers)
router.get('/', authMiddleware(['Buyer', 'Seller']), getAllAuctions);

// Get auction by ID (Buyers & Sellers)
router.get('/:id', authMiddleware(['Buyer', 'Seller']), getAuctionById);

router.post('/', authMiddleware(['Seller']), validateAuction, createAuction);

module.exports = router;
