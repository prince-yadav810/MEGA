import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import TasksOverview from './Tasks/TasksOverview';
import TaskBoard from './Tasks/TaskBoard';
import TaskCalendar from './Tasks/TaskCalendar';
import CompletedTasks from './Tasks/CompletedTasks';

const Workspace = () => {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="table" element={<TasksOverview />} />
      <Route path="board" element={<TaskBoard />} />
      <Route path="calendar" element={<TaskCalendar />} />
      <Route path="completed" element={<CompletedTasks />} />
      <Route path="*" element={<Navigate to="/workspace" replace />} />
    </Routes>
  );
};

export default Workspace;
