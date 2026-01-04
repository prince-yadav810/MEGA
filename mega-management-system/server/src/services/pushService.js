// File path: server/src/services/pushService.js

let webpush;
try {
  webpush = require('web-push');
} catch (error) {
  console.warn('⚠️  web-push package not installed. Push notifications will not work.');
  console.warn('   Run: npm install web-push');
}

const PushSubscription = require('../models/PushSubscription');

// Initialize VAPID keys
let vapidKeysInitialized = false;

const initializeVapidKeys = () => {
  if (vapidKeysInitialized) return;

  if (!webpush) {
    console.warn('⚠️  web-push package not available. Push notifications disabled.');
    return false;
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || 'mailto:admin@megaenterprise.in';

  if (!publicKey || !privateKey) {
    console.warn('⚠️  VAPID keys not configured. Push notifications will not work.');
    console.warn('   Run: node src/scripts/generateVapidKeys.js');
    return false;
  }

  webpush.setVapidDetails(email, publicKey, privateKey);
  vapidKeysInitialized = true;
  console.log('✅ VAPID keys initialized for push notifications');
  return true;
};

// Initialize on module load
initializeVapidKeys();

/**
 * Send push notification to a user
 * @param {String} userId - User ID to send notification to
 * @param {Object} notificationData - Notification data (title, body, icon, badge, data)
 * @returns {Promise<Array>} - Array of send results
 */
const sendPushNotification = async (userId, notificationData) => {
  if (!webpush) {
    return []; // Silently skip if web-push not available
  }

  if (!vapidKeysInitialized) {
    console.warn('⚠️  Cannot send push notification: VAPID keys not initialized');
    return [];
  }

  try {
    // Validate userId
    if (!userId) {
      console.warn('⚠️  Cannot send push notification: userId is required');
      return [];
    }

    // Get all subscriptions for this user
    const subscriptions = await PushSubscription.find({ userId });
    console.log(`🔔 Found ${subscriptions.length} push subscriptions for user ${userId}`);

    if (subscriptions.length === 0) {
      console.log(`ℹ️  No push subscriptions found to send notification to user ${userId}`);
      return []; // No subscriptions - silently return (user hasn't subscribed)
    }

    // Construct notification URL - ensure it's a relative path
    let notificationUrl = '/';
    if (notificationData.actionUrl) {
      // If actionUrl is provided, use it (should be relative like '/tasks' or '/clients')
      notificationUrl = notificationData.actionUrl.startsWith('/')
        ? notificationData.actionUrl
        : '/' + notificationData.actionUrl;
    } else if (notificationData.url) {
      notificationUrl = notificationData.url.startsWith('/')
        ? notificationData.url
        : '/' + notificationData.url;
    }

    const payload = JSON.stringify({
      title: notificationData.title || 'New Notification',
      body: notificationData.message || notificationData.body || '',
      icon: notificationData.icon || '/logo192.png',
      badge: notificationData.badge || '/logo192.png',
      data: {
        url: notificationUrl,
        notificationId: notificationData.notificationId || notificationData._id || null,
        entityType: notificationData.entityType || null,
        entityId: notificationData.entityId ? notificationData.entityId.toString() : null
      },
      tag: notificationData.category || 'notification',
      requireInteraction: false,
      silent: false
    });

    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        console.log(`📤 Sending push to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
        await webpush.sendNotification(
          subscription.toWebPushSubscription(),
          payload
        );
        console.log(`✅ Push sent successfully to ${subscription.endpoint.substring(0, 30)}...`);
        return { success: true, endpoint: subscription.endpoint };
      } catch (error) {
        const statusCode = error.statusCode || error.code;
        const endpoint = subscription.endpoint;

        // Detect push service provider from endpoint
        const isWindows = endpoint.includes('notify.windows.com');
        const isFCM = endpoint.includes('fcm.googleapis.com');
        const isMozilla = endpoint.includes('updates.push.services.mozilla.com');

        // Handle expired/invalid subscriptions (410 = Gone, 404 = Not Found)
        if (statusCode === 410 || statusCode === 404) {
          console.log(`🗑️  Removing expired subscription (${statusCode}): ${endpoint.substring(0, 50)}...`);
          await PushSubscription.findByIdAndDelete(subscription._id);
          return { success: false, endpoint, error: 'expired', statusCode };
        }

        // Handle unauthorized errors (401 = Unauthorized, 403 = Forbidden)
        // These usually mean the subscription is invalid or VAPID keys don't match
        if (statusCode === 401 || statusCode === 403) {
          console.warn(`⚠️  Unauthorized push subscription (${statusCode}) - removing: ${endpoint.substring(0, 50)}...`);
          await PushSubscription.findByIdAndDelete(subscription._id);
          return { success: false, endpoint, error: 'unauthorized', statusCode };
        }

        // Handle bad request (400) - usually means invalid payload or subscription
        if (statusCode === 400) {
          // For Windows, this might be a temporary issue, don't delete immediately
          if (isWindows) {
            console.warn(`⚠️  Windows push error (400) - subscription may be invalid: ${error.message}`);
            // Don't delete Windows subscriptions on 400, might be temporary
            return { success: false, endpoint, error: 'bad_request', statusCode, retry: true };
          } else {
            // For other services, 400 usually means invalid subscription
            console.warn(`⚠️  Invalid subscription (400) - removing: ${endpoint.substring(0, 50)}...`);
            await PushSubscription.findByIdAndDelete(subscription._id);
            return { success: false, endpoint, error: 'invalid', statusCode };
          }
        }

        // Handle other errors (500, 503, etc.) - might be temporary
        if (statusCode >= 500) {
          console.warn(`⚠️  Push service error (${statusCode}) - may retry later: ${error.message}`);
          return { success: false, endpoint, error: 'service_error', statusCode, retry: true };
        }

        // Handle "unexpected response code" - common with Windows
        if (error.message && error.message.includes('unexpected response code')) {
          if (isWindows) {
            console.warn(`⚠️  Windows push service error - subscription may need re-registration: ${error.message}`);
            // Don't delete, might work on next attempt
            return { success: false, endpoint, error: 'windows_error', statusCode, retry: true };
          }
        }

        // Log other errors but don't delete subscription (might be temporary)
        console.warn(`⚠️  Push notification error (${statusCode || 'unknown'}): ${error.message}`);
        return { success: false, endpoint, error: error.message, statusCode };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    const expiredCount = results.filter(r => r.error === 'expired' || r.error === 'unauthorized').length;

    // Log summary
    if (successCount > 0) {
      console.log(`📱 Push notification sent to ${successCount}/${subscriptions.length} device(s) for user ${userId}`);
    }

    if (failedCount > 0 && expiredCount > 0) {
      console.log(`ℹ️  ${expiredCount} expired subscription(s) removed, ${failedCount - expiredCount} other error(s)`);
    } else if (failedCount > 0) {
      // Only log if there are non-expired errors (to reduce noise)
      const nonExpiredErrors = results.filter(r => !r.success && r.error !== 'expired' && r.error !== 'unauthorized');
      if (nonExpiredErrors.length > 0) {
        console.log(`⚠️  ${failedCount} push notification(s) failed (may retry later)`);
      }
    }

    return results;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return [];
  }
};

/**
 * Send push notification to multiple users
 * @param {Array<String>} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Array>} - Array of send results
 */
const sendPushNotificationToMultiple = async (userIds, notificationData) => {
  if (!userIds || userIds.length === 0) return [];

  const promises = userIds.map(userId => sendPushNotification(userId, notificationData));
  const results = await Promise.all(promises);
  return results.flat();
};

/**
 * Get VAPID public key for frontend
 * @returns {String|null} - VAPID public key or null if not configured
 */
const getVapidPublicKey = () => {
  return process.env.VAPID_PUBLIC_KEY || null;
};

module.exports = {
  sendPushNotification,
  sendPushNotificationToMultiple,
  getVapidPublicKey,
  initializeVapidKeys
};

