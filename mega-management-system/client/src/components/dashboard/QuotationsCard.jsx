import React from 'react';
import { FileText, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuotationsCard = ({ quotations = [] }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      extreme: 'text-red-600 bg-red-100 border-red-200',
      high: 'text-orange-600 bg-orange-100 border-orange-200',
      low: 'text-blue-600 bg-blue-100 border-blue-200'
    };
    return colors[priority] || colors.low;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalValue = quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">On-Hold Quotations</h3>
        </div>
        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
          {quotations.length}
        </span>
      </div>

      {quotations.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No quotations on hold</p>
          <p className="text-sm text-gray-400 mt-1">All quotations are processed!</p>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-orange-700 mb-1">Total Value On Hold</p>
            <p className="text-2xl font-bold text-orange-900">{formatCurrency(totalValue)}</p>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {quotations.map((quotation) => (
              <div
                key={quotation._id}
                className={`border rounded-lg p-3 hover:shadow-sm transition-all ${getPriorityColor(quotation.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {quotation.refNo}
                      </h4>
                      {quotation.priority === 'extreme' && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-700 font-medium mb-1">
                      {quotation.clientName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatCurrency(quotation.grandTotal)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1 ml-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getPriorityColor(quotation.priority)}`}>
                      {quotation.priority}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(quotation.date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Link
        to="/quotations"
        className="mt-4 w-full bg-orange-50 text-orange-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-orange-100 transition-colors"
      >
        <span>View All Quotations</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
};

export default QuotationsCard;

