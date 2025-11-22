// File path: server/src/controllers/notificationController.js

const Notification = require('../models/Notification');

// Helper function to create and emit notification
const createNotification = async (notificationData, io) => {
  try {
    const notification = await Notification.create(notificationData);

    // Emit Socket.io event if io is available
    if (io) {
      io.emit('notification:new', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Helper function to notify multiple users
const notifyMultipleUsers = async (userIds, notificationTemplate, io) => {
  try {
    if (!userIds || userIds.length === 0) return [];

    const promises = userIds.map(userId =>
      createNotification({ ...notificationTemplate, userId }, io)
    );

    return await Promise.all(promises);
  } catch (error) {
    console.error('Error notifying multiple users:', error);
    throw error;
  }
};

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
const getAllNotifications = async (req, res) => {
  try {
    const { category, read, limit = 50, page = 1 } = req.query;

    const query = { userId: req.user.id };

    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by read status if provided
    if (read !== undefined) {
      query.read = read === 'true';
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Notification.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread/count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// @desc    Create notification (internal use)
// @route   POST /api/notifications
// @access  Private (Admin only or internal use)
const createNotificationEndpoint = async (req, res) => {
  try {
    const notification = await createNotification(req.body, req.io);

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
};

module.exports = {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotificationEndpoint,
  createNotification, // Export for use in other controllers
  notifyMultipleUsers // Export for notifying multiple users
};
