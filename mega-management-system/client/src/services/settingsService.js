// File Path: client/src/services/settingsService.js

import api from './api';

const settingsService = {
  // Get all system settings (admin only)
  getAllSettings: async () => {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching all settings:', error);
      throw error;
    }
  },

  // Company Settings
  getCompanySettings: async () => {
    try {
      const response = await api.get('/settings/company');
      return response.data;
    } catch (error) {
      console.error('Error fetching company settings:', error);
      throw error;
    }
  },

  updateCompanySettings: async (settings) => {
    try {
      const response = await api.put('/settings/company', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating company settings:', error);
      throw error;
    }
  },

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

  // Payroll Settings
  getPayrollSettings: async () => {
    try {
      const response = await api.get('/settings/payroll');
      return response.data;
    } catch (error) {
      console.error('Error fetching payroll settings:', error);
      throw error;
    }
  },

  updatePayrollSettings: async (settings) => {
    try {
      const response = await api.put('/settings/payroll', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating payroll settings:', error);
      throw error;
    }
  },

  // User Management Settings
  getUserManagementSettings: async () => {
    try {
      const response = await api.get('/settings/user-management');
      return response.data;
    } catch (error) {
      console.error('Error fetching user management settings:', error);
      throw error;
    }
  },

  updateUserManagementSettings: async (settings) => {
    try {
      const response = await api.put('/settings/user-management', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating user management settings:', error);
      throw error;
    }
  },

  // Notification Settings (Global)
  getNotificationSettings: async () => {
    try {
      const response = await api.get('/settings/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  },

  updateNotificationSettings: async (settings) => {
    try {
      const response = await api.put('/settings/notifications', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
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
  }
};

export default settingsService;
