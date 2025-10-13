// File path: client/src/context/NotificationContext.js

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

  // Task notification helpers
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

  // Reminder notification helpers
  const notifyReminder = useCallback((reminderTitle) => {
    addNotification({
      type: 'info',
      title: '🔔 Reminder',
      message: reminderTitle
    });
  }, [addNotification]);

  const notifyReminderCreated = useCallback((reminderTitle) => {
    addNotification({
      type: 'success',
      title: 'Reminder Created',
      message: `Reminder "${reminderTitle}" has been set`
    });
  }, [addNotification]);

  const notifyReminderDeleted = useCallback((reminderTitle) => {
    addNotification({
      type: 'warning',
      title: 'Reminder Deleted',
      message: `"${reminderTitle}" reminder has been deleted`
    });
  }, [addNotification]);

  // Note notification helpers
  const notifyNoteCreated = useCallback((noteHeading) => {
    addNotification({
      type: 'success',
      title: 'Note Created',
      message: `Note "${noteHeading}" has been created`
    });
  }, [addNotification]);

  const notifyNotePinned = useCallback((noteHeading, isPinned) => {
    addNotification({
      type: 'info',
      title: isPinned ? 'Note Pinned' : 'Note Unpinned',
      message: `"${noteHeading}" has been ${isPinned ? 'pinned' : 'unpinned'}`
    });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    // Task helpers
    notifyTaskCreated,
    notifyTaskUpdated,
    notifyTaskDeleted,
    notifyTaskStatusChanged,
    notifyTaskOverdue,
    // Reminder helpers
    notifyReminder,
    notifyReminderCreated,
    notifyReminderDeleted,
    // Note helpers
    notifyNoteCreated,
    notifyNotePinned
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;