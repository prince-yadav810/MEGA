import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calculator,
  CreditCard,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import moment from 'moment';

const SalaryCalculator = ({ salaryData, advancesData }) => {
  const [showAdvanceDetails, setShowAdvanceDetails] = useState(false);

  if (!salaryData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">Loading salary data...</div>
      </div>
    );
  }

  const { baseSalary, salaryPerDay, earnedSalary, deductions, netSalary } = salaryData;
  const { monthlyAdvances, totalAdvancesThisMonth, pendingAdvances, allAdvances } = advancesData || {};

  // Filter pending advances (approved/paid but not deducted)
  const pendingAdvancesList = allAdvances?.filter(
    adv => ['approved', 'paid'].includes(adv.status) && !adv.deductedFromSalary
  ) || [];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Salary Calculation</h3>
        </div>
      </div>

      {/* Base Salary Card */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Monthly Base Salary</p>
            <p className="text-3xl font-bold text-gray-900">
              ₹{baseSalary?.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <DollarSign className="w-8 h-8 text-gray-700" />
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Per Day: <span className="font-semibold text-gray-900">₹{salaryPerDay?.toLocaleString('en-IN')}</span>
          </p>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="space-y-3 mb-4">
        {/* Earned Salary */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Earned Salary</p>
              <p className="text-xs text-gray-500">Based on attendance</p>
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">
            ₹{earnedSalary?.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Deductions */}
        {deductions > 0 && (
          <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-200 rounded-lg">
                <TrendingDown className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Advance Deductions</p>
                <p className="text-xs text-gray-500">{pendingAdvancesList.length} pending advance(s)</p>
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">
              ₹{deductions?.toLocaleString('en-IN')}
            </p>
          </div>
        )}
      </div>

      {/* Net Salary */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5" />
              <p className="text-sm font-medium opacity-90">Net Salary (Payable)</p>
            </div>
            <p className="text-3xl font-bold">
              ₹{netSalary?.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-75">After Deductions</p>
            <p className="text-lg font-semibold mt-1">
              {((netSalary / baseSalary) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Advances This Month */}
      {monthlyAdvances && monthlyAdvances.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-900">
                Advances Taken This Month
              </p>
            </div>
            <p className="text-lg font-bold text-yellow-700">
              ₹{totalAdvancesThisMonth?.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-yellow-700">
            <span>{monthlyAdvances.length} advance payment(s)</span>
          </div>
        </div>
      )}

      {/* Pending Advances Details */}
      {pendingAdvancesList.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowAdvanceDetails(!showAdvanceDetails)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              View Pending Advances ({pendingAdvancesList.length})
            </span>
            {showAdvanceDetails ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {showAdvanceDetails && (
            <div className="mt-2 space-y-2">
              {pendingAdvancesList.map((advance, index) => (
                <div
                  key={index}
                  className="p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{advance.amount?.toLocaleString('en-IN')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          advance.status === 'approved' ? 'bg-green-100 text-green-800' :
                          advance.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {advance.status?.charAt(0).toUpperCase() + advance.status?.slice(1)}
                        </span>
                      </div>
                      {advance.reason && (
                        <p className="text-xs text-gray-600 mb-1">
                          Reason: {advance.reason}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Date: {moment(advance.date).format('MMM D, YYYY')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Note */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Calculation Note:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Salary calculated based on present days</li>
                <li>Pending advances will be deducted from payable salary</li>
                <li>Half-days count as 0.5 working days</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryCalculator;
