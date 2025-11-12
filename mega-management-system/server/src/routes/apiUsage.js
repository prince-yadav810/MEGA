// File Path: server/src/routes/apiUsage.js

const express = require('express');
const router = express.Router();
const apiUsageController = require('../controllers/apiUsageController');

// Mock authentication middleware for development
const mockAuth = (req, res, next) => {
  req.user = {
    id: '507f1f77bcf86cd799439011',
    name: 'Admin User',
    email: 'admin@mega.com',
    role: 'admin'
  };
  next();
};

// Check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// My stats (any authenticated user)
router.get('/my-stats', mockAuth, apiUsageController.getMyStats);

// Admin routes
router.get('/stats', mockAuth, adminOnly, apiUsageController.getOverallStats);
router.get('/user/:userId', mockAuth, adminOnly, apiUsageController.getUserStats);

module.exports = router;
