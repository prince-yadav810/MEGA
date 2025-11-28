// File path: client/src/App.jsx
// REPLACE the entire file with this updated version

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/common/Sidebar';
import MobileBottomNav from './components/common/MobileBottomNav';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Inbox from './pages/Inbox/Inbox';
import Attendance from './pages/Attendance/Attendance';
import QuotationsList from './pages/Quotations/QuotationsList';
import QuotationDetail from './pages/Quotations/QuotationDetail';
import ClientsList from './pages/Clients/ClientsList';
import ClientDetails from './pages/Clients/ClientDetails';
import NotesReminders from './pages/Admin/NotesReminders';
import Settings from './pages/Admin/Settings';
import UserManagement from './pages/Admin/UserManagement';
import EmployeeDetail from './pages/Admin/EmployeeDetail';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import { NotificationProvider } from './context/NotificationContext.js';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('workspace');
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const path = location.pathname;
    if (path === '/dashboard') {
      setActiveTab('dashboard');
    } else if (path.startsWith('/workspace')) {
      setActiveTab('workspace');
    } else if (path.startsWith('/inbox')) {
      setActiveTab('inbox');
    } else if (path.startsWith('/attendance')) {
      setActiveTab('attendance');
    } else if (path.startsWith('/quotations')) {
      // Check view parameter to determine if products or quotations tab should be active
      const viewParam = searchParams.get('view');
      setActiveTab(viewParam === 'products' ? 'products' : 'quotations');
    } else if (path.startsWith('/clients')) {
      setActiveTab('clients');
    } else if (path.startsWith('/products')) {
      setActiveTab('products'); // Products route redirects to quotations?view=products
    } else if (path.startsWith('/notes-reminders')) {
      setActiveTab('notes-reminders');
    } else if (path.startsWith('/settings')) {
      setActiveTab('settings');
    } else if (path.startsWith('/users')) {
      setActiveTab('users');
    }
  }, [location, searchParams]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50 pb-20 lg:pb-0">
          <Routes>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="workspace/*" element={<Workspace />} />
            <Route path="inbox" element={<Inbox />} />
            <Route
              path="attendance"
              element={
                <RoleBasedRoute allowedRoles={['employee']}>
                  <Attendance />
                </RoleBasedRoute>
              }
            />
            <Route path="quotations" element={<QuotationsList />} />
            <Route path="quotations/:id" element={<QuotationDetail />} />
            <Route path="clients" element={<ClientsList />} />
            <Route path="clients/:id" element={<ClientDetails />} />
            <Route path="products" element={<Navigate to="/quotations?view=products" replace />} />
            <Route path="notes-reminders" element={<NotesReminders />} />
            <Route path="settings" element={<Settings />} />
            <Route
              path="users"
              element={
                <RoleBasedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                  <UserManagement />
                </RoleBasedRoute>
              }
            />
            <Route
              path="users/:userId"
              element={
                <RoleBasedRoute allowedRoles={['super_admin', 'admin', 'manager']}>
                  <EmployeeDetail />
                </RoleBasedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/workspace/table" replace />} />
          </Routes>
        </main>
      </div>

      <div className="lg:hidden">
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;