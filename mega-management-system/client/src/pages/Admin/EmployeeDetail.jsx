import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building2, DollarSign, Briefcase, Calendar, Plus, Edit2, ChevronLeft, ChevronRight, CheckCircle, X, Eye, EyeOff, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import userService from '../../services/userService';
import attendanceService from '../../services/attendanceService';
import toast from 'react-hot-toast';
import { taskStatuses, taskPriorities } from '../../utils/sampleData';
import AttendanceCalendarGrid from '../../components/attendance/AttendanceCalendarGrid';
import AttendanceEditModal from '../../components/attendance/AttendanceEditModal';
import SimplifiedAttendanceStats from '../../components/attendance/SimplifiedAttendanceStats';
import SalaryCalculator from '../../components/attendance/SalaryCalculator';
import CompactAdvancePayments from '../../components/attendance/CompactAdvancePayments';
import RecentAttendanceHistory from '../../components/attendance/RecentAttendanceHistory';
import { useAuth } from '../../context/AuthContext';
import moment from 'moment';

export default function EmployeeDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    avatar: '',
    salary: 0
  });
  // Attendance edit modal state
  const [showAttendanceEditModal, setShowAttendanceEditModal] = useState(false);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState(null);
  
  // Advance edit modal state
  const [showAdvanceEditModal, setShowAdvanceEditModal] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [showAllAdvances, setShowAllAdvances] = useState(false);

  // Ref for scrolling to advance section
  const advanceSectionRef = useRef(null);

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (userId) {
      fetchEmployee();
      fetchUserTasks();
      fetchAttendanceSummary(selectedMonth, selectedYear);
    }
  }, [userId, selectedMonth, selectedYear]);

  const fetchEmployee = async () => {
    try {
      setLoadingEmployee(true);
      const response = await userService.getUser(userId);
      if (response.success) {
        setEmployee(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch employee details');
      console.error('Error fetching employee:', error);
    } finally {
      setLoadingEmployee(false);
    }
  };

  const fetchUserTasks = async () => {
    try {
      setLoadingTasks(true);
      const response = await userService.getUserTasks(userId);
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
      const response = await attendanceService.getUserAttendanceSummary(userId, month, year);
      if (response.success) {
        const data = response.data.data || response.data;
        console.log('Employee Detail - Attendance Summary:', data);

        // Handle backwards compatibility: if backend returns 'attendance' key instead of 'stats'
        if (data && data.attendance && !data.stats) {
          data.stats = data.attendance;
          console.log('Converted attendance to stats for backwards compatibility');
        }

        setAttendanceSummary(data);
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
      const response = await userService.addAdvance(userId, {
        amount: parseFloat(advanceData.amount),
        reason: advanceData.reason,
        status: advanceData.status
      });

      if (response.success) {
        toast.success('Advance added successfully');
        setAdvanceData({ amount: '', reason: '', status: 'paid' });
        setShowAdvanceForm(false);
        fetchEmployee(); // Refresh employee data
        fetchAttendanceSummary(selectedMonth, selectedYear); // Refresh attendance summary
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add advance');
    }
  };

  const getTotalAdvances = () => {
    return employee?.advances?.reduce((sum, adv) => sum + adv.amount, 0) || 0;
  };

  const getPendingAdvances = () => {
    return employee?.advances?.filter(adv => adv.status === 'pending').reduce((sum, adv) => sum + adv.amount, 0) || 0;
  };

  const getActiveTasks = () => {
    return tasks.filter(task => task.status !== 'completed').length;
  };

  const getDueTasks = () => {
    const now = moment();
    return tasks.filter(task =>
      task.status !== 'completed' &&
      task.dueDate &&
      moment(task.dueDate).isBefore(now)
    ).length;
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

  const handleEditClick = () => {
    setEditFormData({
      name: employee.name || '',
      email: employee.email || '',
      password: '',
      phone: employee.phone || '',
      department: employee.department || '',
      avatar: employee.avatar || '',
      salary: employee.salary || 0
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editFormData.name || !editFormData.email) {
      toast.error('Please fill in name and email');
      return;
    }

    try {
      const updateData = { ...editFormData };
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await userService.updateUser(userId, updateData);

      if (response.success) {
        toast.success('Employee updated successfully');
        setEmployee(response.data);
        setShowEditModal(false);
        setShowPassword(false);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update employee';
      toast.error(errorMessage);
    }
  };

  // Handle date click in calendar (admin only)
  const handleDateClick = (dayData) => {
    if (!isAdmin) return;
    
    // Check if date is in the future or unmarked
    const isFutureDate = moment(dayData.date).isAfter(moment(), 'day');
    const isUnmarked = dayData.status === 'unmarked';
    
    if (isFutureDate || isUnmarked) {
      toast.error('Cannot edit attendance for future dates');
      return;
    }
    
    setSelectedDayData(dayData);
    setSelectedAttendanceDate(dayData.date);
    setShowAttendanceEditModal(true);
  };

  // Handle attendance update
  const handleUpdateAttendance = async (date, status) => {
    try {
      const response = await attendanceService.updateAttendanceManually(userId, date, status);
      
      if (response.success) {
        toast.success(response.message || 'Attendance updated successfully');
        // Refresh attendance summary to update stats
        await fetchAttendanceSummary(selectedMonth, selectedYear);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update attendance';
      toast.error(errorMessage);
      throw error; // Re-throw to let modal handle it
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
      const response = await userService.updateAdvance(userId, editingAdvance._id, {
        amount: parseFloat(advanceData.amount),
        reason: advanceData.reason,
        status: advanceData.status
      });

      if (response.success) {
        toast.success('Advance updated successfully');
        setAdvanceData({ amount: '', reason: '', status: 'paid' });
        setShowAdvanceEditModal(false);
        setEditingAdvance(null);
        fetchEmployee(); // Refresh employee data
        fetchAttendanceSummary(selectedMonth, selectedYear); // Refresh attendance summary
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update advance');
    }
  };

  if (loadingEmployee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading employee details...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Employee not found</p>
          <button
            onClick={() => navigate('/users')}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Back to Team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/users')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                {employee.avatar ? (
                  <img src={employee.avatar} alt={employee.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {employee.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{employee.name}</h1>
                <p className="text-sm text-gray-600">{employee.department} • {employee.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowAdvanceForm(true);
                    // Scroll to advance section after a brief delay to ensure state update
                    setTimeout(() => {
                      advanceSectionRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }, 100);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg hover:from-yellow-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg"
                >
                  <DollarSign className="w-4 h-4" />
                  Quick Advance
                </button>
              )}
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2.5 rounded-lg shadow-sm">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
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

        {/* Month Navigation - Integrated with Calendar */}
        <div className="mb-4">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-2xl border border-blue-200/60 shadow-md p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousMonth}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-all duration-200 font-semibold hover:shadow-md hover:scale-105"
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" />
                <span className="text-sm font-semibold">Previous</span>
              </button>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {moment(`${selectedYear}-${selectedMonth}-01`).format('MMMM YYYY')}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">Attendance & Salary Details</p>
              </div>
              <button
                onClick={handleNextMonth}
                disabled={selectedMonth === moment().month() + 1 && selectedYear === moment().year()}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:scale-105"
              >
                <span className="text-sm font-semibold">Next</span>
                <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>
        </div>

        {loadingAttendance ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-md p-12 text-center mb-6">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading attendance data...</p>
          </div>
        ) : attendanceSummary ? (
          <>
            {/* Compact Advance Payments - Below Month Navigation, Above Calendar/Stats */}
            {attendanceSummary.advances && attendanceSummary.advances.total > 0 && (
              <div className="mb-6">
                <CompactAdvancePayments advancesData={attendanceSummary.advances} />
              </div>
            )}

            {/* Calendar and Stats - 50-50 Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Left - Calendar */}
              {attendanceSummary.calendar && attendanceSummary.period && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-5 backdrop-blur-sm">
                  <AttendanceCalendarGrid
                    calendarData={attendanceSummary.calendar}
                    period={attendanceSummary.period}
                    isAdmin={isAdmin}
                    onDateClick={handleDateClick}
                  />
                </div>
              )}

              {/* Right - Simplified Attendance Stats */}
              {attendanceSummary.stats && attendanceSummary.period && (
                <SimplifiedAttendanceStats
                  stats={attendanceSummary.stats}
                  period={attendanceSummary.period}
                />
              )}
            </div>

            {/* Salary Details - Full Width Below */}
            {attendanceSummary.salary && attendanceSummary.advances && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 backdrop-blur-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center text-gray-900">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-2.5 rounded-lg mr-3 shadow-sm">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  Salary Details
                </h2>
                <SalaryCalculator
                  salaryData={attendanceSummary.salary}
                  advancesData={attendanceSummary.advances}
                />
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-md p-12 text-center mb-6">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No attendance data available for this month</p>
          </div>
        )}

        {/* Advance Payment Management */}
        <div ref={advanceSectionRef} className="bg-white rounded-xl border border-gray-200 shadow-md p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-2.5 rounded-lg shadow-sm">
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            Advance Payments
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-600 mb-1 font-medium">Total Advances</p>
              <p className="text-2xl font-bold text-gray-900">₹{getTotalAdvances().toLocaleString('en-IN')}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-600 mb-1 font-medium">Pending</p>
              <p className="text-2xl font-bold text-gray-900">₹{getPendingAdvances().toLocaleString('en-IN')}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-600 mb-1 font-medium">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{attendanceSummary?.advances?.totalAdvancesThisMonth?.toLocaleString('en-IN') || 0}
              </p>
            </div>
          </div>

          {/* Advances List */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">History</h4>
              <button
                onClick={() => setShowAdvanceForm(!showAdvanceForm)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Advance
              </button>
            </div>

            {/* Add Advance Form */}
            {showAdvanceForm && (
              <form onSubmit={handleAddAdvance} className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={advanceData.amount}
                    onChange={(e) => setAdvanceData({ ...advanceData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
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
                    className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800"
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
                              advance.status === 'deducted' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {advance.status.charAt(0).toUpperCase() + advance.status.slice(1)}
                            </span>
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-md p-4">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-2.5 rounded-lg shadow-sm">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            Assigned Tasks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-600 mb-1 font-medium">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-600 mb-1 font-medium">Active</p>
              <p className="text-2xl font-bold text-gray-900">{getActiveTasks()}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-red-50 to-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-600 mb-1 font-medium">Due</p>
              <p className="text-2xl font-bold text-red-600">{getDueTasks()}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-white shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm text-gray-600 mb-1 font-medium">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter(task => task.status === 'completed').length}
              </p>
            </div>
          </div>

          {/* Tasks List */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Current Tasks</h4>
            {loadingTasks ? (
              <p className="text-sm text-gray-500 text-center py-4">Loading tasks...</p>
            ) : tasks.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tasks.map((task) => {
                  const isDue = task.status !== 'completed' && task.dueDate && moment(task.dueDate).isBefore(moment());
                  return (
                    <div key={task._id} className={`p-3 rounded-lg border ${isDue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
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
                              <span className={`text-xs flex items-center gap-1 ${isDue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                <Calendar className="w-3 h-3" />
                                {moment(task.dueDate).format('MMM D, YYYY')}
                                {isDue && ' (Overdue)'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No tasks assigned</p>
            )}
          </div>
        </div>

        {/* Recent Attendance History with Location (Last 7 Days) */}
        <div className="mt-6">
          <RecentAttendanceHistory userId={userId} isOwnRecord={false} />
        </div>
      </div>

      {/* Attendance Edit Modal */}
      {showAttendanceEditModal && (
        <AttendanceEditModal
          isOpen={showAttendanceEditModal}
          onClose={() => {
            setShowAttendanceEditModal(false);
            setSelectedAttendanceDate(null);
            setSelectedDayData(null);
          }}
          employee={employee}
          selectedDate={selectedAttendanceDate}
          currentStatus={selectedDayData?.status || null}
          onSave={handleUpdateAttendance}
        />
      )}

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
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
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                >
                  Update Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Employee</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setShowPassword(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="John Doe"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={editFormData.department}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="Sales, IT, HR, etc."
                    required
                  />
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Salary (₹)
                  </label>
                  <input
                    type="number"
                    name="salary"
                    value={editFormData.salary}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="0"
                    min="0"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-gray-500 text-xs">(Leave blank to keep current)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={editFormData.password}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Avatar URL (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo URL (Optional)
                </label>
                <input
                  type="url"
                  name="avatar"
                  value={editFormData.avatar}
                  onChange={handleEditInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setShowPassword(false);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Update Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
