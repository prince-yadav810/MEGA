import React, { useState, useEffect } from 'react';
import { Bell, Volume2, Clock, Save, Loader2, AlertCircle, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import userService from '../../services/userService';
import NotificationSettings from '../common/NotificationSettings';

const NotificationsTab = () => {
  const [settings, setSettings] = useState({
    inAppNotifications: {
      desktopNotifications: true,
      soundAlerts: false
    },
    taskReminderHours: 24
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('default');

  useEffect(() => {
    loadPreferences();
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === 'granted') {
        toast.success('Desktop notifications enabled!');
        // Send a test notification
        new Notification('Notifications Enabled', {
          body: 'You will now receive desktop notifications.',
          icon: '/favicon.ico'
        });
      } else {
        toast.error('Desktop notification permission denied');
      }
    }
  };

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getPreferences();

      if (response.success && response.data) {
        const prefs = response.data;

        setSettings({
          inAppNotifications: {
            desktopNotifications: prefs.notifications?.inApp?.desktopNotifications ?? true,
            soundAlerts: prefs.notifications?.inApp?.soundAlerts ?? false
          },
          taskReminderHours: prefs.notifications?.schedule?.taskReminderHours ?? 24
        });
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInAppToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      inAppNotifications: {
        ...prev.inAppNotifications,
        [key]: !prev.inAppNotifications[key]
      }
    }));
  };

  const handleReminderChange = (value) => {
    setSettings(prev => ({
      ...prev,
      taskReminderHours: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const preferencesData = {
        notifications: {
          inApp: settings.inAppNotifications,
          schedule: {
            taskReminderHours: settings.taskReminderHours
          }
        }
      };

      const response = await userService.updatePreferences(preferencesData);

      if (response.success) {
        toast.success('Notification settings saved successfully!');
      } else {
        toast.error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const ToggleSwitch = ({ enabled, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading notification preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Notification Preferences
        </h2>
        <p className="text-sm text-gray-600">
          Control how and when you receive notifications
        </p>
      </div>

      {/* Desktop Notification Settings - New Component */}
      <div className="mb-6">
        <NotificationSettings />
      </div>

      {/* Task Reminders */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <Inbox className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Task Reminders
          </h3>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reminder Time Before Due Date
          </label>
          <select
            value={settings.taskReminderHours}
            onChange={(e) => handleReminderChange(parseInt(e.target.value))}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value={1}>1 hour before</option>
            <option value={2}>2 hours before</option>
            <option value={4}>4 hours before</option>
            <option value={12}>12 hours before</option>
            <option value={24}>1 day before</option>
            <option value={48}>2 days before</option>
          </select>
          <p className="text-xs text-gray-600 mt-2">
            Task reminders will appear in your inbox notifications
          </p>
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <Bell className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            In-App Notifications
          </h3>
        </div>

        {/* Desktop notification permission status */}
        {permissionStatus !== 'granted' && settings.inAppNotifications.desktopNotifications && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">
                Desktop notifications are enabled but browser permission is required.
              </p>
              <button
                onClick={requestNotificationPermission}
                className="mt-2 text-sm text-yellow-700 underline hover:no-underline font-medium"
              >
                Click here to enable browser notifications
              </button>
            </div>
          </div>
        )}

        {permissionStatus === 'granted' && settings.inAppNotifications.desktopNotifications && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">
              Desktop notifications are active
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Desktop Notifications
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Show browser notifications for new tasks and updates
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.inAppNotifications.desktopNotifications}
              onToggle={() => handleInAppToggle('desktopNotifications')}
            />
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Volume2 className="h-4 w-4 text-gray-400 mr-2" />
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Sound Alerts
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Play a sound when receiving notifications
                </p>
              </div>
            </div>
            <ToggleSwitch
              enabled={settings.inAppNotifications.soundAlerts}
              onToggle={() => handleInAppToggle('soundAlerts')}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  );
};

export default NotificationsTab;
