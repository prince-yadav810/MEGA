import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, Save, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import settingsService from '../../services/settingsService';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AttendanceSettingsTab = () => {
  const [settings, setSettings] = useState({
    officeStartTime: '09:00',
    officeEndTime: '18:00',
    lateThresholdMinutes: 15,
    halfDayHours: 4,
    fullDayHours: 8,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    geolocationRequired: false,
    officeLocation: {
      latitude: 0,
      longitude: 0,
      address: ''
    },
    geofenceRadius: 100,
    allowRemoteCheckIn: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await settingsService.getAttendanceSettings();
      if (response.success && response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to load attendance settings:', error);
      toast.error('Failed to load attendance settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      officeLocation: { ...prev.officeLocation, [field]: value }
    }));
  };

  const toggleWorkingDay = (day) => {
    setSettings(prev => {
      const days = prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day];
      return { ...prev, workingDays: days };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await settingsService.updateAttendanceSettings(settings);
      if (response.success) {
        toast.success('Attendance settings saved successfully!');
      } else {
        toast.error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving attendance settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleLocationChange('latitude', position.coords.latitude);
          handleLocationChange('longitude', position.coords.longitude);
          toast.success('Location captured successfully!');
        },
        (error) => {
          toast.error('Failed to get location. Please enter manually.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading attendance settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Attendance Settings</h2>
        <p className="text-sm text-gray-600">
          Configure office hours, working days, and attendance tracking rules
        </p>
      </div>

      {/* Office Hours */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Office Hours
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Office Start Time
            </label>
            <input
              type="time"
              value={settings.officeStartTime}
              onChange={(e) => handleChange('officeStartTime', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Office End Time
            </label>
            <input
              type="time"
              value={settings.officeEndTime}
              onChange={(e) => handleChange('officeEndTime', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Late Threshold (minutes)
            </label>
            <input
              type="number"
              value={settings.lateThresholdMinutes}
              onChange={(e) => handleChange('lateThresholdMinutes', parseInt(e.target.value) || 0)}
              min={0}
              max={60}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Mark as late after this many minutes</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Half Day Hours
            </label>
            <input
              type="number"
              value={settings.halfDayHours}
              onChange={(e) => handleChange('halfDayHours', parseInt(e.target.value) || 0)}
              min={1}
              max={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum hours for half-day</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Day Hours
            </label>
            <input
              type="number"
              value={settings.fullDayHours}
              onChange={(e) => handleChange('fullDayHours', parseInt(e.target.value) || 0)}
              min={1}
              max={24}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Standard working hours per day</p>
          </div>
        </div>
      </div>

      {/* Working Days */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Working Days
        </h3>

        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleWorkingDay(day)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                settings.workingDays.includes(day)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Selected: {settings.workingDays.length} days per week
        </p>
      </div>

      {/* Geolocation Settings */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
          Location Settings
        </h3>

        <div className="flex items-center justify-between py-3 bg-gray-50 px-4 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Require Geolocation for Check-in
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Employees must be at office location to check in
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange('geolocationRequired', !settings.geolocationRequired)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.geolocationRequired ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.geolocationRequired ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {settings.geolocationRequired && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-800">
                Set your office location to enable geo-fencing for attendance
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Office Address
              </label>
              <input
                type="text"
                value={settings.officeLocation.address}
                onChange={(e) => handleLocationChange('address', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="123 Business Park, Mumbai"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={settings.officeLocation.latitude}
                  onChange={(e) => handleLocationChange('latitude', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="19.0760"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={settings.officeLocation.longitude}
                  onChange={(e) => handleLocationChange('longitude', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="72.8777"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Geofence Radius (meters)
                </label>
                <input
                  type="number"
                  value={settings.geofenceRadius}
                  onChange={(e) => handleChange('geofenceRadius', parseInt(e.target.value) || 100)}
                  min={50}
                  max={1000}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={getCurrentLocation}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Use Current Location
            </button>
          </div>
        )}

        <div className="flex items-center justify-between py-3 bg-gray-50 px-4 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Allow Remote Check-in
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Allow employees to check in from any location
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange('allowRemoteCheckIn', !settings.allowRemoteCheckIn)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.allowRemoteCheckIn ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.allowRemoteCheckIn ? 'translate-x-6' : 'translate-x-1'
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
          {isSaving ? 'Saving...' : 'Save Attendance Settings'}
        </button>
      </div>
    </div>
  );
};

export default AttendanceSettingsTab;
