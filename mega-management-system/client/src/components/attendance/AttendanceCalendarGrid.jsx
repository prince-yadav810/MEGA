import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import moment from 'moment';

const AttendanceCalendarGrid = ({ calendarData, period, onDayClick }) => {
  const [selectedDay, setSelectedDay] = useState(null);

  // Get background color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 border-green-300 hover:bg-green-200';
      case 'absent':
        return 'bg-red-100 border-red-300 hover:bg-red-200';
      case 'half-day':
        return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200';
      case 'holiday':
        return 'bg-gray-100 border-gray-300';
      default:
        return 'bg-white border-gray-200 hover:bg-gray-50';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'half-day':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  // Handle day click
  const handleDayClick = (day) => {
    setSelectedDay(day);
    if (onDayClick) {
      onDayClick(day);
    }
  };

  // Format work duration
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Group calendar data by weeks
  const getWeeks = () => {
    const weeks = [];
    let currentWeek = [];

    // Get first day of month
    const firstDay = moment(`${period.year}-${period.month}-01`);
    const startDayOfWeek = firstDay.day(); // 0 = Sunday, 1 = Monday, etc.

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Add all days of the month
    calendarData.forEach((day, index) => {
      currentWeek.push(day);

      // If week is complete (7 days) or last day of month
      if (currentWeek.length === 7 || index === calendarData.length - 1) {
        // Fill remaining cells if needed
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return weeks;
  };

  const weeks = getWeeks();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {period.monthName} {period.year}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-200 border border-green-400"></div>
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-400"></div>
            <span>Half-day</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-200 border border-red-400"></div>
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-200 border border-gray-400"></div>
            <span>Holiday</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-1 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-3">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return <div key={`empty-${dayIndex}`} className="h-20"></div>;
                }

                const isSelected = selectedDay?.date === day.date;
                const isToday = moment().format('YYYY-MM-DD') === day.date;

                return (
                  <div
                    key={day.date}
                    onClick={() => handleDayClick(day)}
                    className={`
                      relative h-20 rounded border-r border-b p-1.5 cursor-pointer transition-all
                      ${getStatusColor(day.status)}
                      ${isSelected ? 'ring-2 ring-indigo-500' : ''}
                      ${isToday ? 'ring-2 ring-blue-400' : ''}
                    `}
                  >
                    {/* Day Number */}
                    <div className="flex items-start justify-between">
                      <span className={`text-sm font-semibold ${
                        day.status === 'holiday' ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {day.day}
                      </span>
                      {getStatusIcon(day.status)}
                    </div>

                    {/* Advance Payment Indicator */}
                    {day.advance && (
                      <div className="absolute top-1 right-1">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md" title={`Advance: ₹${day.advance.amount}`}>
                          <DollarSign className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Today Indicator */}
                    {isToday && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">
              {moment(selectedDay.date).format('MMMM D, YYYY')} ({selectedDay.dayOfWeek})
            </h4>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              selectedDay.status === 'present' ? 'bg-green-100 text-green-800' :
              selectedDay.status === 'absent' ? 'bg-red-100 text-red-800' :
              selectedDay.status === 'half-day' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {selectedDay.status.charAt(0).toUpperCase() + selectedDay.status.slice(1).replace('-', ' ')}
            </span>
          </div>

          {selectedDay.attendance && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Check-in:</span>
                <span>{moment(selectedDay.attendance.checkInTime).format('hh:mm A')}</span>
              </div>

              {selectedDay.attendance.checkOutTime && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Check-out:</span>
                  <span>{moment(selectedDay.attendance.checkOutTime).format('hh:mm A')}</span>
                </div>
              )}

              {selectedDay.attendance.workDuration && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">Duration:</span>
                  <span className="text-green-600 font-semibold">
                    {formatDuration(selectedDay.attendance.workDuration)}
                  </span>
                </div>
              )}

              {selectedDay.attendance.location && (
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="font-medium">Location:</span>
                    <span className="ml-1">{selectedDay.attendance.location}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedDay.advance && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">Advance Payment</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  ₹{selectedDay.advance.amount.toLocaleString('en-IN')}
                </span>
              </div>
              {selectedDay.advance.reason && (
                <p className="mt-1 text-sm text-gray-600">
                  Reason: {selectedDay.advance.reason}
                </p>
              )}
              <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                selectedDay.advance.status === 'approved' ? 'bg-green-100 text-green-800' :
                selectedDay.advance.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                selectedDay.advance.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedDay.advance.status.charAt(0).toUpperCase() + selectedDay.advance.status.slice(1)}
              </span>
            </div>
          )}

          {!selectedDay.attendance && selectedDay.status === 'absent' && !selectedDay.advance && (
            <div className="text-center text-gray-500 py-4">
              No attendance record for this day
            </div>
          )}

          {selectedDay.status === 'holiday' && (
            <div className="text-center text-gray-500 py-4">
              Holiday (Sunday)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendarGrid;
