import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  RotateCcw,
  Trash2,
  MoreHorizontal,
  Paperclip,
  MessageCircle,
  TrendingUp,
  Table,
  LayoutGrid
} from 'lucide-react';
import { taskPriorities } from '../../utils/sampleData';
import taskService from '../../services/taskService';
import userService from '../../services/userService';

const CompletedTasks = ({ onViewChange }) => {
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    fetchCompletedTasks();
    fetchTeamMembers();
  }, []);

  const fetchCompletedTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasksByStatus('completed');
      if (response.success) {
        setTasks(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch completed tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await userService.getAllUsers();
      if (response.success) {
        setTeamMembers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all, this_week, this_month, last_month
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Workspace views configuration
  const workspaceViews = [
    { id: 'table', name: 'Table', icon: Table, path: '/workspace/table' },
    { id: 'board', name: 'Board', icon: LayoutGrid, path: '/workspace/board' },
    { id: 'calendar', name: 'Calendar', icon: Calendar, path: '/workspace/calendar' },
    { id: 'completed', name: 'Completed', icon: CheckCircle, path: '/workspace/completed' }
  ];

  // Get completed tasks
  const completedTasks = useMemo(() => {
    let filtered = tasks.filter(task => task.status === 'completed');

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.client?.name && task.client.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      filtered = filtered.filter(task => {
        const completedDate = new Date(task.completedDate);
        
        switch (dateFilter) {
          case 'this_week':
            return completedDate >= startOfWeek;
          case 'this_month':
            return completedDate >= startOfMonth;
          case 'last_month':
            return completedDate >= startOfLastMonth && completedDate <= endOfLastMonth;
          default:
            return true;
        }
      });
    }

    // Apply assignee filter
    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(task =>
        task.assignees?.some(assignee => (assignee._id || assignee.id).toString() === assigneeFilter)
      );
    }

    // Sort by completion date (most recent first)
    return filtered.sort((a, b) => new Date(b.completedDate || b.updatedAt) - new Date(a.completedDate || a.updatedAt));
  }, [tasks, searchQuery, dateFilter, assigneeFilter]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Same day';
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  };

  const getCompletionStats = () => {
    const totalTasks = completedTasks.length;
    const onTime = completedTasks.filter(task => 
      new Date(task.completedDate) <= new Date(task.dueDate)
    ).length;
    const late = totalTasks - onTime;
    
    return { totalTasks, onTime, late };
  };

  const stats = getCompletionStats();

  const handleReopenTask = async (taskId) => {
    try {
      const response = await taskService.updateTask(taskId, { status: 'in_progress' });
      if (response.success) {
        setTasks(tasks.filter(task => (task._id || task.id) !== taskId));
        setActiveDropdown(null);
        toast.success('Task reopened successfully');
      }
    } catch (error) {
      toast.error('Failed to reopen task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await taskService.deleteTask(taskId);
      if (response.success) {
        setTasks(tasks.filter(task => (task._id || task.id) !== taskId));
        setActiveDropdown(null);
        toast.success('Task deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete task');
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                showFilters ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* View Switcher */}
        <div className="mt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex bg-gray-100 rounded-lg p-1 mb-4 lg:mb-0">
            {workspaceViews.map((view) => {
              const Icon = view.icon;
              const isActive = location.pathname === view.path;

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

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search completed tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Completion Period</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Completed By</label>
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Team Members</option>
                  {teamMembers.map((member) => (
                    <option key={member._id || member.id} value={(member._id || member.id).toString()}>{member.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex space-x-2">
              <button 
                onClick={() => {
                  setDateFilter('all');
                  setAssigneeFilter('all');
                  setSearchQuery('');
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-6 lg:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Completed</p>
                <p className="text-2xl font-bold text-success-600">{stats.totalTasks}</p>
              </div>
              <div className="bg-success-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Time</p>
                <p className="text-2xl font-bold text-primary-600">{stats.onTime}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalTasks > 0 ? Math.round((stats.onTime / stats.totalTasks) * 100) : 0}% completion rate
                </p>
              </div>
              <div className="bg-primary-100 p-2 rounded-full">
                <Clock className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Late Completion</p>
                <p className="text-2xl font-bold text-warning-600">{stats.late}</p>
                <p className="text-xs text-gray-500">
                  {stats.totalTasks > 0 ? Math.round((stats.late / stats.totalTasks) * 100) : 0}% of total
                </p>
              </div>
              <div className="bg-warning-100 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-warning-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {completedTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed On
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedTasks.map((task) => {
                    const isLate = new Date(task.completedDate) > new Date(task.dueDate);
                    
                    return (
                      <tr key={task._id || task.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-success-500 flex-shrink-0" />
                              <div className="text-sm font-medium text-gray-900 truncate">{task.title}</div>
                            </div>
                            <div className="text-sm text-gray-500 truncate mt-1">{task.description}</div>
                            {task.client && (
                              <div className="text-xs text-primary-600 mt-1">{task.client}</div>
                            )}
                            <div className="flex items-center space-x-3 mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${taskPriorities[task.priority].bgColor} ${taskPriorities[task.priority].color}`}>
                                {taskPriorities[task.priority].label}
                              </span>
                              {task.attachments > 0 && (
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <Paperclip className="h-3 w-3" />
                                  <span>{task.attachments}</span>
                                </div>
                              )}
                              {task.comments > 0 && (
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <MessageCircle className="h-3 w-3" />
                                  <span>{task.comments}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex -space-x-1">
                            {task.assignees.slice(0, 3).map((assignee, index) => (
                              <div
                                key={assignee._id || assignee.id || index}
                                className="w-8 h-8 rounded-full border-2 border-white"
                                title={assignee.name}
                              >
                                {assignee.profileImage?.url ? (
                                  <img
                                    src={assignee.profileImage.url}
                                    alt={assignee.name}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-xs flex items-center justify-center font-medium rounded-full">
                                    {assignee.name?.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            ))}
                            {task.assignees.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-medium border-2 border-white">
                                +{task.assignees.length - 3}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm ${isLate ? 'text-warning-600' : 'text-gray-900'}`}>
                            {formatDate(task.completedDate)}
                          </div>
                          {isLate && (
                            <div className="text-xs text-warning-600 font-medium">
                              Late completion
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {formatDuration(task.createdDate, task.completedDate)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative">
                            <button
                              onClick={() => setActiveDropdown(activeDropdown === (task._id || task.id) ? null : (task._id || task.id))}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                            {activeDropdown === (task._id || task.id) && (
                              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                <button
                                  onClick={() => handleReopenTask(task._id || task.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  <span>Reopen Task</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id || task.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No completed tasks found</h3>
                <p>Completed tasks will appear here once team members finish their work</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletedTasks;