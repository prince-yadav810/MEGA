const mongoose = require('mongoose');

// Temporary auth middleware - replace with actual JWT authentication later
const protect = (req, res, next) => {
  // For now, create a dummy user for testing
  // Use the real user ID from seeded users (Rajesh Kumar)
  req.user = {
    _id: new mongoose.Types.ObjectId('68e806efc81efb0b836779c6'),
    name: 'Rajesh Kumar',
    email: 'rajesh@mega.com'
  };
  next();
};

module.exports = { protect };
