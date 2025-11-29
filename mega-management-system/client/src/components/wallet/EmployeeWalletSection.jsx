import React, { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowDownRight, ArrowUpRight, Calendar, X, AlertCircle } from 'lucide-react';
import walletService from '../../services/walletService';
import toast from 'react-hot-toast';
import moment from 'moment';
import { useAuth } from '../../context/AuthContext';

export default function EmployeeWalletSection() {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: ''
  });

  useEffect(() => {
    if (user?.id || user?._id) {
      fetchWalletData();
      fetchTransactions();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const userId = user?.id || user?._id;
      const response = await walletService.getWallet(userId);
      if (response.success) {
        setWalletData(response.data);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to fetch wallet data');
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const userId = user?.id || user?._id;
      const response = await walletService.getTransactions(userId, { limit: 20 });
      if (response.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!expenseForm.description || expenseForm.description.trim() === '') {
      toast.error('Description is required for expenses');
      return;
    }

    try {
      const userId = user?.id || user?._id;
      const response = await walletService.addDebit(userId, {
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description.trim()
      });

      if (response.success) {
        toast.success('Expense recorded successfully');
        setShowAddExpenseModal(false);
        setExpenseForm({ amount: '', description: '' });
        fetchWalletData();
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record expense');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">My Wallet</h2>
        </div>
        <button
          onClick={() => setShowAddExpenseModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Wallet Balance Card */}
      <div className="border-2 border-gray-200 rounded-lg p-4 sm:p-6 mb-6 bg-white">
        <div className="text-sm text-gray-600 mb-2">Current Balance</div>
        <div className={`text-3xl sm:text-4xl font-bold ${walletData?.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          ₹{walletData?.balance?.toFixed(2) || '0.00'}
        </div>
        {walletData?.balance < 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm bg-red-50 text-red-700 px-3 py-2 rounded border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Your balance is negative. Please contact admin.</span>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction History</h3>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No transactions yet</div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition gap-3"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    transaction.type === 'credit'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-gray-800">
                        {transaction.type === 'credit' ? 'Money Received' : 'Expense'}
                      </span>
                      {transaction.type === 'credit' && (
                        <span className="text-xs text-gray-500">
                          by {transaction.createdBy?.name || 'Admin'}
                        </span>
                      )}
                    </div>

                    {transaction.description && (
                      <p className="text-sm text-gray-600 mb-1 break-words">{transaction.description}</p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {moment(transaction.createdAt).format('DD/MM/YYYY hh:mm A')}
                      </span>
                      <span>
                        Balance: ₹{transaction.balanceAfter?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`text-lg font-semibold sm:mt-0 ${
                  transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Record Expense</h3>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Balance
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg">
                  <span className={`text-lg font-semibold ${walletData?.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{walletData?.balance?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Spent (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Where did you spend this money?"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Please provide detailed description of the expense
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
