import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * RoleBasedRoute component for role-based access control
 * @param {Array} allowedRoles - Array of roles that can access this route
 * @param {ReactNode} children - Component to render if user has permission
 * @param {string} redirectTo - Path to redirect if user doesn't have permission (default: /workspace/table)
 */
const RoleBasedRoute = ({ children, allowedRoles = [], redirectTo = '/workspace/table' }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user or user not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If no role restrictions, allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return children;
  }

  // Check if user's role is in the allowed roles
  const hasPermission = allowedRoles.includes(user.role);

  if (!hasPermission) {
    // Show toast notification
    toast.error('You do not have permission to access this page', {
      duration: 3000,
      id: 'role-access-denied' // Prevent duplicate toasts
    });

    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default RoleBasedRoute;
