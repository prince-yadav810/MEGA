// File path: server/src/models/PushSubscription.js

const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  // User this subscription belongs to
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Push subscription endpoint (unique per device/browser)
  endpoint: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Encryption keys for push messages
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },

  // User agent for debugging/analytics
  userAgent: {
    type: String,
    default: ''
  },

  // Device/browser identifier (optional)
  deviceInfo: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
pushSubscriptionSchema.index({ userId: 1, endpoint: 1 });

// Method to get subscription object for web-push
pushSubscriptionSchema.methods.toWebPushSubscription = function() {
  return {
    endpoint: this.endpoint,
    keys: {
      p256dh: this.keys.p256dh,
      auth: this.keys.auth
    }
  };
};

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);

