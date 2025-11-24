import React, { useState, useEffect } from 'react';
import { Bell, Mail, Volume2, Clock, Save, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import userService from '../../services/userService';

const NotificationsTab = () => {
  const [settings, setSettings] = useState({
    emailNotifications: {
      taskAssignments: true,
      taskDueDate: true,
      quotationUpdates: true
    },
    inAppNotifications: {
      desktopNotifications: true,
      soundAlerts: false
    },
    preferences: {
      taskReminderHours: 24,
      dailyDigest: false,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      weekendNotifications: false
    }
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

        if (prefs.notifications) {
          setSettings({
            emailNotifications: {
              taskAssignments: prefs.notifications.email?.taskAssignments ?? true,
              taskDueDate: prefs.notifications.email?.taskDueDate ?? true,
              quotationUpdates: prefs.notifications.email?.quotationUpdates ?? true
            },
            inAppNotifications: {
              desktopNotifications: prefs.notifications.inApp?.desktopNotifications ?? true,
              soundAlerts: prefs.notifications.inApp?.soundAlerts ?? false
            },
            preferences: {
              taskReminderHours: prefs.notifications.schedule?.taskReminderHours ?? 24,
              dailyDigest: prefs.notifications.schedule?.dailyDigest ?? false,
              quietHoursEnabled: prefs.notifications.schedule?.quietHoursEnabled ?? false,
              quietHoursStart: prefs.notifications.schedule?.quietHoursStart ?? '22:00',
              quietHoursEnd: prefs.notifications.schedule?.quietHoursEnd ?? '08:00',
              weekendNotifications: prefs.notifications.schedule?.weekendNotifications ?? false
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: !prev.emailNotifications[key]
      }
    }));
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

  const handlePreferenceChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const preferencesData = {
        notifications: {
          email: settings.emailNotifications,
          inApp: settings.inAppNotifications,
          schedule: settings.preferences
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

  const ToggleSwitch = ({ enabled, onToggle, disabled = false }) => (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${enabled ? 'bg-blue-600' : 'bg-gray-200'}`}
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

      {/* Email Notifications */}
      <div>
        <div className="flex items-center mb-4">
          <Mail className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Email Notifications
          </h3>
        </div>
        <div className="space-y-3">
          {[
            {
              key: 'taskAssignments',
              label: 'Task Assignments',
              description: 'Get notified when a task is assigned to you'
            },
            {
              key: 'taskDueDate',
              label: 'Task Due Date Reminders',
              description: 'Reminders for upcoming and overdue tasks'
            },
            {
              key: 'quotationUpdates',
              label: 'Quotation Updates',
              description: 'Updates on quotation status changes'
            }
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-gray-700">{label}</label>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
              <ToggleSwitch
                enabled={settings.emailNotifications[key]}
                onToggle={() => handleEmailToggle(key)}
              />
            </div>
          ))}
        </div>

        {/* Task Reminder Time */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Reminder Time
          </label>
          <select
            value={settings.preferences.taskReminderHours}
            onChange={(e) => handlePreferenceChange('taskReminderHours', parseInt(e.target.value))}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value={1}>1 hour before due</option>
            <option value={2}>2 hours before due</option>
            <option value={4}>4 hours before due</option>
            <option value={12}>12 hours before due</option>
            <option value={24}>1 day before due</option>
            <option value={48}>2 days before due</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Receive task reminders this long before the due date
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
                Desktop notifications are enabled but browser permission is {permissionStatus}.
              </p>
              <button
                onClick={requestNotificationPermission}
                className="mt-2 text-sm text-yellow-700 underline hover:no-underline"
              >
                Click here to enable browser notifications
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Desktop Notifications
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Show browser notifications for important updates
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

      {/* Quiet Hours */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Notification Schedule
          </h3>
        </div>

        <div className="space-y-4">
          {/* Daily Digest */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Daily Summary Email
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Receive a daily summary of all notifications instead of individual emails
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.preferences.dailyDigest}
              onToggle={() => handlePreferenceChange('dailyDigest', !settings.preferences.dailyDigest)}
            />
          </div>

          {/* Quiet Hours Toggle */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Enable Quiet Hours
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pause non-urgent notifications during specified hours
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.preferences.quietHoursEnabled}
                onToggle={() => handlePreferenceChange('quietHoursEnabled', !settings.preferences.quietHoursEnabled)}
              />
            </div>

            {settings.preferences.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={settings.preferences.quietHoursStart}
                    onChange={(e) => handlePreferenceChange('quietHoursStart', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={settings.preferences.quietHoursEnd}
                    onChange={(e) => handlePreferenceChange('quietHoursEnd', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Weekend Notifications */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Weekend Notifications
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Receive notifications on Saturdays and Sundays
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.preferences.weekendNotifications}
              onToggle={() => handlePreferenceChange('weekendNotifications', !settings.preferences.weekendNotifications)}
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
