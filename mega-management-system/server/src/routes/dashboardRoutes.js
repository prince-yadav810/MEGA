const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(protect);

// @route   GET /api/dashboard
// @desc    Get dashboard statistics and data for current user
// @access  Private
router.get('/', getDashboardStats);

module.exports = router;

