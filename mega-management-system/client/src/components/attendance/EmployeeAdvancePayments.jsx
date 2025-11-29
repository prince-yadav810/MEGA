// File Path: client/src/components/attendance/EmployeeAdvancePayments.jsx

import React, { useState } from 'react';
import { DollarSign, Calendar, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import moment from 'moment';

const EmployeeAdvancePayments = ({ advances = [] }) => {
  const [showAll, setShowAll] = useState(false);

  if (!advances || advances.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center text-gray-900">
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-2.5 rounded-lg mr-3 shadow-sm">
            <DollarSign className="w-5 h-5 text-yellow-600" />
          </div>
          Advance Payments
        </h2>
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No advance payments taken</p>
        </div>
      </div>
    );
  }

  // Calculate total
  const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);

  // Sort by date (newest first)
  const sortedAdvances = [...advances].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  // Show first 5 or all
  const displayedAdvances = showAll ? sortedAdvances : sortedAdvances.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center text-gray-900">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-2.5 rounded-lg mr-3 shadow-sm">
          <DollarSign className="w-5 h-5 text-yellow-600" />
        </div>
        Advance Payments
      </h2>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg p-6 mb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1 font-medium">Total Advance Payments</p>
            <p className="text-4xl font-bold text-yellow-700">
              ₹{totalAdvances.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-gray-600 mt-2">{advances.length} payment{advances.length > 1 ? 's' : ''} taken</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-full">
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Advances are deducted from your monthly salary. Contact your manager for any clarifications.
        </p>
      </div>

      {/* Advance History */}
      <div>
        <h3 className="text-md font-semibold text-gray-900 mb-3">Advance History</h3>
        <div className="space-y-3">
          {displayedAdvances.map((advance, index) => (
            <div
              key={advance._id || index}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-yellow-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{advance.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{moment(advance.date).format('DD MMM YYYY')}</span>
                </div>
              </div>

              {advance.reason && (
                <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Reason:</span> {advance.reason}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show More/Less Button */}
        {advances.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show All ({advances.length} total)
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmployeeAdvancePayments;

