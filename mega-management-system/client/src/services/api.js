// File path: client/src/services/api.js
// REPLACE entire file with this

import axios from 'axios';

// API URL pointing to backend server
// In production (Cloud Run), use relative URL since frontend & backend are on same domain
const API_URL = process.env.NODE_ENV === 'production'
  ? '/api'
  : (process.env.REACT_APP_API_URL || 'http://localhost:5001/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login for 401 errors that are NOT from password change
    // (password change returns 401 when current password is incorrect)
    const isPasswordChangeEndpoint = error.config?.url?.includes('/auth/change-password');
    
    if (error.response?.status === 401 && !isPasswordChangeEndpoint) {
      // Token is invalid or expired - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;