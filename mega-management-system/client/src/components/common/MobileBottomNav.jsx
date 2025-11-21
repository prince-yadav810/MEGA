import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  UserCog,
  ClipboardCheck,
  Home,
  Package,
  StickyNote,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileBottomNav = ({ activeTab, setActiveTab }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Home',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'workspace',
      name: 'Tasks',
      icon: LayoutDashboard,
      path: '/workspace/table'
    },
    {
      id: 'attendance',
      name: 'Attendance',
      icon: ClipboardCheck,
      path: '/attendance',
      // Only employees can access Attendance tab
      roles: ['employee']
    },
    {
      id: 'quotations',
      name: 'Quotes',
      icon: FileText,
      path: '/quotations'
    },
    {
      id: 'products',
      name: 'Products',
      icon: Package,
      path: '/products'
    },
    {
      id: 'clients',
      name: 'Clients',
      icon: Users,
      path: '/clients'
    },
    {
      id: 'inbox',
      name: 'Inbox',
      icon: Inbox,
      path: '/inbox'
    },
    {
      id: 'notes',
      name: 'Notes',
      icon: StickyNote,
      path: '/notes-reminders'
    },
    {
      id: 'users',
      name: 'Team',
      icon: UserCog,
      path: '/users',
      // Only managers/admins can access Team tab
      roles: ['manager', 'admin']
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      path: '/settings'
    }
  ];

  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.filter(item => {
    if (item.roles && user?.role) {
      return item.roles.includes(user.role);
    }
    return true;
  });

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    if (path === '/workspace') {
      return location.pathname === '/workspace' || location.pathname.startsWith('/workspace');
    }
    if (path === '/notes-reminders') {
      return location.pathname === '/notes-reminders' || location.pathname.startsWith('/notes-reminders');
    }
    if (path === '/inbox') {
      return location.pathname === '/inbox' || location.pathname.startsWith('/inbox');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-50">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div className="flex items-center gap-1 min-w-max">
          {filteredNavigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setActiveTab && setActiveTab(item.id)}
                className={`
                  flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[70px]
                  ${active
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <Icon className={`h-5 w-5 mb-1 ${active ? 'text-primary-600' : ''}`} />
                <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-primary-700' : ''}`}>
                  {item.name}
                </span>
                {active && (
                  <div className="w-4 h-0.5 bg-primary-500 rounded-full mt-1" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
