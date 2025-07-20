const validateAuction = (req, res, next) => {
  const { title, description, basePrice, expirationTime } = req.body;
  if (!title || !description || !basePrice || !expirationTime) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (typeof basePrice !== 'number' || basePrice < 0) {
    return res.status(400).json({ error: 'Base price must be a non-negative number' });
  }
  if (new Date(expirationTime) <= Date.now()) {
    return res.status(400).json({ error: 'Expiration time must be in the future' });
  }
  next();
};

module.exports = { validateAuction };