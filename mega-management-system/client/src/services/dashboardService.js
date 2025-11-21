import api from './api';

const dashboardService = {
  // Get dashboard statistics and data
  getStats: async () => {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
};

export default dashboardService;

