/**
 * Health check routes for monitoring application status
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Simple health check endpoint
router.get('/', healthController.getHealth);

// Deep health check that also verifies database connection
router.get('/deep', healthController.getDeepHealth);

module.exports = router;
