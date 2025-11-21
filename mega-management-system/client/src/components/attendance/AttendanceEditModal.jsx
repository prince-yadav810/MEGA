import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import moment from 'moment';

const AttendanceEditModal = ({ isOpen, onClose, employee, selectedDate, currentStatus, onSave }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus || null);
  const [saving, setSaving] = useState(false);

  // Reset selected status when modal opens or currentStatus changes
  React.useEffect(() => {
    if (isOpen) {
      // Don't pre-select holiday status, allow admin to choose
      if (currentStatus && currentStatus !== 'holiday') {
        setSelectedStatus(currentStatus);
      } else {
        setSelectedStatus(null);
      }
    }
  }, [isOpen, currentStatus]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!selectedStatus) {
      return;
    }

    setSaving(true);
    try {
      await onSave(selectedDate, selectedStatus);
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'half-day':
        return 'Half Day';
      case 'holiday':
        return 'Holiday';
      default:
        return 'Not Marked';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-500 hover:bg-green-600';
      case 'absent':
        return 'bg-red-500 hover:bg-red-600';
      case 'half-day':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5" />;
      case 'absent':
        return <XCircle className="w-5 h-5" />;
      case 'half-day':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Attendance</h2>
            <p className="text-sm text-gray-600 mt-1">
              {employee?.name || 'Employee'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={saving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Date Display */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-700">Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {moment(selectedDate).format('dddd, MMMM DD, YYYY')}
              </p>
            </div>
          </div>

          {/* Current Status */}
          {currentStatus && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-1">Current Status</p>
              <div className="flex items-center gap-2">
                {getStatusIcon(currentStatus)}
                <span className="text-sm font-semibold text-gray-900">
                  {getStatusLabel(currentStatus)}
                </span>
              </div>
            </div>
          )}

          {/* Status Options */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Select Status</p>
            <div className="grid grid-cols-3 gap-3">
              {/* Present Option */}
              <button
                onClick={() => setSelectedStatus('present')}
                disabled={saving}
                className={`
                  flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
                  ${selectedStatus === 'present'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                  }
                  ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <CheckCircle className={`w-8 h-8 ${selectedStatus === 'present' ? 'text-green-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${selectedStatus === 'present' ? 'text-green-900' : 'text-gray-700'}`}>
                  Present
                </span>
              </button>

              {/* Half Day Option */}
              <button
                onClick={() => setSelectedStatus('half-day')}
                disabled={saving}
                className={`
                  flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
                  ${selectedStatus === 'half-day'
                    ? 'border-yellow-500 bg-yellow-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50'
                  }
                  ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <AlertCircle className={`w-8 h-8 ${selectedStatus === 'half-day' ? 'text-yellow-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${selectedStatus === 'half-day' ? 'text-yellow-900' : 'text-gray-700'}`}>
                  Half Day
                </span>
              </button>

              {/* Absent Option */}
              <button
                onClick={() => setSelectedStatus('absent')}
                disabled={saving}
                className={`
                  flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all
                  ${selectedStatus === 'absent'
                    ? 'border-red-500 bg-red-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50'
                  }
                  ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <XCircle className={`w-8 h-8 ${selectedStatus === 'absent' ? 'text-red-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${selectedStatus === 'absent' ? 'text-red-900' : 'text-gray-700'}`}>
                  Absent
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedStatus || saving}
            className={`
              px-4 py-2 rounded-lg text-white font-medium transition-colors
              ${selectedStatus
                ? `${getStatusColor(selectedStatus)}`
                : 'bg-gray-400 cursor-not-allowed'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceEditModal;

