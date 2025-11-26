import React, { useState, useEffect } from 'react';
import { Monitor, Save, Loader2, List, Kanban, CalendarDays, SortAsc } from 'lucide-react';
import toast from 'react-hot-toast';
import userService from '../../services/userService';

const AppearanceTab = () => {
  const [settings, setSettings] = useState({
    defaultPage: 'dashboard',
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
          defaultPage: prefs.appearance?.defaultPage || 'dashboard',
          defaultTaskView: prefs.work?.defaultTaskView || 'list',
          taskSortOrder: prefs.work?.taskSortOrder || 'dueDate',
          showCompletedTasks: prefs.work?.showCompletedTasks ?? true
        });

        // Sync to localStorage
        if (prefs.appearance?.defaultPage) {
          localStorage.setItem('defaultPage', prefs.appearance.defaultPage);
        }
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
          defaultPage: settings.defaultPage
        },
        work: {
          defaultTaskView: settings.defaultTaskView,
          taskSortOrder: settings.taskSortOrder,
          showCompletedTasks: settings.showCompletedTasks
        }
      };

      const response = await userService.updatePreferences(preferencesData);

      if (response.success) {
        // Save to localStorage
        localStorage.setItem('defaultPage', settings.defaultPage);
        localStorage.setItem('defaultTaskView', settings.defaultTaskView);
        localStorage.setItem('taskSortOrder', settings.taskSortOrder);
        localStorage.setItem('showCompletedTasks', String(settings.showCompletedTasks));

        toast.success('Display settings saved successfully!');
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

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading display preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Display Settings
        </h2>
        <p className="text-sm text-gray-600">
          Customize how information is displayed throughout the application
        </p>
      </div>

      {/* Task View Preferences */}
      <div className="space-y-4">
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

          <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg">
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
          <p className="text-xs text-gray-500 mt-1">
            The page you'll see when you first log in
          </p>
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
          {isSaving ? 'Saving...' : 'Save Display Settings'}
        </button>
      </div>
    </div>
  );
};

export default AppearanceTab;
