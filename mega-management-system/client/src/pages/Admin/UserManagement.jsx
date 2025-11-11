import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, X, Eye, EyeOff, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import taskService from '../../services/taskService';
import toast from 'react-hot-toast';
import moment from 'moment';
import EmployeeCard from '../../components/team/EmployeeCard';

export default function UserManagement() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [tasks, setTasks] = useState([]);
  const [dueTasksMap, setDueTasksMap] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    avatar: '',
    salary: 0,
    role: 'employee'
  });

  // Fetch users and tasks on component mount
  useEffect(() => {
    fetchUsers();
    fetchTasks();
  }, []);

  // Apply filters whenever users, search, or filters change
  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, filterRole, filterDepartment]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      if (response.success) {
        // Filter out admin and manager roles - only show employees
        const employeesOnly = (response.data || []).filter(u => u.role === 'employee');
        setUsers(employeesOnly);
      }
    } catch (error) {
      toast.error('Failed to fetch team members');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await taskService.getAllTasks();
      if (response.success) {
        setTasks(response.data || []);
        calculateDueTasks(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Don't show error toast, tasks are optional
    }
  };

  const calculateDueTasks = (allTasks) => {
    const now = moment();
    const dueMap = {};

    // Calculate due tasks for each employee
    allTasks.forEach(task => {
      if (task.status !== 'completed' && task.dueDate && moment(task.dueDate).isBefore(now)) {
        // Task is overdue
        if (task.assignees && Array.isArray(task.assignees)) {
          task.assignees.forEach(assignee => {
            const userId = assignee._id || assignee.id || assignee;
            if (!dueMap[userId]) {
              dueMap[userId] = 0;
            }
            dueMap[userId]++;
          });
        }
      }
    });

    setDueTasksMap(dueMap);
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(user => user.department === filterDepartment);
    }

    setFilteredUsers(filtered);
  };

  // Get unique departments for filter
  const departments = [...new Set(users.map(u => u.department).filter(Boolean))];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      department: '',
      avatar: '',
      salary: 0,
      role: 'employee'
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.email) {
      toast.error('Please fill in name and email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password for new users
    if (!editingUser && !formData.password) {
      toast.error('Password is required for new team members');
      return;
    }

    // Check for duplicate email (client-side check)
    if (!editingUser) {
      const emailExists = users.some(u => u.email.toLowerCase() === formData.email.toLowerCase());
      if (emailExists) {
        toast.error('Email already exists. Please use a different email address.');
        return;
      }
    } else {
      // When editing, check if email is taken by another user
      const emailExists = users.some(u =>
        u.email.toLowerCase() === formData.email.toLowerCase() &&
        (u._id || u.id) !== (editingUser._id || editingUser.id)
      );
      if (emailExists) {
        toast.error('Email already exists. Please use a different email address.');
        return;
      }
    }

    try {
      if (editingUser) {
        // Update existing user
        const updateData = { ...formData };
        // Only include password if it's been changed
        if (!updateData.password) {
          delete updateData.password;
        }

        const response = await userService.updateUser(editingUser.id || editingUser._id, updateData);

        if (response.success) {
          toast.success('Team member updated successfully');
          setUsers(users.map(u =>
            (u.id || u._id) === (editingUser.id || editingUser._id) ? response.data : u
          ));
        }
      } else {
        // Create new user
        const response = await userService.createUser(formData);

        if (response.success) {
          toast.success('Team member added successfully');
          setUsers([response.data, ...users]);
        }
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save team member';
      toast.error(errorMessage);
      console.error('Error saving user:', error);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't populate password for security
      phone: user.phone || '',
      department: user.department || '',
      avatar: user.avatar || '',
      salary: user.salary || 0,
      role: user.role || 'employee'
    });
    setShowModal(true);
  };

  const handleViewEmployee = (user) => {
    // Navigate to employee detail page
    navigate(`/users/${user._id || user.id}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterDepartment('all');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage employees and track their attendance</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
            </div>

            {/* Department Filter */}
            <div className="flex gap-2">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {(searchTerm || filterDepartment !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Clear filters"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Tags */}
          {(searchTerm || filterDepartment !== 'all') && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  Search: "{searchTerm}"
                </span>
              )}
              {filterDepartment !== 'all' && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  Dept: {filterDepartment}
                </span>
              )}
              <span className="text-sm text-gray-500">
                ({filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Team Members Grid */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading team members...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {users.length === 0 ? 'No employees yet' : 'No employees found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {users.length === 0
              ? 'Get started by adding your first employee'
              : 'Try adjusting your filters or search term'}
          </p>
          {users.length === 0 && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Employee
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <EmployeeCard
              key={user.id || user._id}
              employee={user}
              onClick={handleViewEmployee}
              dueTasks={dueTasksMap[user._id || user.id] || 0}
            />
          ))}
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
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
                    value={formData.email}
                    onChange={handleInputChange}
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
                    value={formData.phone}
                    onChange={handleInputChange}
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
                    value={formData.department}
                    onChange={handleInputChange}
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
                    value={formData.salary}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="0"
                    min="0"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {!editingUser && <span className="text-red-500">*</span>}
                    {editingUser && <span className="text-gray-500 text-xs">(Leave blank to keep current)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 pr-10"
                      placeholder="Enter password"
                      required={!editingUser}
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
                  value={formData.avatar}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {editingUser ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
