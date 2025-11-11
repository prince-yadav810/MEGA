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
  createReminder: async (reminderData, files = null) => {
    try {
      if (files && files.length > 0) {
        const formData = new FormData();
        
        // Append all reminder fields
        Object.keys(reminderData).forEach(key => {
          if (Array.isArray(reminderData[key])) {
            formData.append(key, JSON.stringify(reminderData[key]));
          } else {
            formData.append(key, reminderData[key]);
          }
        });
        
        // Append each file
        for (let i = 0; i < files.length; i++) {
          formData.append('attachments', files[i]);
        }
        
        const response = await api.post('/reminders', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        const response = await api.post('/reminders', reminderData);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      throw error;
    }
  },

  // Update a reminder
  updateReminder: async (reminderId, reminderData, files = null) => {
    try {
      if (files && files.length > 0) {
        const formData = new FormData();
        
        // Append all reminder fields
        Object.keys(reminderData).forEach(key => {
          if (Array.isArray(reminderData[key])) {
            formData.append(key, JSON.stringify(reminderData[key]));
          } else {
            formData.append(key, reminderData[key]);
          }
        });
        
        // Append each file
        for (let i = 0; i < files.length; i++) {
          formData.append('attachments', files[i]);
        }
        
        const response = await api.put(`/reminders/${reminderId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        const response = await api.put(`/reminders/${reminderId}`, reminderData);
        return response.data;
      }
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
  },

  // Delete an attachment
  deleteAttachment: async (reminderId, attachmentId) => {
    try {
      const response = await api.delete(`/reminders/${reminderId}/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }
  },

  // Rename an attachment
  renameAttachment: async (reminderId, attachmentId, filename) => {
    try {
      const response = await api.patch(`/reminders/${reminderId}/attachments/${attachmentId}/rename`, { filename });
      return response.data;
    } catch (error) {
      console.error('Error renaming attachment:', error);
      throw error;
    }
  }
};

export default reminderService;