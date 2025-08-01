require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const exportRoutes = require('./routes/exportRoutes');
const healthRoutes = require('./routes/healthRoutes');
const swaggerConfig = require('./config/swagger');
const winston = require('winston');
const app = express();

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Add logger to the app
app.locals.logger = logger;

// Middleware to log all requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Configure CORS with appropriate options
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://192.168.29.61:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(helmet()); // Security headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to auth endpoints (more strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again after 15 minutes'
});

// Swagger API documentation
app.use('/api-docs', swaggerConfig.serve, swaggerConfig.setup);

// Health check routes (no auth required for monitoring)
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/auctions', limiter, auctionRoutes);
app.use('/api/admin', limiter, adminRoutes);
app.use('/api/export', limiter, exportRoutes);

app.get('/', (req, res) => {
  res.send('Auction App Backend');
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  });
});

module.exports = app;
