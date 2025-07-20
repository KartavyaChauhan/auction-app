require("dotenv").config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const app = express();

app.use(cors({ origin: 'http://192.168.29.61:8080' })); // Specific origin for development
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.get('/', (req, res) => {
  res.send('Auction App Backend');
});

module.exports = app;