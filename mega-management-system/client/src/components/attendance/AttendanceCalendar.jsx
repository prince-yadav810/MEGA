import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, CheckCircle, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import moment from 'moment';
import attendanceService from '../../services/attendanceService';
import toast from 'react-hot-toast';

const AttendanceCalendar = ({ userId }) => {
  const [currentDate, setCurrentDate] = useState(moment());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchAttendanceData();
    }
  }, [userId, currentDate]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const startDate = currentDate.clone().startOf('month').format('YYYY-MM-DD');
      const endDate = currentDate.clone().endOf('month').format('YYYY-MM-DD');

      // Fetch attendance records and stats in parallel
      const [recordsResponse, statsResponse] = await Promise.all([
        attendanceService.getUserAttendance(userId, startDate, endDate, 100),
        attendanceService.getUserAttendanceStats(
          userId,
          currentDate.month() + 1,
          currentDate.year()
        )
      ]);

      setAttendanceRecords(recordsResponse.data || []);
      setStats(statsResponse.data || null);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(currentDate.clone().subtract(1, 'month'));
    setSelectedDate(null);
    setSelectedAttendance(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.clone().add(1, 'month'));
    setSelectedDate(null);
    setSelectedAttendance(null);
  };

  const handleDateClick = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    setSelectedDate(dateStr);

    // Find attendance record for this date
    const attendance = attendanceRecords.find(record => {
      return moment(record.date).format('YYYY-MM-DD') === dateStr;
    });

    setSelectedAttendance(attendance || null);
  };

  const renderCalendar = () => {
    const startOfMonth = currentDate.clone().startOf('month');
    const endOfMonth = currentDate.clone().endOf('month');
    const startDate = startOfMonth.clone().startOf('week');
    const endDate = endOfMonth.clone().endOf('week');

    const calendar = [];
    const day = startDate.clone();

    while (day.isBefore(endDate, 'day')) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const currentDay = day.clone();
        const isCurrentMonth = currentDay.month() === currentDate.month();
        const isToday = currentDay.isSame(moment(), 'day');
        const dateStr = currentDay.format('YYYY-MM-DD');
        const isSelected = selectedDate === dateStr;

        // Find attendance for this day
        const attendance = attendanceRecords.find(record => {
          return moment(record.date).format('YYYY-MM-DD') === dateStr;
        });

        const hasAttendance = !!attendance;
        const isWeekend = currentDay.day() === 0 || currentDay.day() === 6;

        week.push(
          <div
            key={currentDay.format('YYYY-MM-DD')}
            onClick={() => isCurrentMonth && handleDateClick(currentDay)}
            className={`
              min-h-[60px] p-2 border border-gray-200 cursor-pointer transition-all
              ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-blue-50'}
              ${isToday ? 'ring-2 ring-blue-500' : ''}
              ${isSelected ? 'bg-blue-100 border-blue-500' : ''}
              ${isWeekend && isCurrentMonth ? 'bg-gray-50' : ''}
            `}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                {currentDay.date()}
              </span>
              {hasAttendance && (
                <div className={`w-2 h-2 rounded-full ${
                  attendance.checkOutTime ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
              )}
            </div>
            {hasAttendance && isCurrentMonth && (
              <div className="mt-1 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{moment(attendance.checkInTime).format('HH:mm')}</span>
                </div>
              </div>
            )}
          </div>
        );
        day.add(1, 'day');
      }
      calendar.push(
        <div key={day.format('YYYY-MM-DD')} className="grid grid-cols-7">
          {week}
        </div>
      );
    }

    return calendar;
  };

  const formatTime = (date) => {
    return moment(date).format('hh:mm A');
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Monthly Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-gray-600">Total Days</p>
              <p className="text-lg font-bold text-gray-900">{stats.stats?.totalDays || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Present</p>
              <p className="text-lg font-bold text-green-600">{stats.stats?.presentDays || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Attendance Rate</p>
              <p className="text-lg font-bold text-blue-600">{stats.stats?.attendanceRate || '0%'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Avg Work Hours</p>
              <p className="text-lg font-bold text-indigo-600">{stats.stats?.avgWorkHours || '0h'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {currentDate.format('MMMM YYYY')}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-xs font-semibold text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading calendar...
          </div>
        ) : (
          renderCalendar()
        )}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            {moment(selectedDate).format('dddd, MMMM DD, YYYY')}
          </h3>

          {selectedAttendance ? (
            <div className="space-y-4">
              {/* Check-in Details */}
              <div className="border-l-4 border-green-500 bg-green-50 p-3 rounded">
                <div className="flex items-center mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <span className="font-semibold text-green-900">Check-in</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Time:</strong> {formatTime(selectedAttendance.checkInTime)}
                </p>
                <div className="flex items-start text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Location:</p>
                    <p>{selectedAttendance.location?.address || 'Location unavailable'}</p>
                    {selectedAttendance.location?.city && (
                      <p className="text-xs mt-1">
                        {selectedAttendance.location.city}
                        {selectedAttendance.location.state && `, ${selectedAttendance.location.state}`}
                        {selectedAttendance.location.country && `, ${selectedAttendance.location.country}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Check-out Details */}
              {selectedAttendance.checkOutTime ? (
                <div className="border-l-4 border-red-500 bg-red-50 p-3 rounded">
                  <div className="flex items-center mb-2">
                    <XCircle className="w-4 h-4 text-red-600 mr-2" />
                    <span className="font-semibold text-red-900">Check-out</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Time:</strong> {formatTime(selectedAttendance.checkOutTime)}
                  </p>
                  <div className="flex items-start text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Location:</p>
                      <p>{selectedAttendance.checkOutLocation?.address || 'Location unavailable'}</p>
                      {selectedAttendance.checkOutLocation?.city && (
                        <p className="text-xs mt-1">
                          {selectedAttendance.checkOutLocation.city}
                          {selectedAttendance.checkOutLocation.state && `, ${selectedAttendance.checkOutLocation.state}`}
                          {selectedAttendance.checkOutLocation.country && `, ${selectedAttendance.checkOutLocation.country}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    <strong>Work Duration:</strong> {formatDuration(selectedAttendance.workDuration)}
                  </p>
                </div>
              ) : (
                <div className="border-l-4 border-yellow-500 bg-yellow-50 p-3 rounded">
                  <p className="text-yellow-900 font-medium">No check-out recorded</p>
                </div>
              )}

              {/* Notes */}
              {selectedAttendance.notes && (
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                  <p className="text-sm text-gray-600">{selectedAttendance.notes}</p>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedAttendance.status === 'present' ? 'bg-green-100 text-green-800' :
                  selectedAttendance.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                  selectedAttendance.status === 'half-day' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedAttendance.status.toUpperCase()}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p>No attendance record for this date</p>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-2">Legend:</p>
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Checked out</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Checked in only</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-blue-500 rounded-full" />
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
