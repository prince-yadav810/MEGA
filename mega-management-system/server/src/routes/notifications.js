const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// All notification routes require authentication
router.get('/', protect, (req, res) => {
  res.json({ message: 'notifications routes - coming soon' });
});

module.exports = router;
