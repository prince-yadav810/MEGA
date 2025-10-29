import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import attendanceService from '../../services/attendanceService';
import moment from 'moment';

const Attendance = () => {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance and history
  useEffect(() => {
    fetchTodayAttendance();
    fetchAttendanceHistory();
  }, []);

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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance</h1>
          <p className="text-gray-600">Mark your daily attendance and view your history</p>
        </div>

        {/* Current Time and Date Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Current Time</p>
              <p className="text-4xl font-bold">{currentTime.toLocaleTimeString()}</p>
              <p className="text-lg mt-2 opacity-90">
                {moment(currentTime).format('dddd, MMMM DD, YYYY')}
              </p>
            </div>
            <Clock className="w-16 h-16 opacity-50" />
          </div>
        </div>

        {/* Today's Attendance Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Today's Attendance
          </h2>

          {todayAttendance ? (
            <div className="space-y-4">
              {/* Check-in Info */}
              <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-semibold text-green-900">Checked In</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      <strong>Time:</strong> {formatTime(todayAttendance.checkInTime)}
                    </p>
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span>{todayAttendance.location?.address || 'Location unavailable'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Check-out Info */}
              {todayAttendance.checkOutTime ? (
                <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <XCircle className="w-5 h-5 text-red-600 mr-2" />
                        <span className="font-semibold text-red-900">Checked Out</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">
                        <strong>Time:</strong> {formatTime(todayAttendance.checkOutTime)}
                      </p>
                      <div className="flex items-start text-sm text-gray-600 mb-2">
                        <MapPin className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                        <span>{todayAttendance.checkOutLocation?.address || 'Location unavailable'}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">
                        Work Duration: {formatDuration(todayAttendance.workDuration)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-yellow-900 font-medium">Awaiting Check-out</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">You haven't marked attendance today</p>
            </div>
          )}

          {/* Action Buttons */}
          {(canCheckIn || canCheckOut) && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>

              {locationLoading && (
                <div className="flex items-center justify-center text-blue-600 text-sm">
                  <MapPin className="w-4 h-4 mr-2 animate-pulse" />
                  Fetching your location...
                </div>
              )}

              <div className="flex gap-3">
                {canCheckIn && (
                  <button
                    onClick={handleCheckIn}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Marking Attendance...
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
                    className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Marking Check-out...
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

              <p className="text-xs text-gray-500 text-center">
                <MapPin className="w-3 h-3 inline mr-1" />
                Your location will be recorded when you mark attendance
              </p>
            </div>
          )}
        </div>

        {/* Attendance History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Attendance History</h2>

          {attendanceHistory.length > 0 ? (
            <div className="space-y-3">
              {attendanceHistory.map((record) => (
                <div
                  key={record._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {formatDate(record.date)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                      record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      record.status === 'half-day' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    {/* Check-in */}
                    <div>
                      <p className="text-gray-600 mb-1">
                        <strong>Check-in:</strong> {formatTime(record.checkInTime)}
                      </p>
                      <div className="flex items-start text-xs text-gray-500">
                        <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{record.location?.address}</span>
                      </div>
                    </div>

                    {/* Check-out */}
                    <div>
                      {record.checkOutTime ? (
                        <>
                          <p className="text-gray-600 mb-1">
                            <strong>Check-out:</strong> {formatTime(record.checkOutTime)}
                          </p>
                          <div className="flex items-start text-xs text-gray-500">
                            <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">
                              {record.checkOutLocation?.address || 'N/A'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-500 italic">Not checked out</p>
                      )}
                    </div>
                  </div>

                  {record.workDuration > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-700">
                        <strong>Work Duration:</strong> {formatDuration(record.workDuration)}
                      </p>
                    </div>
                  )}

                  {record.notes && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-600">
                        <strong>Notes:</strong> {record.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No attendance history available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
