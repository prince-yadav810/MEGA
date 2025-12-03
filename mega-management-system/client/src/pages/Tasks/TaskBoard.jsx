import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
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
  const [boardView, setBoardView] = useState('status'); // 'status' or 'timeline'
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [menuOpenTaskId, setMenuOpenTaskId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null); // { taskId, type: 'priority', position: 'top' | 'bottom' }
  const [editingProgress, setEditingProgress] = useState(null); // taskId of task being edited
  const [progressValue, setProgressValue] = useState(''); // temporary progress value

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
      if (!event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
      if (editingProgress && !event.target.closest('.progress-input-container')) {
        setEditingProgress(null);
        setProgressValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenTaskId, editingProgress]);

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

  // Status-based columns configuration
  const statusColumns = [
    { id: 'todo', title: 'To Do', status: 'todo', color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress', color: 'bg-primary-100' },
    { id: 'completed', title: 'Completed', status: 'completed', color: 'bg-success-100' }
  ];

  // Timeline-based columns configuration
  const timelineColumns = [
    { id: 'overdue', title: 'Overdue', timeline: 'overdue', color: 'bg-error-100' },
    { id: 'today', title: 'Today', timeline: 'today', color: 'bg-warning-100' },
    { id: 'tomorrow', title: 'Tomorrow', timeline: 'tomorrow', color: 'bg-primary-100' }
  ];

  // Dynamic columns based on board view
  const columns = boardView === 'status' ? statusColumns : timelineColumns;

  // Priority sorting order (urgent > high > medium > low)
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

  // Helper function to get timeline category for a task
  const getTimelineCategory = (task) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) return 'overdue';
    if (dueDate.getTime() === today.getTime()) return 'today';

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dueDate.getTime() === tomorrow.getTime()) return 'tomorrow';

    return null; // Tasks beyond tomorrow are not shown in timeline view
  };

  // Group tasks by status or timeline with priority sorting
  const tasksByStatus = useMemo(() => {
    // Apply search filter
    const filtered = tasks.filter(task =>
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.client && task.client.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (boardView === 'status') {
      // Group by status
      return columns.reduce((acc, column) => {
        acc[column.id] = filtered
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
    } else {
      // Group by timeline (overdue, today, tomorrow)
      return columns.reduce((acc, column) => {
        acc[column.id] = filtered
          .filter(task => getTimelineCategory(task) === column.timeline)
          .sort((a, b) => {
            // First sort by priority
            const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            if (priorityDiff !== 0) return priorityDiff;
            // Then sort by due date
            return new Date(a.dueDate) - new Date(b.dueDate);
          });
        return acc;
      }, {});
    }
  }, [tasks, searchQuery, boardView, columns]);

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

  // Drag and drop handlers with instant response
  const handleDragStart = (e, task) => {
    // Immediate drag start with no delay
    requestAnimationFrame(() => {
      setDraggedTask(task);
    });

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for Firefox

    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();

    // Create a wrapper for 3D perspective
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.top = '-9999px';
    wrapper.style.left = '-9999px';
    wrapper.style.width = `${rect.width}px`;
    wrapper.style.height = `${rect.height}px`;
    wrapper.style.perspective = '1200px';
    wrapper.style.perspectiveOrigin = 'center center';

    // Create custom drag image with fixed size and 3D effect
    const dragImage = element.cloneNode(true);
    dragImage.style.width = `${rect.width}px`;
    dragImage.style.height = `${rect.height}px`;
    dragImage.style.minWidth = `${rect.width}px`;
    dragImage.style.maxWidth = `${rect.width}px`;
    dragImage.style.minHeight = `${rect.height}px`;
    dragImage.style.maxHeight = `${rect.height}px`;
    dragImage.style.opacity = '0.98';
    dragImage.style.transform = 'rotateX(-5deg) rotateY(5deg) rotateZ(-2deg)';
    dragImage.style.transformStyle = 'preserve-3d';
    dragImage.style.backfaceVisibility = 'hidden';
    dragImage.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    dragImage.style.pointerEvents = 'none';
    dragImage.style.filter = 'brightness(1.02)';

    wrapper.appendChild(dragImage);
    document.body.appendChild(wrapper);

    // Calculate center point for drag image
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    e.dataTransfer.setDragImage(wrapper, centerX, centerY);

    // Remove the temporary drag image after rendering
    setTimeout(() => {
      if (document.body.contains(wrapper)) {
        document.body.removeChild(wrapper);
      }
    }, 0);

    // Immediate visual feedback with 3D effect on original card
    element.style.opacity = '0.3';
    element.style.transform = 'rotateX(-3deg) rotateY(3deg) rotateZ(-1deg) scale(0.95)';
    element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
    element.style.transition = 'none';
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
    // Reset all visual states
    e.currentTarget.style.opacity = '1';
    e.currentTarget.style.transform = '';
    e.currentTarget.style.boxShadow = '';
    e.currentTarget.style.transition = '';
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

  const handleProgressClick = (taskId, currentProgress) => {
    setEditingProgress(taskId);
    setProgressValue(currentProgress || '0');
  };

  const handleProgressChange = (e) => {
    const value = e.target.value;
    // Only allow numbers 0-100
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0 && parseInt(value) <= 100)) {
      setProgressValue(value);
    }
  };

  const handleProgressSave = async (taskId) => {
    const progress = parseInt(progressValue);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      toast.error('Please enter a value between 0 and 100');
      return;
    }

    try {
      const response = await taskService.updateTask(taskId, { progress });
      if (response.success) {
        setTasks(tasks.map(task =>
          (task._id || task.id) === taskId ? { ...task, progress } : task
        ));
        setEditingProgress(null);
        setProgressValue('');
        toast.success('Progress updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const handleProgressKeyDown = (e, taskId) => {
    if (e.key === 'Enter') {
      handleProgressSave(taskId);
    } else if (e.key === 'Escape') {
      setEditingProgress(null);
      setProgressValue('');
    }
  };

  const getDropdownPosition = (buttonElement) => {
    if (!buttonElement) return 'bottom';
    const rect = buttonElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    return spaceBelow < 200 && spaceAbove > spaceBelow ? 'top' : 'bottom';
  };

  const TaskCard = ({ task }) => {
    const taskId = task._id || task.id;
    const isMenuOpen = menuOpenTaskId === taskId;
    const isDraggable = boardView === 'status'; // Only allow dragging in status view

    return (
    <div
      draggable={isDraggable}
      onDragStart={isDraggable ? (e) => handleDragStart(e, task) : undefined}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
      onMouseDown={(e) => {
        // Prevent text selection during drag
        if (isDraggable) {
          e.currentTarget.style.cursor = 'grabbing';
        }
      }}
      onMouseUp={(e) => {
        if (isDraggable) {
          e.currentTarget.style.cursor = 'grab';
        }
      }}
      className={`bg-white rounded-xl border-2 border-gray-100 p-4 mb-3 hover:shadow-lg hover:border-primary-200 transition-all duration-150 ${isDraggable ? 'cursor-grab' : 'cursor-default'} group hover:-translate-y-0.5 select-none`}
      style={{
        willChange: 'transform, opacity, box-shadow',
        WebkitUserDrag: 'element',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        touchAction: 'pan-y',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden'
      }}
    >
      {/* Priority Badge - Top Corner */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 relative dropdown-container">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const position = getDropdownPosition(e.currentTarget);
              setActiveDropdown(
                activeDropdown?.taskId === taskId && activeDropdown?.type === 'priority'
                  ? null
                  : { taskId, type: 'priority', position }
              );
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${taskPriorities[task.priority].bgColor} ${taskPriorities[task.priority].color} hover:opacity-80 transition-opacity`}
          >
            {getPriorityIcon(task.priority)}
            <span>{taskPriorities[task.priority].label}</span>
          </button>

          {activeDropdown?.taskId === taskId && activeDropdown?.type === 'priority' && (
            <div
              className={`absolute z-20 left-0 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 ${
                activeDropdown.position === 'top' ? 'bottom-full mb-1' : 'top-8'
              }`}
            >
              {Object.entries(taskPriorities).map(([key, priority]) => (
                <button
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickPriorityChange(taskId, key);
                  }}
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
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span
            onClick={(e) => {
              e.stopPropagation();
              if (editingProgress !== taskId) {
                handleProgressClick(taskId, task.progress || 0);
              }
            }}
            className="text-xs text-gray-500 font-medium cursor-pointer hover:text-primary-600 transition-colors"
          >
            Progress
          </span>
          {editingProgress === taskId ? (
            <div className="flex items-center gap-2 progress-input-container">
              <input
                type="text"
                value={progressValue}
                onChange={handleProgressChange}
                onKeyDown={(e) => handleProgressKeyDown(e, taskId)}
                onBlur={() => handleProgressSave(taskId)}
                autoFocus
                placeholder="0-100"
                className="w-16 px-2 py-1 text-xs border-2 border-primary-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-center font-semibold bg-white shadow-sm"
              />
              <span className="font-semibold text-primary-600">%</span>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleProgressClick(taskId, task.progress || 0);
              }}
              className="text-xs font-semibold text-gray-600 hover:text-primary-600 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-primary-50"
            >
              {task.progress || 0}%
            </button>
          )}
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (editingProgress !== taskId) {
              handleProgressClick(taskId, task.progress || 0);
            }
          }}
          className="w-full bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden cursor-pointer hover:h-2 transition-all duration-200 shadow-inner"
        >
          <div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-500 shadow-sm hover:shadow-md"
            style={{
              width: `${Math.min(100, task.progress || 0)}%`
            }}
          ></div>
        </div>
      </div>
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
        <div className="px-6 pt-6 pb-3">
          {/* Board View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setBoardView('status')}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${boardView === 'status'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Status</span>
            </button>
            <button
              onClick={() => setBoardView('timeline')}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${boardView === 'timeline'
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Clock className="h-4 w-4" />
              <span>Timeline</span>
            </button>
          </div>
        </div>
        <div className="flex gap-5 px-6 pb-24 min-w-max">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`
                min-w-80 max-w-80 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-4 transition-all duration-200 border-2
                ${boardView === 'status' && draggedOverColumn === column.status
                  ? 'ring-4 ring-primary-400 bg-gradient-to-b from-primary-50 to-primary-100 border-primary-400 shadow-2xl scale-102 transform'
                  : 'border-gray-200 shadow-sm'
                }
              `}
              onDragOver={boardView === 'status' ? (e) => handleDragOver(e, column.status) : undefined}
              onDragLeave={boardView === 'status' ? handleDragLeave : undefined}
              onDrop={boardView === 'status' ? (e) => handleDrop(e, column.status) : undefined}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-200">
                <div className="flex items-center gap-2">
                  {boardView === 'status' && column.status && taskStatuses[column.status] && (
                    <div className={`w-3 h-3 rounded-full ${taskStatuses[column.status].dotColor} shadow-sm`}></div>
                  )}
                  {boardView === 'timeline' && (
                    <div className={`w-3 h-3 rounded-full ${
                      column.timeline === 'overdue' ? 'bg-error-500' :
                      column.timeline === 'today' ? 'bg-warning-500' :
                      'bg-primary-500'
                    } shadow-sm`}></div>
                  )}
                  <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">{column.title}</h2>
                  <span className="bg-white text-gray-700 text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm border border-gray-200">
                    {tasksByStatus[column.id]?.length || 0}
                  </span>
                </div>
                <button
                  onClick={() => {
                    // Functionality will be added in the future
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* Tasks */}
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {tasksByStatus[column.id]?.map((task) => (
                  <TaskCard key={task._id || task.id} task={task} />
                ))}

                {(!tasksByStatus[column.id] || tasksByStatus[column.id].length === 0) && (
                  <div className="text-center py-12 px-4">
                    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 transition-all hover:border-primary-300 hover:bg-primary-50">
                      <div className="text-sm text-gray-500 mb-2">No tasks {boardView === 'timeline' ? 'in this timeline' : 'yet'}</div>
                      {boardView === 'status' && (
                        <button
                          onClick={() => setIsTaskFormOpen(true)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          + Add first task
                        </button>
                      )}
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