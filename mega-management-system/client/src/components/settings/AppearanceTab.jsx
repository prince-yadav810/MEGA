import React, { useState, useEffect } from 'react';
import { Monitor, Calendar, Clock, DollarSign, LayoutGrid, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import userService from '../../services/userService';

const AppearanceTab = () => {
  const [settings, setSettings] = useState({
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12-hour',
    currency: 'INR',
    rowsPerPage: 25,
    compactMode: false,
    defaultPage: 'workspace'
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
        if (prefs.appearance) {
          setSettings({
            dateFormat: prefs.appearance.dateFormat || 'DD/MM/YYYY',
            timeFormat: prefs.appearance.timeFormat || '12-hour',
            currency: prefs.appearance.currency || 'INR',
            rowsPerPage: prefs.appearance.rowsPerPage || 25,
            compactMode: prefs.appearance.compactMode || false,
            defaultPage: prefs.appearance.defaultPage || 'workspace'
          });
          
          // Also sync to localStorage for immediate use
          localStorage.setItem('dateFormat', prefs.appearance.dateFormat || 'DD/MM/YYYY');
          localStorage.setItem('timeFormat', prefs.appearance.timeFormat || '12-hour');
          localStorage.setItem('currency', prefs.appearance.currency || 'INR');
          localStorage.setItem('rowsPerPage', String(prefs.appearance.rowsPerPage || 25));
          localStorage.setItem('compactMode', String(prefs.appearance.compactMode || false));
          localStorage.setItem('defaultPage', prefs.appearance.defaultPage || 'workspace');
        }
      }
    } catch (error) {
      console.error('Failed to load appearance preferences:', error);
      // Don't show error toast on initial load, just use defaults
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
      // Prepare data for backend
      const preferencesData = {
        appearance: {
          dateFormat: settings.dateFormat,
          timeFormat: settings.timeFormat,
          currency: settings.currency,
          rowsPerPage: Number(settings.rowsPerPage),
          compactMode: settings.compactMode,
          defaultPage: settings.defaultPage
        }
      };

      // Save to backend
      const response = await userService.updatePreferences(preferencesData);
      
      if (response.success) {
        // Also save to localStorage for immediate use
        localStorage.setItem('dateFormat', settings.dateFormat);
        localStorage.setItem('timeFormat', settings.timeFormat);
        localStorage.setItem('currency', settings.currency);
        localStorage.setItem('rowsPerPage', String(settings.rowsPerPage));
        localStorage.setItem('compactMode', String(settings.compactMode));
        localStorage.setItem('defaultPage', settings.defaultPage);
        
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Appearance Settings
        </h2>
        <p className="text-sm text-gray-600">
          Customize how information is displayed throughout the application
        </p>
      </div>

      {/* Date Format */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <Calendar className="h-4 w-4 mr-2" />
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

      {/* Time Format */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <Clock className="h-4 w-4 mr-2" />
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

      {/* Currency */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <DollarSign className="h-4 w-4 mr-2" />
          Currency Display
        </label>
        <select
          value={settings.currency}
          onChange={(e) => handleChange('currency', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="INR">₹ Indian Rupee (INR)</option>
          <option value="USD">$ US Dollar (USD)</option>
          <option value="EUR">€ Euro (EUR)</option>
          <option value="GBP">£ British Pound (GBP)</option>
        </select>
      </div>

      {/* Default Landing Page */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <Monitor className="h-4 w-4 mr-2" />
          Default Landing Page
        </label>
        <select
          value={settings.defaultPage}
          onChange={(e) => handleChange('defaultPage', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="workspace">Workspace</option>
          <option value="quotations">Quotations</option>
          <option value="products">Products</option>
          <option value="analytics">Analytics</option>
        </select>
      </div>

      {/* Rows Per Page */}
      <div>
        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
          <LayoutGrid className="h-4 w-4 mr-2" />
          Rows Per Page (Tables)
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

      {/* Compact Mode Toggle */}
      <div className="flex items-center justify-between py-3 border-t border-gray-200">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Compact View Mode
          </label>
          <p className="text-xs text-gray-500 mt-1">
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

      {/* Save Button */}
      <div className="pt-4 border-t border-gray-200">
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
