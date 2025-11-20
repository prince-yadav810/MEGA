import React from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';

const CompactAdvancePayments = ({ advancesData }) => {
  if (!advancesData || !advancesData.total || advancesData.total === 0) {
    return null;
  }

  const {
    monthlyAdvances = [],
    totalAdvancesThisMonth = 0,
    pendingAdvances = []
  } = advancesData;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-2.5 rounded-lg shadow-sm">
            <DollarSign className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-0.5">Advance Payments</h3>
            <p className="text-xl font-bold text-gray-900">
              ₹{totalAdvancesThisMonth?.toLocaleString('en-IN') || 0}
            </p>
          </div>
          {monthlyAdvances.length > 0 && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{monthlyAdvances.length}</span> request{monthlyAdvances.length > 1 ? 's' : ''} this month
            </div>
          )}
        </div>
        
        {pendingAdvances && pendingAdvances.length > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-800">
              {pendingAdvances.length} Pending
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompactAdvancePayments;

