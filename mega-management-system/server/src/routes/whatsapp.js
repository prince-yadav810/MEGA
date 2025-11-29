// File Path: server/src/routes/whatsapp.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const whatsappService = require('../services/whatsappService');
const paymentReminderScheduler = require('../services/paymentReminderScheduler');

// @desc    Get WhatsApp service status
// @route   GET /api/whatsapp/status
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    const schedulerStats = paymentReminderScheduler.getStats();
    
    res.json({
      success: true,
      data: {
        whatsapp: status,
        scheduler: schedulerStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching WhatsApp status',
      error: error.message
    });
  }
});

// @desc    Test WhatsApp connection
// @route   POST /api/whatsapp/test
// @access  Private
router.post('/test', protect, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }
    
    const testMessage = message || `🧪 Test message from MEGA Management System\n\nThis is a test message. If you received this, the WhatsApp integration is working!\n\nTime: ${new Date().toLocaleString()}`;
    
    const result = await whatsappService.sendMessage({
      to: phoneNumber,
      message: testMessage,
      clientName: 'Test User'
    });
    
    res.json({
      success: result.success,
      message: result.success ? 'Test message sent successfully' : 'Failed to send test message',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending test message',
      error: error.message
    });
  }
});

// @desc    Get scheduler statistics
// @route   GET /api/whatsapp/scheduler/stats
// @access  Private
router.get('/scheduler/stats', protect, async (req, res) => {
  try {
    const stats = paymentReminderScheduler.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching scheduler stats',
      error: error.message
    });
  }
});

// @desc    Manually trigger scheduler check
// @route   POST /api/whatsapp/scheduler/trigger
// @access  Private (Admin only)
router.post('/scheduler/trigger', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can manually trigger scheduler'
      });
    }
    
    // Trigger check in background
    paymentReminderScheduler.triggerCheck();
    
    res.json({
      success: true,
      message: 'Scheduler check triggered. Processing reminders in background.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error triggering scheduler',
      error: error.message
    });
  }
});

// @desc    Get upcoming reminders
// @route   GET /api/whatsapp/scheduler/upcoming
// @access  Private
router.get('/scheduler/upcoming', protect, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const reminders = await paymentReminderScheduler.getUpcomingReminders(parseInt(days));
    
    res.json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming reminders',
      error: error.message
    });
  }
});

// @desc    Get overdue reminders
// @route   GET /api/whatsapp/scheduler/overdue
// @access  Private
router.get('/scheduler/overdue', protect, async (req, res) => {
  try {
    const reminders = await paymentReminderScheduler.getOverdueReminders();
    
    res.json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue reminders',
      error: error.message
    });
  }
});

// @desc    Reset scheduler statistics
// @route   POST /api/whatsapp/scheduler/reset-stats
// @access  Private (Admin only)
router.post('/scheduler/reset-stats', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can reset scheduler statistics'
      });
    }
    
    paymentReminderScheduler.resetStats();
    
    res.json({
      success: true,
      message: 'Scheduler statistics reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting statistics',
      error: error.message
    });
  }
});

module.exports = router;



