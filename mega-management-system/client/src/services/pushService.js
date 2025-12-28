// File path: client/src/services/pushService.js

import api from './api';

// Check if browser supports push notifications
export const isPushSupported = () => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

// Check current notification permission
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    throw new Error('Notifications are not supported in this browser');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Notification permission was previously denied');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

// Get VAPID public key from backend
export const getVapidPublicKey = async () => {
  try {
    const response = await api.get('/push/vapid-public-key');
    return response.data.publicKey;
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    throw error;
  }
};

// Convert VAPID key from base64 URL to Uint8Array
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Subscribe to push notifications
export const subscribeToPush = async () => {
  try {
    // Check support
    if (!isPushSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    // Check permission
    let permission = getNotificationPermission();
    if (permission === 'default') {
      permission = await requestNotificationPermission();
    }

    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    // Wait for service worker to be ready
    let registration;
    try {
      registration = await navigator.serviceWorker.ready;
    } catch (error) {
      throw new Error('Service worker not available. Please refresh the page.');
    }

    // Get VAPID public key
    let vapidPublicKey;
    try {
      vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not available');
      }
    } catch (error) {
      if (error.response?.status === 503) {
        throw new Error('Push notifications are not configured on the server');
      }
      throw error;
    }

    // Subscribe to push
    let subscription;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Push subscription denied. Please check your browser settings.');
      }
      throw error;
    }

    // Convert subscription to object
    const subscriptionObject = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(
          String.fromCharCode.apply(
            null,
            new Uint8Array(subscription.getKey('p256dh'))
          )
        ),
        auth: btoa(
          String.fromCharCode.apply(
            null,
            new Uint8Array(subscription.getKey('auth'))
          )
        )
      }
    };

    // Send subscription to backend
    try {
      await api.post('/push/subscribe', {
        ...subscriptionObject,
        userAgent: navigator.userAgent,
        deviceInfo: `${navigator.platform} - ${navigator.userAgent}`
      });
    } catch (error) {
      // If backend save fails, unsubscribe from push service to avoid orphaned subscriptions
      try {
        await subscription.unsubscribe();
      } catch (unsubError) {
        // Ignore unsubscribe errors
      }
      throw error;
    }

    console.log('✅ Push subscription successful');
    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    throw error;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from push service
      await subscription.unsubscribe();

      // Remove from backend
      await api.delete('/push/unsubscribe', {
        data: { endpoint: subscription.endpoint }
      });

      console.log('✅ Push unsubscription successful');
    }
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    throw error;
  }
};

// Check if user is subscribed
export const isSubscribed = async () => {
  try {
    if (!isPushSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

// Get current subscription
export const getCurrentSubscription = async () => {
  try {
    if (!isPushSupported()) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting current subscription:', error);
    return null;
  }
};

