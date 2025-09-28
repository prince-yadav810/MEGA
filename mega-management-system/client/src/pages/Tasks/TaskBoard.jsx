import React, { useState, useMemo } from 'react';
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
  User
} from 'lucide-react';
import { sampleTasks, taskStatuses, taskPriorities } from '../../utils/sampleData';

const TaskBoard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);

  // Kanban columns configuration
  const columns = [
    { id: 'todo', title: 'To Do', status: 'todo', color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress', color: 'bg-primary-100' },
    { id: 'review', title: 'Review', status: 'review', color: 'bg-yellow-100' },
    { id: 'scheduled', title: 'Scheduled', status: 'scheduled', color: 'bg-purple-100' },
    { id: 'completed', title: 'Completed', status: 'completed', color: 'bg-success-100' }
  ];

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const filtered = sampleTasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.client && task.client.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return columns.reduce((acc, column) => {
      acc[column.status] = filtered.filter(task => task.status === column.status);
      return acc;
    }, {});
  }, [searchQuery]);

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
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    
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
    e.preventDefault();
    setDraggedOverColumn(null);
  };

  const handleDrop = (e, columnStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== columnStatus) {
      // Here you would typically update the task status in your state management
      console.log(`Moving task ${draggedTask.id} from ${draggedTask.status} to ${columnStatus}`);
    }
    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  const TaskCard = ({ task }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, task)}
      className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-move group"
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getPriorityIcon(task.priority)}
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${taskPriorities[task.priority].bgColor} ${taskPriorities[task.priority].color}`}>
            {taskPriorities[task.priority].label}
          </span>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Task Title & Description */}
      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{task.title}</h3>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

      {/* Client */}
      {task.client && (
        <div className="text-xs text-primary-600 mb-3 bg-primary-50 px-2 py-1 rounded inline-block">
          {task.client}
        </div>
      )}

      {/* Due Date */}
      <div className="flex items-center space-x-1 mb-3">
        <Calendar className="h-3 w-3 text-gray-400" />
        <span className={`text-xs ${getDueDateColor(task.dueDate, task.status)}`}>
          {formatDate(task.dueDate)}
        </span>
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="text-xs text-gray-500">+{task.tags.length - 2}</span>
          )}
        </div>
      )}

      {/* Task Footer */}
      <div className="flex items-center justify-between">
        {/* Assignees */}
        <div className="flex -space-x-1">
          {task.assignees.slice(0, 2).map((assignee) => (
            <div
              key={assignee.id}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-xs flex items-center justify-center font-medium border-2 border-white"
              title={assignee.name}
            >
              {assignee.avatar}
            </div>
          ))}
          {task.assignees.length > 2 && (
            <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center font-medium border-2 border-white">
              +{task.assignees.length - 2}
            </div>
          )}
        </div>

        {/* Attachments & Comments */}
        <div className="flex items-center space-x-2">
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

      {/* Progress Bar */}
      {task.timeTracked && task.estimatedTime && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{task.timeTracked}</span>
            <span>{task.estimatedTime}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-primary-500 h-1 rounded-full transition-all duration-300" 
              style={{ 
                width: `${Math.min(100, (parseFloat(task.timeTracked) / parseFloat(task.estimatedTime)) * 100)}%` 
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">Board View</h1>
            <p className="text-gray-600">Kanban-style task management</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors">
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
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

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-4 lg:p-6 min-w-max">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`
                min-w-80 max-w-80 bg-gray-100 rounded-lg p-4 transition-all duration-200
                ${draggedOverColumn === column.status ? 'ring-2 ring-primary-400 bg-primary-50' : ''}
              `}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${taskStatuses[column.status].dotColor}`}></div>
                  <h2 className="font-semibold text-gray-900">{column.title}</h2>
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                    {tasksByStatus[column.status]?.length || 0}
                  </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Tasks */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tasksByStatus[column.status]?.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                
                {(!tasksByStatus[column.status] || tasksByStatus[column.status].length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-sm">No tasks</div>
                    <button className="text-xs text-primary-600 hover:text-primary-700 mt-1">
                      + Add a task
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;