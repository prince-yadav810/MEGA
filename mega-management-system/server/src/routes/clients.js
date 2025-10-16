const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// All client routes require authentication
router.get('/', protect, (req, res) => {
  res.json({ message: 'clients routes - coming soon' });
});

module.exports = router;
