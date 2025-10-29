// File Path: client/src/services/userService.js

import api from './api';

// Local storage keys
const USERS_STORAGE_KEY = 'mega_users';

// Get users from localStorage
const getLocalUsers = () => {
  try {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error reading users from localStorage:', error);
    return [];
  }
};

// Save users to localStorage
const saveLocalUsers = (users) => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to localStorage:', error);
  }
};

const userService = {
  // Get all users (team members)
  getAllUsers: async () => {
    try {
      const response = await api.get('/users');
      console.log('✓ Using API - Users fetched:', response.data.data?.length || 0);
      return response.data;
    } catch (error) {
      console.warn('⚠️ API not available, using localStorage. Error:', error.message);
      const users = getLocalUsers();
      return { success: true, data: users };
    }
  },

  // Get single user
  getUser: async (id) => {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const users = getLocalUsers();
      const user = users.find(u => (u._id || u.id) === id);
      return { success: true, data: user };
    }
  },

  // Create new team member
  createUser: async (userData) => {
    try {
      console.log('Creating user via API:', userData);
      const response = await api.post('/users', userData);
      console.log('✓ User created via API:', response.data.data);
      return response.data;
    } catch (error) {
      console.warn('⚠️ API not available, using localStorage. Error:', error.message);
      const users = getLocalUsers();
      const newUser = {
        ...userData,
        id: Date.now().toString(),
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };
      // Don't store password in localStorage
      delete newUser.password;
      users.push(newUser);
      saveLocalUsers(users);
      return { success: true, data: newUser, message: 'User created (offline)' };
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const users = getLocalUsers();
      const index = users.findIndex(u => (u._id || u.id) === id);
      if (index !== -1) {
        users[index] = { ...users[index], ...userData, updatedAt: new Date().toISOString() };
        // Don't store password in localStorage
        delete users[index].password;
        saveLocalUsers(users);
        return { success: true, data: users[index], message: 'User updated (offline)' };
      }
      throw new Error('User not found');
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.warn('API not available, using localStorage');
      const users = getLocalUsers();
      const filteredUsers = users.filter(u => (u._id || u.id) !== id);
      saveLocalUsers(filteredUsers);
      return { success: true, message: 'User deleted (offline)' };
    }
  },

  // Add advance payment to user
  addAdvance: async (userId, advanceData) => {
    try {
      const response = await api.post(`/users/${userId}/advances`, advanceData);
      return response.data;
    } catch (error) {
      console.error('Error adding advance:', error);
      throw error;
    }
  },

  // Get user tasks
  getUserTasks: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/tasks`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      return { success: true, data: [] }; // Return empty array if tasks not available
    }
  }
};

export default userService;
