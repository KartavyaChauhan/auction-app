const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  basePrice: { type: Number, required: true, min: 0 },
  currentPrice: { type: Number, default: 0 },
  expirationTime: { type: Date, required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  highestBidder: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Auction', auctionSchema);