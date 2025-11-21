import React from 'react';
import { Bell, Clock, ChevronRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const RemindersCard = ({ reminders = [], dateRange = 'today' }) => {
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  const sortedReminders = [...reminders].sort((a, b) => {
    const timeA = a.reminderTime || '00:00';
    const timeB = b.reminderTime || '00:00';
    return timeA.localeCompare(timeB);
  });

  const getRepeatLabel = (frequency) => {
    const labels = {
      none: 'Once',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      custom: 'Custom'
    };
    return labels[frequency] || 'Once';
  };

  const getTitle = () => {
    if (dateRange === 'upcoming') {
      return 'Upcoming Reminders';
    }
    return "Today's Reminders";
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bell className="h-6 w-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
        </div>
        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
          {reminders.length}
        </span>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reminders found</p>
          <p className="text-sm text-gray-400 mt-1">You can relax! 🎯</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {sortedReminders.map((reminder) => (
            <div
              key={reminder._id}
              className="border border-purple-200 rounded-lg p-3 hover:border-purple-300 hover:shadow-sm transition-all bg-purple-50/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">
                    {reminder.title}
                  </h4>
                  
                  <div className="flex items-center space-x-3 text-xs text-gray-600">
                    {dateRange === 'upcoming' && (
                      <span className="flex items-center text-blue-600 font-medium">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(reminder.reminderDate)}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(reminder.reminderTime)}
                    </span>
                    
                    {reminder.repeatFrequency && reminder.repeatFrequency !== 'none' && (
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {getRepeatLabel(reminder.repeatFrequency)}
                      </span>
                    )}
                  </div>

                  {reminder.alertTimes && reminder.alertTimes.length > 0 && (
                    <div className="mt-1">
                      <span className="text-xs text-purple-700 font-medium">
                        {reminder.alertTimes.length} alert{reminder.alertTimes.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end ml-2">
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {dateRange === 'upcoming' ? 'Upcoming' : 'Active'}
                  </span>
                </div>
              </div>

              {reminder.attachments && reminder.attachments.length > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-200">
                  <p className="text-xs text-gray-500">
                    📎 {reminder.attachments.length} attachment{reminder.attachments.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Link
        to="/inbox"
        className="mt-4 w-full bg-purple-50 text-purple-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-purple-100 transition-colors"
      >
        <span>View All Reminders</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

export default RemindersCard;

