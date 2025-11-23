const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotificationEndpoint
} = require('../controllers/notificationController');

// All notification routes require authentication
router.get('/', protect, getAllNotifications);
router.get('/unread/count', protect, getUnreadCount);
router.post('/', protect, createNotificationEndpoint);
router.patch('/read-all', protect, markAllAsRead);
router.patch('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
