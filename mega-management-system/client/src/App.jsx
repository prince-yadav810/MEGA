// File path: client/src/App.jsx
// REPLACE the entire file with this updated version

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/common/Sidebar';
import MobileBottomNav from './components/common/MobileBottomNav';
import Workspace from './pages/Workspace';
import QuotationsList from './pages/Quotations/QuotationsList';
import ClientsList from './pages/Clients/ClientsList';
import ProductCatalog from './pages/Products/ProductCatalog';
import NotesReminders from './pages/Admin/NotesReminders';
import Settings from './pages/Admin/Settings';
import UserManagement from './pages/Admin/UserManagement';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import { NotificationProvider } from './context/NotificationContext.js';
import { AuthProvider } from './context/AuthContext';
import { initializeSampleData } from './utils/initSampleData';
import './App.css';

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('workspace');
  const location = useLocation();

  useEffect(() => {
    try {
      initializeSampleData();
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }, []);

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/workspace')) {
      setActiveTab('workspace');
    } else if (path.startsWith('/quotations')) {
      setActiveTab('quotations');
    } else if (path.startsWith('/clients')) {
      setActiveTab('clients');
    } else if (path.startsWith('/products')) {
      setActiveTab('products');
    } else if (path.startsWith('/notes-reminders')) {
      setActiveTab('notes-reminders');
    } else if (path.startsWith('/settings')) {
      setActiveTab('settings');
    } else if (path.startsWith('/users')) {
      setActiveTab('users');
    }
  }, [location]);

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
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Routes>
            <Route index element={<Navigate to="/workspace" replace />} />
            <Route path="workspace/*" element={<Workspace />} />
            <Route path="quotations" element={<QuotationsList />} />
            <Route path="clients" element={<ClientsList />} />
            <Route path="products" element={<ProductCatalog />} />
            <Route path="notes-reminders" element={<NotesReminders />} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="*" element={<Navigate to="/workspace" replace />} />
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