import React, { useState, useMemo } from 'react';
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
  MoreHorizontal
} from 'lucide-react';
import { sampleTasks, taskStatuses, taskPriorities } from '../../utils/sampleData';

const TaskCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('month'); // month, week, day

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and days in month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    // Get previous month's last days
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    
    // Generate calendar days
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
    
    // Next month's days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
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
    const filtered = sampleTasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.client && task.client.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return filtered.reduce((acc, task) => {
      const dateKey = new Date(task.dueDate).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(task);
      return acc;
    }, {});
  }, [searchQuery]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const getPriorityColor = (priority) => {
    if (priority === 'urgent') return 'border-l-error-500 bg-error-50';
    if (priority === 'high') return 'border-l-warning-500 bg-warning-50';
    if (priority === 'medium') return 'border-l-primary-500 bg-primary-50';
    return 'border-l-gray-400 bg-gray-50';
  };

  const TaskItem = ({ task, isCompact = false }) => (
    <div className={`
      text-xs p-1 mb-1 rounded border-l-2 cursor-pointer hover:shadow-sm transition-all duration-150
      ${getPriorityColor(task.priority)}
      ${isCompact ? 'truncate' : ''}
    `}>
      <div className="font-medium text-gray-900 truncate">{task.title}</div>
      {!isCompact && (
        <>
          <div className="text-gray-600 truncate">{task.description}</div>
          {task.client && (
            <div className="text-primary-600 font-medium mt-1">{task.client}</div>
          )}
          <div className="flex items-center space-x-2 mt-1">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs ${taskStatuses[task.status].color}`}>
              {taskStatuses[task.status].label}
            </span>
            <div className="flex -space-x-1">
              {task.assignees.slice(0, 2).map((assignee) => (
                <div
                  key={assignee.id}
                  className="w-4 h-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-xs flex items-center justify-center font-medium border border-white"
                  title={assignee.name}
                >
                  {assignee.avatar.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const selectedDateTasks = selectedDate ? tasksByDate[selectedDate.toDateString()] || [] : [];

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">Calendar View</h1>
            <p className="text-gray-600">Task timeline and schedule overview</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={goToToday}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Today
            </button>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors">
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mt-4">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 min-w-48 text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button 
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main Calendar */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-gray-50">
              {dayNames.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarData.map((day, index) => {
                const dayTasks = tasksByDate[day.fullDate.toDateString()] || [];
                const isSelected = selectedDate && selectedDate.toDateString() === day.fullDate.toDateString();
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-32 p-2 border-r border-b border-gray-200 last:border-r-0 cursor-pointer
                      hover:bg-gray-50 transition-colors
                      ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                      ${day.isToday ? 'bg-primary-50' : ''}
                      ${isSelected ? 'ring-2 ring-primary-400 bg-primary-50' : ''}
                    `}
                    onClick={() => setSelectedDate(day.fullDate)}
                  >
                    <div className={`
                      flex items-center justify-center w-6 h-6 text-sm font-medium mb-1
                      ${day.isToday ? 'bg-primary-600 text-white rounded-full' : ''}
                      ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                    `}>
                      {day.date}
                    </div>
                    
                    <div className="space-y-1 overflow-hidden">
                      {dayTasks.slice(0, 3).map((task) => (
                        <TaskItem key={task.id} task={task} isCompact={true} />
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-500 font-medium">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task Details Sidebar */}
        {selectedDate && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                {selectedDate.toLocaleDateString('en-IN', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              {selectedDateTasks.length > 0 ? (
                selectedDateTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No tasks scheduled for this day</p>
                  <button className="text-primary-600 hover:text-primary-700 text-sm mt-2">
                    + Add a task
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCalendar;