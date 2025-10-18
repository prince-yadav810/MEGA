// File path: client/src/components/common/Sidebar.jsx

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  StickyNote,
  Settings,
  UserCog,
  Menu,
  ChevronLeft,
  Inbox,
  Bell,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Sidebar = ({ collapsed, onToggle, activeTab, setActiveTab }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const navigationItems = [
    {
      id: 'workspace',
      name: 'Workspace',
      icon: LayoutDashboard,
      path: '/workspace'
    },
    {
      id: 'inbox',
      name: 'Inbox',
      icon: Inbox,
      path: '/inbox'
    },
    {
      id: 'quotations',
      name: 'Quotations',
      icon: FileText,
      path: '/quotations'
    },
    {
      id: 'clients',
      name: 'Clients',
      icon: Users,
      path: '/clients'
    },
    {
      id: 'products',
      name: 'Products',
      icon: Package,
      path: '/products'
    },
    {
      id: 'notes-reminders',
      name: 'Notes & Reminders',
      icon: StickyNote,
      path: '/notes-reminders'
    },
    {
      id: 'users',
      name: 'Team',
      icon: UserCog,
      path: '/users'
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      path: '/settings'
    }
  ];

  const isActive = (path) => {
    // For workspace, check if we're on any workspace route
    if (path === '/workspace') {
      return location.pathname === '/' || 
             location.pathname === '/workspace' || 
             location.pathname.startsWith('/workspace/');
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (itemId, itemPath) => {
    setActiveTab(itemId);
    // If clicking on workspace and already on a workspace sub-route, stay there
    // Otherwise navigate to the main workspace
    if (itemPath === '/workspace' && location.pathname.startsWith('/workspace/')) {
      return; // Don't navigate, just update active tab
    }
  };

  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-xl font-bold text-primary-700">MEGA</h1>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {collapsed ? (
            <Menu className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => handleNavClick(item.id, item.path)}
              className={`
                flex items-center p-3 rounded-lg transition-all duration-200 group relative
                ${active 
                  ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
                ${collapsed ? 'justify-center' : 'justify-start'}
              `}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-primary-600' : ''}`} />

              {!collapsed && (
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium">{item.name}</div>
                </div>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-16 bg-gray-900 text-white text-xs rounded-md py-1 px-2 
                               opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                               transition-all duration-200 whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}

              {/* Active indicator */}
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-primary-600 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        {/* User Info */}
        {!collapsed && user && (
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center p-3 rounded-lg transition-all duration-200 group
            text-red-600 hover:bg-red-50
            ${collapsed ? 'justify-center' : 'justify-start'}
          `}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && (
            <span className="ml-3 text-sm font-medium">Logout</span>
          )}

          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="absolute left-16 bg-gray-900 text-white text-xs rounded-md py-1 px-2
                           opacity-0 invisible group-hover:opacity-100 group-hover:visible
                           transition-all duration-200 whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>

        {/* Version Info */}
        {!collapsed && (
          <div className="text-xs text-gray-500 text-center">
            <div className="font-medium">MEGA Enterprises</div>
            <div className="mt-1">v1.0.0</div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;