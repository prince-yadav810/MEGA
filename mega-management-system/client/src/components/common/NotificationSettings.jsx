import React from 'react';
import { Bell, BellOff, Smartphone, Monitor, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import toast from 'react-hot-toast';

const NotificationSettings = () => {
  const {
    browserNotificationsEnabled,
    notificationPermission,
    requestNotificationPermission
  } = useNotifications();

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission();
    
    if (permission === 'granted') {
      toast.success('🔔 Desktop notifications enabled!');
    } else if (permission === 'denied') {
      toast.error('Notification permission denied. Please enable it in your browser settings.');
    }
  };

  const getPermissionStatus = () => {
    switch (notificationPermission) {
      case 'granted':
        return {
          icon: <CheckCircle className="h-5 w-5 text-success-600" />,
          text: 'Enabled',
          description: 'You will receive desktop notifications',
          color: 'text-success-700',
          bg: 'bg-success-50',
          border: 'border-success-200'
        };
      case 'denied':
        return {
          icon: <XCircle className="h-5 w-5 text-error-600" />,
          text: 'Denied',
          description: 'Enable in browser settings to receive notifications',
          color: 'text-error-700',
          bg: 'bg-error-50',
          border: 'border-error-200'
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-warning-600" />,
          text: 'Not Enabled',
          description: 'Click to enable desktop notifications',
          color: 'text-warning-700',
          bg: 'bg-warning-50',
          border: 'border-warning-200'
        };
    }
  };

  const status = getPermissionStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Bell className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Desktop Notifications</h3>
          <p className="text-sm text-gray-600">Get notified even when you're using other apps</p>
        </div>
      </div>

      {/* Current Status */}
      <div className={`rounded-lg border ${status.border} ${status.bg} p-4 mb-4`}>
        <div className="flex items-start gap-3">
          {status.icon}
          <div className="flex-1">
            <p className={`font-semibold ${status.color}`}>{status.text}</p>
            <p className="text-sm text-gray-600 mt-0.5">{status.description}</p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-semibold text-gray-900">What you'll get:</h4>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <Monitor className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">Desktop notifications on your computer</p>
          </div>
          <div className="flex items-start gap-2">
            <Smartphone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">Mobile notifications on your phone/tablet</p>
          </div>
          <div className="flex items-start gap-2">
            <Bell className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">Real-time updates even when using other apps</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      {!browserNotificationsEnabled && notificationPermission !== 'denied' && (
        <button
          onClick={handleEnableNotifications}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span>Enable Notifications</span>
        </button>
      )}

      {notificationPermission === 'denied' && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">
            How to enable notifications:
          </p>
          <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
            <li>Click the lock or info icon in your browser's address bar</li>
            <li>Find "Notifications" in the permissions list</li>
            <li>Change the setting to "Allow"</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      )}

      {browserNotificationsEnabled && (
        <div className="bg-success-50 rounded-lg p-4 border border-success-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success-600" />
            <p className="text-sm font-medium text-success-800">
              You're all set! You'll receive notifications even when using other apps.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;

