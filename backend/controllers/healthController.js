/**
 * Health check controller for monitoring application status
 */

const os = require('os');
const { version } = require('../package.json');

/**
 * Basic health check endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getHealth = (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'UP',
    version,
    hostname: os.hostname(),
    memory: {
      total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
      free: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
      usage: `${Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)}%`
    },
    cpu: os.cpus().length
  };

  return res.status(200).json(health);
};

/**
 * Deep health check endpoint that also verifies database connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDeepHealth = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const health = {
      uptime: process.uptime(),
      timestamp: Date.now(),
      status: 'UP',
      version,
      hostname: os.hostname(),
      services: {
        database: mongoose.connection.readyState === 1 ? 'UP' : 'DOWN'
      }
    };

    return res.status(200).json(health);
  } catch (error) {
    return res.status(503).json({
      status: 'DOWN',
      timestamp: Date.now(),
      error: error.message
    });
  }
};
