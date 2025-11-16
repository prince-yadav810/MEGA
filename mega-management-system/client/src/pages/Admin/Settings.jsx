import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Palette, Settings as SettingsIcon, LogOut } from 'lucide-react';
import ProfileTab from '../../components/settings/ProfileTab';
import NotificationsTab from '../../components/settings/NotificationsTab';
import AppearanceTab from '../../components/settings/AppearanceTab';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const tabs = [
    {
      id: 'profile',
      name: 'Profile',
      icon: User
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: Palette
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'appearance':
        return <AppearanceTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <SettingsIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">
            Manage your account preferences and application settings
          </p>
        </div>

        {/* Tabs Navigation - Top */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                      ${isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {renderTabContent()}
        </div>

        {/* Account Section with Logout */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Account</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sign out of your account
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-lg text-red-600 bg-white hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
