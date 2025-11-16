import React, { useState, useEffect } from 'react';
import { Bell, Mail, Volume2, Clock, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import userService from '../../services/userService';

const NotificationsTab = () => {
  const [settings, setSettings] = useState({
    emailNotifications: {
      taskAssignments: true,
      taskDueDate: true,
      quotationUpdates: true,
      productStockAlerts: false,
      systemAnnouncements: true
    },
    inAppNotifications: {
      desktopNotifications: true,
      soundAlerts: false
    },
    preferences: {
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      weekendNotifications: true
    }
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from backend on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getPreferences();
      
      if (response.success && response.data) {
        const prefs = response.data;
        
        // Map backend structure to component state
        if (prefs.notifications) {
          setSettings({
            emailNotifications: {
              taskAssignments: prefs.notifications.email?.taskAssignments ?? true,
              taskDueDate: prefs.notifications.email?.taskDueDate ?? true,
              quotationUpdates: prefs.notifications.email?.quotationUpdates ?? true,
              productStockAlerts: prefs.notifications.email?.productStockAlerts ?? false,
              systemAnnouncements: prefs.notifications.email?.systemAnnouncements ?? true
            },
            inAppNotifications: {
              desktopNotifications: prefs.notifications.inApp?.desktopNotifications ?? true,
              soundAlerts: prefs.notifications.inApp?.soundAlerts ?? false
            },
            preferences: {
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
      // Don't show error toast on initial load, just use defaults
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

  const handlePreferenceToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key]
      }
    }));
  };

  const handleTimeChange = (key, value) => {
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
      // Map component state to backend structure
      const preferencesData = {
        notifications: {
          email: {
            taskAssignments: settings.emailNotifications.taskAssignments,
            taskDueDate: settings.emailNotifications.taskDueDate,
            quotationUpdates: settings.emailNotifications.quotationUpdates,
            productStockAlerts: settings.emailNotifications.productStockAlerts,
            systemAnnouncements: settings.emailNotifications.systemAnnouncements
          },
          inApp: {
            desktopNotifications: settings.inAppNotifications.desktopNotifications,
            soundAlerts: settings.inAppNotifications.soundAlerts
          },
          schedule: {
            quietHoursEnabled: settings.preferences.quietHoursEnabled,
            quietHoursStart: settings.preferences.quietHoursStart,
            quietHoursEnd: settings.preferences.quietHoursEnd,
            weekendNotifications: settings.preferences.weekendNotifications
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
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
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
        <div className="space-y-4">
          {[
            { key: 'taskAssignments', label: 'Task Assignments', description: 'Get notified when a task is assigned to you' },
            { key: 'taskDueDate', label: 'Task Due Date Reminders', description: 'Reminders for upcoming and overdue tasks' },
            { key: 'quotationUpdates', label: 'Quotation Updates', description: 'Updates on quotation status changes' },
            { key: 'productStockAlerts', label: 'Product Stock Alerts', description: 'Alerts when product stock is low' },
            { key: 'systemAnnouncements', label: 'System Announcements', description: 'Important system updates and news' }
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {label}
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {description}
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.emailNotifications[key]}
                onToggle={() => handleEmailToggle(key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <Bell className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            In-App Notifications
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Desktop Notifications
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Show browser notifications for important updates
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.inAppNotifications.desktopNotifications}
              onToggle={() => handleInAppToggle('desktopNotifications')}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Sound Alerts
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Play a sound when receiving notifications
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.inAppNotifications.soundAlerts}
              onToggle={() => handleInAppToggle('soundAlerts')}
            />
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Notification Schedule
          </h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable Quiet Hours
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Pause non-urgent notifications during specified hours
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.preferences.quietHoursEnabled}
              onToggle={() => handlePreferenceToggle('quietHoursEnabled')}
            />
          </div>

          {settings.preferences.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 pl-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={settings.preferences.quietHoursStart}
                  onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={settings.preferences.quietHoursEnd}
                  onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between py-3">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Weekend Notifications
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Receive notifications on Saturdays and Sundays
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.preferences.weekendNotifications}
              onToggle={() => handlePreferenceToggle('weekendNotifications')}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 border-t border-gray-200">
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
