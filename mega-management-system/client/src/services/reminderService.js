// File path: client/src/services/reminderService.js

import api from './api';

const reminderService = {
  // Get all active reminders
  getAllReminders: async () => {
    try {
      const response = await api.get('/reminders');
      return response.data;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      throw error;
    }
  },

  // Create a new reminder
  createReminder: async (reminderData) => {
    try {
      const response = await api.post('/reminders', reminderData);
      return response.data;
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  },

  // Update a reminder
  updateReminder: async (reminderId, reminderData) => {
    try {
      const response = await api.put(`/reminders/${reminderId}`, reminderData);
      return response.data;
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  },

  // Delete a reminder
  deleteReminder: async (reminderId) => {
    try {
      const response = await api.delete(`/reminders/${reminderId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  },

  // Check due reminders
  checkDueReminders: async () => {
    try {
      const response = await api.get('/reminders/check-due');
      return response.data;
    } catch (error) {
      console.error('Error checking due reminders:', error);
      throw error;
    }
  }
};

export default reminderService;