// File path: server/src/routes/pushSubscriptions.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  getSubscriptions
} = require('../controllers/pushSubscriptionController');

// Public route - needed for subscription
router.get('/vapid-public-key', getVapidPublicKey);

// All other routes require authentication
router.post('/subscribe', protect, subscribe);
router.delete('/unsubscribe', protect, unsubscribe);
router.get('/subscriptions', protect, getSubscriptions);

module.exports = router;

