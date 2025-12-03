import React, { useState, useEffect } from 'react';
import { Bell, X, Smartphone, Laptop } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const NotificationPermissionBanner = () => {
  const { 
    notificationPermission, 
    requestNotificationPermission,
    browserNotificationsEnabled 
  } = useNotifications();
  
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the banner
    const isDismissed = localStorage.getItem('notification-banner-dismissed') === 'true';
    setDismissed(isDismissed);

    // Show banner if notifications are not enabled and not dismissed
    if (notificationPermission === 'default' && !isDismissed) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notificationPermission]);

  const handleEnable = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      setShowBanner(false);
      localStorage.setItem('notification-banner-dismissed', 'true');
    } else if (permission === 'denied') {
      setShowBanner(false);
      localStorage.setItem('notification-banner-dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  if (!showBanner || browserNotificationsEnabled || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-slide-down">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-2xl p-4 border border-primary-400">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bell className="h-6 w-6 text-white animate-pulse" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg mb-1">
              Enable Desktop & Mobile Notifications
            </h3>
            <p className="text-white/90 text-sm mb-3">
              Get real-time updates even when you're using other apps or on your mobile device. Stay informed about tasks, clients, and important updates.
            </p>
            
            {/* Features */}
            <div className="flex flex-wrap gap-3 mb-3">
              <div className="flex items-center gap-1.5 text-white/90 text-xs bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                <Laptop className="h-3.5 w-3.5" />
                <span>Desktop Alerts</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/90 text-xs bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile Push</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/90 text-xs bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
                <Bell className="h-3.5 w-3.5" />
                <span>Real-time Updates</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleEnable}
                className="px-4 py-2 bg-white text-primary-600 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Enable Notifications
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-white/90 hover:text-white text-sm font-medium hover:bg-white/10 rounded-lg transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;
