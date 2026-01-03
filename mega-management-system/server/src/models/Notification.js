// File path: server/src/models/Notification.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // User this notification belongs to
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Notification type for icon/color display
  type: {
    type: String,
    enum: ['success', 'info', 'warning', 'error'],
    default: 'info'
  },

  // Category for filtering
  category: {
    type: String,
    enum: ['task', 'client', 'quotation', 'product', 'note', 'reminder', 'payment', 'system'],
    required: true,
    index: true
  },

  // Notification content
  title: {
    type: String,
    required: true,
    trim: true
  },

  message: {
    type: String,
    required: true,
    trim: true
  },

  // Related entity information (for navigation)
  entityType: {
    type: String,
    enum: ['task', 'client', 'quotation', 'product', 'note', 'reminder', 'payment-reminder', 'wallet', null],
    default: null
  },

  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },

  // Action URL (optional - for direct navigation)
  actionUrl: {
    type: String,
    default: null
  },

  // Read status
  read: {
    type: Boolean,
    default: false,
    index: true
  },

  // Who created this notification (system or user name)
  createdBy: {
    type: String,
    default: 'System'
  },

  // Flag for task assignment notifications (for special highlighting)
  isAssignment: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, category: 1, createdAt: -1 });

// TTL index - automatically delete notifications after 7 days (604800 seconds)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

// Virtual for time display (12-hour AM/PM format)
notificationSchema.virtual('timeAgo').get(function () {
  const date = this.createdAt;
  if (!date) return '';

  // Format time in 12-hour AM/PM format
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  const minutesStr = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutesStr} ${ampm}`;
});

// Ensure virtuals are included in JSON
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
