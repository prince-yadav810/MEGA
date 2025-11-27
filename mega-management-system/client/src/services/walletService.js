// File Path: client/src/services/walletService.js

import api from './api';

const walletService = {
  // Get wallet balance and info
  getWallet: async (userId) => {
    try {
      const response = await api.get(`/wallet/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get wallet error:', error);
      throw error;
    }
  },

  // Get transaction history
  getTransactions: async (userId, params = {}) => {
    try {
      const { page = 1, limit = 50, type } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(type && { type })
      });

      const response = await api.get(`/wallet/${userId}/transactions?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Get transactions error:', error);
      throw error;
    }
  },

  // Add credit to wallet (Admin only)
  addCredit: async (userId, creditData) => {
    try {
      const response = await api.post(`/wallet/${userId}/credit`, creditData);
      return response.data;
    } catch (error) {
      console.error('Add credit error:', error);
      throw error;
    }
  },

  // Record expense/debit (Employee)
  addDebit: async (userId, debitData) => {
    try {
      const response = await api.post(`/wallet/${userId}/debit`, debitData);
      return response.data;
    } catch (error) {
      console.error('Add debit error:', error);
      throw error;
    }
  }
};

export default walletService;
//