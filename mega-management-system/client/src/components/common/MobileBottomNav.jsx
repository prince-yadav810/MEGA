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
  Inbox,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const MobileBottomNav = ({ activeTab, setActiveTab }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const navigationItems = [
    {
      id: 'dashboard',
      name: 'Home',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'inbox',
      name: 'Inbox',
      icon: Inbox,
      path: '/inbox'
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
      id: 'notes',
      name: 'Notes',
      icon: StickyNote,
      path: '/notes-reminders'
    },
    {
      id: 'wallet',
      name: 'Wallet',
      icon: Wallet,
      path: '/wallet'
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
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');

    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    if (path === '/workspace/table') {
      return location.pathname === '/workspace' || location.pathname.startsWith('/workspace');
    }
    if (path === '/notes-reminders') {
      return location.pathname === '/notes-reminders' || location.pathname.startsWith('/notes-reminders');
    }
    if (path === '/inbox') {
      return location.pathname === '/inbox' || location.pathname.startsWith('/inbox');
    }
    if (path === '/products') {
      // Products route redirects to /quotations?view=products
      return (location.pathname === '/quotations' && viewParam === 'products') ||
        (location.pathname.startsWith('/products'));
    }
    if (path === '/quotations') {
      // Only active if on quotations and NOT viewing products
      return (location.pathname === '/quotations' || location.pathname.startsWith('/quotations')) &&
        viewParam !== 'products';
    }
    if (path === '/clients') {
      return location.pathname === '/clients' || location.pathname.startsWith('/clients');
    }
    if (path === '/attendance') {
      return location.pathname === '/attendance' || location.pathname.startsWith('/attendance');
    }
    if (path === '/users') {
      return location.pathname === '/users' || location.pathname.startsWith('/users');
    }
    if (path === '/wallet') {
      return location.pathname === '/wallet' || location.pathname.startsWith('/wallet');
    }
    if (path === '/settings') {
      return location.pathname === '/settings' || location.pathname.startsWith('/settings');
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
                  flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[70px] relative
                  ${active
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 mb-1 ${active ? 'text-primary-600' : ''}`} />
                  {item.id === 'inbox' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-error-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
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
