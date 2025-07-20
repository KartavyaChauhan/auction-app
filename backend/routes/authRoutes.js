const express = require('express');
const { signup, login } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // ✅ ADD THIS
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.get(
  '/profile',
  authMiddleware(['Buyer', 'Seller', 'Admin']),
  (req, res) => {
    res.json({ message: 'Protected route accessed', user: req.user });
  }
);

// Route: POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fix role if it has a trailing comma or is lowercase
    if (typeof user.role === 'string') {
      user.role = user.role.replace(/[,\s]+$/g, '').replace(/^\s+|\s+$/g, '');
      if (!['Buyer', 'Seller', 'Admin'].includes(user.role)) {
        user.role = 'Buyer'; // fallback to Buyer if invalid
      }
    }

    // Fix password if missing or invalid
    if (!user.password || typeof user.password !== 'string' || user.password.length < 10) {
      user.password = await bcrypt.hash(newPassword, 10);
    } else {
      user.password = await bcrypt.hash(newPassword, 10);
    }
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
