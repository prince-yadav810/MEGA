import React, { useState, useEffect } from 'react';
import {
  Wallet, Search, Plus, ArrowDownRight, ArrowUpRight, X,
  ChevronDown, ChevronUp, Download, Calendar, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import walletService from '../../services/walletService';
import userService from '../../services/userService';
import EmployeeWalletSection from '../../components/wallet/EmployeeWalletSection';
import toast from 'react-hot-toast';
import moment from 'moment';

export default function WalletPage() {
  const { user } = useAuth();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'super_admin';

  // For admin/manager view
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEmployee, setExpandedEmployee] = useState(null);
  const [employeeWallets, setEmployeeWallets] = useState({});
  const [employeeTransactions, setEmployeeTransactions] = useState({});
  const [employeeTransactionPages, setEmployeeTransactionPages] = useState({});
  const [loadingMoreTransactions, setLoadingMoreTransactions] = useState({});
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [creditForm, setCreditForm] = useState({ amount: '', description: '' });

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportEmployee, setExportEmployee] = useState(null);
  const [exportDateRange, setExportDateRange] = useState({ startDate: '', endDate: '' });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isAdminOrManager) {
      fetchEmployees();
    }
  }, [isAdminOrManager]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers();
      if (response.success) {
        const employeeList = response.data.filter(u => u.role === 'employee');
        setEmployees(employeeList);

        const walletPromises = employeeList.map(async (emp) => {
          try {
            const walletRes = await walletService.getWallet(emp._id);
            return { id: emp._id, data: walletRes.success ? walletRes.data : null };
          } catch {
            return { id: emp._id, data: null };
          }
        });

        const walletResults = await Promise.all(walletPromises);
        const walletsMap = {};
        walletResults.forEach(result => {
          walletsMap[result.id] = result.data;
        });
        setEmployeeWallets(walletsMap);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeTransactions = async (employeeId, page = 1, append = false) => {
    try {
      if (!append) {
        setLoadingMoreTransactions(prev => ({ ...prev, [employeeId]: true }));
      }

      const response = await walletService.getTransactions(employeeId, { limit: 10, page });
      if (response.success) {
        setEmployeeTransactions(prev => ({
          ...prev,
          [employeeId]: append
            ? [...(prev[employeeId] || []), ...(response.data.transactions || [])]
            : response.data.transactions || []
        }));
        setEmployeeTransactionPages(prev => ({
          ...prev,
          [employeeId]: {
            currentPage: page,
            totalPages: response.data.pagination?.pages || 1,
            total: response.data.pagination?.total || 0
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingMoreTransactions(prev => ({ ...prev, [employeeId]: false }));
    }
  };

  const handleExpandEmployee = async (employeeId) => {
    if (expandedEmployee === employeeId) {
      setExpandedEmployee(null);
    } else {
      setExpandedEmployee(employeeId);
      if (!employeeTransactions[employeeId]) {
        await fetchEmployeeTransactions(employeeId, 1);
      }
    }
  };

  const handleLoadMoreTransactions = async (employeeId) => {
    const pageInfo = employeeTransactionPages[employeeId];
    if (pageInfo && pageInfo.currentPage < pageInfo.totalPages) {
      setLoadingMoreTransactions(prev => ({ ...prev, [employeeId]: true }));
      await fetchEmployeeTransactions(employeeId, pageInfo.currentPage + 1, true);
    }
  };

  const handleOpenAddMoney = (employee) => {
    setSelectedEmployee(employee);
    setCreditForm({ amount: '', description: '' });
    setShowAddMoneyModal(true);
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();

    if (!creditForm.amount || parseFloat(creditForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const response = await walletService.addCredit(selectedEmployee._id, {
        amount: parseFloat(creditForm.amount),
        description: creditForm.description || 'Money added by admin'
      });

      if (response.success) {
        toast.success('Money added successfully');
        setShowAddMoneyModal(false);

        const walletRes = await walletService.getWallet(selectedEmployee._id);
        if (walletRes.success) {
          setEmployeeWallets(prev => ({
            ...prev,
            [selectedEmployee._id]: walletRes.data
          }));
        }

        if (expandedEmployee === selectedEmployee._id) {
          await fetchEmployeeTransactions(selectedEmployee._id, 1);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add money');
    }
  };

  // Export handlers
  const handleOpenExportModal = (employee) => {
    setExportEmployee(employee);
    setExportDateRange({ startDate: '', endDate: '' });
    setShowExportModal(true);
  };

  const handleExport = async (type) => {
    if (!exportEmployee) return;

    try {
      setExporting(true);
      let transactions = [];

      if (type === 'all') {
        // Download last 1000 transactions
        const response = await walletService.getTransactions(exportEmployee._id, { limit: 1000 });
        if (response.success) {
          transactions = response.data.transactions || [];
        }
      } else if (type === 'dateRange') {
        // Validate date range
        if (!exportDateRange.startDate || !exportDateRange.endDate) {
          toast.error('Please select both start and end dates');
          setExporting(false);
          return;
        }

        // Fetch all transactions and filter by date
        const response = await walletService.getTransactions(exportEmployee._id, { limit: 1000 });
        if (response.success) {
          const startDate = new Date(exportDateRange.startDate);
          const endDate = new Date(exportDateRange.endDate);
          endDate.setHours(23, 59, 59, 999); // Include entire end day

          transactions = (response.data.transactions || []).filter(tx => {
            const txDate = new Date(tx.createdAt);
            return txDate >= startDate && txDate <= endDate;
          });
        }
      }

      if (transactions.length === 0) {
        toast.error('No transactions found for the selected criteria');
        setExporting(false);
        return;
      }

      // Export to CSV
      walletService.exportTransactionsCSV(transactions);
      toast.success(`Exported ${transactions.length} transactions`);
      setShowExportModal(false);
    } catch (error) {
      toast.error('Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Employee view - just render EmployeeWalletSection
  if (!isAdminOrManager) {
    return (
      <div className="min-h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-6 lg:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
                <p className="text-gray-600 mt-0.5">Manage your expenses and view transaction history</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
          <EmployeeWalletSection />
        </div>
      </div>
    );
  }

  // Admin/Manager view
  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Employee Wallets</h1>
                <p className="text-gray-600 mt-0.5">Manage employee wallet balances and transactions</p>
              </div>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No employees found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => {
              const wallet = employeeWallets[employee._id];
              const isExpanded = expandedEmployee === employee._id;
              const transactions = employeeTransactions[employee._id] || [];
              const pageInfo = employeeTransactionPages[employee._id];
              const isLoadingMore = loadingMoreTransactions[employee._id];
              const hasMore = pageInfo && pageInfo.currentPage < pageInfo.totalPages;

              return (
                <div
                  key={employee._id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg"
                >
                  {/* Card Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                          {employee.avatar ? (
                            <img src={employee.avatar} alt={employee.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span className="text-white font-bold">
                              {employee.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                          <p className="text-sm text-gray-500">{employee.department || 'No department'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenExportModal(employee)}
                          className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition"
                          title="Export Transactions"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenAddMoney(employee)}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
                          title="Add Money"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Wallet Balance */}
                    <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Current Balance</div>
                      <div className={`text-3xl font-bold ${(wallet?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{wallet?.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => handleExpandEmployee(employee._id)}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide Transactions
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          View Transactions
                        </>
                      )}
                    </button>
                  </div>

                  {/* Expanded Transactions */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">Recent Transactions</h4>
                        {pageInfo && (
                          <span className="text-xs text-gray-500">
                            Showing {transactions.length} of {pageInfo.total}
                          </span>
                        )}
                      </div>
                      {transactions.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No transactions yet</p>
                      ) : (
                        <>
                          <div className="space-y-2 max-h-80 overflow-y-auto">
                            {transactions.map((tx) => (
                              <div
                                key={tx._id}
                                className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-full ${tx.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {tx.type === 'credit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {tx.type === 'credit' ? 'Credit' : 'Expense'}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {moment(tx.createdAt).format('DD/MM/YY HH:mm')}
                                    </p>
                                  </div>
                                </div>
                                <span className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                  {tx.type === 'credit' ? '+' : '-'}₹{tx.amount?.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Load More Button */}
                          {hasMore && (
                            <button
                              onClick={() => handleLoadMoreTransactions(employee._id)}
                              disabled={isLoadingMore}
                              className="w-full mt-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isLoadingMore ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4" />
                                  Load More
                                </>
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Money Modal */}
      {showAddMoneyModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Add Money to Wallet</h3>
              <button
                onClick={() => setShowAddMoneyModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddMoney} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 bo rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{selectedEmployee.name?.charAt(0)}</span>
                  </div>
                  <span className="text-gray-700 font-medium">{selectedEmployee.name}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={creditForm.description}
                  onChange={(e) => setCreditForm({ ...creditForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Reason for adding money"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMoneyModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition font-medium shadow-md"
                >
                  Add Money
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && exportEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Export Transactions</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{exportEmployee.name?.charAt(0)}</span>
                  </div>
                  <span className="text-gray-700 font-medium">{exportEmployee.name}</span>
                </div>
              </div>

              {/* Date Range Selection */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Select Date Range</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="date"
                      value={exportDateRange.startDate}
                      onChange={(e) => setExportDateRange({ ...exportDateRange, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={exportDateRange.endDate}
                      onChange={(e) => setExportDateRange({ ...exportDateRange, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleExport('dateRange')}
                  disabled={exporting}
                  className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export Date Range
                </button>
              </div>

              {/* Quick Export */}
              <div className="text-center">
                <span className="text-sm text-gray-500">Or</span>
              </div>

              <button
                onClick={() => handleExport('all')}
                disabled={exporting}
                className="w-full mt-4 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download All Transactions (Last 1000)
              </button>

              <button
                onClick={() => setShowExportModal(false)}
                className="w-full mt-3 px-4 py-2 text-gray-500 hover:text-gray-700 transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
