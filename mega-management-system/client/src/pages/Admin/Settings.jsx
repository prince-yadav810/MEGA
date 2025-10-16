import React, { useState } from 'react';
import { User, Bell, Palette, Shield, Settings as SettingsIcon, HelpCircle } from 'lucide-react';
import ProfileTab from '../../components/settings/ProfileTab';
import AppearanceTab from '../../components/settings/AppearanceTab';
import NotificationsTab from '../../components/settings/NotificationsTab';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    {
      id: 'profile',
      name: 'Profile',
      icon: User,
      description: 'Manage your profile and account settings'
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: Palette,
      description: 'Customize how the app looks and feels'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      description: 'Control your notification preferences'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'appearance':
        return <AppearanceTab />;
      case 'notifications':
        return <NotificationsTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-start p-4 rounded-lg transition-all duration-200
                      ${isActive
                        ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                        : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="text-left">
                      <div className={`font-semibold ${
                        isActive ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {tab.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Help Section */}
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <HelpCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900">
                      Need Help?
                    </h3>
                    <p className="text-xs text-blue-700 mt-1">
                      Contact your administrator for assistance with settings.
                    </p>
                  </div>
                </div>
              </div>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
