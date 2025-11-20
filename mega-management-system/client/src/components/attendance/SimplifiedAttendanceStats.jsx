import React from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

const SimplifiedAttendanceStats = ({ stats, period }) => {
  if (!stats || !period) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-center text-gray-500 font-medium">Loading summary...</div>
      </div>
    );
  }

  // Calculate attendance percentage color
  const getAttendanceGradient = (rate) => {
    if (rate >= 90) return 'from-green-500 to-emerald-600';
    if (rate >= 75) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  const mainStats = [
    {
      icon: CheckCircle,
      label: 'Present',
      value: stats.presentDays,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      icon: XCircle,
      label: 'Absent',
      value: stats.absentDays,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200'
    },
    {
      icon: AlertCircle,
      label: 'Half Day',
      value: stats.halfDays,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200'
    },
    {
      icon: Clock,
      label: 'Late',
      value: stats.lateDays,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 backdrop-blur-sm h-full">
      {/* Attendance Rate - Simplified (just progress bar) */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Attendance Rate</span>
          <span className={`text-lg font-bold ${
            stats.attendanceRate >= 90 ? 'text-green-600' :
            stats.attendanceRate >= 75 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {stats.attendanceRate?.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner mb-2">
          <div
            className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${getAttendanceGradient(stats.attendanceRate)} shadow-sm`}
            style={{ width: `${Math.min(stats.attendanceRate, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 font-medium">
          Progress: <span className="font-semibold text-gray-900">{stats.presentDays} / {period.workingDays} days</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {mainStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className={`bg-white rounded-lg border ${stat.borderColor} p-3 hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${stat.bgColor} shadow-sm`}>
                  <IconComponent className={`w-4 h-4 ${stat.textColor}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                  <p className={`text-lg font-bold ${stat.textColor} mt-0.5`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimplifiedAttendanceStats;

