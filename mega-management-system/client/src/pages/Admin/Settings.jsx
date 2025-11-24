import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Palette,
  Settings as SettingsIcon,
  LogOut,
  Building2,
  Clock,
  FileText,
  Wallet,
  Shield
} from 'lucide-react';
import ProfileTab from '../../components/settings/ProfileTab';
import NotificationsTab from '../../components/settings/NotificationsTab';
import AppearanceTab from '../../components/settings/AppearanceTab';
import CompanySettingsTab from '../../components/settings/CompanySettingsTab';
import AttendanceSettingsTab from '../../components/settings/AttendanceSettingsTab';
import QuotationSettingsTab from '../../components/settings/QuotationSettingsTab';
import PayrollSettingsTab from '../../components/settings/PayrollSettingsTab';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  // Personal settings - available to all users
  const personalTabs = [
    {
      id: 'profile',
      name: 'Profile',
      icon: User,
      description: 'Manage your profile information'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      description: 'Configure notification preferences'
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: Palette,
      description: 'Customize display settings'
    }
  ];

  // Admin settings - only for admins
  const adminTabs = [
    {
      id: 'company',
      name: 'Company',
      icon: Building2,
      description: 'Company information & branding',
      adminOnly: true
    },
    {
      id: 'attendance',
      name: 'Attendance',
      icon: Clock,
      description: 'Office hours & attendance rules',
      adminOnly: true
    },
    {
      id: 'quotation',
      name: 'Quotation',
      icon: FileText,
      description: 'Quote numbering & defaults',
      adminOnly: true
    },
    {
      id: 'payroll',
      name: 'Payroll',
      icon: Wallet,
      description: 'Salary & deduction settings',
      adminOnly: true
    }
  ];

  // Combine tabs based on role
  const allTabs = isAdmin ? [...personalTabs, ...adminTabs] : personalTabs;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'appearance':
        return <AppearanceTab />;
      case 'company':
        return isAdmin ? <CompanySettingsTab /> : null;
      case 'attendance':
        return isAdmin ? <AttendanceSettingsTab /> : null;
      case 'quotation':
        return isAdmin ? <QuotationSettingsTab /> : null;
      case 'payroll':
        return isAdmin ? <PayrollSettingsTab /> : null;
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

        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Personal Settings Section */}
              <div className="p-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Personal Settings
                </h3>
              </div>
              <nav className="p-2">
                {personalTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2.5 rounded-lg mb-1 text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <div className="font-medium text-sm">{tab.name}</div>
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* Admin Settings Section */}
              {isAdmin && (
                <>
                  <div className="p-3 bg-gray-50 border-t border-b border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin Settings
                    </h3>
                  </div>
                  <nav className="p-2">
                    {adminTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center px-3 py-2.5 rounded-lg mb-1 text-left transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div>
                            <div className="font-medium text-sm">{tab.name}</div>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </>
              )}

              {/* Logout Button */}
              <div className="p-2 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
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
