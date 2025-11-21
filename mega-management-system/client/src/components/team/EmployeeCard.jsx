import React from 'react';
import { Mail, Phone, IndianRupee, Clock, CheckCircle, XCircle } from 'lucide-react';
import moment from 'moment';

const EmployeeCard = ({ employee, onClick, todayAttendance = null }) => {
  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format salary in Indian format
  const formatSalary = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format time
  const formatTime = (time) => {
    if (!time) return '--:--';
    return moment(time).format('hh:mm A');
  };

  return (
    <div
      onClick={() => onClick(employee)}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 cursor-pointer transform hover:-translate-y-1"
    >
      {/* Header with gradient - like Quotation Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative">
            {employee.avatar ? (
              <img
                src={employee.avatar}
                alt={employee.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white border-opacity-30"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-white text-lg font-bold">
                {getInitials(employee.name)}
              </div>
            )}
          </div>

          <div className="text-white">
            <p className="font-semibold text-lg">{employee.name}</p>
            <p className="text-xs text-primary-100">{employee.department || 'Employee'}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Email */}
        <div className="flex items-start space-x-3">
          <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium">Email</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {employee.email}
            </p>
          </div>
        </div>

        {/* Phone */}
        {employee.phone && (
          <div className="flex items-start space-x-3">
            <Phone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium">Phone</p>
              <p className="text-sm font-semibold text-gray-900">
                {employee.phone}
              </p>
            </div>
          </div>
        )}

        {/* Salary */}
        {employee.salary > 0 && (
          <div className="flex items-start space-x-3">
            <IndianRupee className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-medium">Monthly Salary</p>
              <p className="text-lg font-bold text-green-600">
                {formatSalary(employee.salary)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Today's Attendance */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">Today's Attendance</span>
          <span className="text-xs text-gray-400">{moment().format('DD MMM YYYY')}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Check In */}
          <div className="bg-green-50 rounded-lg p-2 border border-green-100">
            <div className="flex items-center space-x-1 mb-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-700">Check In</span>
            </div>
            <p className="text-sm font-bold text-green-800">
              {todayAttendance?.checkInTime ? formatTime(todayAttendance.checkInTime) : '--:--'}
            </p>
          </div>

          {/* Check Out */}
          <div className="bg-red-50 rounded-lg p-2 border border-red-100">
            <div className="flex items-center space-x-1 mb-1">
              <XCircle className="h-3 w-3 text-red-600" />
              <span className="text-xs font-medium text-red-700">Check Out</span>
            </div>
            <p className="text-sm font-bold text-red-800">
              {todayAttendance?.checkOutTime ? formatTime(todayAttendance.checkOutTime) : '--:--'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCard;
