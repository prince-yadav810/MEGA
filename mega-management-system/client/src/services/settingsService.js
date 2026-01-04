import api from './api';

const settingsService = {
  // Attendance Settings
  getAttendanceSettings: async () => {
    try {
      const response = await api.get('/settings/attendance');
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance settings:', error);
      throw error;
    }
  },

  updateAttendanceSettings: async (settings) => {
    try {
      const response = await api.put('/settings/attendance', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating attendance settings:', error);
      throw error;
    }
  },

  // Quotation Settings
  getQuotationSettings: async () => {
    try {
      const response = await api.get('/settings/quotation');
      return response.data;
    } catch (error) {
      console.error('Error fetching quotation settings:', error);
      throw error;
    }
  },

  updateQuotationSettings: async (settings) => {
    try {
      const response = await api.put('/settings/quotation', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating quotation settings:', error);
      throw error;
    }
  },

  // Get departments list (for dropdowns)
  getDepartments: async () => {
    try {
      const response = await api.get('/settings/departments');
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  // General Settings (for notifications, etc.)
  getSettings: async () => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  },

  updateSettings: async (settings) => {
    try {
      // For notification settings, use the notifications-specific endpoint
      const response = await api.put('/settings/notifications', settings.notifications || settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
};

export default settingsService;
