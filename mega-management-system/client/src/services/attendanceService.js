import api from './api';

const attendanceService = {
  // Employee APIs
  checkIn: async (latitude, longitude, notes = '') => {
    try {
      const response = await api.post('/attendance/check-in', {
        latitude,
        longitude,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Check-in error:', error);
      throw error.response?.data || error;
    }
  },

  checkOut: async (latitude, longitude, notes = '') => {
    try {
      const response = await api.put('/attendance/check-out', {
        latitude,
        longitude,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Check-out error:', error);
      throw error.response?.data || error;
    }
  },

  getTodayAttendance: async () => {
    try {
      const response = await api.get('/attendance/today');
      return response.data;
    } catch (error) {
      console.error('Get today attendance error:', error);
      throw error.response?.data || error;
    }
  },

  getMyAttendance: async (startDate = null, endDate = null, limit = 30) => {
    try {
      const params = { limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/attendance/my-records', { params });
      return response.data;
    } catch (error) {
      console.error('Get my attendance error:', error);
      throw error.response?.data || error;
    }
  },

  getMyAttendanceSummary: async (month = null, year = null) => {
    try {
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;

      const response = await api.get('/attendance/my-summary', { params });
      return response.data;
    } catch (error) {
      console.error('Get my attendance summary error:', error);
      throw error.response?.data || error;
    }
  },

  // Manager/Admin APIs
  getUserAttendance: async (userId, startDate = null, endDate = null, limit = 30) => {
    try {
      const params = { limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get(`/attendance/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Get user attendance error:', error);
      throw error.response?.data || error;
    }
  },

  getUserAttendanceStats: async (userId, month = null, year = null) => {
    try {
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;

      const response = await api.get(`/attendance/user/${userId}/stats`, { params });
      return response.data;
    } catch (error) {
      console.error('Get user attendance stats error:', error);
      throw error.response?.data || error;
    }
  },

  getUserAttendanceSummary: async (userId, month = null, year = null) => {
    try {
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;

      const response = await api.get(`/attendance/user/${userId}/summary`, { params });
      return response.data;
    } catch (error) {
      console.error('Get user attendance summary error:', error);
      throw error.response?.data || error;
    }
  },

  getAllAttendance: async (filters = {}) => {
    try {
      const response = await api.get('/attendance', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Get all attendance error:', error);
      throw error.response?.data || error;
    }
  },

  // Helper function to get user's current location
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let errorMessage = 'Unable to retrieve location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'An unknown error occurred while getting location.';
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }
};

export default attendanceService;
