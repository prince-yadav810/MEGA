import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import moment from 'moment';

const AttendanceCalendarGrid = ({ calendarData, period }) => {
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'absent':
        return <XCircle className="w-3 h-3 text-red-600" />;
      case 'half-day':
        return <AlertCircle className="w-3 h-3 text-yellow-600" />;
      case 'holiday':
        return <Clock className="w-3 h-3 text-gray-400" />;
      default:
        return null;
    }
  };

  // Get background color based on status
  const getStatusBg = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-50 border-green-200';
      case 'absent':
        return 'bg-red-50 border-red-200';
      case 'half-day':
        return 'bg-yellow-50 border-yellow-200';
      case 'holiday':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  // Group calendar data by weeks
  const getWeeks = () => {
    const weeks = [];
    let currentWeek = [];

    // Get first day of month
    const firstDay = moment(`${period.year}-${period.month}-01`);
    const startDayOfWeek = firstDay.day();

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    // Add all days of the month
    calendarData.forEach((day, index) => {
      currentWeek.push(day);

      if (currentWeek.length === 7 || index === calendarData.length - 1) {
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
    <div className="select-none w-full max-w-full">
      {/* Header */}
      <div className="text-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {period.monthName} {period.year}
        </h3>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mb-3 text-[10px]">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-2.5 h-2.5 text-green-600" />
          <span className="text-gray-600">Present</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="w-2.5 h-2.5 text-yellow-600" />
          <span className="text-gray-600">Half Day</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="w-2.5 h-2.5 text-red-600" />
          <span className="text-gray-600">Absent</span>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-[11px] font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1 w-full">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1 w-full">
            {week.map((day, dayIndex) => {
              if (!day) {
                return <div key={`empty-${dayIndex}`} className="h-[48px] w-full"></div>;
              }

              const isToday = moment().format('YYYY-MM-DD') === day.date;

              return (
                <div
                  key={day.date}
                  className={`
                    h-[48px] w-full rounded-md border flex flex-col items-center justify-center
                    transition-all duration-200 hover:shadow-sm cursor-pointer
                    ${getStatusBg(day.status)}
                    ${isToday ? 'ring-1 ring-blue-400 ring-offset-1' : ''}
                  `}
                >
                  <span className="text-[11px] font-medium text-gray-700 leading-none">{day.day}</span>
                  <div className="mt-0.5">
                    {getStatusIcon(day.status)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceCalendarGrid;
