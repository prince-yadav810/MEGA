import React, { useState, useEffect, useRef } from 'react';
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
  XCircle,
  Loader
} from 'lucide-react';
import { getQuotations, uploadExcel } from '../../services/quotationService';

const QuotationsList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Fetch quotations on component mount
  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await getQuotations();
      if (response.success) {
        setQuotations(response.data);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
      alert('Failed to load quotations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Selected file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Validate file type - also allow by extension
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];

    const fileName = file.name.toLowerCase();
    const isValidExtension = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');
    const isValidType = validTypes.includes(file.type);

    if (!isValidType && !isValidExtension) {
      alert(`Please upload a valid Excel file (.xls, .xlsx, or .csv)\n\nFile type detected: ${file.type}`);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      console.log('Starting upload...');
      const response = await uploadExcel(file, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      console.log('Upload response:', response);

      if (response.success) {
        alert(
          `Successfully uploaded!\n\n` +
          `Total processed: ${response.data.total}\n` +
          `Saved: ${response.data.saved}\n` +
          (response.data.parseErrors > 0 ? `Parse errors: ${response.data.parseErrors}\n` : '') +
          (response.data.saveErrors > 0 ? `Save errors: ${response.data.saveErrors}` : '')
        );

        // Refresh quotations list
        await fetchQuotations();
      }
    } catch (error) {
      console.error('Error uploading Excel:', error);

      // Show more detailed error
      let errorMessage = 'Failed to upload Excel file. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.error) {
        errorMessage += `\n\nDetails: ${error.error}`;
      }

      alert(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const statusConfig = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved: { label: "Approved", color: "bg-success-100 text-success-800", icon: CheckCircle },
    rejected: { label: "Rejected", color: "bg-error-100 text-error-800", icon: XCircle },
    expired: { label: "Expired", color: "bg-gray-100 text-gray-800", icon: Calendar }
  };

  // Filter and search quotations
  const filteredQuotations = quotations.filter(quote => {
    // Apply status filter
    if (filterStatus !== 'all' && quote.status !== filterStatus) {
      return false;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const matchesNumber = quote.number.toLowerCase().includes(searchLower);
      const matchesTitle = quote.title.toLowerCase().includes(searchLower);
      const matchesClient = quote.client.toLowerCase().includes(searchLower);
      const matchesAmount = quote.amount.toLowerCase().includes(searchLower);

      return matchesNumber || matchesTitle || matchesClient || matchesAmount;
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    total: quotations.length,
    pending: quotations.filter(q => q.status === 'pending').length,
    approved: quotations.filter(q => q.status === 'approved').length,
    totalValue: quotations.reduce((sum, q) => {
      // Extract numeric value from amount string (e.g., "₹2,50,000" -> 250000)
      const numStr = q.amount.replace(/[^\d]/g, '');
      return sum + (parseInt(numStr) || 0);
    }, 0)
  };

  const formatCurrency = (amount) => {
    // Convert to lakhs format
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(1)}L`;
  };

  const sampleQuotations = filteredQuotations;

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
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="hidden"
            />
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>{uploadProgress}%</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload Excel</span>
                </>
              )}
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
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
              {filterStatus !== 'all' && (
                <span className="ml-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  1
                </span>
              )}
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Status</div>
                  <button
                    onClick={() => {
                      setFilterStatus('all');
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                      filterStatus === 'all' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    All Quotations
                  </button>
                  <button
                    onClick={() => {
                      setFilterStatus('pending');
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center ${
                      filterStatus === 'pending' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                    Pending
                  </button>
                  <button
                    onClick={() => {
                      setFilterStatus('approved');
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center ${
                      filterStatus === 'approved' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-success-600" />
                    Approved
                  </button>
                  <button
                    onClick={() => {
                      setFilterStatus('rejected');
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center ${
                      filterStatus === 'rejected' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <XCircle className="h-4 w-4 mr-2 text-error-600" />
                    Rejected
                  </button>
                  <button
                    onClick={() => {
                      setFilterStatus('expired');
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center ${
                      filterStatus === 'expired' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar className="h-4 w-4 mr-2 text-gray-600" />
                    Expired
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 py-6 lg:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quotes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
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
                <p className="text-2xl font-bold text-success-600">{stats.approved}</p>
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
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(stats.totalValue)}</p>
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
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center space-x-2 text-gray-500">
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Loading quotations...</span>
                      </div>
                    </td>
                  </tr>
                ) : sampleQuotations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        {searchQuery || filterStatus !== 'all' ? (
                          <div>
                            <p className="font-medium">No quotations found</p>
                            <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
                          </div>
                        ) : (
                          <div>
                            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                            <p className="font-medium">No quotations yet</p>
                            <p className="text-sm mt-1">Upload an Excel file to get started</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sampleQuotations.map((quote) => {
                    const StatusIcon = statusConfig[quote.status]?.icon || Clock;

                    return (
                      <tr key={quote._id || quote.id} className="hover:bg-gray-50 group">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{quote.number}</div>
                            <div className="text-sm text-gray-500">{quote.title}</div>
                            <div className="text-xs text-gray-400 mt-1">{quote.items || 0} items</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{quote.client}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{quote.amount}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[quote.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[quote.status]?.label || quote.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {new Date(quote.validUntil).toLocaleDateString('en-IN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationsList;