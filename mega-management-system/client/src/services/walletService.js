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
  },

  // Get wallet analytics (Admin/Manager only)
  getAnalytics: async (params = {}) => {
    try {
      const { startDate, endDate } = params;
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const url = `/wallet/stats/analytics${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Get analytics error:', error);
      throw error;
    }
  },

  // Bulk credit to multiple employees (Admin/Manager only)
  bulkCredit: async (employeeIds, amount, description) => {
    try {
      const response = await api.post('/wallet/bulk/credit', {
        employeeIds,
        amount,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Bulk credit error:', error);
      throw error;
    }
  },

  // Export transactions as CSV
  exportTransactionsCSV: (transactions) => {
    const headers = ['Date', 'Type', 'Amount', 'Description', 'Balance After'];
    const rows = transactions.map(tx => [
      new Date(tx.createdAt).toLocaleDateString(),
      tx.type,
      tx.amount.toFixed(2),
      tx.description || '',
      tx.balanceAfter.toFixed(2)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};

export default walletService;
//