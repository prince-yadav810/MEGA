import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on app load
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (err) {
          console.error('Failed to fetch user:', err);
          localStorage.removeItem('token');
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authService.login(email, password);

      // Store token in localStorage
      localStorage.setItem('token', response.token);

      // Set user state
      setUser(response.user);

      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear token and user state regardless of API call success
      localStorage.removeItem('token');
      setUser(null);
      setError(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
