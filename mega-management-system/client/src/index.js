import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Register service worker for PWA and push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);

        // Check for updates periodically (every 60 seconds)
        setInterval(() => {
          registration.update();
        }, 60000);

        // Check for updates on page visibility change
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        });

        // Handle new service worker available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 New service worker found, installing...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New version available - auto-refresh when user is not actively using the page
                console.log('🔄 New version available!');

                // If page is hidden (not actively being used), refresh immediately
                if (document.visibilityState === 'hidden') {
                  window.location.reload();
                } else {
                  // Page is visible - refresh on next visibility change or show subtle notification
                  const handleVisibilityChange = () => {
                    if (document.visibilityState === 'hidden') {
                      document.removeEventListener('visibilitychange', handleVisibilityChange);
                      // Small delay to ensure the tab is fully in background
                      setTimeout(() => window.location.reload(), 100);
                    }
                  };
                  document.addEventListener('visibilitychange', handleVisibilityChange);

                  // Also refresh when user returns after some time
                  const handleFocus = () => {
                    window.removeEventListener('focus', handleFocus);
                    // Check if still a new version (might have refreshed in another tab)
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      window.location.reload();
                    }
                  };
                  // Add slight delay before listening to focus to avoid immediate trigger
                  setTimeout(() => {
                    window.addEventListener('focus', handleFocus);
                  }, 1000);
                }
              } else {
                // First install - no need to refresh
                console.log('✅ Service Worker installed for the first time');
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
      });
  });

  // Handle controller change (when new SW takes over)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Service Worker controller changed, reloading...');
    window.location.reload();
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
