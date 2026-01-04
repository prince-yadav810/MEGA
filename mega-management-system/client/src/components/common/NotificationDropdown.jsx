import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext.js';

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, enablePushNotifications, pushPermission } = useNotifications();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning-600" />;
      default:
        return <Info className="h-5 w-5 text-primary-600" />;
    }
  };

  // Helper to format time in 12-hour AM/PM format
  const formatTime = (createdAt) => {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return '';

    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Push Notification Request Button */}
            {pushPermission === 'default' && (
              <button
                onClick={() => {
                  enablePushNotifications()
                    .then(granted => {
                      if (granted) alert('✅ Push Notifications Enabled Successfully!');
                      else alert('⚠️ Permission granted but setup failed. Check console.');
                    })
                    .catch(err => {
                      alert(`❌ Error enabling push: ${err.message}`);
                    });
                }}
                className="w-full mt-1 mb-1 px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-md hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
              >
                <Bell className="h-3 w-3" />
                Enable Push Notifications
              </button>
            )}

            {/* Sync button for users who already granted permission but may not have subscription */}
            {pushPermission === 'granted' && (
              <button
                onClick={() => {
                  enablePushNotifications()
                    .then(() => alert('✅ Push subscription synced!'))
                    .catch(err => alert(`❌ Sync failed: ${err.message}`));
                }}
                className="w-full mt-1 mb-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-md hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
              >
                <Bell className="h-3 w-3" />
                Sync Push Notifications
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => {
                const notifId = notification._id || notification.id;
                return (
                  <div
                    key={notifId}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-primary-50' : ''
                      }`}
                    onClick={() => markAsRead(notifId)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notifId);
                        }}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/inbox');
                }}
                className="text-xs text-primary-600 hover:text-primary-700 w-full text-center"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
