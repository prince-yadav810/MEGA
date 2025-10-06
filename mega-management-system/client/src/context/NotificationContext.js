import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'info',
      title: 'Welcome!',
      message: 'Task management system is ready',
      time: 'Just now',
      read: false
    }
  ]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      time: 'Just now',
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helper functions for common notification types
  const notifyTaskCreated = useCallback((taskTitle) => {
    addNotification({
      type: 'success',
      title: 'Task Created',
      message: `"${taskTitle}" has been created successfully`
    });
  }, [addNotification]);

  const notifyTaskUpdated = useCallback((taskTitle) => {
    addNotification({
      type: 'info',
      title: 'Task Updated',
      message: `"${taskTitle}" has been updated`
    });
  }, [addNotification]);

  const notifyTaskDeleted = useCallback((taskTitle) => {
    addNotification({
      type: 'warning',
      title: 'Task Deleted',
      message: `"${taskTitle}" has been deleted`
    });
  }, [addNotification]);

  const notifyTaskStatusChanged = useCallback((taskTitle, newStatus) => {
    const statusLabels = {
      todo: 'To Do',
      in_progress: 'In Progress',
      review: 'Review',
      scheduled: 'Scheduled',
      completed: 'Completed'
    };
    addNotification({
      type: 'info',
      title: 'Status Changed',
      message: `"${taskTitle}" moved to ${statusLabels[newStatus] || newStatus}`
    });
  }, [addNotification]);

  const notifyTaskOverdue = useCallback((taskTitle, daysOverdue) => {
    addNotification({
      type: 'warning',
      title: 'Task Overdue',
      message: `"${taskTitle}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`
    });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    // Helper methods
    notifyTaskCreated,
    notifyTaskUpdated,
    notifyTaskDeleted,
    notifyTaskStatusChanged,
    notifyTaskOverdue
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
