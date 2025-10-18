const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// All user routes require authentication
router.get('/', protect, (req, res) => {
  res.json({ message: 'users routes - coming soon' });
});

module.exports = router;


