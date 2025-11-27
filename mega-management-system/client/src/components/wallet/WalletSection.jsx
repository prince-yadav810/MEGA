import React, { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowDownRight, ArrowUpRight, Calendar, User, X } from 'lucide-react';
import walletService from '../../services/walletService';
import toast from 'react-hot-toast';
import moment from 'moment';

export default function WalletSection({ userId, employeeName }) {
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [creditForm, setCreditForm] = useState({
    amount: '',
    description: ''
  });

  useEffect(() => {
    if (userId) {
      fetchWalletData();
      fetchTransactions();
    }
  }, [userId]);

  const fetchWalletData = async () => {
    try {
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
      const response = await walletService.getTransactions(userId, { limit: 10 });
      if (response.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async (e) => {
    e.preventDefault();

    if (!creditForm.amount || parseFloat(creditForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const response = await walletService.addCredit(userId, {
        amount: parseFloat(creditForm.amount),
        description: creditForm.description || 'Money added by admin'
      });

      if (response.success) {
        toast.success('Money added to wallet successfully');
        setShowAddMoneyModal(false);
        setCreditForm({ amount: '', description: '' });
        fetchWalletData();
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add money');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Employee Wallet</h2>
        </div>
        <button
          onClick={() => setShowAddMoneyModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Money
        </button>
      </div>

      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-6">
        <div className="text-sm opacity-90 mb-2">Current Balance</div>
        <div className="text-4xl font-bold">
          ₹{walletData?.balance?.toFixed(2) || '0.00'}
        </div>
        {walletData?.balance < 0 && (
          <div className="mt-2 text-sm bg-red-500/30 px-3 py-1 rounded inline-block">
            Negative Balance
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No transactions yet</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-full ${
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

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">
                        {transaction.type === 'credit' ? 'Money Added' : 'Expense'}
                      </span>
                      <span className="text-xs text-gray-500">
                        by {transaction.createdBy?.name || 'Unknown'}
                      </span>
                    </div>

                    {transaction.description && (
                      <p className="text-sm text-gray-600 mb-1">{transaction.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
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

                <div className={`text-lg font-semibold ${
                  transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-800">Add Money to Wallet</h3>
              <button
                onClick={() => setShowAddMoneyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddMoney} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee
                </label>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{employeeName}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={creditForm.description}
                  onChange={(e) => setCreditForm({ ...creditForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Reason for adding money"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMoneyModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Add Money
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
