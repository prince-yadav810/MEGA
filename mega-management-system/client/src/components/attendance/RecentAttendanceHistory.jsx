import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Calendar, AlertCircle } from 'lucide-react';
import moment from 'moment';
import attendanceService from '../../services/attendanceService';

const RecentAttendanceHistory = ({ userId, isOwnRecord = false }) => {
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchRecentAttendance();
    }
  }, [userId]);

  const fetchRecentAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await attendanceService.getRecentAttendanceWithLocation(userId);
      setRecentAttendance(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load recent attendance');
      console.error('Error fetching recent attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    const badges = {
      present: 'bg-green-100 text-green-800 border-green-200',
      absent: 'bg-red-100 text-red-800 border-red-200',
      'half-day': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      late: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Loading recent attendance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (recentAttendance.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center text-gray-900">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2.5 rounded-lg mr-3 shadow-sm">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          Recent Attendance History (Last 7 Days)
        </h3>
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No attendance records in the last 7 days</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center text-gray-900">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2.5 rounded-lg mr-3 shadow-sm">
          <Calendar className="w-5 h-5 text-blue-600" />
        </div>
        Recent Attendance History (Last 7 Days)
      </h3>

      <div className="space-y-3">
        {recentAttendance.map((record, index) => (
          <div
            key={record._id || index}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
          >
            {/* Header: Date and Status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-900">
                  {moment(record.date).format('dddd, MMM DD, YYYY')}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(record.status)}`}>
                {record.status.toUpperCase()}
              </span>
            </div>

            {/* Location Data - Only shown if available */}
            {record.hasLocationData ? (
              <div className="space-y-2 text-sm">
                {/* Check-In Info */}
                {record.checkInTime && (
                  <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-800">Check-In</span>
                      <span className="text-green-700 font-mono">
                        {moment(record.checkInTime).format('hh:mm A')}
                      </span>
                    </div>
                    {record.location && (
                      <div className="flex items-start gap-2 mt-2">
                        <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-green-700">
                          <div className="font-medium">{record.location.address}</div>
                          {record.location.city && (
                            <div className="text-xs text-green-600 mt-0.5">
                              {record.location.city}
                              {record.location.state && `, ${record.location.state}`}
                              {record.location.postalCode && ` ${record.location.postalCode}`}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Check-Out Info */}
                {record.checkOutTime && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-800">Check-Out</span>
                      <span className="text-blue-700 font-mono">
                        {moment(record.checkOutTime).format('hh:mm A')}
                      </span>
                    </div>
                    {record.checkOutLocation && (
                      <div className="flex items-start gap-2 mt-2">
                        <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-blue-700">
                          <div className="font-medium">{record.checkOutLocation.address}</div>
                          {record.checkOutLocation.city && (
                            <div className="text-xs text-blue-600 mt-0.5">
                              {record.checkOutLocation.city}
                              {record.checkOutLocation.state && `, ${record.checkOutLocation.state}`}
                              {record.checkOutLocation.postalCode && ` ${record.checkOutLocation.postalCode}`}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Work Duration */}
                {record.workDuration > 0 && (
                  <div className="flex items-center gap-2 text-gray-600 text-xs bg-gray-50 rounded-md p-2 border border-gray-200">
                    <Clock className="w-3 h-3" />
                    <span>
                      Work Duration: {Math.floor(record.workDuration / 60)}h {record.workDuration % 60}m
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500 text-sm bg-gray-50 rounded-md p-3 border border-gray-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Location data not available (older than 7 days or manually marked)</span>
              </div>
            )}

            {/* Notes */}
            {record.notes && record.notes !== 'Manually updated by admin' && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Notes:</span> {record.notes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentAttendanceHistory;
