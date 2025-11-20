import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Building2, DollarSign, Briefcase, Calendar, CheckCircle, Clock, AlertCircle, Plus, ClipboardCheck, Edit2, ChevronLeft, ChevronRight, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import userService from '../services/userService';
import attendanceService from '../services/attendanceService';
import toast from 'react-hot-toast';
import { taskStatuses, taskPriorities } from '../utils/sampleData';
import AttendanceCalendarGrid from './attendance/AttendanceCalendarGrid';
import AttendanceSummary from './attendance/AttendanceSummary';
import SalaryCalculator from './attendance/SalaryCalculator';
import moment from 'moment';

export default function EmployeeDetailModal({ employee, onClose, onUpdate, onEdit }) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(moment().month() + 1);
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [advanceData, setAdvanceData] = useState({
    amount: '',
    reason: '',
    status: 'paid'
  });
  const [showAdvanceEditModal, setShowAdvanceEditModal] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [showAllAdvances, setShowAllAdvances] = useState(false);

  useEffect(() => {
    if (employee) {
      fetchUserTasks();
      fetchAttendanceSummary(selectedMonth, selectedYear);
    }
  }, [employee, selectedMonth, selectedYear]);

  const fetchUserTasks = async () => {
    try {
      setLoadingTasks(true);
      const response = await userService.getUserTasks(employee._id || employee.id);
      if (response.success) {
        setTasks(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchAttendanceSummary = async (month, year) => {
    try {
      setLoadingAttendance(true);
      const response = await attendanceService.getUserAttendanceSummary(
        employee._id || employee.id,
        month,
        year
      );
      if (response.success) {
        setAttendanceSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleAddAdvance = async (e) => {
    e.preventDefault();

    if (!advanceData.amount || parseFloat(advanceData.amount) <= 0) {
      toast.error('Please enter a valid advance amount');
      return;
    }

    try {
      const response = await userService.addAdvance(employee._id || employee.id, {
        amount: parseFloat(advanceData.amount),
        reason: advanceData.reason,
        status: advanceData.status
      });

      if (response.success) {
        toast.success('Advance added successfully');
        setAdvanceData({ amount: '', reason: '', status: 'paid' });
        setShowAdvanceForm(false);
        onUpdate(); // Refresh employee data
        // Refresh attendance summary to reflect new advance
        fetchAttendanceSummary(selectedMonth, selectedYear);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add advance');
    }
  };

  // Handle edit advance click
  const handleEditAdvance = (advance) => {
    setEditingAdvance(advance);
    setAdvanceData({
      amount: advance.amount.toString(),
      reason: advance.reason || '',
      status: advance.status || 'paid'
    });
    setShowAdvanceEditModal(true);
  };

  // Handle update advance
  const handleUpdateAdvance = async (e) => {
    e.preventDefault();

    if (!advanceData.amount || parseFloat(advanceData.amount) <= 0) {
      toast.error('Please enter a valid advance amount');
      return;
    }

    if (!editingAdvance) return;

    try {
      const response = await userService.updateAdvance(employee._id || employee.id, editingAdvance._id, {
        amount: parseFloat(advanceData.amount),
        reason: advanceData.reason,
        status: advanceData.status
      });

      if (response.success) {
        toast.success('Advance updated successfully');
        setAdvanceData({ amount: '', reason: '', status: 'paid' });
        setShowAdvanceEditModal(false);
        setEditingAdvance(null);
        onUpdate(); // Refresh employee data
        fetchAttendanceSummary(selectedMonth, selectedYear); // Refresh attendance summary
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update advance');
    }
  };

  const getTotalAdvances = () => {
    return employee.advances?.reduce((sum, adv) => sum + adv.amount, 0) || 0;
  };

  const getPendingAdvances = () => {
    return employee.advances?.filter(adv => adv.status === 'pending').reduce((sum, adv) => sum + adv.amount, 0) || 0;
  };

  const getActiveTasks = () => {
    return tasks.filter(task => task.status !== 'completed').length;
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  if (!employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <span className="text-white font-bold text-2xl">
                  {employee.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
              <p className="text-gray-600">{employee.department}</p>
              <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                employee.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                employee.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {employee.role?.charAt(0).toUpperCase() + employee.role?.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(employee)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Email:</span>
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Phone:</span>
                <span>{employee.phone}</span>
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6 bg-indigo-50 rounded-lg p-4">
            <button
              onClick={handlePreviousMonth}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Previous</span>
            </button>
            <div className="text-center">
              <h3 className="text-xl font-bold text-indigo-900">
                {moment(`${selectedYear}-${selectedMonth}-01`).format('MMMM YYYY')}
              </h3>
              <p className="text-sm text-indigo-600">Attendance & Salary Details</p>
            </div>
            <button
              onClick={handleNextMonth}
              disabled={selectedMonth === moment().month() + 1 && selectedYear === moment().year()}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-medium">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loadingAttendance ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center mb-6">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading attendance data...</p>
            </div>
          ) : attendanceSummary ? (
            <>
              {/* Attendance Summary & Salary Calculator Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <AttendanceSummary summaryData={attendanceSummary} />
                <SalaryCalculator
                  salaryData={attendanceSummary.salary}
                  advancesData={attendanceSummary.advances}
                />
              </div>

              {/* Attendance Calendar Grid */}
              <div className="mb-6">
                <AttendanceCalendarGrid
                  calendarData={attendanceSummary.calendar}
                  period={attendanceSummary.period}
                />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center mb-6">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance data available for this month</p>
            </div>
          )}

          {/* Advance Payment Management */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              Advance Payments Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Total Advances (All Time)</p>
                <p className="text-2xl font-bold text-orange-600">₹{getTotalAdvances().toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Pending Advances</p>
                <p className="text-2xl font-bold text-red-600">₹{getPendingAdvances().toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{attendanceSummary?.advances?.totalAdvancesThisMonth?.toLocaleString('en-IN') || 0}
                </p>
              </div>
            </div>

            {/* Advances List */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Advance History</h4>
                <button
                  onClick={() => setShowAdvanceForm(!showAdvanceForm)}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Advance
                </button>
              </div>

              {/* Add Advance Form */}
              {showAdvanceForm && (
                <form onSubmit={handleAddAdvance} className="mb-4 p-4 bg-orange-50 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={advanceData.amount}
                      onChange={(e) => setAdvanceData({ ...advanceData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <input
                      type="text"
                      value={advanceData.reason}
                      onChange={(e) => setAdvanceData({ ...advanceData, reason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Reason for advance"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdvanceForm(false);
                        setAdvanceData({ amount: '', reason: '', status: 'paid' });
                      }}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                    >
                      Add Advance
                    </button>
                  </div>
                </form>
              )}

              {employee.advances && employee.advances.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {(() => {
                      const reversedAdvances = [...employee.advances].reverse();
                      const displayedAdvances = showAllAdvances ? reversedAdvances : reversedAdvances.slice(0, 5);
                      return displayedAdvances.map((advance, index) => (
                        <div key={advance._id || `advance-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">₹{advance.amount.toLocaleString('en-IN')}</p>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                advance.status === 'paid' ? 'bg-green-100 text-green-800' :
                                advance.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                advance.status === 'deducted' ? 'bg-purple-100 text-purple-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {advance.status.charAt(0).toUpperCase() + advance.status.slice(1)}
                              </span>
                              {advance.deductedFromSalary && (
                                <span className="text-xs text-gray-500">
                                  (Deducted: {advance.deductionMonth})
                                </span>
                              )}
                            </div>
                            {advance.reason && (
                              <p className="text-sm text-gray-600 mt-1">{advance.reason}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm text-gray-500">
                              {new Date(advance.date).toLocaleDateString('en-IN')}
                            </div>
                            <button
                              onClick={() => handleEditAdvance(advance)}
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit advance"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  {employee.advances.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllAdvances(!showAllAdvances)}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {showAllAdvances ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show All ({employee.advances.length})
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No advances recorded</p>
              )}
            </div>
          </div>

          {/* Tasks Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Assigned Tasks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Total Tasks</p>
                <p className="text-2xl font-bold text-blue-600">{tasks.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Active Tasks</p>
                <p className="text-2xl font-bold text-orange-600">{getActiveTasks()}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {tasks.filter(task => task.status === 'completed').length}
                </p>
              </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-900 mb-3">Current Tasks</h4>
              {loadingTasks ? (
                <p className="text-sm text-gray-500 text-center py-4">Loading tasks...</p>
              ) : tasks.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tasks.map((task) => (
                    <div key={task._id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{task.title}</h5>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${taskStatuses[task.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                              {taskStatuses[task.status]?.label || task.status}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${taskPriorities[task.priority]?.bgColor || 'bg-gray-100'} ${taskPriorities[task.priority]?.color || 'text-gray-800'}`}>
                              {taskPriorities[task.priority]?.label || task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No tasks assigned</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Advance Edit Modal */}
      {showAdvanceEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Advance</h2>
              <button
                onClick={() => {
                  setShowAdvanceEditModal(false);
                  setEditingAdvance(null);
                  setAdvanceData({ amount: '', reason: '', status: 'paid' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateAdvance} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={advanceData.amount}
                  onChange={(e) => setAdvanceData({ ...advanceData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={advanceData.reason}
                  onChange={(e) => setAdvanceData({ ...advanceData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Reason for advance"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdvanceEditModal(false);
                    setEditingAdvance(null);
                    setAdvanceData({ amount: '', reason: '', status: 'paid' });
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                >
                  Update Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
