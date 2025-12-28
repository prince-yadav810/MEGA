// File path: server/src/controllers/pushSubscriptionController.js

const PushSubscription = require('../models/PushSubscription');
const pushService = require('../services/pushService');

// @desc    Get VAPID public key
// @route   GET /api/push/vapid-public-key
// @access  Public (needed for subscription)
const getVapidPublicKey = async (req, res) => {
  try {
    const publicKey = pushService.getVapidPublicKey();

    if (!publicKey) {
      return res.status(503).json({
        success: false,
        message: 'Push notifications not configured'
      });
    }

    res.status(200).json({
      success: true,
      publicKey
    });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting VAPID public key',
      error: error.message
    });
  }
};

// @desc    Subscribe to push notifications
// @route   POST /api/push/subscribe
// @access  Private
const subscribe = async (req, res) => {
  try {
    const { endpoint, keys, userAgent, deviceInfo } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'Missing required subscription data'
      });
    }

    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({ endpoint });

    if (existingSubscription) {
      // Update if it belongs to a different user or update metadata
      if (existingSubscription.userId.toString() !== req.user.id) {
        existingSubscription.userId = req.user.id;
        existingSubscription.userAgent = userAgent || '';
        existingSubscription.deviceInfo = deviceInfo || '';
        await existingSubscription.save();
      }
      
      return res.status(200).json({
        success: true,
        message: 'Subscription updated',
        data: existingSubscription
      });
    }

    // Create new subscription
    try {
      const subscription = await PushSubscription.create({
        userId: req.user.id,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth
        },
        userAgent: userAgent || req.get('user-agent') || '',
        deviceInfo: deviceInfo || ''
      });

      console.log(`✅ Push subscription created for user ${req.user.id}`);

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        data: subscription
      });
    } catch (createError) {
      // Handle duplicate key error (endpoint already exists)
      if (createError.code === 11000 || createError.name === 'MongoServerError') {
        // Try to find and update existing subscription
        const existing = await PushSubscription.findOne({ endpoint });
        if (existing) {
          existing.userId = req.user.id;
          existing.userAgent = userAgent || req.get('user-agent') || '';
          existing.deviceInfo = deviceInfo || '';
          await existing.save();
          
          return res.status(200).json({
            success: true,
            message: 'Subscription updated',
            data: existing
          });
        }
      }
      throw createError;
    }
  } catch (error) {
    console.error('Error creating push subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating push subscription',
      error: error.message
    });
  }
};

// @desc    Unsubscribe from push notifications
// @route   DELETE /api/push/unsubscribe
// @access  Private
const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint is required'
      });
    }

    const subscription = await PushSubscription.findOneAndDelete({
      endpoint,
      userId: req.user.id
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    console.log(`🗑️  Push subscription removed for user ${req.user.id}`);

    res.status(200).json({
      success: true,
      message: 'Unsubscribed successfully'
    });
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({
      success: false,
      message: 'Error unsubscribing',
      error: error.message
    });
  }
};

// @desc    Get user's push subscriptions
// @route   GET /api/push/subscriptions
// @access  Private
const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await PushSubscription.find({ userId: req.user.id })
      .select('endpoint userAgent deviceInfo createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: subscriptions,
      count: subscriptions.length
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: error.message
    });
  }
};

module.exports = {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  getSubscriptions
};

