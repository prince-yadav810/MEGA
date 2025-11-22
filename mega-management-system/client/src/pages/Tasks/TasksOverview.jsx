import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  CheckCircle,
  X
} from 'lucide-react';
import { taskStatuses, taskPriorities } from '../../utils/sampleData';
import TaskForm from '../../components/forms/TaskForm';
import taskService from '../../services/taskService';
import userService from '../../services/userService';

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
  const [activeDropdown, setActiveDropdown] = useState(null); // { taskId, type: 'status' | 'priority', position: 'top' | 'bottom' }
  const [showCheckboxes, setShowCheckboxes] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [expandedTaskText, setExpandedTaskText] = useState(null); // task object for text expansion modal
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);
  const highlightedRowRef = useRef(null);

  useEffect(() => {
    fetchTasks();
    fetchStats();
    fetchTeamMembers();
  }, []);

  // Handle highlighting from inbox navigation
  useEffect(() => {
    if (location.state?.highlightId) {
      setHighlightedTaskId(location.state.highlightId);
      // Clear the highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedTaskId(null);
      }, 3000);
      // Clear location state to prevent re-highlighting on refresh
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state?.highlightId]);

  // Scroll to highlighted task
  useEffect(() => {
    if (highlightedTaskId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedTaskId, tasks]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
      if (!event.target.closest('.menu-dropdown-container')) {
        setOpenMenuTaskId(null);
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

  const handleUpdateTask = async (taskData) => {
    try {
      const taskId = editingTask._id || editingTask.id;
      const response = await taskService.updateTask(taskId, taskData);
      if (response.success) {
        toast.success('Task updated successfully!');
        fetchTasks();
        fetchStats();
        setEditingTask(null);
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteConfirmTask) return;
    try {
      const taskId = deleteConfirmTask._id || deleteConfirmTask.id;
      const response = await taskService.deleteTask(taskId);
      if (response.success) {
        toast.success('Task deleted successfully!');
        fetchTasks();
        fetchStats();
        setDeleteConfirmTask(null);
      }
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleMarkCompleted = async (task) => {
    try {
      const taskId = task._id || task.id;
      const response = await taskService.updateTask(taskId, {
        status: 'completed',
        completedDate: new Date()
      });
      if (response.success) {
        toast.success('Task marked as completed!');
        fetchTasks();
        fetchStats();
        setOpenMenuTaskId(null);
      }
    } catch (error) {
      toast.error('Failed to mark task as completed');
    }
  };

  const handleAssignTask = (task) => {
    setAssigningTask(task);
    setOpenMenuTaskId(null);
  };

  const handleUpdateAssignees = async (taskData) => {
    try {
      const taskId = assigningTask._id || assigningTask.id;
      const response = await taskService.updateTask(taskId, {
        assignees: taskData.assignees
      });
      if (response.success) {
        toast.success('Assignees updated successfully!');
        fetchTasks();
        setAssigningTask(null);
      }
    } catch (error) {
      toast.error('Failed to update assignees');
    }
  };

  const handleBulkMarkCompleted = async () => {
    try {
      const promises = selectedTasks.map(taskId =>
        taskService.updateTask(taskId, {
          status: 'completed',
          completedDate: new Date()
        })
      );
      await Promise.all(promises);
      toast.success(`${selectedTasks.length} task(s) marked as completed!`);
      fetchTasks();
      fetchStats();
      setSelectedTasks([]);
    } catch (error) {
      toast.error('Failed to mark tasks as completed');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedTasks.length} task(s)? This action cannot be undone.`)) {
      return;
    }
    try {
      const promises = selectedTasks.map(taskId => taskService.deleteTask(taskId));
      await Promise.all(promises);
      toast.success(`${selectedTasks.length} task(s) deleted successfully!`);
      fetchTasks();
      fetchStats();
      setSelectedTasks([]);
    } catch (error) {
      toast.error('Failed to delete tasks');
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
  const [deleteConfirmTask, setDeleteConfirmTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [openMenuTaskId, setOpenMenuTaskId] = useState(null);
  const [assigningTask, setAssigningTask] = useState(null);

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
      // Exclude completed tasks from the table view
      const notCompleted = task.status !== 'completed';

      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (task.client?.name && task.client.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === 'all' ||
                             task.assignees?.some(assignee => (assignee._id || assignee.id).toString() === assigneeFilter);

      return notCompleted && matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
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
      setSelectedTasks(filteredAndSortedTasks.map(task => task._id || task.id));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = date - today;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays <= 7) return `${diffDays} days`;

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
    date.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((date - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-error-600 font-medium';
    if (diffDays === 0) return 'text-warning-600 font-medium';
    if (diffDays <= 3) return 'text-warning-500';
    return 'text-gray-700';
  };

  const handleQuickStatusChange = async (taskId, newStatus) => {
    try {
      const response = await taskService.updateTask(taskId, { status: newStatus });
      if (response.success) {
        setTasks(tasks.map(task =>
          (task._id || task.id) === taskId ? { ...task, status: newStatus } : task
        ));
        setActiveDropdown(null);
        fetchStats();
        toast.success('Status updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleQuickPriorityChange = async (taskId, newPriority) => {
    try {
      const response = await taskService.updateTask(taskId, { priority: newPriority });
      if (response.success) {
        setTasks(tasks.map(task =>
          (task._id || task.id) === taskId ? { ...task, priority: newPriority } : task
        ));
        setActiveDropdown(null);
        toast.success('Priority updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update priority');
    }
  };

  const getDropdownPosition = (buttonElement) => {
    if (!buttonElement) return 'bottom';
    const rect = buttonElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    return spaceBelow < 200 && spaceAbove > spaceBelow ? 'top' : 'bottom';
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
                    key !== 'completed' && <option key={key} value={key}>{status.label}</option>
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
                    <option key={member._id || member.id} value={(member._id || member.id).toString()}>{member.name}</option>
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
              <button
                onClick={handleBulkMarkCompleted}
                className="px-3 py-1 text-sm text-primary-700 hover:text-primary-800"
              >
                Mark Complete
              </button>
              <button
                onClick={() => {
                  // For bulk assign, assign to the first selected task
                  const firstTask = tasks.find(t => (t._id || t.id) === selectedTasks[0]);
                  if (firstTask) {
                    setAssigningTask(firstTask);
                  }
                }}
                className="px-3 py-1 text-sm text-primary-700 hover:text-primary-800"
              >
                Assign
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm text-error-600 hover:text-error-700"
              >
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
                  {showCheckboxes && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTasks.length === filteredAndSortedTasks.length && filteredAndSortedTasks.length > 0}
                        onChange={selectAllTasks}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left w-1/5">
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Task</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left w-40">
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedTasks.map((task, index) => {
                  const taskId = task._id || task.id;
                  const isHighlighted = highlightedTaskId === taskId;
                  return (
                  <tr
                    key={taskId}
                    ref={isHighlighted ? highlightedRowRef : null}
                    className={`hover:bg-gray-100 group transition-all duration-500 ${
                      isHighlighted
                        ? 'bg-yellow-100 ring-2 ring-yellow-400 ring-inset animate-pulse'
                        : index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    {showCheckboxes && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(taskId)}
                          onChange={() => toggleTaskSelection(taskId)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 w-1/5">
                      <div className="max-w-xs">
                        <button
                          onClick={() => setExpandedTaskText(task)}
                          className="text-left w-full group/text"
                          title="Click to view full text"
                        >
                          <div className="text-sm font-medium text-gray-900 truncate group-hover/text:text-primary-600 transition-colors">{task.title}</div>
                          <div className="text-sm text-gray-500 truncate group-hover/text:text-gray-700 transition-colors">{task.description}</div>
                        </button>
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
                    <td className="px-6 py-4 w-40">
                      <div className="relative dropdown-container">
                        <button
                          onClick={(e) => {
                            const position = getDropdownPosition(e.currentTarget);
                            setActiveDropdown(
                              activeDropdown?.taskId === taskId && activeDropdown?.type === 'status'
                                ? null
                                : { taskId, type: 'status', position }
                            );
                          }}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${taskStatuses[task.status].color} hover:opacity-80 transition-opacity`}
                        >
                          <div className={`w-2 h-2 rounded-full mr-1.5 ${taskStatuses[task.status].dotColor}`}></div>
                          {taskStatuses[task.status].label}
                        </button>

                        {activeDropdown?.taskId === taskId && activeDropdown?.type === 'status' && (
                          <div
                            className={`absolute z-10 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 ${
                              activeDropdown.position === 'top' ? 'bottom-full mb-1' : 'mt-1'
                            }`}
                          >
                            {Object.entries(taskStatuses).map(([key, status]) => (
                              <button
                                key={key}
                                onClick={() => handleQuickStatusChange(taskId, key)}
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
                      <div className="relative dropdown-container">
                        <button
                          onClick={(e) => {
                            const position = getDropdownPosition(e.currentTarget);
                            setActiveDropdown(
                              activeDropdown?.taskId === taskId && activeDropdown?.type === 'priority'
                                ? null
                                : { taskId, type: 'priority', position }
                            );
                          }}
                          className="flex items-center space-x-1 hover:opacity-80 transition-opacity"
                        >
                          {getPriorityIcon(task.priority)}
                          <span className={`text-sm font-medium ${taskPriorities[task.priority].color}`}>
                            {taskPriorities[task.priority].label}
                          </span>
                        </button>

                        {activeDropdown?.taskId === taskId && activeDropdown?.type === 'priority' && (
                          <div
                            className={`absolute z-10 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 ${
                              activeDropdown.position === 'top' ? 'bottom-full mb-1' : 'mt-1'
                            }`}
                          >
                            {Object.entries(taskPriorities).map(([key, priority]) => (
                              <button
                                key={key}
                                onClick={() => handleQuickPriorityChange(taskId, key)}
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
                        {task.assignees && task.assignees.length > 0 ? (
                          <>
                            {task.assignees.slice(0, 3).map((assignee, index) => (
                              <div
                                key={assignee._id || assignee.id || index}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-xs flex items-center justify-center font-medium border-2 border-white"
                                title={assignee.name || 'Assignee'}
                              >
                                {assignee.avatar || assignee.name?.substring(0, 2).toUpperCase() || '??'}
                              </div>
                            ))}
                            {task.assignees.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-medium border-2 border-white">
                                +{task.assignees.length - 3}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No assignees</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${getDueDateColor(task.dueDate, task.status)}`}>
                        {formatDate(task.dueDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative menu-dropdown-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuTaskId(openMenuTaskId === taskId ? null : taskId);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Actions"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                        {openMenuTaskId === taskId && (
                          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                            <div className="py-1" role="menu">
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setOpenMenuTaskId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirmTask(task);
                                  setOpenMenuTaskId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-error-600 hover:bg-error-50 flex items-center space-x-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                              </button>
                            </div>
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
        isOpen={isTaskFormOpen || editingTask !== null}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        initialData={editingTask}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setDeleteConfirmTask(null)}
            ></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-error-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-error-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Task
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete "{deleteConfirmTask.title}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteTask}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-error-600 text-base font-medium text-white hover:bg-error-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTask(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Dialog */}
      {assigningTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setAssigningTask(null)}
            ></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Assign Task: {assigningTask.title}
                  </h3>
                  <button
                    onClick={() => setAssigningTask(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Team Members
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {teamMembers.map(member => {
                      const isAssigned = assigningTask.assignees?.some(
                        a => (a._id || a.id || a) === member._id
                      );
                      return (
                        <button
                          key={member._id}
                          type="button"
                          onClick={() => {
                            const currentAssignees = assigningTask.assignees || [];
                            const assigneeIds = currentAssignees.map(a => a._id || a.id || a);
                            let newAssignees;

                            if (isAssigned) {
                              newAssignees = assigneeIds.filter(id => id !== member._id);
                            } else {
                              newAssignees = [...assigneeIds, member._id];
                            }

                            setAssigningTask({
                              ...assigningTask,
                              assignees: newAssignees
                            });
                          }}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all ${
                            isAssigned
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-300 hover:border-gray-400 text-gray-700'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-xs flex items-center justify-center font-medium">
                            {member.avatar || member.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{member.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {teamMembers.length === 0 && (
                    <p className="text-sm text-gray-500">No team members available. Add team members in the Team section first.</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => handleUpdateAssignees({
                    assignees: Array.isArray(assigningTask.assignees)
                      ? assigningTask.assignees.map(a => a._id || a.id || a)
                      : []
                  })}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Update Assignees
                </button>
                <button
                  type="button"
                  onClick={() => setAssigningTask(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Text Expansion Modal */}
      {expandedTaskText && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setExpandedTaskText(null)}
            ></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-semibold text-gray-900">
                    Task Details
                  </h3>
                  <button
                    onClick={() => setExpandedTaskText(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <p className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {expandedTaskText.title}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <p className="text-base text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                      {expandedTaskText.description || 'No description provided'}
                    </p>
                  </div>

                  {expandedTaskText.client && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client
                      </label>
                      <p className="text-sm text-primary-600 bg-primary-50 p-3 rounded-lg">
                        {expandedTaskText.client}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setExpandedTaskText(null)}
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksOverview;