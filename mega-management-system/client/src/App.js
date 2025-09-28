import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/common/Sidebar';
import Dashboard from './pages/Dashboard';
import './App.css';

// Placeholder components for other routes
const QuotationsList = () => (
  <div className="h-full bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Quotations</h1>
      <p className="text-gray-600">Quotations management coming soon...</p>
    </div>
  </div>
);

const ClientsList = () => (
  <div className="h-full bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Clients</h1>
      <p className="text-gray-600">Client management coming soon...</p>
    </div>
  </div>
);

const ProductCatalog = () => (
  <div className="h-full bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Products</h1>
      <p className="text-gray-600">Product catalog coming soon...</p>
    </div>
  </div>
);

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
              
              {/* Main routes */}
              <Route path="/workspace" element={<Dashboard />} />
              <Route path="/quotations" element={<QuotationsList />} />
              <Route path="/clients" element={<ClientsList />} />
              <Route path="/products" element={<ProductCatalog />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;