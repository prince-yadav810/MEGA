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
    enum: ['task', 'client', 'quotation', 'product', 'note', 'reminder', 'payment-reminder', null],
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
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, category: 1, createdAt: -1 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
  const seconds = Math.floor((new Date() - this.createdAt) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return this.createdAt.toLocaleDateString();
});

// Ensure virtuals are included in JSON
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notification', notificationSchema);
