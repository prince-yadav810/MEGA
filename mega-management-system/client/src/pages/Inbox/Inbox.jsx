// File path: client/src/pages/Inbox/Inbox.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ListTodo
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
    clearAll,
    fetchNotifications
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
    reminder: { icon: Calendar, color: 'text-red-600', bg: 'bg-red-100' },
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

    // Navigate based on entity type
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.entityType) {
      switch (notification.entityType) {
        case 'task':
          navigate('/workspace/tasks');
          break;
        case 'client':
          navigate('/clients');
          break;
        case 'quotation':
          navigate('/quotations');
          break;
        case 'product':
          navigate('/products');
          break;
        case 'note':
        case 'reminder':
          navigate('/notes-reminders');
          break;
        default:
          break;
      }
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

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
      try {
        await clearAll();
        toast.success('All notifications cleared');
      } catch (error) {
        toast.error('Failed to clear notifications');
      }
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await removeNotification(notificationId);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const renderNotificationGroup = (title, notifications) => {
    if (notifications.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {title}
        </h3>
        <div className="space-y-2">
          {notifications.map((notification) => {
            const id = notification.id || notification._id;
            return (
              <div
                key={id}
                onClick={() => handleNotificationClick(notification)}
                className={`
                  bg-white rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md
                  ${!notification.read ? 'border-primary-200 bg-primary-50/50' : 'border-gray-200'}
                `}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 rounded-lg ${categoryConfig[notification.category]?.bg || 'bg-gray-100'}`}>
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
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
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

                      {/* Type Icon */}
                      <div className="flex items-center space-x-2 ml-4">
                        {getNotificationIcon(notification.type)}
                        <button
                          onClick={(e) => handleDeleteNotification(e, id)}
                          className="p-1 text-gray-400 hover:text-error-600 rounded transition-colors"
                          title="Delete notification"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
          <p className="text-sm text-gray-600 mt-1">
            Stay updated with all your notifications in one place
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-error-700 bg-error-50 hover:bg-error-100 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear all</span>
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Total: <span className="font-semibold text-gray-900">{notifications.length}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Unread: <span className="font-semibold text-primary-700">{unreadCount}</span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-success-500" />
              <span className="text-sm text-gray-600">
                Read: <span className="font-semibold text-gray-900">{notifications.length - unreadCount}</span>
              </span>
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
