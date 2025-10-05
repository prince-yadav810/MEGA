import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowUpDown,
  Filter,
  Search,
  Plus,
  MoreHorizontal,
  Calendar,
  User,
  Clock,
  AlertCircle,
  TrendingUp,
  Paperclip,
  MessageCircle,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  Table,
  LayoutGrid,
  CheckCircle
} from 'lucide-react';
import { taskStatuses, taskPriorities, teamMembers } from '../../utils/sampleData';
import TaskForm from '../../components/forms/TaskForm';
import taskService from '../../services/taskService';

const TasksOverview = ({ onViewChange }) => {
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getAllTasks();
      if (response.success) {
        setTasks(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch tasks');
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

  const handleCreateTask = async (taskData) => {
    try {
      const response = await taskService.createTask(taskData);
      if (response.success) {
        toast.success(response.message || 'Task created successfully!');
        fetchTasks();
        fetchStats();
      }
    } catch (error) {
      toast.error('Failed to create task');
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Workspace views configuration
  const workspaceViews = [
    { id: 'table', name: 'Table', icon: Table, path: '/workspace/table' },
    { id: 'board', name: 'Board', icon: LayoutGrid, path: '/workspace/board' },
    { id: 'calendar', name: 'Calendar', icon: Calendar, path: '/workspace/calendar' },
    { id: 'completed', name: 'Completed', icon: CheckCircle, path: '/workspace/completed' }
  ];

  // Filtering and sorting logic
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (task.client?.name && task.client.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === 'all' ||
                             task.assignees?.some(assignee => (assignee._id || assignee.id).toString() === assigneeFilter);

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'dueDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortField === 'assignees') {
        aValue = a.assignees.length;
        bValue = b.assignees.length;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tasks, searchQuery, sortField, sortDirection, statusFilter, priorityFilter, assigneeFilter]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const selectAllTasks = () => {
    if (selectedTasks.length === filteredAndSortedTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredAndSortedTasks.map(task => task.id));
    }
  };

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

  const getDueDateColor = (dueDate, status) => {
    if (status === 'completed') return 'text-gray-500';
    
    const date = new Date(dueDate);
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-error-600 font-medium';
    if (diffDays === 0) return 'text-warning-600 font-medium';
    if (diffDays <= 3) return 'text-warning-500';
    return 'text-gray-700';
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
            <button
              onClick={() => setIsTaskFormOpen(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors"
            >
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
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  {Object.entries(taskStatuses).map(([key, status]) => (
                    <option key={key} value={key}>{status.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  {Object.entries(taskPriorities).map(([key, priority]) => (
                    <option key={key} value={key}>{priority.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Team Members</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id.toString()}>{member.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex space-x-2">
              <button 
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
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
      <div className="px-4 pt-6 lg:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="bg-primary-50 border-b border-primary-200 px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-700">
              {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm text-primary-700 hover:text-primary-800">
                Mark Complete
              </button>
              <button className="px-3 py-1 text-sm text-primary-700 hover:text-primary-800">
                Assign
              </button>
              <button className="px-3 py-1 text-sm text-error-600 hover:text-error-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white mx-4 my-4 lg:mx-6 rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTasks.length === filteredAndSortedTasks.length && filteredAndSortedTasks.length > 0}
                      onChange={selectAllTasks}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Task</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Status</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('priority')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Priority</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('assignees')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Assignees</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('dueDate')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Due Date</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">{task.title}</div>
                        <div className="text-sm text-gray-500 truncate">{task.description}</div>
                        {task.client && (
                          <div className="text-xs text-primary-600 mt-1">{task.client}</div>
                        )}
                        <div className="flex items-center space-x-3 mt-2">
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${taskStatuses[task.status].color}`}>
                        <div className={`w-2 h-2 rounded-full mr-1.5 ${taskStatuses[task.status].dotColor}`}></div>
                        {taskStatuses[task.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        {getPriorityIcon(task.priority)}
                        <span className={`text-sm font-medium ${taskPriorities[task.priority].color}`}>
                          {taskPriorities[task.priority].label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {task.assignees.slice(0, 3).map((assignee) => (
                          <div
                            key={assignee.id}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-xs flex items-center justify-center font-medium border-2 border-white"
                            title={assignee.name}
                          >
                            {assignee.avatar}
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
                      <div className={`text-sm ${getDueDateColor(task.dueDate, task.status)}`}>
                        {formatDate(task.dueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500">
                        {task.timeTracked} / {task.estimatedTime}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-primary-500 h-1.5 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (parseFloat(task.timeTracked) / parseFloat(task.estimatedTime)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 text-gray-400 hover:text-gray-600" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-error-600" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAndSortedTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        onSubmit={handleCreateTask}
      />
    </div>
  );
};

export default TasksOverview;