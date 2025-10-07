import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Paperclip,
  MessageCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  User,
  Table,
  LayoutGrid,
  CheckCircle,
  Bell
} from 'lucide-react';
import { taskStatuses, taskPriorities } from '../../utils/sampleData';
import TaskForm from '../../components/forms/TaskForm';
import taskService from '../../services/taskService';
import NotificationDropdown from '../../components/common/NotificationDropdown';
import { useNotifications } from '../../context/NotificationContext.js';

const TaskBoard = ({ onViewChange }) => {
  const location = useLocation();
  const { notifyTaskCreated, notifyTaskUpdated, notifyTaskDeleted, notifyTaskStatusChanged } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [menuOpenTaskId, setMenuOpenTaskId] = useState(null);

  // Workspace views configuration
  const workspaceViews = [
    { id: 'table', name: 'Table', icon: Table, path: '/workspace/table' },
    { id: 'board', name: 'Board', icon: LayoutGrid, path: '/workspace/board' },
    { id: 'calendar', name: 'Calendar', icon: Calendar, path: '/workspace/calendar' },
    { id: 'completed', name: 'Completed', icon: CheckCircle, path: '/workspace/completed' }
  ];

  useEffect(() => {
    fetchTasks();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpenTaskId && !event.target.closest('.task-menu-container')) {
        setMenuOpenTaskId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenTaskId]);

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

  const handleCreateTask = async (taskData) => {
    try {
      const response = await taskService.createTask(taskData);
      if (response.success) {
        toast.success(response.message || 'Task created successfully!');
        notifyTaskCreated(taskData.title);
        fetchTasks();
      }
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await taskService.updateTask(taskId, updates);
      if (response.success) {
        toast.success('Task updated successfully!');
        fetchTasks();
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleEditTask = async (taskData) => {
    try {
      const taskId = editingTask._id || editingTask.id;
      const response = await taskService.updateTask(taskId, taskData);
      if (response.success) {
        toast.success('Task updated successfully!');
        notifyTaskUpdated(taskData.title);
        fetchTasks();
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
      const taskTitle = deleteConfirmTask.title;
      const response = await taskService.deleteTask(taskId);
      if (response.success) {
        toast.success('Task deleted successfully!');
        notifyTaskDeleted(taskTitle);
        fetchTasks();
        setDeleteConfirmTask(null);
      }
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  // Kanban columns configuration
  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo', color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress', color: 'bg-primary-100' },
    { id: 'review', title: 'Review', status: 'review', color: 'bg-yellow-100' },
    { id: 'scheduled', title: 'Scheduled', status: 'scheduled', color: 'bg-purple-100' },
    { id: 'completed', title: 'Completed', status: 'completed', color: 'bg-success-100' }
  ];

  // Priority sorting order (urgent > high > medium > low)
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

  // Group tasks by status with priority sorting
  const tasksByStatus = useMemo(() => {
    const filtered = tasks.filter(task =>
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.client && task.client.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return columns.reduce((acc, column) => {
      // Filter by status and sort by priority (high to low)
      acc[column.status] = filtered
        .filter(task => task.status === column.status)
        .sort((a, b) => {
          // First sort by priority
          const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          if (priorityDiff !== 0) return priorityDiff;
          // Then sort by due date
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      return acc;
    }, {});
  }, [tasks, searchQuery]);

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
    if (diffDays <= 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'urgent') return <AlertCircle className="h-3 w-3 text-error-500" />;
    if (priority === 'high') return <TrendingUp className="h-3 w-3 text-warning-500" />;
    return <Clock className="h-3 w-3 text-gray-400" />;
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
    return 'text-gray-600';
  };

  // Drag and drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverColumn(columnStatus);
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the column entirely
    const relatedTarget = e.relatedTarget;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDraggedOverColumn(null);
    }
  };

  const handleDragEnd = (e) => {
    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e, columnStatus) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedTask && draggedTask.status !== columnStatus) {
      const taskId = draggedTask._id || draggedTask.id;
      const taskTitle = draggedTask.title;

      // Optimistically update UI
      setTasks(prevTasks =>
        prevTasks.map(task =>
          (task._id || task.id) === taskId
            ? { ...task, status: columnStatus }
            : task
        )
      );

      // Update in database
      try {
        await handleUpdateTask(taskId, { status: columnStatus });
        notifyTaskStatusChanged(taskTitle, columnStatus);
      } catch (error) {
        // Revert on error
        fetchTasks();
        toast.error('Failed to update task status');
      }
    }

    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  const TaskCard = ({ task }) => {
    const taskId = task._id || task.id;
    const isMenuOpen = menuOpenTaskId === taskId;

    return (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, task)}
      onDragEnd={handleDragEnd}
      className="bg-white rounded-xl border-2 border-gray-100 p-4 mb-3 hover:shadow-lg hover:border-primary-200 transition-all duration-300 cursor-move group hover:-translate-y-0.5"
    >
      {/* Priority Badge - Top Corner */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${taskPriorities[task.priority].bgColor} ${taskPriorities[task.priority].color}`}>
            {getPriorityIcon(task.priority)}
            <span>{taskPriorities[task.priority].label}</span>
          </div>
        </div>
        <div className="relative task-menu-container">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpenTaskId(isMenuOpen ? null : taskId);
            }}
            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-20 border border-gray-200">
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTask(task);
                    setMenuOpenTaskId(null);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit Task
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmTask(task);
                    setMenuOpenTaskId(null);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-error-600 hover:bg-gray-100"
                >
                  Delete Task
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Title */}
      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-base leading-snug">
        {task.title}
      </h3>

      {/* Task Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
        {task.description}
      </p>

      {/* Client Badge */}
      {task.client?.name && (
        <div className="mb-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md border border-primary-100">
            <User className="h-3 w-3" />
            {task.client.name}
          </div>
        </div>
      )}

      {/* Due Date with enhanced styling */}
      <div className="flex items-center gap-1.5 mb-3 bg-gray-50 px-2.5 py-1.5 rounded-md w-fit">
        <Calendar className="h-3.5 w-3.5 text-gray-500" />
        <span className={`text-xs font-medium ${getDueDateColor(task.dueDate, task.status)}`}>
          {formatDate(task.dueDate)}
        </span>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="text-xs bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 px-2 py-1 rounded-md font-medium border border-gray-200"
            >
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-gray-500 px-2 py-1">+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100 my-3"></div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Assignees */}
        <div className="flex -space-x-2">
          {task.assignees?.slice(0, 3).map((assignee, index) => (
            <div
              key={assignee._id || assignee.id || index}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-xs flex items-center justify-center font-semibold border-2 border-white ring-1 ring-gray-200"
              title={assignee.name}
            >
              {assignee.name?.substring(0, 2).toUpperCase() || assignee.avatar}
            </div>
          ))}
          {task.assignees?.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 text-white text-xs flex items-center justify-center font-semibold border-2 border-white ring-1 ring-gray-200">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>

        {/* Attachments & Comments */}
        <div className="flex items-center gap-3">
          {(task.attachments?.length > 0 || task.attachments > 0) && (
            <div className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors">
              <Paperclip className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{task.attachments?.length || task.attachments}</span>
            </div>
          )}
          {(task.comments?.length > 0 || task.comments > 0) && (
            <div className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors">
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{task.comments?.length || task.comments}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {task.timeTracked && task.estimatedTime && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-600 mb-1.5">
            <span className="font-medium">Progress</span>
            <span className="font-semibold">{task.timeTracked} / {task.estimatedTime}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-1.5 rounded-full transition-all duration-500 shadow-sm"
              style={{
                width: `${Math.min(100, (parseFloat(task.timeTracked) / parseFloat(task.estimatedTime)) * 100)}%`
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
    );
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
            <NotificationDropdown />
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
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-5 p-6 min-w-max">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`
                min-w-80 max-w-80 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-4 transition-all duration-300 border-2
                ${draggedOverColumn === column.status
                  ? 'ring-2 ring-primary-400 bg-primary-50 border-primary-300 shadow-lg'
                  : 'border-gray-200 shadow-sm'
                }
              `}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-200">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${taskStatuses[column.status].dotColor} shadow-sm`}></div>
                  <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">{column.title}</h2>
                  <span className="bg-white text-gray-700 text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm border border-gray-200">
                    {tasksByStatus[column.status]?.length || 0}
                  </span>
                </div>
                <button
                  onClick={() => setIsTaskFormOpen(true)}
                  className="text-gray-400 hover:text-primary-600 hover:bg-white p-1.5 rounded-lg transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Tasks */}
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {tasksByStatus[column.status]?.map((task) => (
                  <TaskCard key={task._id || task.id} task={task} />
                ))}

                {(!tasksByStatus[column.status] || tasksByStatus[column.status].length === 0) && (
                  <div className="text-center py-12 px-4">
                    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 transition-all hover:border-primary-300 hover:bg-primary-50">
                      <div className="text-sm text-gray-500 mb-2">No tasks yet</div>
                      <button
                        onClick={() => setIsTaskFormOpen(true)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        + Add first task
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isTaskFormOpen || editingTask !== null}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleEditTask : handleCreateTask}
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
    </div>
  );
};

export default TaskBoard;