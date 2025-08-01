const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const exportRoutes = require('./routes/exportRoutes'); // Importing export routes
const swaggerConfig = require('./config/swaggerConfig');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const cors = require('cors');

const { Queue } = require('bullmq');
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
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
  serverAdapter
});

const app = express();

// Apply Helmet for security headers - more relaxed for development
if (process.env.NODE_ENV === 'production') {
  // Strict security for production
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'http:'],
          scriptSrc: ["'self'", 'https://cdn.socket.io'],
          connectSrc: ["'self'", 'ws:', 'wss:']
        }
      }
    })
  );
} else {
  // Relaxed for development
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );
}

// CORS middleware for REST API
const allowedOrigins = [
  'http://192.168.29.61:8080',
  'http://192.168.56.1:8080',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:5500', // Common Live Server port
  'http://127.0.0.1:3000', // Common React dev server
  'http://localhost:3000' // Common React dev server
  // Add any additional origins you might use
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Content-Length'
    ]
  })
);

const server = http.createServer(app);

app.use('/admin/queues', serverAdapter.getRouter()); // Bull UI endpoint

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Content-Length'
    ]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowEIO3: true
});

connectDB();

app.use(express.json());

// Rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: { error: 'Too many login attempts. Try again later.' }
});
app.use('/api/auth/login', loginLimiter);

// Rate limiter for bidding
const bidLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 3,
  message: { error: 'You are bidding too fast. Please slow down.' }
});
app.use('/api/auctions/bid', bidLimiter);

// Import health routes
const healthRoutes = require('./routes/healthRoutes');

// Health check endpoint (no auth required for monitoring)
app.use('/health', healthRoutes);

// API Documentation with Swagger UI
app.use('/api-docs', swaggerConfig.serve, swaggerConfig.setup);

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
const path = require('path');
const uploadsPath = process.env.NODE_ENV === 'production' 
  ? '/uploads' 
  : path.join(__dirname, '../uploads');
console.log('Uploads directory path:', uploadsPath); // Log the path for debugging

// Apply CORS for static files in uploads directory
app.use(
  '/uploads',
  (req, res, next) => {
    // Set CORS headers to allow access from any origin
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Content-Length'
    );
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'credentialless');
    res.header('Cross-Origin-Opener-Policy', 'same-origin');

    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  },
  express.static(uploadsPath)
);

// Error handling middleware (should be after all routes)
app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({ error: 'Something went wrong.' });
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
