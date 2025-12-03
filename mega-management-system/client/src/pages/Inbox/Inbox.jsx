// File path: client/src/pages/Inbox/Inbox.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Check,
  CheckCheck,
  Search,
  Filter,
  Trash2,
  FileText,
  Users,
  Package,
  StickyNote,
  Calendar,
  DollarSign,
  Settings,
  ListTodo,
  User
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import toast from 'react-hot-toast';

const Inbox = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    fetchNotifications,
    showDesktopNotification,
    browserNotificationsEnabled
  } = useNotifications();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  // Filter notifications whenever filters or notifications change
  useEffect(() => {
    let filtered = [...notifications];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(n => n.category === selectedCategory);
    }

    // Filter by read status
    if (selectedStatus === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (selectedStatus === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query)
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, selectedCategory, selectedStatus, searchQuery]);

  // Group notifications by date
  const groupNotificationsByDate = (notifs) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    notifs.forEach(notification => {
      const notifDate = new Date(notification.createdAt || notification.time);
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      if (notifDay.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else if (notifDate >= thisWeek) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(filteredNotifications);

  // Category icons and colors
  const categoryConfig = {
    all: { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100' },
    task: { icon: ListTodo, color: 'text-blue-600', bg: 'bg-blue-100' },
    client: { icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    quotation: { icon: FileText, color: 'text-green-600', bg: 'bg-green-100' },
    product: { icon: Package, color: 'text-orange-600', bg: 'bg-orange-100' },
    note: { icon: StickyNote, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    reminder: { icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-100' },
    payment: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    system: { icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100' }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-error-600" />;
      default:
        return <Info className="h-5 w-5 text-primary-600" />;
    }
  };

  const getCategoryIcon = (category) => {
    const config = categoryConfig[category] || categoryConfig.all;
    const Icon = config.icon;
    return <Icon className={`h-5 w-5 ${config.color}`} />;
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id || notification._id);
    }

    // Get the entity ID for highlighting
    const entityId = notification.entityId;

    // Navigate based on entity type with state for highlighting
    if (notification.entityType) {
      switch (notification.entityType) {
        case 'task':
          navigate('/workspace/table', { state: { highlightId: entityId } });
          break;
        case 'client':
          navigate('/clients', { state: { highlightId: entityId } });
          break;
        case 'quotation':
          navigate('/quotations', { state: { highlightId: entityId } });
          break;
        case 'product':
          navigate('/products', { state: { highlightId: entityId } });
          break;
        case 'note':
        case 'reminder':
          navigate('/notes-reminders', { state: { highlightId: entityId } });
          break;
        default:
          if (notification.actionUrl) {
            navigate(notification.actionUrl);
          }
          break;
      }
    } else if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await removeNotification(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  // Test notification function
  const handleTestNotification = () => {
    const testNotifications = [
      {
        title: 'New Task Assigned',
        message: 'You have been assigned to "Update Website Design" - Due in 2 days',
        category: 'task',
        entityType: 'task',
        _id: 'test-1'
      },
      {
        title: 'Payment Reminder',
        message: 'Invoice #27788 from RITHWIK PROJECTS is due in 3 days - Amount: ₹45,000',
        category: 'payment',
        entityType: 'payment',
        _id: 'test-2'
      },
      {
        title: 'New Client Added',
        message: 'Acme Corporation has been added to your clients list',
        category: 'client',
        entityType: 'client',
        _id: 'test-3'
      }
    ];

    const randomNotif = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    
    if (browserNotificationsEnabled) {
      showDesktopNotification(randomNotif);
      toast.success('Test notification sent! Check your desktop/mobile.');
    } else {
      toast.error('Please enable desktop notifications first');
    }
  };

  // Swipeable notification item component for mobile
  const SwipeableNotificationItem = ({ notification, onDelete, onClick }) => {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const deleteThreshold = 100;

    const handlers = useSwipeable({
      onSwiping: (e) => {
        if (e.dir === 'Left') {
          setIsSwiping(true);
          setSwipeOffset(Math.min(Math.abs(e.deltaX), 150));
        }
      },
      onSwipedLeft: (e) => {
        if (Math.abs(e.deltaX) > deleteThreshold) {
          onDelete();
        } else {
          setSwipeOffset(0);
        }
        setIsSwiping(false);
      },
      onSwiped: () => {
        if (!isSwiping) {
          setSwipeOffset(0);
        }
      },
      trackMouse: false,
      trackTouch: true,
      preventScrollOnSwipe: false,
      delta: 10
    });

    const id = notification.id || notification._id;
    const isAssignment = notification.isAssignment || notification.title === 'New Task Assigned';

    return (
      <div className="relative overflow-hidden rounded-lg mb-2">
        {/* Delete background (shown on swipe) */}
        <div
          className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 rounded-lg"
          style={{ opacity: swipeOffset / deleteThreshold }}
        >
          <Trash2 className="h-6 w-6 text-white" />
        </div>

        {/* Notification card */}
        <div
          {...handlers}
          onClick={() => !isSwiping && onClick(notification)}
          style={{ transform: `translateX(-${swipeOffset}px)`, touchAction: 'pan-y' }}
          className={`
            relative rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md
            ${isAssignment
              ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
              : !notification.read
                ? 'border-primary-200 bg-primary-50/50'
                : 'bg-white border-gray-200'}
          `}
        >
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div className={`flex-shrink-0 p-2 rounded-lg ${
              notification.category === 'reminder'
                ? 'bg-amber-100'
                : isAssignment 
                  ? 'bg-indigo-100' 
                  : categoryConfig[notification.category]?.bg || 'bg-gray-100'
            }`}>
              {getCategoryIcon(notification.category)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                    )}
                    {isAssignment && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                        Assigned
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>

                  {/* Created by / Updated by info */}
                  {notification.createdBy && notification.createdBy !== 'System' && (
                    <div className="flex items-center space-x-1 mt-2">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {notification.title?.includes('Updated') ? 'Updated by: ' : 'Created by: '}
                      </span>
                      <span className="text-xs font-semibold text-primary-600">
                        {notification.createdBy}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500">
                      {notification.timeAgo || notification.time || 'Just now'}
                    </span>
                    {notification.category && (
                      <span className="text-xs text-gray-500 capitalize">
                        {notification.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Type Icon & Delete (hidden on mobile for swipe) */}
                <div className="flex items-center space-x-2 ml-4">
                  {getNotificationIcon(notification.type)}
                  <button
                    onClick={(e) => handleDeleteNotification(e, id)}
                    className="hidden sm:block p-1 text-gray-400 hover:text-error-600 rounded transition-colors"
                    title="Delete notification"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNotificationGroup = (title, notifications) => {
    if (notifications.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {title}
        </h3>
        <div className="space-y-0">
          {notifications.map((notification) => {
            const id = notification.id || notification._id;
            return (
              <SwipeableNotificationItem
                key={id}
                notification={notification}
                onDelete={() => handleDeleteNotification(null, id)}
                onClick={handleNotificationClick}
              />
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 pb-24">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
              <p className="text-sm text-gray-600 mt-1">
                Stay updated with all your notifications in one place
              </p>
            </div>
            {browserNotificationsEnabled && (
              <button
                onClick={handleTestNotification}
                className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg transition-colors text-sm font-medium"
                title="Test desktop notification"
              >
                <Bell className="h-4 w-4" />
                Test Notification
              </button>
            )}
          </div>
        </div>

        {/* Filters and Actions - Compact Layout */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          {/* Search + Filters Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {/* Compact Search */}
            <div className="relative flex-1 sm:max-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-gray-400 hidden sm:block" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-2 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="task">Tasks</option>
                <option value="client">Clients</option>
                <option value="quotation">Quotations</option>
                <option value="product">Products</option>
                <option value="note">Notes</option>
                <option value="reminder">Reminders</option>
                <option value="payment">Payments</option>
                <option value="system">System</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-2 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>

              {/* Mark all read button */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors ml-auto sm:ml-0"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Compact Stats */}
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-gray-200 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-600">Total: <span className="font-semibold text-gray-900">{notifications.length}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-gray-600">Unread: <span className="font-semibold text-primary-700">{unreadCount}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-success-500" />
              <span className="text-gray-600">Read: <span className="font-semibold text-gray-900">{notifications.length - unreadCount}</span></span>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'No notifications match your filters'
                : 'You are all caught up!'}
            </p>
          </div>
        ) : (
          <div>
            {renderNotificationGroup('Today', groupedNotifications.today)}
            {renderNotificationGroup('Yesterday', groupedNotifications.yesterday)}
            {renderNotificationGroup('This Week', groupedNotifications.thisWeek)}
            {renderNotificationGroup('Older', groupedNotifications.older)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
