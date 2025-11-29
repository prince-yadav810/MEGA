// File path: client/src/context/NotificationContext.js

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import socketService from '../services/socketService';
import * as notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from backend on mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  // Initialize Socket.io connection
  useEffect(() => {
    if (user && user._id) {
      socketService.connect(null, user._id);

      // Listen for new notifications
      socketService.on('notification:new', (notification) => {
        console.log('📬 New notification received:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      return () => {
        socketService.off('notification:new');
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getAllNotifications({ limit: 50 });
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      time: 'Just now',
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev]);
    if (!newNotification.read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Update backend
      await notificationService.markNotificationAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert on error
      fetchNotifications();
      fetchUnreadCount();
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

      // Update backend
      await notificationService.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Revert on error
      fetchNotifications();
      fetchUnreadCount();
    }
  }, []);

  const removeNotification = useCallback(async (id) => {
    try {
      const notification = notifications.find(n => n._id === id || n.id === id);

      // Optimistic update
      setNotifications(prev => prev.filter(n => n._id !== id && n.id !== id));
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Update backend
      await notificationService.deleteNotification(id);
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Revert on error
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [notifications]);

  // Task notification helpers
  const notifyTaskCreated = useCallback((taskTitle) => {
    addNotification({
      type: 'success',
      title: 'Task Created',
      message: `"${taskTitle}" has been created successfully`,
      category: 'task'
    });
  }, [addNotification]);

  const notifyTaskUpdated = useCallback((taskTitle) => {
    addNotification({
      type: 'info',
      title: 'Task Updated',
      message: `"${taskTitle}" has been updated`,
      category: 'task'
    });
  }, [addNotification]);

  const notifyTaskDeleted = useCallback((taskTitle) => {
    addNotification({
      type: 'warning',
      title: 'Task Deleted',
      message: `"${taskTitle}" has been deleted`,
      category: 'task'
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
      message: `"${taskTitle}" moved to ${statusLabels[newStatus] || newStatus}`,
      category: 'task'
    });
  }, [addNotification]);

  const notifyTaskOverdue = useCallback((taskTitle, daysOverdue) => {
    addNotification({
      type: 'warning',
      title: 'Task Overdue',
      message: `"${taskTitle}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
      category: 'task'
    });
  }, [addNotification]);

  // Reminder notification helpers
  const notifyReminder = useCallback((reminderTitle) => {
    addNotification({
      type: 'info',
      title: '🔔 Reminder',
      message: reminderTitle,
      category: 'reminder'
    });
  }, [addNotification]);

  const notifyReminderCreated = useCallback((reminderTitle) => {
    addNotification({
      type: 'success',
      title: 'Reminder Created',
      message: `Reminder "${reminderTitle}" has been set`,
      category: 'reminder'
    });
  }, [addNotification]);

  const notifyReminderDeleted = useCallback((reminderTitle) => {
    addNotification({
      type: 'warning',
      title: 'Reminder Deleted',
      message: `"${reminderTitle}" reminder has been deleted`,
      category: 'reminder'
    });
  }, [addNotification]);

  // Note notification helpers
  const notifyNoteCreated = useCallback((noteHeading) => {
    addNotification({
      type: 'success',
      title: 'Note Created',
      message: `Note "${noteHeading}" has been created`,
      category: 'note'
    });
  }, [addNotification]);

  const notifyNotePinned = useCallback((noteHeading, isPinned) => {
    addNotification({
      type: 'info',
      title: isPinned ? 'Note Pinned' : 'Note Unpinned',
      message: `"${noteHeading}" has been ${isPinned ? 'pinned' : 'unpinned'}`,
      category: 'note'
    });
  }, [addNotification]);

  const value = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    fetchNotifications,
    fetchUnreadCount,
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
