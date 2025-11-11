import React from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Target
} from 'lucide-react';

const AttendanceSummary = ({ stats, period }) => {
  if (!stats || !period) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">Loading summary...</div>
      </div>
    );
  }

  // Calculate attendance percentage color
  const getAttendanceColor = (rate) => {
    if (rate >= 90) return 'text-green-600 bg-green-50';
    if (rate >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const statsCards = [
    {
      icon: Calendar,
      label: 'Working Days',
      value: period.workingDays,
      color: 'text-blue-600 bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: CheckCircle,
      label: 'Present Days',
      value: stats.presentDays,
      color: 'text-green-600 bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: XCircle,
      label: 'Absent Days',
      value: stats.absentDays,
      color: 'text-red-600 bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      icon: AlertCircle,
      label: 'Half Days',
      value: stats.halfDays,
      color: 'text-yellow-600 bg-yellow-50',
      iconColor: 'text-yellow-600'
    },
    {
      icon: Clock,
      label: 'Late Days',
      value: stats.lateDays,
      color: 'text-orange-600 bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      icon: Target,
      label: 'Attendance Rate',
      value: `${stats.attendanceRate?.toFixed(1)}%`,
      color: getAttendanceColor(stats.attendanceRate),
      iconColor: stats.attendanceRate >= 90 ? 'text-green-600' :
                 stats.attendanceRate >= 75 ? 'text-yellow-600' : 'text-red-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Attendance Summary
        </h3>
        <p className="text-sm text-gray-500">
          {period.monthName} {period.year}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color.split(' ')[0]}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color.split(' ')[1]}`}>
                  <IconComponent className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Work Hours Section */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Work Hours</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Total Hours</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">
              {stats.totalWorkHours?.toFixed(1)}h
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Avg. Hours/Day</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {stats.avgWorkHours?.toFixed(1)}h
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Attendance</span>
          <span className={`text-sm font-bold ${
            stats.attendanceRate >= 90 ? 'text-green-600' :
            stats.attendanceRate >= 75 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {stats.attendanceRate?.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              stats.attendanceRate >= 90 ? 'bg-green-500' :
              stats.attendanceRate >= 75 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${Math.min(stats.attendanceRate, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="mt-6">
        {stats.attendanceRate >= 90 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-900">Excellent Attendance!</p>
                <p className="text-sm text-green-700 mt-1">
                  Keep up the great work. Your attendance rate is outstanding.
                </p>
              </div>
            </div>
          </div>
        ) : stats.attendanceRate >= 75 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-900">Good Attendance</p>
                <p className="text-sm text-yellow-700 mt-1">
                  You're doing well. Try to maintain consistent attendance for better performance.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Needs Improvement</p>
                <p className="text-sm text-red-700 mt-1">
                  Your attendance rate is below expectations. Please try to improve your regularity.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceSummary;
