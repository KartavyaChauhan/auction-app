const verifyAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'Admin')) {
    return next();
  }
  return res.status(403).json({ error: 'Access denied' });
};

module.exports = { verifyAdmin };
