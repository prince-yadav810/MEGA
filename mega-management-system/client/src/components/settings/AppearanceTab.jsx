import React, { useState, useEffect } from 'react';
import { Monitor, Calendar, Clock, DollarSign, LayoutGrid, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const AppearanceTab = () => {
  const [settings, setSettings] = useState({
    dateFormat: localStorage.getItem('dateFormat') || 'DD/MM/YYYY',
    timeFormat: localStorage.getItem('timeFormat') || '12',
    currency: localStorage.getItem('currency') || 'INR',
    rowsPerPage: localStorage.getItem('rowsPerPage') || '25',
    compactMode: localStorage.getItem('compactMode') === 'true',
    defaultPage: localStorage.getItem('defaultPage') || 'workspace'
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      Object.keys(settings).forEach(key => {
        localStorage.setItem(key, settings[key]);
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('Appearance settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

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
          <option value="12">12-hour (3:30 PM)</option>
          <option value="24">24-hour (15:30)</option>
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
