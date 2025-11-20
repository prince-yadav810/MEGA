import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  UserCog,
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MobileBottomNav = ({ activeTab, setActiveTab }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navigationItems = [
    {
      id: 'workspace',
      name: 'Workspace',
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
    if (path === '/workspace') {
      return location.pathname === '/' || location.pathname.startsWith('/workspace');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {filteredNavigationItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setActiveTab && setActiveTab(item.id)}
              className={`
                flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1
                ${active
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
                }
              `}
            >
              <Icon className={`h-5 w-5 mb-1 ${active ? 'text-primary-600' : ''}`} />
              <span className={`text-xs font-medium truncate ${active ? 'text-primary-700' : ''}`}>
                {item.name}
              </span>
              {active && (
                <div className="w-4 h-0.5 bg-primary-500 rounded-full mt-1" />
              )}
            </Link>
          );
        })}

        {/* More menu for remaining items */}
        {filteredNavigationItems.length > 5 ? (
          <div className="flex flex-col items-center py-2 px-3 rounded-lg min-w-0">
            <div className="flex space-x-1">
              {filteredNavigationItems.slice(5).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setActiveTab && setActiveTab(item.id)}
                    className={`
                      p-1 rounded transition-colors
                      ${active
                        ? 'text-primary-600 bg-primary-100'
                        : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
            <span className="text-xs font-medium text-gray-500 mt-1">More</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MobileBottomNav;
