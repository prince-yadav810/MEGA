import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Table,
  LayoutGrid,
  Calendar,
  CheckCircle,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Clock,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { taskStatuses, taskPriorities } from '../utils/sampleData';
import taskService from '../services/taskService';

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeStatusDropdown, setActiveStatusDropdown] = useState(null);
  const [activePriorityDropdown, setActivePriorityDropdown] = useState(null);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.status-dropdown') && !event.target.closest('.priority-dropdown')) {
        setActiveStatusDropdown(null);
        setActivePriorityDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getAllTasks();
      if (response.success) {
        setTasks(response.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await taskService.getTaskStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  // Workspace views configuration
  const workspaceViews = [
    { id: 'table', name: 'Table', icon: Table, path: '/workspace/table' },
    { id: 'board', name: 'Board', icon: LayoutGrid, path: '/workspace/board' },
    { id: 'calendar', name: 'Calendar', icon: Calendar, path: '/workspace/calendar' },
    { id: 'completed', name: 'Completed', icon: CheckCircle, path: '/workspace/completed' }
  ];

  // Determine active view based on current path
  const getActiveView = () => {
    const path = location.pathname;
    if (path.includes('/table')) return 'table';
    if (path.includes('/board')) return 'board';
    if (path.includes('/calendar')) return 'calendar';
    if (path.includes('/completed')) return 'completed';
    return 'table'; // default
  };

  const activeView = getActiveView();

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.client?.name && task.client.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent') return <AlertCircle className="h-4 w-4 text-error-500" />;
    if (priority === 'high') return <TrendingUp className="h-4 w-4 text-warning-500" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const response = await taskService.updateTask(taskId, { status: newStatus });
      if (response.success) {
        setTasks(tasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
        setActiveStatusDropdown(null);
        fetchStats();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handlePriorityChange = async (taskId, newPriority) => {
    try {
      const response = await taskService.updateTask(taskId, { priority: newPriority });
      if (response.success) {
        setTasks(tasks.map(task =>
          task.id === taskId ? { ...task, priority: newPriority } : task
        ));
        setActivePriorityDropdown(null);
      }
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">Workspace</h1>
            <p className="text-gray-600">Manage tasks and collaborate with your team</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors">
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* View Switcher */}
        <div className="mt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex bg-gray-100 rounded-lg p-1 mb-4 lg:mb-0">
            {workspaceViews.map((view) => {
              const Icon = view.icon;
              const isActive = activeView === view.id;
              
              return (
                <Link
                  key={view.id}
                  to={view.path}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-white text-primary-700 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{view.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-6 lg:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-primary-100 p-2 rounded-full">
                <Table className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-primary-600">{stats.inProgress}</p>
              </div>
              <div className="bg-primary-100 p-2 rounded-full">
                <Clock className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-success-600">{stats.completed}</p>
              </div>
              <div className="bg-success-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-error-600">{stats.overdue}</p>
              </div>
              <div className="bg-error-100 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-error-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Task Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.slice(0, 6).map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                        {task.client?.name && (
                          <div className="text-xs text-primary-600 mt-1">{task.client.name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative status-dropdown">
                        <button
                          onClick={() => setActiveStatusDropdown(activeStatusDropdown === task.id ? null : task.id)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${taskStatuses[task.status].color} hover:opacity-80 transition-opacity`}
                        >
                          <div className={`w-2 h-2 rounded-full mr-1.5 ${taskStatuses[task.status].dotColor}`}></div>
                          {taskStatuses[task.status].label}
                        </button>

                        {activeStatusDropdown === task.id && (
                          <div className="absolute z-10 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                            {Object.entries(taskStatuses).map(([key, status]) => (
                              <button
                                key={key}
                                onClick={() => handleStatusChange(task.id, key)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                                  task.status === key ? 'bg-gray-50' : ''
                                }`}
                              >
                                <div className={`w-2 h-2 rounded-full ${status.dotColor}`}></div>
                                <span>{status.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative priority-dropdown">
                        <button
                          onClick={() => setActivePriorityDropdown(activePriorityDropdown === task.id ? null : task.id)}
                          className="flex items-center space-x-1 hover:opacity-80 transition-opacity"
                        >
                          {getPriorityIcon(task.priority)}
                          <span className={`text-sm font-medium ${taskPriorities[task.priority].color}`}>
                            {taskPriorities[task.priority].label}
                          </span>
                        </button>

                        {activePriorityDropdown === task.id && (
                          <div className="absolute z-10 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                            {Object.entries(taskPriorities).map(([key, priority]) => (
                              <button
                                key={key}
                                onClick={() => handlePriorityChange(task.id, key)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                                  task.priority === key ? 'bg-gray-50' : ''
                                }`}
                              >
                                {getPriorityIcon(key)}
                                <span className={priority.color}>{priority.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {task.assignees?.slice(0, 2).map((assignee, index) => (
                          <div
                            key={assignee._id || assignee.id || `assignee-${task.id}-${index}`}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-xs flex items-center justify-center font-medium border-2 border-white"
                            title={assignee.name}
                          >
                            {assignee.name?.substring(0, 2).toUpperCase() || assignee.avatar}
                          </div>
                        ))}
                        {task.assignees?.length > 2 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-medium border-2 border-white">
                            +{task.assignees.length - 2}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(task.dueDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200">
            <button 
              onClick={() => navigate('/workspace/table')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View all tasks →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;