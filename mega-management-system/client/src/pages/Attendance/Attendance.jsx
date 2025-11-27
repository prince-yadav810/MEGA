import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, CheckCircle, XCircle, AlertCircle, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import attendanceService from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';
import AttendanceCalendarGrid from '../../components/attendance/AttendanceCalendarGrid';
import SimplifiedAttendanceStats from '../../components/attendance/SimplifiedAttendanceStats';
import SalaryCalculator from '../../components/attendance/SalaryCalculator';
import CompactAdvancePayments from '../../components/attendance/CompactAdvancePayments';
import RecentAttendanceHistory from '../../components/attendance/RecentAttendanceHistory';
import moment from 'moment';

const Attendance = () => {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(moment().month());
  const [selectedYear, setSelectedYear] = useState(moment().year());

  // Fetch today's attendance and history
  useEffect(() => {
    fetchTodayAttendance();
    fetchAttendanceHistory();
    fetchAttendanceSummary();
  }, [user]);

  // Fetch summary when month/year changes
  useEffect(() => {
    fetchAttendanceSummary();
  }, [selectedMonth, selectedYear]);

  const fetchTodayAttendance = async () => {
    try {
      const response = await attendanceService.getTodayAttendance();
      setTodayAttendance(response.data);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const response = await attendanceService.getMyAttendance(null, null, 30);
      setAttendanceHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const response = await attendanceService.getMyAttendanceSummary(
        selectedMonth + 1, // moment months are 0-indexed
        selectedYear
      );
      console.log('Attendance Summary Response:', response);
      console.log('Response data:', response.data);

      const data = response.data.data || response.data;
      console.log('Setting summaryData to:', data);

      // Handle backwards compatibility: if backend returns 'attendance' key instead of 'stats'
      if (data && data.attendance && !data.stats) {
        data.stats = data.attendance;
        console.log('Converted attendance to stats for backwards compatibility');
      }

      setSummaryData(data);
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      toast.error('Failed to load attendance data');
    }
  };

  const handleMonthChange = (direction) => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;

    if (direction === 'prev') {
      newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
      newYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    } else {
      newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
      newYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const handleCheckIn = async () => {
    setLocationLoading(true);
    setLoading(true);

    try {
      // Request location permission and get coordinates
      const location = await attendanceService.getCurrentLocation();

      // Mark attendance with location
      const response = await attendanceService.checkIn(
        location.latitude,
        location.longitude,
        notes
      );

      toast.success(response.message || 'Attendance marked successfully!');
      setTodayAttendance(response.data);
      setNotes('');
      fetchAttendanceHistory();
    } catch (error) {
      console.error('Check-in error:', error);
      const errorMessage = error.message || error.error || 'Failed to mark attendance';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setLocationLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLocationLoading(true);
    setLoading(true);

    try {
      // Request location and get coordinates
      const location = await attendanceService.getCurrentLocation();

      // Mark check-out with location
      const response = await attendanceService.checkOut(
        location.latitude,
        location.longitude,
        notes
      );

      toast.success(response.message || 'Check-out marked successfully!');
      setTodayAttendance(response.data);
      setNotes('');
      fetchAttendanceHistory();
    } catch (error) {
      console.error('Check-out error:', error);
      const errorMessage = error.message || error.error || 'Failed to mark check-out';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setLocationLoading(false);
    }
  };

  const formatTime = (date) => {
    return moment(date).format('hh:mm A');
  };

  const formatDate = (date) => {
    return moment(date).format('MMM DD, YYYY');
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const canCheckIn = !todayAttendance;
  const canCheckOut = todayAttendance && !todayAttendance.checkOutTime;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              Attendance
            </h1>
            <p className="text-gray-600 text-sm md:text-base">Mark your daily attendance and view your history</p>
          </div>
        </div>

        {/* Today's Attendance Status */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-5 flex items-center text-gray-900">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2.5 rounded-lg mr-3 shadow-sm">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            Today's Attendance
          </h2>

          {todayAttendance ? (
            <div className="space-y-3">
              {/* Check-in Info */}
              <div className="border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="bg-green-100 p-1.5 rounded-lg mr-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-semibold text-green-900 text-lg">Checked In</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong className="font-semibold">Time:</strong> <span className="font-mono">{formatTime(todayAttendance.checkInTime)}</span>
                    </p>
                    <div className="flex items-start text-sm text-gray-600 bg-white/60 rounded-md p-2">
                      <MapPin className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0 text-green-600" />
                      <span className="flex-1">{todayAttendance.location?.address || 'Location unavailable'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Check-out Info */}
              {todayAttendance.checkOutTime ? (
                <div className="border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-rose-50 p-4 rounded-lg shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="bg-red-100 p-1.5 rounded-lg mr-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="font-semibold text-red-900 text-lg">Checked Out</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        <strong className="font-semibold">Time:</strong> <span className="font-mono">{formatTime(todayAttendance.checkOutTime)}</span>
                      </p>
                      <div className="flex items-start text-sm text-gray-600 mb-3 bg-white/60 rounded-md p-2">
                        <MapPin className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0 text-red-600" />
                        <span className="flex-1">{todayAttendance.checkOutLocation?.address || 'Location unavailable'}</span>
                      </div>
                      <div className="bg-white/80 rounded-md p-2.5 border border-gray-200">
                        <p className="text-sm font-semibold text-gray-800">
                          Work Duration: <span className="text-blue-600 font-mono">{formatDuration(todayAttendance.workDuration)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="bg-yellow-100 p-1.5 rounded-lg mr-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <span className="text-yellow-900 font-semibold">Awaiting Check-out</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">No attendance marked today</p>
              <p className="text-sm text-gray-500">Click "Check In" below to mark your attendance</p>
            </div>
          )}

          {/* Action Buttons */}
          {(canCheckIn || canCheckOut) && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notes <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  rows="2"
                />
              </div>

              {locationLoading && (
                <div className="flex items-center justify-center text-blue-600 text-sm bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <MapPin className="w-4 h-4 mr-2 animate-pulse" />
                  <span className="font-medium">Fetching your location...</span>
                </div>
              )}

              <div className="flex gap-3">
                {canCheckIn && (
                  <button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        <span>Marking Attendance...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Check In
                      </>
                    )}
                  </button>
                )}

                {canCheckOut && (
                  <button
                    onClick={handleCheckOut}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white py-3.5 px-6 rounded-lg hover:from-red-700 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        <span>Marking Check-out...</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 mr-2" />
                        Check Out
                      </>
                    )}
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Your location will be recorded when you mark attendance
              </p>
            </div>
          )}
        </div>

        {/* Attendance Calendar and Stats */}
        {summaryData && (
          <>
            {/* Month Navigation */}
            <div className="mb-4">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-2xl border border-blue-200/60 shadow-md p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleMonthChange('prev')}
                    className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-all duration-200 font-semibold hover:shadow-md hover:scale-105"
                  >
                    ← Previous
                  </button>
                  <div className="text-center">
                    <h2 className="text-lg font-bold text-gray-900">
                      {moment().month(selectedMonth).year(selectedYear).format('MMMM YYYY')}
                    </h2>
                    <p className="text-xs text-gray-600 mt-0.5">Attendance Overview</p>
                  </div>
                  <button
                    onClick={() => handleMonthChange('next')}
                    className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:scale-105"
                    disabled={selectedMonth === moment().month() && selectedYear === moment().year()}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Advance Payments - Below Month Navigation, Above Calendar/Stats */}
            {summaryData.advances && summaryData.advances.total > 0 && (
              <div className="mb-6">
                <CompactAdvancePayments advancesData={summaryData.advances} />
              </div>
            )}

            {/* Calendar and Stats - 50-50 Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Left - Calendar */}
              {summaryData.calendar && summaryData.period && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 backdrop-blur-sm">
                  <AttendanceCalendarGrid
                    calendarData={summaryData.calendar}
                    period={summaryData.period}
                  />
                </div>
              )}

              {/* Right - Simplified Attendance Stats */}
              {summaryData.stats && summaryData.period && (
                <SimplifiedAttendanceStats
                  stats={summaryData.stats}
                  period={summaryData.period}
                />
              )}
            </div>

            {/* Salary Details - Full Width Below */}
            {summaryData.salary && summaryData.advances && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 backdrop-blur-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center text-gray-900">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-2.5 rounded-lg mr-3 shadow-sm">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  Salary Details
                </h2>
                <SalaryCalculator
                  salaryData={summaryData.salary}
                  advancesData={summaryData.advances}
                />
              </div>
            )}
          </>
        )}

        {/* Recent Attendance History with Location (Last 7 Days) */}
        {user && (
          <RecentAttendanceHistory userId={user._id} isOwnRecord={true} />
        )}

        {/* Attendance History */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-5 text-gray-900 flex items-center">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-2.5 rounded-lg mr-3 shadow-sm">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            Recent Attendance History
          </h2>

          {attendanceHistory.length > 0 ? (
            <div className="space-y-3">
              {attendanceHistory.map((record) => (
                <div
                  key={record._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:shadow-md transition-all duration-200 bg-white"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-900 text-base">
                      {formatDate(record.date)}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      record.status === 'present' ? 'bg-green-100 text-green-800 border border-green-200' :
                      record.status === 'late' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      record.status === 'half-day' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {record.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {/* Check-in */}
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <p className="text-gray-700 mb-2 font-semibold flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1.5" />
                        Check-in
                      </p>
                      <p className="text-gray-900 font-mono mb-2">{formatTime(record.checkInTime)}</p>
                      <div className="flex items-start text-xs text-gray-600 bg-white/60 rounded p-2">
                        <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0 text-green-600" />
                        <span className="line-clamp-2">{record.location?.address}</span>
                      </div>
                    </div>

                    {/* Check-out */}
                    <div className={`rounded-lg p-3 border ${record.checkOutTime ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                      {record.checkOutTime ? (
                        <>
                          <p className="text-gray-700 mb-2 font-semibold flex items-center">
                            <XCircle className="w-4 h-4 text-red-600 mr-1.5" />
                            Check-out
                          </p>
                          <p className="text-gray-900 font-mono mb-2">{formatTime(record.checkOutTime)}</p>
                          <div className="flex items-start text-xs text-gray-600 bg-white/60 rounded p-2">
                            <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0 text-red-600" />
                            <span className="line-clamp-2">
                              {record.checkOutLocation?.address || 'N/A'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500 italic text-sm">Not checked out</p>
                      )}
                    </div>
                  </div>

                  {(record.workDuration > 0 || record.notes) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                      {record.workDuration > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <p className="text-sm text-gray-700">
                            <strong className="font-semibold">Work Duration:</strong> <span className="font-mono text-blue-600">{formatDuration(record.workDuration)}</span>
                          </p>
                        </div>
                      )}
                      {record.notes && (
                        <div className="bg-gray-50 rounded-md p-2 border border-gray-200">
                          <p className="text-xs text-gray-600">
                            <strong className="font-semibold">Notes:</strong> {record.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No attendance history available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
