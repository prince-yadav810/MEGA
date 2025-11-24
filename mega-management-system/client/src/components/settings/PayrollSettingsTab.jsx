import React, { useState, useEffect } from 'react';
import { Wallet, Calendar, Percent, Clock, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import settingsService from '../../services/settingsService';

const PayrollSettingsTab = () => {
  const [settings, setSettings] = useState({
    payCycle: 'monthly',
    salaryCreditDay: 1,
    maxAdvancePercent: 50,
    advanceDeductionMethod: 'full',
    pfEnabled: false,
    pfRate: 12,
    tdsEnabled: false,
    overtimeEnabled: false,
    overtimeRate: 1.5
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await settingsService.getPayrollSettings();
      if (response.success && response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to load payroll settings:', error);
      toast.error('Failed to load payroll settings');
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
      const response = await settingsService.updatePayrollSettings(settings);
      if (response.success) {
        toast.success('Payroll settings saved successfully!');
      } else {
        toast.error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving payroll settings:', error);
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
          <p className="text-gray-600">Loading payroll settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Payroll Settings</h2>
        <p className="text-sm text-gray-600">
          Configure salary processing, advances, and deductions
        </p>
      </div>

      {/* Pay Cycle Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Pay Cycle
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pay Cycle
            </label>
            <select
              value={settings.payCycle}
              onChange={(e) => handleChange('payCycle', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="bi-weekly">Bi-Weekly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salary Credit Day
            </label>
            <select
              value={settings.salaryCreditDay}
              onChange={(e) => handleChange('salaryCreditDay', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[1, 5, 7, 10, 15, 25, 28].map(day => (
                <option key={day} value={day}>
                  {day === 1 ? '1st' : day === 2 ? '2nd' : day === 3 ? '3rd' : `${day}th`} of the month
                </option>
              ))}
              <option value={0}>Last day of month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advance Settings */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-blue-600" />
          Advance Payment Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Advance (% of Salary)
            </label>
            <div className="relative">
              <input
                type="number"
                value={settings.maxAdvancePercent}
                onChange={(e) => handleChange('maxAdvancePercent', parseInt(e.target.value) || 0)}
                min={0}
                max={100}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Employees can request up to {settings.maxAdvancePercent}% of their salary as advance
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deduction Method
            </label>
            <select
              value={settings.advanceDeductionMethod}
              onChange={(e) => handleChange('advanceDeductionMethod', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="full">Full (Deduct in next salary)</option>
              <option value="installments">Installments (Split across months)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deductions */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Percent className="h-5 w-5 mr-2 text-blue-600" />
          Deductions
        </h3>

        {/* PF */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Provident Fund (PF)
              </label>
              <p className="text-xs text-gray-500">
                Enable PF deduction from salary
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('pfEnabled', !settings.pfEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.pfEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.pfEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.pfEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PF Rate (%)
              </label>
              <div className="relative w-32">
                <input
                  type="number"
                  value={settings.pfRate}
                  onChange={(e) => handleChange('pfRate', parseFloat(e.target.value) || 0)}
                  min={0}
                  max={25}
                  step={0.5}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          )}
        </div>

        {/* TDS */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Tax Deducted at Source (TDS)
              </label>
              <p className="text-xs text-gray-500">
                Enable TDS calculation based on income slabs
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('tdsEnabled', !settings.tdsEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.tdsEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.tdsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Overtime */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Overtime
        </h3>

        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable Overtime Pay
              </label>
              <p className="text-xs text-gray-500">
                Pay extra for hours worked beyond standard work hours
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('overtimeEnabled', !settings.overtimeEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.overtimeEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.overtimeEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.overtimeEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overtime Rate (multiplier)
              </label>
              <select
                value={settings.overtimeRate}
                onChange={(e) => handleChange('overtimeRate', parseFloat(e.target.value))}
                className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1.25}>1.25x (25% extra)</option>
                <option value={1.5}>1.5x (50% extra)</option>
                <option value={2}>2x (100% extra)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Overtime hours will be paid at {settings.overtimeRate}x the regular hourly rate
              </p>
            </div>
          )}
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
          {isSaving ? 'Saving...' : 'Save Payroll Settings'}
        </button>
      </div>
    </div>
  );
};

export default PayrollSettingsTab;
