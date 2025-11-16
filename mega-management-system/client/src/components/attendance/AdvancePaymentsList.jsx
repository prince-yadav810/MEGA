import React, { useState } from 'react';
import { DollarSign, Calendar, CheckCircle, Clock, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import moment from 'moment';

const AdvancePaymentsList = ({ advancesData }) => {
  const [showAllAdvances, setShowAllAdvances] = useState(false);

  if (!advancesData) {
    return (
      <div className="text-center py-8 text-gray-500">
        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>No advance payment data available</p>
      </div>
    );
  }

  const {
    monthlyAdvances = [],
    totalAdvancesThisMonth = 0,
    pendingAdvances = [],
    allAdvances = []
  } = advancesData;

  // Get status color and icon
  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="w-4 h-4 text-green-600" />,
          label: status === 'paid' ? 'Paid' : 'Approved'
        };
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-4 h-4 text-yellow-600" />,
          label: 'Pending'
        };
      case 'deducted':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <CheckCircle className="w-4 h-4 text-blue-600" />,
          label: 'Deducted'
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="w-4 h-4 text-red-600" />,
          label: 'Rejected'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="w-4 h-4 text-gray-600" />,
          label: status
        };
    }
  };

  // Render individual advance card
  const renderAdvanceCard = (advance, index) => {
    const statusConfig = getStatusConfig(advance.status);

    return (
      <div
        key={index}
        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                ₹{advance.amount?.toLocaleString('en-IN') || 0}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {moment(advance.date).format('MMM DD, YYYY')}
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color} flex items-center gap-1`}>
            {statusConfig.icon}
            {statusConfig.label}
          </span>
        </div>

        {advance.reason && (
          <div className="mb-2">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Reason:</span> {advance.reason}
            </p>
          </div>
        )}

        {advance.deductedFromSalary && advance.deductionMonth && (
          <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 mt-2">
            <span className="font-medium">Deducted from:</span> {moment(advance.deductionMonth, 'YYYY-MM').format('MMMM YYYY')} salary
          </div>
        )}

        {advance.approvedDate && (
          <div className="text-xs text-gray-600 mt-2">
            <span className="font-medium">Approved on:</span> {moment(advance.approvedDate).format('MMM DD, YYYY')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Advances This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{totalAdvancesThisMonth?.toLocaleString('en-IN') || 0}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Total Requests</p>
            <p className="text-lg font-semibold text-blue-600">
              {monthlyAdvances.length}
            </p>
          </div>
        </div>
      </div>

      {/* Pending Advances Alert */}
      {pendingAdvances && pendingAdvances.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 mb-1">
                Pending Advances ({pendingAdvances.length})
              </h4>
              <p className="text-sm text-yellow-800">
                You have {pendingAdvances.length} advance payment{pendingAdvances.length > 1 ? 's' : ''} awaiting approval
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Advances */}
      {monthlyAdvances.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            This Month's Advances ({monthlyAdvances.length})
          </h4>
          <div className="space-y-3 mb-4">
            {monthlyAdvances.map((advance, index) => renderAdvanceCard(advance, `monthly-${index}`))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <DollarSign className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 text-sm">No advances taken this month</p>
        </div>
      )}

      {/* All Advances History - Collapsible */}
      {allAdvances && allAdvances.length > 0 && allAdvances.length > monthlyAdvances.length && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => setShowAllAdvances(!showAllAdvances)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 mb-3 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              All Advances History ({allAdvances.length})
            </span>
            {showAllAdvances ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {showAllAdvances && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allAdvances.map((advance, index) => renderAdvanceCard(advance, `all-${index}`))}
            </div>
          )}
        </div>
      )}

      {/* Info Note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800">
            Advance payments are deducted from your monthly salary. Check the Salary section on the right for detailed calculations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdvancePaymentsList;
