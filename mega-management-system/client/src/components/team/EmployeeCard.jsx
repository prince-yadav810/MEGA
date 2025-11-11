import React from 'react';
import { User, Mail, Phone, Briefcase, DollarSign, Calendar, AlertCircle } from 'lucide-react';

const EmployeeCard = ({ employee, onClick, dueTasks = 0 }) => {
  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    if (employee.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    );
  };

  return (
    <div
      onClick={() => onClick(employee)}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-indigo-300 group"
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="relative">
            {employee.avatar ? (
              <img
                src={employee.avatar}
                alt={employee.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 group-hover:border-indigo-400 transition-colors"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold border-2 border-gray-200 group-hover:border-indigo-400 transition-colors">
                {getInitials(employee.name)}
              </div>
            )}
            {/* Online Indicator */}
            {employee.isActive && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>

          {/* Name and Role */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {employee.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(employee.role)}`}>
                {employee.role?.charAt(0).toUpperCase() + employee.role?.slice(1)}
              </span>
              {getStatusBadge()}
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="space-y-2 text-sm">
        {/* Email */}
        <div className="flex items-center text-gray-600">
          <Mail className="w-4 h-4 mr-2 text-gray-400" />
          <span className="truncate">{employee.email}</span>
        </div>

        {/* Phone */}
        {employee.phone && (
          <div className="flex items-center text-gray-600">
            <Phone className="w-4 h-4 mr-2 text-gray-400" />
            <span>{employee.phone}</span>
          </div>
        )}

        {/* Department */}
        {employee.department && (
          <div className="flex items-center text-gray-600">
            <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
            <span>{employee.department}</span>
          </div>
        )}

        {/* Salary */}
        {employee.salary && (
          <div className="flex items-center text-gray-600">
            <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">
              ₹{employee.salary.toLocaleString('en-IN')} / month
            </span>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            <span>
              Joined {new Date(employee.createdAt).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {dueTasks > 0 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                <AlertCircle className="w-3 h-3" />
                {dueTasks} Due
              </span>
            )}
            {employee.advances && employee.advances.length > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                {employee.advances.filter(adv => !adv.deductedFromSalary).length} Advance(s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover Effect Indicator */}
      <div className="mt-3 text-center">
        <span className="text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Click to view details →
        </span>
      </div>
    </div>
  );
};

export default EmployeeCard;
