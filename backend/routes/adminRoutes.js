const express = require('express');
const {
  blockUser, unblockUser, blockAuction, unblockAuction, siteStats,
  getAllUsers, getAllAuctions, exportAllBidsCSV
} = require('../controllers/adminController');
const verifyToken = require('../middleware/verifyToken');
const { verifyAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

// Apply middleware in correct order: verifyToken FIRST, then verifyAdmin
router.put('/block-user/:id', verifyToken, verifyAdmin, blockUser);
router.put('/unblock-user/:id', verifyToken, verifyAdmin, unblockUser);
router.put('/block-auction/:id', verifyToken, verifyAdmin, blockAuction);
router.put('/unblock-auction/:id', verifyToken, verifyAdmin, unblockAuction);
router.get('/stats', verifyToken, verifyAdmin, siteStats);

// Admin dashboard endpoints
router.get('/users', verifyToken, verifyAdmin, getAllUsers);
router.get('/auctions', verifyToken, verifyAdmin, getAllAuctions);
router.get('/export/bids', verifyToken, verifyAdmin, exportAllBidsCSV);

module.exports = router;
