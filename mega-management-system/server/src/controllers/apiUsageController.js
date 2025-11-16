// File Path: server/src/controllers/apiUsageController.js

const { getUsageStatistics, getUserUsageStats } = require('../utils/apiUsageTracker');

/**
 * API Usage Controller
 * Provides endpoints for monitoring API usage (admin only)
 */

// @desc    Get overall API usage statistics
// @route   GET /api/admin/api-usage/stats
// @access  Private (Admin only)
exports.getOverallStats = async (req, res) => {
  try {
    const stats = await getUsageStatistics();

    if (!stats) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve usage statistics'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get API usage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching API usage statistics',
      error: error.message
    });
  }
};

// @desc    Get user-specific usage statistics
// @route   GET /api/admin/api-usage/user/:userId
// @access  Private (Admin only)
exports.getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const stats = await getUserUsageStats(userId, parseInt(days));

    if (!stats) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user statistics'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user API usage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics',
      error: error.message
    });
  }
};

// @desc    Get current user's usage statistics
// @route   GET /api/api-usage/my-stats
// @access  Private
exports.getMyStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await getUserUsageStats(req.user.id, parseInt(days));

    if (!stats) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve your statistics'
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get my API usage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your statistics',
      error: error.message
    });
  }
};
