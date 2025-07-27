const express = require('express');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const exportRoutes = require('./routes/exportRoutes'); // Importing export routes
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const cors = require('cors');

const { Queue } = require('bullmq');
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};
const auctionQueue = new Queue('auctionQueue', { connection: redisConnection });

const { scheduleAuctionChecks } = require('./workers/auctionWorker');
const { setupAuctionSockets } = require('./sockets/auctionSockets');

// Bull Board setup
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express'); // Updated import for ExpressAdapter

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(auctionQueue)],
  serverAdapter,
});

const app = express();

// CORS middleware for REST API
app.use(cors({
  origin: [
    'http://192.168.29.61:8080',
    'http://192.168.56.1:8080',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5500' // <-- Add this line
  ],
  credentials: true
}));

const server = http.createServer(app);

app.use('/admin/queues', serverAdapter.getRouter()); // Bull UI endpoint

const io = new Server(server, {
  cors: {
    origin: [
      'http://192.168.29.61:8080',
      'http://192.168.56.1:8080',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:5500', // Allow Live Server
      'http://localhost:5500', // Also allow localhost for Live Server
      'http://localhost:8080',
      'http://192.168.29.61:5500'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

connectDB();

app.use(express.json());
// Rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: { error: "Too many login attempts. Try again later." }
});
app.use('/api/auth/login', loginLimiter);

// Rate limiter for bidding
const bidLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 3,
  message: { error: "You are bidding too fast. Please slow down." }
});
app.use('/api/auctions/bid', bidLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/export', exportRoutes); // Using export routes
app.get('/', (req, res) => {
  res.send('Auction App Backend');
});

// Admin routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

setupAuctionSockets(io);

// Serve uploaded images statically
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

// Error handling middleware (should be after all routes)
app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ error: "Something went wrong." });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  logger.info(`✅ Server running on port ${PORT}`);
  logger.info('Auction Queue:', auctionQueue);
  logger.info('Auction Queue Details:', auctionQueue);
  logger.info('Queue Name:', auctionQueue.name);
  logger.info('Queue Connection:', auctionQueue.opts.connection);
  await scheduleAuctionChecks(); // Reschedule missed jobs
});

module.exports = { io };


// sudo service redis-server start
// karta@LAPTOP-4EFMT7SR:/mnt/c/Users/karta$ redis-cli ping