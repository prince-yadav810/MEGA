// File Path: client/src/services/clientService.js

import api from './api';

// Local storage keys
const CLIENTS_STORAGE_KEY = 'mega_clients';
const REMINDERS_STORAGE_KEY = 'mega_payment_reminders';

// Get clients from localStorage
const getLocalClients = () => {
  try {
    const clients = localStorage.getItem(CLIENTS_STORAGE_KEY);
    return clients ? JSON.parse(clients) : [];
  } catch (error) {
    console.error('Error reading clients from localStorage:', error);
    return [];
  }
};

// Save clients to localStorage
const saveLocalClients = (clients) => {
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  } catch (error) {
    console.error('Error saving clients to localStorage:', error);
  }
};

// Get reminders from localStorage
const getLocalReminders = () => {
  try {
    const reminders = localStorage.getItem(REMINDERS_STORAGE_KEY);
    return reminders ? JSON.parse(reminders) : [];
  } catch (error) {
    console.error('Error reading reminders from localStorage:', error);
    return [];
  }
};

// Save reminders to localStorage
const saveLocalReminders = (reminders) => {
  try {
    localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
  } catch (error) {
    console.error('Error saving reminders to localStorage:', error);
  }
};

const clientService = {
  // Get all clients
  getAllClients: async (params = {}) => {
    try {
      const response = await api.get('/clients', { params });
      console.log('✓ Using API - Clients fetched:', response.data.data?.length || 0);
      return response.data;
    } catch (error) {
      console.warn('⚠️ API not available, using localStorage. Error:', error.message);
      const clients = getLocalClients();
      return { success: true, data: clients, count: clients.length };
    }
  },

  // Get single client
  getClient: async (id) => {
    try {
      const response = await api.get(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const clients = getLocalClients();
      const client = clients.find(c => (c._id || c.id) === id);
      return { success: true, data: client };
    }
  },

  // Create new client
  createClient: async (clientData) => {
    try {
      console.log('Creating client via API:', clientData);
      const response = await api.post('/clients', clientData);
      console.log('✓ Client created via API:', response.data.data);
      return response.data;
    } catch (error) {
      console.warn('⚠️ API not available, using localStorage. Error:', error.message);
      const clients = getLocalClients();
      const newClient = {
        ...clientData,
        id: Date.now().toString(),
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalQuotations: 0,
        totalOutstanding: 0
      };
      clients.push(newClient);
      saveLocalClients(clients);
      return { success: true, data: newClient, message: 'Client created (offline)' };
    }
  },

  // Update client
  updateClient: async (id, clientData) => {
    try {
      const response = await api.put(`/clients/${id}`, clientData);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const clients = getLocalClients();
      const index = clients.findIndex(c => (c._id || c.id) === id);
      if (index !== -1) {
        clients[index] = { ...clients[index], ...clientData, updatedAt: new Date().toISOString() };
        saveLocalClients(clients);
        return { success: true, data: clients[index], message: 'Client updated (offline)' };
      }
      throw new Error('Client not found');
    }
  },

  // Delete client
  deleteClient: async (id) => {
    try {
      const response = await api.delete(`/clients/${id}`);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const clients = getLocalClients();
      const filteredClients = clients.filter(c => (c._id || c.id) !== id);
      saveLocalClients(filteredClients);
      return { success: true, message: 'Client deleted (offline)' };
    }
  },

  // Toggle client active status
  toggleClientActive: async (id) => {
    try {
      const response = await api.patch(`/clients/${id}/toggle-active`);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const clients = getLocalClients();
      const index = clients.findIndex(c => (c._id || c.id) === id);
      if (index !== -1) {
        clients[index].isActive = !clients[index].isActive;
        saveLocalClients(clients);
        return { success: true, data: clients[index] };
      }
      throw new Error('Client not found');
    }
  },

  // Get client statistics
  getClientStats: async () => {
    try {
      const response = await api.get('/clients/stats');
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const clients = getLocalClients();
      const stats = {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.isActive).length,
        inactiveClients: clients.filter(c => !c.isActive).length,
        clientsWithOutstanding: clients.filter(c => c.totalOutstanding > 0).length,
        totalOutstandingAmount: clients.reduce((sum, c) => sum + (c.totalOutstanding || 0), 0)
      };
      return { success: true, data: stats };
    }
  },

  // Payment Reminder Operations
  
  // Get all reminders
  getAllReminders: async (params = {}) => {
    try {
      const response = await api.get('/clients/payment-reminders/all', { params });
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const reminders = getLocalReminders();
      return { success: true, data: reminders };
    }
  },

  // Get reminders for specific client
  getClientReminders: async (clientId) => {
    try {
      const response = await api.get(`/clients/${clientId}/payment-reminders`);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const reminders = getLocalReminders();
      const clientReminders = reminders.filter(r => r.client === clientId || r.client?._id === clientId);
      return { success: true, data: clientReminders };
    }
  },

  // Create payment reminder
  createReminder: async (clientId, reminderData) => {
    try {
      const response = await api.post(`/clients/${clientId}/payment-reminders`, reminderData);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const reminders = getLocalReminders();
      const newReminder = {
        ...reminderData,
        id: Date.now().toString(),
        _id: Date.now().toString(),
        client: clientId,
        status: 'active',
        messagesSent: 0,
        createdAt: new Date().toISOString(),
        messageLogs: []
      };
      reminders.push(newReminder);
      saveLocalReminders(reminders);
      return { success: true, data: newReminder, message: 'Reminder created (offline)' };
    }
  },

  // Stop reminder
  stopReminder: async (reminderId, reason = '') => {
    try {
      const response = await api.patch(`/clients/payment-reminders/${reminderId}/stop`, { reason });
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const reminders = getLocalReminders();
      const index = reminders.findIndex(r => (r._id || r.id) === reminderId);
      if (index !== -1) {
        reminders[index].status = 'stopped';
        reminders[index].stoppedAt = new Date().toISOString();
        reminders[index].stoppedReason = reason;
        saveLocalReminders(reminders);
        return { success: true, data: reminders[index] };
      }
      throw new Error('Reminder not found');
    }
  },

  // Resume reminder
  resumeReminder: async (reminderId) => {
    try {
      const response = await api.patch(`/clients/payment-reminders/${reminderId}/resume`);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const reminders = getLocalReminders();
      const index = reminders.findIndex(r => (r._id || r.id) === reminderId);
      if (index !== -1) {
        reminders[index].status = 'active';
        saveLocalReminders(reminders);
        return { success: true, data: reminders[index] };
      }
      throw new Error('Reminder not found');
    }
  },

  // Send reminder manually
  sendReminderManually: async (reminderId) => {
    try {
      const response = await api.post(`/clients/payment-reminders/${reminderId}/send`);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const reminders = getLocalReminders();
      const index = reminders.findIndex(r => (r._id || r.id) === reminderId);
      if (index !== -1) {
        reminders[index].messagesSent += 1;
        reminders[index].lastSentDate = new Date().toISOString();
        reminders[index].messageLogs.push({
          sentAt: new Date().toISOString(),
          status: 'sent'
        });
        if (reminders[index].messagesSent >= reminders[index].totalMessagesToSend) {
          reminders[index].status = 'completed';
        }
        saveLocalReminders(reminders);
        return { success: true, data: reminders[index] };
      }
      throw new Error('Reminder not found');
    }
  },

  // Business Card OCR Operations

  // Extract client data from business card images
  extractFromCard: async (formData) => {
    try {
      console.log('Extracting data from business card images...');
      const response = await api.post('/clients/extract-from-card', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout for OCR operations
      });
      console.log('✓ Business card data extracted successfully');
      return response.data;
    } catch (error) {
      console.error('⚠️ Business card extraction failed:', error.message);

      // Rethrow to allow proper error handling in component
      throw error;
    }
  }
};

export default clientService;