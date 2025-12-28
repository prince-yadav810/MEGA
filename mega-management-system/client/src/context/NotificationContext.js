// File path: client/src/context/NotificationContext.js

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import socketService from '../services/socketService';
import * as notificationService from '../services/notificationService';
import * as pushService from '../services/pushService';
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

  // Fetch notifications from backend on mount and set up polling
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchNotifications();
    fetchUnreadCount();

    // Set up periodic refresh as fallback (every 30 seconds)
    // This ensures notifications appear even if Socket.io fails
    const refreshInterval = setInterval(() => {
      if (user && document.visibilityState === 'visible') {
        // Only refresh if tab is visible (to avoid unnecessary requests)
        fetchUnreadCount(); // Lightweight check
      }
    }, 30000); // 30 seconds

    // Refresh when tab becomes visible (but only once, not continuously)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Small delay to avoid rapid refreshes
        setTimeout(() => {
          fetchUnreadCount();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!user || !user._id) return;

    // Connect socket and join user room
    const socket = socketService.connect(null, user._id);
    
    // Wait for socket to connect before setting up listeners
    const setupSocketListeners = () => {
      // Listen for new notifications
      socketService.on('notification:new', (notification) => {
        console.log('📬 New notification received via Socket.io:', notification);
        
        // Add notification to state
        setNotifications(prev => {
          // Check if notification already exists (prevent duplicates)
          const exists = prev.some(n => 
            (n._id && notification._id && n._id.toString() === notification._id.toString()) ||
            (n.id && notification.id && n.id === notification.id)
          );
          
          if (exists) {
            console.log('⚠️  Notification already exists, skipping duplicate');
            return prev;
          }
          
          return [notification, ...prev];
        });
        
        // Update unread count
        if (!notification.read) {
          setUnreadCount(prev => prev + 1);
        }
        
        // Also refresh from server to ensure consistency
        setTimeout(() => {
          fetchUnreadCount();
        }, 500);
      });

      // Verify socket connection status
      if (socketService.isConnected()) {
        console.log('✅ Socket.io already connected');
      } else {
        console.warn('⚠️  Socket.io not connected, will connect shortly');
      }
    };

    // Setup listeners immediately
    setupSocketListeners();

    // Also setup listeners after a short delay to ensure socket is ready
    const timer = setTimeout(() => {
      if (socketService.isConnected()) {
        console.log('✅ Socket.io connection verified');
      } else {
        console.warn('⚠️  Socket.io not connected, retrying...');
        socketService.connect(null, user._id);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      socketService.off('notification:new');
      socketService.off('connect');
      socketService.off('disconnect');
    };
  }, [user]);

  // Initialize push notifications subscription
  useEffect(() => {
    if (!user || !user._id) return;

    // Check if push notifications are supported
    if (!pushService.isPushSupported()) {
      console.log('ℹ️  Push notifications not supported in this browser');
      return;
    }

    // Listen for service worker messages (like permission errors)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_PERMISSION_REQUIRED') {
          console.warn('⚠️  Notification permission required. Please enable notifications in browser settings.');
          // Optionally show a toast or UI message to user
        }
      });
    }

    // Initialize push subscription
    const initializePush = async () => {
      try {
        // Wait a bit more to ensure service worker is fully ready
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // First, check and request permission if needed
        let permission = pushService.getNotificationPermission();
        
        if (permission === 'default') {
          // Request permission first
          try {
            permission = await pushService.requestNotificationPermission();
            console.log('Permission result:', permission);
          } catch (permError) {
            console.log('ℹ️  Notification permission request cancelled or failed');
            return; // Can't proceed without permission
          }
        }
        
        if (permission !== 'granted') {
          console.warn('⚠️  Notification permission not granted. Push notifications will not work.');
          console.warn('   Please enable notifications in your browser settings.');
          return;
        }
        
        // Now check if already subscribed
        const isSubscribed = await pushService.isSubscribed();
        
        if (!isSubscribed) {
          // Permission granted but not subscribed - subscribe now
          try {
            await pushService.subscribeToPush();
            console.log('✅ Push notifications subscribed');
          } catch (subError) {
            // Subscription failed but permission is granted - might be server issue
            console.warn('⚠️  Failed to subscribe to push notifications:', subError.message);
          }
        } else {
          // Verify subscription is still valid by checking with backend
          console.log('ℹ️  Already subscribed to push notifications');
        }
      } catch (error) {
        // Don't show error to user - push notifications are optional
        // Only log if it's not a known expected error
        if (!error.message?.includes('not supported') && 
            !error.message?.includes('permission') &&
            !error.message?.includes('not configured')) {
          console.error('Error initializing push notifications:', error.message);
        }
      }
    };

    // Small delay to ensure service worker is ready
    const timer = setTimeout(initializePush, 1000);
    
    return () => {
      clearTimeout(timer);
    };
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
