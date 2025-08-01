const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const {
  createAuction,
  getAllAuctions,
  getAuctionById,
  updateAuction
} = require('../controllers/auctionController');
const upload = require('../middleware/upload');
// Update auction (Sellers only, with image upload)
router.patch('/:id', authMiddleware(['Seller']), upload.single('image'), updateAuction);
const { validateAuction } = require('../middleware/validators');
// Create a new auction (Sellers only, with image upload)
router.post(
  '/',
  authMiddleware(['Seller']),
  upload.single('image'),
  validateAuction,
  createAuction
);

// Get all auctions (PUBLIC)
router.get('/', getAllAuctions);

// Get auction by ID (PUBLIC)
router.get('/:id', getAuctionById);

module.exports = router;
