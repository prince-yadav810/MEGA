import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  TrendingUp,
  User,
  X,
  Table,
  LayoutGrid,
  CheckCircle,
  Paperclip,
  MessageCircle,
  Edit2,
  Tag
} from 'lucide-react';
import { taskStatuses, taskPriorities } from '../../utils/sampleData';
import TaskForm from '../../components/forms/TaskForm';
import taskService from '../../services/taskService';

const TaskCalendar = ({ onViewChange }) => {
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(null); // { taskId, type: 'priority', position: 'top' | 'bottom' }
  const [showMobilePopup, setShowMobilePopup] = useState(false);

  // Workspace views configuration
  const workspaceViews = [
    { id: 'table', name: 'Table', icon: Table, path: '/workspace/table' },
    { id: 'board', name: 'Board', icon: LayoutGrid, path: '/workspace/board' },
    { id: 'calendar', name: 'Calendar', icon: CalendarIcon, path: '/workspace/calendar' },
    { id: 'completed', name: 'Completed', icon: CheckCircle, path: '/workspace/completed' }
  ];

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
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

  const handleCreateTask = async (taskData) => {
    try {
      const response = await taskService.createTask(taskData);
      if (response.success) {
        toast.success(response.message || 'Task created successfully!');
        fetchTasks();
      }
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      const response = await taskService.updateTask(selectedTask._id || selectedTask.id, taskData);
      if (response.success) {
        toast.success('Task updated successfully!');
        fetchTasks();
        setSelectedTask(null);
        setIsEditingTask(false);
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();

    const days = [];

    // Previous month's days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        fullDate: new Date(year, month - 1, prevMonthDays - i)
      });
    }

    // Current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        fullDate: date
      });
    }

    // Next month's days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
        fullDate: new Date(year, month + 1, day)
      });
    }

    return days;
  }, [currentDate]);

  // Get tasks by date
  const tasksByDate = useMemo(() => {
    const filtered = tasks.filter(task =>
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.client?.name && task.client.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return filtered.reduce((acc, task) => {
      const dateKey = new Date(task.dueDate).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(task);
      return acc;
    }, {});
  }, [tasks, searchQuery]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    setSelectedDate(null);
    setSelectedTask(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
    setSelectedTask(null);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-blue-500',
      low: 'bg-gray-400'
    };
    return colors[priority] || colors.low;
  };

  const getPriorityDotColor = (priority) => {
    const colors = {
      urgent: 'bg-red-500 ring-red-100',
      high: 'bg-orange-500 ring-orange-100',
      medium: 'bg-blue-500 ring-blue-100',
      low: 'bg-gray-400 ring-gray-100'
    };
    return colors[priority] || colors.low;
  };

  const handleTaskClick = (task, e) => {
    e.stopPropagation();
    setSelectedTask(task);
    setSelectedDate(new Date(task.dueDate));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedTask(null);
    // Show popup on mobile (less than 1024px)
    if (window.innerWidth < 1024) {
      setShowMobilePopup(true);
    }
  };

  const closeMobilePopup = () => {
    setShowMobilePopup(false);
    setSelectedDate(null);
    setSelectedTask(null);
  };

  const handleQuickPriorityChange = async (taskId, newPriority) => {
    try {
      const response = await taskService.updateTask(taskId, { priority: newPriority });
      if (response.success) {
        setTasks(tasks.map(task =>
          (task._id || task.id) === taskId ? { ...task, priority: newPriority } : task
        ));
        if (selectedTask && (selectedTask._id || selectedTask.id) === taskId) {
          setSelectedTask({ ...selectedTask, priority: newPriority });
        }
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

  const selectedDateTasks = selectedDate ? tasksByDate[selectedDate.toDateString()] || [] : [];

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6 flex-shrink-0">
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

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Calendar Grid - Left Side */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Calendar Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                >
                  Today
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-100"></div>
                <span className="text-gray-600 font-medium">Urgent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-100"></div>
                <span className="text-gray-600 font-medium">High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-100"></div>
                <span className="text-gray-600 font-medium">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-400 ring-2 ring-gray-100"></div>
                <span className="text-gray-600 font-medium">Low</span>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              {dayNames.map((day) => (
                <div key={day} className="p-2 text-center border-r border-gray-200 last:border-r-0">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarData.map((day, index) => {
                const dayTasks = tasksByDate[day.fullDate.toDateString()] || [];
                const isSelected = selectedDate?.toDateString() === day.fullDate.toDateString();

                // Get the highest priority task for background color
                const getHighestPriorityTask = () => {
                  if (dayTasks.length === 0) return null;
                  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                  return dayTasks.reduce((highest, task) => {
                    if (!highest) return task;
                    return priorityOrder[task.priority] < priorityOrder[highest.priority] ? task : highest;
                  }, null);
                };

                const highestPriorityTask = getHighestPriorityTask();

                const getBackgroundColor = () => {
                  if (!day.isCurrentMonth) return 'bg-gray-50/50';
                  if (isSelected) return 'bg-primary-100/50';
                  if (day.isToday) return 'bg-blue-50';
                  if (highestPriorityTask) {
                    const bgColors = {
                      urgent: 'bg-red-50',
                      high: 'bg-orange-50',
                      medium: 'bg-blue-50',
                      low: 'bg-gray-50'
                    };
                    return bgColors[highestPriorityTask.priority] || 'bg-white';
                  }
                  return 'bg-white';
                };

                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(day.fullDate)}
                    className={`
                      h-14 lg:h-20 p-1 lg:p-1.5 border-r border-b border-gray-200 cursor-pointer transition-all
                      ${getBackgroundColor()}
                      ${day.isToday ? 'ring-2 ring-blue-400 ring-inset' : ''}
                      ${isSelected ? 'ring-2 ring-primary-500 ring-inset' : ''}
                      hover:ring-2 hover:ring-gray-300 hover:ring-inset
                      last-of-type:border-r-0
                    `}
                  >
                    <div className={`
                      text-xs font-bold mb-1 flex items-center justify-center
                      ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                      ${day.isToday ? 'bg-blue-600 text-white rounded-full w-5 h-5 text-[10px]' : ''}
                    `}>
                      {day.date}
                    </div>

                    {dayTasks.length > 0 && (
                      <>
                        {/* Mobile: Show colored dots */}
                        <div className="lg:hidden flex flex-wrap justify-center gap-0.5 mt-1">
                          {dayTasks.slice(0, 3).map((task) => (
                            <div
                              key={task._id || task.id}
                              className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}
                            />
                          ))}
                          {dayTasks.length > 3 && (
                            <span className="text-[8px] text-gray-500 font-bold">+{dayTasks.length - 3}</span>
                          )}
                        </div>

                        {/* Desktop: Show task titles */}
                        <div className="hidden lg:block space-y-0.5">
                          {dayTasks.slice(0, 2).map((task) => (
                            <div
                              key={task._id || task.id}
                              onClick={(e) => handleTaskClick(task, e)}
                              className="group px-1.5 py-0.5 rounded hover:bg-white/90 hover:shadow-sm transition-all cursor-pointer"
                            >
                              <span className="text-[10px] text-gray-900 font-semibold line-clamp-1 group-hover:text-primary-700 leading-tight block">
                                {task.title}
                              </span>
                            </div>
                          ))}
                          {dayTasks.length > 2 && (
                            <div className="text-[10px] text-primary-700 font-bold text-center mt-0.5">
                              +{dayTasks.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task Details Panel - Right Side (hidden on mobile) */}
        <div className="hidden lg:flex w-96 bg-white border-l border-gray-200 flex-col flex-shrink-0 overflow-hidden">
          {selectedTask ? (
            // Single Task View
            <>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Task Details</h3>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Priority & Status */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative dropdown-container">
                    <button
                      onClick={(e) => {
                        const taskId = selectedTask._id || selectedTask.id;
                        const position = getDropdownPosition(e.currentTarget);
                        setActiveDropdown(
                          activeDropdown?.taskId === taskId && activeDropdown?.type === 'priority'
                            ? null
                            : { taskId, type: 'priority', position }
                        );
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${taskPriorities[selectedTask.priority].bgColor} ${taskPriorities[selectedTask.priority].color} hover:opacity-80 transition-opacity`}
                    >
                      {selectedTask.priority === 'urgent' && <AlertCircle className="h-3.5 w-3.5" />}
                      {selectedTask.priority === 'high' && <TrendingUp className="h-3.5 w-3.5" />}
                      <span className="uppercase tracking-wide">{taskPriorities[selectedTask.priority].label}</span>
                    </button>

                    {activeDropdown?.taskId === (selectedTask._id || selectedTask.id) && activeDropdown?.type === 'priority' && (
                      <div
                        className={`absolute z-20 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 ${
                          activeDropdown.position === 'top' ? 'bottom-full mb-1' : 'mt-1'
                        }`}
                      >
                        {Object.entries(taskPriorities).map(([key, priority]) => (
                          <button
                            key={key}
                            onClick={() => handleQuickPriorityChange(selectedTask._id || selectedTask.id, key)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center space-x-2 ${
                              selectedTask.priority === key ? 'bg-gray-50' : ''
                            }`}
                          >
                            {key === 'urgent' && <AlertCircle className="h-3 w-3 text-error-500" />}
                            {key === 'high' && <TrendingUp className="h-3 w-3 text-warning-500" />}
                            {key === 'medium' && <Clock className="h-3 w-3 text-gray-400" />}
                            {key === 'low' && <Clock className="h-3 w-3 text-gray-400" />}
                            <span className={priority.color}>{priority.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${taskStatuses[selectedTask.status].color}`}>
                    {taskStatuses[selectedTask.status].label}
                  </span>
                </div>

                {/* Task Title */}
                <h4 className="text-xl font-bold text-gray-900 mb-3">{selectedTask.title}</h4>

                {/* Task Description */}
                <div className="mb-6">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Description</label>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">{selectedTask.description}</p>
                </div>

                {/* Due Date */}
                <div className="mb-6">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Due Date</label>
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedTask.dueDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Client */}
                {selectedTask.client?.name && (
                  <div className="mb-6">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Client</label>
                    <div className="flex items-center gap-2 bg-primary-50 px-3 py-2 rounded-lg border border-primary-100">
                      <User className="h-4 w-4 text-primary-600" />
                      <span className="text-sm font-semibold text-primary-700">{selectedTask.client.name}</span>
                    </div>
                  </div>
                )}

                {/* Assignees */}
                {selectedTask.assignees?.length > 0 && (
                  <div className="mb-6">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Assignees</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.assignees.map((assignee, index) => (
                        <div
                          key={assignee._id || assignee.id || index}
                          className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-xs flex items-center justify-center font-bold">
                            {assignee.name?.substring(0, 2).toUpperCase() || assignee.avatar}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{assignee.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedTask.tags?.length > 0 && (
                  <div className="mb-6">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTask.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments & Comments */}
                <div className="flex items-center gap-4 mb-6">
                  {(selectedTask.attachments?.length > 0 || selectedTask.attachments > 0) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Paperclip className="h-4 w-4" />
                      <span className="text-sm font-medium">{selectedTask.attachments?.length || selectedTask.attachments} attachments</span>
                    </div>
                  )}
                  {(selectedTask.comments?.length > 0 || selectedTask.comments > 0) && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{selectedTask.comments?.length || selectedTask.comments} comments</span>
                    </div>
                  )}
                </div>

                {/* Time Tracking */}
                {selectedTask.estimatedTime && (
                  <div className="mb-6">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Time Tracking</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Tracked: <span className="font-bold text-gray-900">{selectedTask.timeTracked || '0h'}</span></span>
                        <span className="text-gray-600">Estimated: <span className="font-bold text-gray-900">{selectedTask.estimatedTime}</span></span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, ((parseFloat(selectedTask.timeTracked) || 0) / (parseFloat(selectedTask.estimatedTime) || 1)) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsEditingTask(true)}
                  className="w-full bg-primary-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors font-semibold"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Task
                </button>
              </div>
            </>
          ) : selectedDate ? (
            // Date View with all tasks
            <>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedDateTasks.length} tasks</p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {selectedDateTasks.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateTasks.map((task) => {
                      const taskId = task._id || task.id;
                      return (
                      <div
                        key={taskId}
                        onClick={() => setSelectedTask(task)}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-lg hover:border-primary-200 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="relative dropdown-container">
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
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${taskPriorities[task.priority].bgColor} ${taskPriorities[task.priority].color} hover:opacity-80 transition-opacity`}
                            >
                              {task.priority === 'urgent' && <AlertCircle className="h-3 w-3" />}
                              {task.priority === 'high' && <TrendingUp className="h-3 w-3" />}
                              <span>{taskPriorities[task.priority].label}</span>
                            </button>

                            {activeDropdown?.taskId === taskId && activeDropdown?.type === 'priority' && (
                              <div
                                className={`absolute z-20 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 ${
                                  activeDropdown.position === 'top' ? 'bottom-full mb-1' : 'mt-1'
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
                                    {key === 'urgent' && <AlertCircle className="h-3 w-3 text-error-500" />}
                                    {key === 'high' && <TrendingUp className="h-3 w-3 text-warning-500" />}
                                    {key === 'medium' && <Clock className="h-3 w-3 text-gray-400" />}
                                    {key === 'low' && <Clock className="h-3 w-3 text-gray-400" />}
                                    <span className={priority.color}>{priority.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${taskStatuses[task.status].color}`}>
                            {taskStatuses[task.status].label}
                          </span>
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors">{task.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>

                        {task.client?.name && (
                          <div className="flex items-center gap-1.5 text-xs text-primary-700 bg-primary-50 px-2 py-1 rounded-md mt-3 w-fit">
                            <User className="h-3 w-3" />
                            {task.client.name}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No tasks on this date</p>
                    <button
                      onClick={() => setIsTaskFormOpen(true)}
                      className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add a task
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Empty State
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium mb-2">Select a date or task</p>
                <p className="text-gray-400 text-sm">Click on a date to view all tasks or click on a task to see details</p>
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

      {/* Edit Task Modal */}
      {isEditingTask && selectedTask && (
        <TaskForm
          isOpen={isEditingTask}
          onClose={() => setIsEditingTask(false)}
          onSubmit={handleUpdateTask}
          initialData={selectedTask}
        />
      )}

      {/* Mobile Popup Modal */}
      {showMobilePopup && selectedDate && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeMobilePopup}
          />

          {/* Popup Content */}
          <div className="relative bg-white w-full max-h-[70vh] rounded-t-2xl overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-sm text-gray-600">
                  {(tasksByDate[selectedDate.toDateString()] || []).length} tasks
                </p>
              </div>
              <button
                onClick={closeMobilePopup}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Tasks List */}
            <div className="overflow-y-auto p-4 max-h-[calc(70vh-80px)]">
              {(tasksByDate[selectedDate.toDateString()] || []).length > 0 ? (
                <div className="space-y-3">
                  {(tasksByDate[selectedDate.toDateString()] || []).map((task) => (
                    <div
                      key={task._id || task.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${taskPriorities[task.priority].bgColor} ${taskPriorities[task.priority].color}`}>
                          {taskPriorities[task.priority].label}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${taskStatuses[task.status].color}`}>
                          {taskStatuses[task.status].label}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                      {task.client?.name && (
                        <div className="flex items-center gap-1.5 text-xs text-primary-700 mt-2">
                          <User className="h-3 w-3" />
                          {task.client.name}
                        </div>
                      )}
                      {task.assignees?.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex -space-x-1">
                            {task.assignees.slice(0, 3).map((assignee, idx) => (
                              <div
                                key={assignee._id || assignee.id || idx}
                                className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-xs flex items-center justify-center font-bold border-2 border-white"
                              >
                                {assignee.name?.substring(0, 1).toUpperCase()}
                              </div>
                            ))}
                          </div>
                          {task.assignees.length > 3 && (
                            <span className="text-xs text-gray-500">+{task.assignees.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No tasks on this date</p>
                  <button
                    onClick={() => {
                      closeMobilePopup();
                      setIsTaskFormOpen(true);
                    }}
                    className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    + Add a task
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCalendar;
