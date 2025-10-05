import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import TasksOverview from './Tasks/TasksOverview';
import TaskBoard from './Tasks/TaskBoard';
import TaskCalendar from './Tasks/TaskCalendar';
import CompletedTasks from './Tasks/CompletedTasks';

const Workspace = () => {
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    console.log('✅ Workspace component mounted!');
  }, []);

  const handleViewChange = (view) => {
    console.log('Changing view to:', view);
    setActiveView(view);
  };

  const renderView = () => {
    console.log('Current active view:', activeView);
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onViewChange={handleViewChange} />;
      case 'table':
        return <TasksOverview onViewChange={handleViewChange} />;
      case 'board':
        return <TaskBoard onViewChange={handleViewChange} />;
      case 'calendar':
        return <TaskCalendar onViewChange={handleViewChange} />;
      case 'completed':
        return <CompletedTasks onViewChange={handleViewChange} />;
      default:
        return <Dashboard onViewChange={handleViewChange} />;
    }
  };

  return <>{renderView()}</>;
};

export default Workspace;
