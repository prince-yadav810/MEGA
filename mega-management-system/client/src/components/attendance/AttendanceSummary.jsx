import React from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  Target,
  Zap
} from 'lucide-react';

const AttendanceSummary = ({ stats, period }) => {
  if (!stats || !period) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center text-gray-500">Loading summary...</div>
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
      total: period.workingDays,
      gradient: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      icon: XCircle,
      label: 'Absent',
      value: stats.absentDays,
      total: period.workingDays,
      gradient: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      icon: AlertCircle,
      label: 'Half Day',
      value: stats.halfDays,
      total: period.workingDays,
      gradient: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      icon: Clock,
      label: 'Late',
      value: stats.lateDays,
      total: period.workingDays,
      gradient: 'from-orange-500 to-amber-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Attendance Rate Card - Hero Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className={`bg-gradient-to-r ${getAttendanceGradient(stats.attendanceRate)} p-4`}>
          <div className="flex items-center justify-between">
            <div className="text-white">
              <p className="text-sm font-medium opacity-90">Attendance Rate</p>
              <p className="text-3xl font-bold">{stats.attendanceRate?.toFixed(1)}%</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">
              {stats.presentDays} / {period.workingDays} days
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${getAttendanceGradient(stats.attendanceRate)}`}
              style={{ width: `${Math.min(stats.attendanceRate, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {mainStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`w-5 h-5 ${stat.textColor}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Month Info */}
      <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            {period.monthName} {period.year}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {period.workingDays} working days
        </span>
      </div>
    </div>
  );
};

export default AttendanceSummary;
