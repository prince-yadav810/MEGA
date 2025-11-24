import React, { useState, useEffect } from 'react';
import { Monitor, Calendar, Clock, LayoutGrid, Save, Loader2, Sun, Moon, Laptop, List, Kanban, CalendarDays, SortAsc } from 'lucide-react';
import toast from 'react-hot-toast';
import userService from '../../services/userService';

const AppearanceTab = () => {
  const [settings, setSettings] = useState({
    // Display Settings
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour',
    rowsPerPage: 25,
    compactMode: false,
    defaultPage: 'dashboard',
    // Theme
    theme: 'light',
    // Work Preferences
    defaultTaskView: 'list',
    taskSortOrder: 'dueDate',
    showCompletedTasks: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getPreferences();

      if (response.success && response.data) {
        const prefs = response.data;

        setSettings({
          dateFormat: prefs.appearance?.dateFormat || 'DD/MM/YYYY',
          timeFormat: prefs.appearance?.timeFormat || '12-hour',
          rowsPerPage: prefs.appearance?.rowsPerPage || 25,
          compactMode: prefs.appearance?.compactMode || false,
          defaultPage: prefs.appearance?.defaultPage || 'dashboard',
          theme: prefs.work?.theme || 'light',
          defaultTaskView: prefs.work?.defaultTaskView || 'list',
          taskSortOrder: prefs.work?.taskSortOrder || 'dueDate',
          showCompletedTasks: prefs.work?.showCompletedTasks ?? true
        });

        // Sync to localStorage
        Object.entries(prefs.appearance || {}).forEach(([key, value]) => {
          localStorage.setItem(key, String(value));
        });
      }
    } catch (error) {
      console.error('Failed to load appearance preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const preferencesData = {
        appearance: {
          dateFormat: settings.dateFormat,
          timeFormat: settings.timeFormat,
          rowsPerPage: Number(settings.rowsPerPage),
          compactMode: settings.compactMode,
          defaultPage: settings.defaultPage
        },
        work: {
          theme: settings.theme,
          defaultTaskView: settings.defaultTaskView,
          taskSortOrder: settings.taskSortOrder,
          showCompletedTasks: settings.showCompletedTasks
        }
      };

      const response = await userService.updatePreferences(preferencesData);

      if (response.success) {
        // Save to localStorage
        localStorage.setItem('dateFormat', settings.dateFormat);
        localStorage.setItem('timeFormat', settings.timeFormat);
        localStorage.setItem('rowsPerPage', String(settings.rowsPerPage));
        localStorage.setItem('compactMode', String(settings.compactMode));
        localStorage.setItem('defaultPage', settings.defaultPage);
        localStorage.setItem('theme', settings.theme);

        // Apply theme immediately
        applyTheme(settings.theme);

        toast.success('Appearance settings saved successfully!');
      } else {
        toast.error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving appearance preferences:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading appearance preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Appearance & Display
        </h2>
        <p className="text-sm text-gray-600">
          Customize how information is displayed throughout the application
        </p>
      </div>

      {/* Theme Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Sun className="h-5 w-5 mr-2 text-blue-600" />
          Theme
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light', icon: Sun, description: 'Light mode' },
            { id: 'dark', label: 'Dark', icon: Moon, description: 'Dark mode' },
            { id: 'system', label: 'System', icon: Laptop, description: 'Follow system' }
          ].map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleChange('theme', id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                settings.theme === id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className={`h-6 w-6 mx-auto mb-2 ${
                settings.theme === id ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div className="text-sm font-medium text-gray-900">{label}</div>
              <div className="text-xs text-gray-500">{description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Date & Time Format */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Date & Time
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Format
            </label>
            <select
              value={settings.dateFormat}
              onChange={(e) => handleChange('dateFormat', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Format
            </label>
            <select
              value={settings.timeFormat}
              onChange={(e) => handleChange('timeFormat', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="12-hour">12-hour (3:30 PM)</option>
              <option value="24-hour">24-hour (15:30)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task View Preferences */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <List className="h-5 w-5 mr-2 text-blue-600" />
          Task View Preferences
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Task View
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'list', label: 'List', icon: List },
              { id: 'kanban', label: 'Kanban', icon: Kanban },
              { id: 'calendar', label: 'Calendar', icon: CalendarDays }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleChange('defaultTaskView', id)}
                className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  settings.defaultTaskView === id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`h-5 w-5 ${
                  settings.defaultTaskView === id ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  settings.defaultTaskView === id ? 'text-blue-600' : 'text-gray-700'
                }`}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <SortAsc className="h-4 w-4 mr-1" />
              Default Sort Order
            </label>
            <select
              value={settings.taskSortOrder}
              onChange={(e) => handleChange('taskSortOrder', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="createdAt">Created Date</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Show Completed Tasks
              </label>
              <p className="text-xs text-gray-500">Display completed tasks in lists</p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('showCompletedTasks', !settings.showCompletedTasks)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showCompletedTasks ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.showCompletedTasks ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Monitor className="h-5 w-5 mr-2 text-blue-600" />
          Display Options
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Landing Page
            </label>
            <select
              value={settings.defaultPage}
              onChange={(e) => handleChange('defaultPage', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="dashboard">Dashboard</option>
              <option value="workspace">Workspace</option>
              <option value="quotations">Quotations</option>
              <option value="clients">Clients</option>
              <option value="attendance">Attendance</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
              <LayoutGrid className="h-4 w-4 mr-1" />
              Rows Per Page
            </label>
            <select
              value={settings.rowsPerPage}
              onChange={(e) => handleChange('rowsPerPage', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="10">10 rows</option>
              <option value="25">25 rows</option>
              <option value="50">50 rows</option>
              <option value="100">100 rows</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Compact View Mode
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Reduce spacing and padding for a more compact interface
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange('compactMode', !settings.compactMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.compactMode ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.compactMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Appearance Settings'}
        </button>
      </div>
    </div>
  );
};

export default AppearanceTab;
