import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

const QuotationsList = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample quotations data
  const sampleQuotations = [
    {
      id: 1,
      number: "Q-2024-001",
      client: "ABC Industries",
      title: "Industrial Hoses & Connectors",
      amount: "₹2,50,000",
      status: "pending",
      createdDate: "2024-12-01",
      validUntil: "2024-12-31",
      items: 12
    },
    {
      id: 2,
      number: "Q-2024-002",
      client: "XYZ Corporation",
      title: "Safety Equipment Package",
      amount: "₹1,85,000",
      status: "approved",
      createdDate: "2024-11-28",
      validUntil: "2024-12-28",
      items: 8
    },
    {
      id: 3,
      number: "Q-2024-003",
      client: "DEF Engineering",
      title: "Hydraulic System Components",
      amount: "₹3,75,000",
      status: "rejected",
      createdDate: "2024-11-25",
      validUntil: "2024-12-25",
      items: 15
    }
  ];

  const statusConfig = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved: { label: "Approved", color: "bg-success-100 text-success-800", icon: CheckCircle },
    rejected: { label: "Rejected", color: "bg-error-100 text-error-800", icon: XCircle },
    expired: { label: "Expired", color: "bg-gray-100 text-gray-800", icon: Calendar }
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 lg:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">Quotations</h1>
            <p className="text-gray-600">Manage quotes and proposals</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-200 transition-colors">
              <Upload className="h-4 w-4" />
              <span>Upload Excel</span>
            </button>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-primary-700 transition-colors">
              <Plus className="h-4 w-4" />
              <span>New Quote</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:space-x-4">
          <div className="relative flex-1 max-w-md mb-4 lg:mb-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-6 lg:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quotes</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div className="bg-primary-100 p-2 rounded-full">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">5</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-success-600">4</p>
              </div>
              <div className="bg-success-100 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-primary-600">₹28.5L</p>
              </div>
              <div className="bg-primary-100 p-2 rounded-full">
                <DollarSign className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quotations Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Quotations</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quote Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sampleQuotations.map((quote) => {
                  const StatusIcon = statusConfig[quote.status].icon;
                  
                  return (
                    <tr key={quote.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{quote.number}</div>
                          <div className="text-sm text-gray-500">{quote.title}</div>
                          <div className="text-xs text-gray-400 mt-1">{quote.items} items</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{quote.client}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{quote.amount}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[quote.status].color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[quote.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(quote.validUntil).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1 text-gray-400 hover:text-gray-600" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-primary-600" title="Download">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationsList;