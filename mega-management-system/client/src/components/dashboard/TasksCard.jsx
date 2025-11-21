import React from 'react';
import { CheckSquare, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const TasksCard = ({ tasks = [] }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'text-red-600 bg-red-100',
      high: 'text-orange-600 bg-orange-100',
      medium: 'text-yellow-600 bg-yellow-100',
      low: 'text-green-600 bg-green-100'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      todo: 'text-gray-600 bg-gray-100',
      in_progress: 'text-blue-600 bg-blue-100',
      review: 'text-purple-600 bg-purple-100',
      scheduled: 'text-indigo-600 bg-indigo-100',
      completed: 'text-green-600 bg-green-100'
    };
    return colors[status] || colors.todo;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays <= 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CheckSquare className="h-6 w-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
        </div>
        <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tasks due today</p>
          <p className="text-sm text-gray-400 mt-1">You're all caught up! 🎉</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="border border-gray-200 rounded-lg p-3 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {task.description}
                    </p>
                  )}
                  {task.client && (
                    <p className="text-xs text-primary-600 mt-1">
                      {task.client.companyName}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end space-y-1 ml-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        to="/workspace/table"
        className="mt-4 w-full bg-primary-50 text-primary-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-primary-100 transition-colors"
      >
        <span>View All Tasks</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

export default TasksCard;

