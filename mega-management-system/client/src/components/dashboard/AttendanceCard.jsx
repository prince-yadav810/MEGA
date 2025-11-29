import React, { useState } from 'react';
import { Clock, LogIn, LogOut, Users, UserCheck, UserX, AlertCircle, Calendar, Wallet } from 'lucide-react';
import attendanceService from '../../services/attendanceService';

const AttendanceCard = ({ userRole, attendanceData, onCheckIn, onCheckOut }) => {
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    try {
      setLoading(true);

      // Use the service's helper function to get location
      const location = await attendanceService.getCurrentLocation();

      // Call check-in with correct parameters (latitude, longitude, notes)
      await attendanceService.checkIn(
        location.latitude,
        location.longitude,
        '' // notes - empty for dashboard quick check-in
      );

      if (onCheckIn) onCheckIn();
      setLoading(false);
    } catch (error) {
      console.error('Check-in failed:', error);
      alert(error.message || 'Check-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);

      // Use the service's helper function to get location
      const location = await attendanceService.getCurrentLocation();

      // Call check-out with correct parameters (latitude, longitude, notes)
      await attendanceService.checkOut(
        location.latitude,
        location.longitude,
        '' // notes - empty for dashboard quick check-out
      );

      if (onCheckOut) onCheckOut();
      setLoading(false);
    } catch (error) {
      console.error('Check-out failed:', error);
      alert(error.message || 'Check-out failed. Please try again.');
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Employee View
  if (userRole === 'employee') {
    const isCheckedIn = attendanceData?.checkedIn;
    const hasCheckedOut = attendanceData?.checkOutTime;
    const { advanceTaken = 0, daysPresent = 0, daysAbsent = 0 } = attendanceData || {};

    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-6 w-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">My Attendance</h3>
          </div>
          {isCheckedIn && !hasCheckedOut && (
            <span className="flex items-center space-x-1 text-green-600 text-sm font-medium">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              <span>Active</span>
            </span>
          )}
        </div>

        {!isCheckedIn ? (
          <div className="text-center py-6 mb-4 border-b border-gray-100">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">You haven't checked in today</p>
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <LogIn className="h-5 w-5" />
              <span>{loading ? 'Checking in...' : 'Check In'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-6 border-b border-gray-100 pb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Check In</p>
                <p className="text-xl font-bold text-green-700">{formatTime(attendanceData.checkInTime)}</p>
              </div>
              {hasCheckedOut ? (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Check Out</p>
                  <p className="text-xl font-bold text-blue-700">{formatTime(attendanceData.checkOutTime)}</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Check Out</p>
                  <p className="text-xl font-bold text-gray-400">--:--</p>
                </div>
              )}
            </div>

            <div className="bg-primary-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Work Duration</p>
              <p className="text-2xl font-bold text-primary-700">
                {formatDuration(attendanceData.workDuration)}
              </p>
            </div>

            {!hasCheckedOut && (
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <LogOut className="h-5 w-5" />
                <span>{loading ? 'Checking out...' : 'Check Out'}</span>
              </button>
            )}
          </div>
        )}
        
        {/* Monthly Stats */}
        <div className="mt-auto">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-500" />
            Monthly Stats
          </h4>
          <div className="grid grid-cols-3 gap-2">
             <div className="bg-gray-50 p-2 rounded-lg text-center">
               <p className="text-xs text-gray-500 mb-1">Present</p>
               <p className="text-lg font-bold text-green-600">{daysPresent}</p>
             </div>
             <div className="bg-gray-50 p-2 rounded-lg text-center">
               <p className="text-xs text-gray-500 mb-1">Absent</p>
               <p className="text-lg font-bold text-red-600">{daysAbsent}</p>
             </div>
             <div className="bg-gray-50 p-2 rounded-lg text-center">
               <p className="text-xs text-gray-500 mb-1">Advance</p>
               <p className="text-sm font-bold text-orange-600">{formatCurrency(advanceTaken)}</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin/Manager View
  const summary = attendanceData?.summary || {};
  const presentList = attendanceData?.presentList || [];
  const absentList = attendanceData?.absentList || [];

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-full flex flex-col">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="h-6 w-6 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900">Team Attendance</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <UserCheck className="h-4 w-4 text-green-600" />
            <p className="text-sm text-gray-600">Present</p>
          </div>
          <p className="text-2xl font-bold text-green-700">{summary.present || 0}</p>
        </div>

        <div className="bg-red-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <UserX className="h-4 w-4 text-red-600" />
            <p className="text-sm text-gray-600">Absent</p>
          </div>
          <p className="text-2xl font-bold text-red-700">{summary.absent || 0}</p>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-gray-600">Late</p>
          </div>
          <p className="text-2xl font-bold text-yellow-700">{summary.late || 0}</p>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            <Users className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-gray-600">Total</p>
          </div>
          <p className="text-2xl font-bold text-blue-700">{summary.total || 0}</p>
        </div>
      </div>

      <div className="mt-4 border-t pt-4 space-y-3">
        {/* Present Employees */}
        {presentList.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
              <UserCheck className="h-4 w-4 mr-1" />
              Who is Present ({presentList.length})
            </h4>
            <div className="bg-green-50 rounded-lg p-2 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {presentList.map((attendance, index) => (
                  <div key={index} className="flex items-center justify-between text-sm py-1 px-2 hover:bg-green-100 rounded">
                    <span className="text-gray-800 font-medium">{attendance.user?.name}</span>
                    <span className="text-green-600 text-xs">{formatTime(attendance.checkInTime)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Absent Employees */}
        {absentList.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center">
              <UserX className="h-4 w-4 mr-1" />
              Who is Absent ({absentList.length})
            </h4>
            <div className="bg-red-50 rounded-lg p-2 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {absentList.map((user, index) => (
                  <div key={index} className="flex items-center justify-between text-sm py-1 px-2 hover:bg-red-100 rounded">
                    <span className="text-gray-800 font-medium">{user.name}</span>
                    <span className="text-red-600 text-xs">{user.department || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceCard;
