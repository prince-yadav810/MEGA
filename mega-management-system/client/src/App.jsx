import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/common/Sidebar';
import MobileBottomNav from './components/common/MobileBottomNav';
import Dashboard from './pages/Dashboard';
import TasksOverview from './pages/Tasks/TasksOverview';
import TaskBoard from './pages/Tasks/TaskBoard';
import TaskCalendar from './pages/Tasks/TaskCalendar';
import CompletedTasks from './pages/Tasks/CompletedTasks';
import QuotationsList from './pages/Quotations/QuotationsList';
import ClientsList from './pages/Clients/ClientsList';
import ProductCatalog from './pages/Products/ProductCatalog';
import Analytics from './pages/Admin/Analytics';
import Settings from './pages/Admin/Settings';
import UserManagement from './pages/Admin/UserManagement';
import './App.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('workspace');

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <Router>
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onToggle={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <Routes>
              {/* Default route redirects to workspace */}
              <Route path="/" element={<Navigate to="/workspace" replace />} />
              
              {/* Dashboard shows workspace by default */}
              <Route path="/workspace" element={<Dashboard />} />
              <Route path="/workspace/table" element={<TasksOverview />} />
              <Route path="/workspace/board" element={<TaskBoard />} />
              <Route path="/workspace/calendar" element={<TaskCalendar />} />
              <Route path="/workspace/completed" element={<CompletedTasks />} />
              
              {/* Other main tabs */}
              <Route path="/quotations" element={<QuotationsList />} />
              <Route path="/clients" element={<ClientsList />} />
              <Route path="/products" element={<ProductCatalog />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/users" element={<UserManagement />} />
            </Routes>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden">
          <MobileBottomNav 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* Toast Notifications */}
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
    </Router>
  );
}

export default App;