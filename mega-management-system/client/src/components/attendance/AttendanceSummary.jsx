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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className={`bg-gradient-to-r ${getAttendanceGradient(stats.attendanceRate)} p-5 shadow-md`}>
          <div className="flex items-center justify-between">
            <div className="text-white">
              <p className="text-sm font-semibold opacity-90 mb-1">Attendance Rate</p>
              <p className="text-3xl font-bold tracking-tight">{stats.attendanceRate?.toFixed(1)}%</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-xl shadow-sm backdrop-blur-sm">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-gray-600 font-medium">Progress</span>
            <span className="font-semibold text-gray-900">
              {stats.presentDays} / {period.workingDays} days
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${getAttendanceGradient(stats.attendanceRate)} shadow-sm`}
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
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-lg ${stat.bgColor} shadow-sm`}>
                  <IconComponent className={`w-5 h-5 ${stat.textColor}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.textColor} mt-0.5`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Month Info */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 flex items-center justify-between border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="bg-white p-1.5 rounded-lg shadow-sm">
            <Calendar className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {period.monthName} {period.year}
          </span>
        </div>
        <span className="text-xs font-medium text-gray-600 bg-white px-2.5 py-1 rounded-full border border-gray-200">
          {period.workingDays} working days
        </span>
      </div>
    </div>
  );
};

export default AttendanceSummary;
