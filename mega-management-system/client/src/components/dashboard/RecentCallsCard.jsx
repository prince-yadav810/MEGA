import React from 'react';
import { PhoneCall, CheckCircle, XCircle, Clock, Phone } from 'lucide-react';

const RecentCallsCard = ({ recentCalls = [], dateRange = 'today' }) => {
  const getOutcomeIcon = (outcome) => {
    switch (outcome) {
      case 'Fruitful':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Not Interested':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'No Answer':
        return <Phone className="h-4 w-4 text-gray-600" />;
      case 'Busy':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Callback Requested':
        return <PhoneCall className="h-4 w-4 text-blue-600" />;
      case 'Need to Visit':
        return <PhoneCall className="h-4 w-4 text-purple-600" />;
      default:
        return <PhoneCall className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOutcomeColor = (outcome) => {
    const colors = {
      'Fruitful': 'bg-green-50 border-green-200 text-green-700',
      'Not Interested': 'bg-red-50 border-red-200 text-red-700',
      'No Answer': 'bg-gray-50 border-gray-200 text-gray-700',
      'Busy': 'bg-yellow-50 border-yellow-200 text-yellow-700',
      'Callback Requested': 'bg-blue-50 border-blue-200 text-blue-700',
      'Need to Visit': 'bg-purple-50 border-purple-200 text-purple-700'
    };
    return colors[outcome] || 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getTitle = () => {
    if (dateRange === 'upcoming') {
      return 'Upcoming Calls';
    }
    return 'Recent Calls';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <PhoneCall className="h-6 w-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          dateRange === 'upcoming' 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {recentCalls.length} {dateRange === 'upcoming' ? 'scheduled' : 'today'}
        </span>
      </div>

      {recentCalls.length === 0 ? (
        <div className="text-center py-8">
          <PhoneCall className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No calls found</p>
          <p className="text-sm text-gray-400 mt-1">Start making calls and log them here!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {recentCalls.map((call) => {
            const isUpcoming = call.isUpcoming || dateRange === 'upcoming';
            
            return (
              <div
                key={call._id}
                className={`border rounded-lg p-3 ${isUpcoming ? 'bg-blue-50 border-blue-200' : getOutcomeColor(call.outcome)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {!isUpcoming && getOutcomeIcon(call.outcome)}
                      {isUpcoming && <PhoneCall className="h-4 w-4 text-blue-600" />}
                      <h4 className="font-medium text-gray-900 text-sm">
                        {call.client?.companyName || 'Unknown Client'}
                      </h4>
                    </div>
                    
                    <div className="space-y-1">
                      {!isUpcoming && (
                        <p className="text-xs font-medium">
                          Outcome: {call.outcome}
                        </p>
                      )}
                      
                      {isUpcoming && (
                        <p className="text-xs font-medium text-blue-700">
                          Scheduled Call
                        </p>
                      )}
                      
                      {call.notes && !isUpcoming && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {call.notes}
                        </p>
                      )}

                      {call.performedBy && (
                        <p className="text-xs text-gray-500">
                          {isUpcoming ? 'Assigned to: ' : 'By: '}{call.performedBy.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end ml-2">
                    {isUpcoming && (
                      <span className="text-xs text-blue-600 font-medium mb-1">
                        {formatDate(call.date)}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTime(call.date)}
                    </span>
                    {call.nextCallDate && !isUpcoming && (
                      <span className="text-xs text-blue-600 mt-1">
                        Follow-up scheduled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentCallsCard;

