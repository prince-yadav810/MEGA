import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Building2, DollarSign, Briefcase, Calendar, CheckCircle, Clock, AlertCircle, Plus, ClipboardCheck } from 'lucide-react';
import userService from '../services/userService';
import toast from 'react-hot-toast';
import { taskStatuses, taskPriorities } from '../utils/sampleData';
import AttendanceCalendar from './attendance/AttendanceCalendar';

export default function EmployeeDetailModal({ employee, onClose, onUpdate }) {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [advanceData, setAdvanceData] = useState({
    amount: '',
    reason: '',
    status: 'pending'
  });

  useEffect(() => {
    if (employee) {
      fetchUserTasks();
    }
  }, [employee]);

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
        setAdvanceData({ amount: '', reason: '', status: 'pending' });
        setShowAdvanceForm(false);
        onUpdate(); // Refresh employee data
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add advance');
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

  if (!employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              {employee.avatar ? (
                <img src={employee.avatar} alt={employee.name} className="w-16 h-16 rounded-full" />
              ) : (
                <span className="text-white font-bold text-2xl">
                  {employee.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
              <p className="text-gray-600">{employee.department}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4">
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

          {/* Salary & Financial Information */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Salary & Advances
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Monthly Salary</p>
                <p className="text-2xl font-bold text-green-600">₹{employee.salary?.toLocaleString('en-IN') || 0}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Total Advances</p>
                <p className="text-2xl font-bold text-orange-600">₹{getTotalAdvances().toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Pending Advances</p>
                <p className="text-2xl font-bold text-red-600">₹{getPendingAdvances().toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Advances List */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Advance History</h4>
                <button
                  onClick={() => setShowAdvanceForm(!showAdvanceForm)}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Advance
                </button>
              </div>

              {/* Add Advance Form */}
              {showAdvanceForm && (
                <form onSubmit={handleAddAdvance} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={advanceData.amount}
                        onChange={(e) => setAdvanceData({ ...advanceData, amount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter amount"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={advanceData.status}
                        onChange={(e) => setAdvanceData({ ...advanceData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="paid">Paid</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <input
                      type="text"
                      value={advanceData.reason}
                      onChange={(e) => setAdvanceData({ ...advanceData, reason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Reason for advance"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAdvanceForm(false);
                        setAdvanceData({ amount: '', reason: '', status: 'pending' });
                      }}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      Add Advance
                    </button>
                  </div>
                </form>
              )}

              {employee.advances && employee.advances.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {employee.advances.map((advance, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">₹{advance.amount.toLocaleString('en-IN')}</p>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            advance.status === 'paid' ? 'bg-green-100 text-green-800' :
                            advance.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {advance.status.charAt(0).toUpperCase() + advance.status.slice(1)}
                          </span>
                        </div>
                        {advance.reason && (
                          <p className="text-sm text-gray-600 mt-1">{advance.reason}</p>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(advance.date).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
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

          {/* Attendance Information */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-purple-600" />
              Attendance Records
            </h3>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <AttendanceCalendar userId={employee._id || employee.id} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
