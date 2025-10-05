const mongoose = require('mongoose');

// Temporary auth middleware - replace with actual JWT authentication later
const protect = (req, res, next) => {
  // For now, create a dummy user for testing
  // Use a valid ObjectId
  req.user = {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    name: 'Demo User',
    email: 'demo@mega.com'
  };
  next();
};

module.exports = { protect };
