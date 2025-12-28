// Service Worker for PWA Push Notifications
// This file must be in the public folder to be accessible at the root

const CACHE_NAME = 'mega-management-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/logo192.png',
  '/logo512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of all pages immediately
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received', event);

  let notificationData = {
    title: 'New Notification',
    body: 'You have a new notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'notification',
    data: {
      url: '/'
    }
  };

  // Parse push data if available
  if (event.data) {
    try {
      // Try to get the data - web-push sends it as ArrayBuffer or text
      let textData;
      
      // Check if data has text() method (PushMessageData)
      if (typeof event.data.text === 'function') {
        textData = event.data.text();
      } else if (event.data instanceof ArrayBuffer) {
        // Convert ArrayBuffer to string
        textData = new TextDecoder().decode(event.data);
      } else {
        textData = String(event.data);
      }
      
      // Try to parse as JSON
      if (textData) {
        try {
          const data = JSON.parse(textData);
          console.log('Service Worker: Parsed JSON push data:', data);
          notificationData = {
            title: data.title || notificationData.title,
            body: data.body || notificationData.body,
            icon: data.icon || notificationData.icon,
            badge: data.badge || notificationData.badge,
            tag: data.tag || notificationData.tag,
            data: data.data || notificationData.data,
            requireInteraction: data.requireInteraction || false,
            silent: data.silent || false
          };
        } catch (jsonError) {
          // Not JSON, use as plain text
          console.log('Service Worker: Push data is plain text, using as notification body');
          notificationData.body = textData || notificationData.body;
        }
      }
    } catch (error) {
      console.error('Service Worker: Error reading push data', error);
      // Keep default notification data
    }
  }

  // Show notification
  event.waitUntil(
    (async () => {
      try {
        console.log('Service Worker: Attempting to show notification:', notificationData.title);
        
        // Show the notification
        await self.registration.showNotification(notificationData.title, {
          body: notificationData.body,
          icon: notificationData.icon,
          badge: notificationData.badge,
          tag: notificationData.tag,
          data: notificationData.data,
          requireInteraction: notificationData.requireInteraction,
          silent: notificationData.silent,
          vibrate: [200, 100, 200], // Vibration pattern for mobile
          actions: [
            {
              action: 'open',
              title: 'Open',
              icon: '/logo192.png'
            },
            {
              action: 'close',
              title: 'Close'
            }
          ]
        });
        
        console.log('Service Worker: ✅ Notification shown successfully');
      } catch (error) {
        // If permission denied, log it but don't crash
        console.error('Service Worker: ❌ Cannot show notification:', error.message);
        
        if (error.message.includes('permission') || error.name === 'NotAllowedError') {
          console.warn('Service Worker: ⚠️  Notification permission not granted');
          console.warn('Service Worker: Please enable notifications in browser settings');
          
          // Try to notify the client page about permission issue
          try {
            const clients = await self.clients.matchAll();
            clients.forEach((client) => {
              client.postMessage({
                type: 'NOTIFICATION_PERMISSION_REQUIRED',
                message: 'Please grant notification permission to receive push notifications'
              });
            });
          } catch (msgError) {
            // Ignore message errors
          }
        }
      }
    })()
  );
});

// Notification click event - handle user clicking on notification
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);

  event.notification.close(); // Close the notification

  const notificationData = event.notification.data || {};
  let urlToOpen = notificationData.url || '/';

  // Ensure URL is relative or same origin
  try {
    const url = new URL(urlToOpen, self.location.origin);
    urlToOpen = url.pathname + url.search + url.hash;
  } catch (error) {
    // If URL parsing fails, use default
    urlToOpen = '/';
  }

  // Handle action buttons
  if (event.action === 'close') {
    return; // Just close, don't open
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && client.url.startsWith(self.location.origin)) {
          // Focus existing window and navigate if needed
          if ('focus' in client) {
            if (client.url !== self.location.origin + urlToOpen && 'navigate' in client) {
              return client.navigate(urlToOpen).then(() => client.focus()).catch(() => client.focus());
            }
            return client.focus();
          }
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen).catch((error) => {
          console.error('Service Worker: Error opening window:', error);
          // Fallback to root if specific URL fails
          return clients.openWindow('/');
        });
      }
    }).catch((error) => {
      console.error('Service Worker: Error handling notification click:', error);
    })
  );
});

// Notification close event (optional - for analytics)
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed', event);
});

// Fetch event - serve cached resources when offline
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both fail, return offline page or fallback
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

