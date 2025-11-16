import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Loader2,
  Plus,
  ArrowUpDown,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { getQuotations } from '../../services/quotationService';
import QuotationUploadModal from '../../components/quotations/QuotationUploadModal';
import QuotationCard from '../../components/quotations/QuotationCard';
import toast from 'react-hot-toast';

/**
 * QuotationsList Page
 * Main page for quotation management
 * Features: Upload Excel via modal, View quotations, Download PDFs, Sorting
 */
const QuotationsList = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');

  // Fetch quotations on component mount
  useEffect(() => {
    fetchQuotations();
  }, []);

  /**
   * Fetch all quotations
   */
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await getQuotations();

      if (response.success) {
        setQuotations(response.data);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle successful upload
   */
  const handleUploadSuccess = (newQuotation) => {
    setQuotations((prev) => [newQuotation, ...prev]);
  };

  /**
   * Calculate counts for sorting badges
   */
  const getCounts = () => ({
    // Status counts
    on_hold: quotations.filter((q) => q.status === 'on_hold').length,
    approved: quotations.filter((q) => q.status === 'approved').length,
    rejected: quotations.filter((q) => q.status === 'rejected').length,
    // Priority counts
    low: quotations.filter((q) => q.priority === 'low').length,
    high: quotations.filter((q) => q.priority === 'high').length,
    extreme: quotations.filter((q) => q.priority === 'extreme').length
  });

  const counts = getCounts();

  /**
   * Get unique client names for filter dropdown
   */
  const getUniqueClients = () => {
    const clients = quotations.map((q) => q.clientName).filter(Boolean);
    return [...new Set(clients)].sort();
  };

  const uniqueClients = getUniqueClients();

  /**
   * Filter quotations based on search query and filters
   */
  const filteredQuotations = quotations.filter((quotation) => {
    // Apply status filter
    if (statusFilter !== 'all' && quotation.status !== statusFilter) {
      return false;
    }

    // Apply priority filter
    if (priorityFilter !== 'all' && quotation.priority !== priorityFilter) {
      return false;
    }

    // Apply client filter
    if (clientFilter !== 'all' && quotation.clientName !== clientFilter) {
      return false;
    }

    // Apply search query
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      quotation.refNo?.toLowerCase().includes(query) ||
      quotation.clientName?.toLowerCase().includes(query) ||
      quotation.fileName?.toLowerCase().includes(query)
    );
  });

  /**
   * Sort quotations
   */
  const sortedQuotations = [...filteredQuotations].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date) - new Date(b.date);
        break;
      case 'grandTotal':
        comparison = (a.grandTotal || 0) - (b.grandTotal || 0);
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setClientFilter('all');
    setSearchQuery('');
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || clientFilter !== 'all' || searchQuery;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
              <p className="text-gray-600">Upload and manage your quotations</p>
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="hidden sm:inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            Upload Excel
          </button>
        </div>
      </div>

      {/* Quotations List Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header with Count and Controls */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              All Quotations{' '}
              <span className="text-gray-500 font-normal">({quotations.length})</span>
            </h2>

            {/* Sort Controls */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="date">Date</option>
                  <option value="grandTotal">Amount</option>
                </select>
              </div>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="all">All Status ({quotations.length})</option>
                <option value="on_hold">On Hold ({counts.on_hold})</option>
                <option value="approved">Approved ({counts.approved})</option>
                <option value="rejected">Rejected ({counts.rejected})</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="all">All Priority ({quotations.length})</option>
                <option value="extreme">Extreme ({counts.extreme})</option>
                <option value="high">High ({counts.high})</option>
                <option value="low">Low ({counts.low})</option>
              </select>
            </div>

            {/* Client Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Client
              </label>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="all">All Clients ({uniqueClients.length})</option>
                {uniqueClients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Info */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700">
                Showing {sortedQuotations.length} of {quotations.length} quotations
                {statusFilter !== 'all' && ` • Status: ${statusFilter.replace('_', ' ')}`}
                {priorityFilter !== 'all' && ` • Priority: ${priorityFilter}`}
                {clientFilter !== 'all' && ` • Client: ${clientFilter}`}
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Status/Priority Quick Stats */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-xs">
              <Clock className="h-3 w-3 text-yellow-600" />
              <span className="text-yellow-700 font-medium">On Hold: {counts.on_hold}</span>
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full text-xs">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-green-700 font-medium">Approved: {counts.approved}</span>
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 border border-red-200 rounded-full text-xs">
              <XCircle className="h-3 w-3 text-red-600" />
              <span className="text-red-700 font-medium">Rejected: {counts.rejected}</span>
            </div>
            <div className="border-l border-gray-300 mx-2"></div>
            <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 border border-red-200 rounded-full text-xs">
              <Zap className="h-3 w-3 text-red-600" />
              <span className="text-red-700 font-medium">Extreme: {counts.extreme}</span>
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 bg-orange-50 border border-orange-200 rounded-full text-xs">
              <AlertTriangle className="h-3 w-3 text-orange-600" />
              <span className="text-orange-700 font-medium">High: {counts.high}</span>
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs">
              <span className="text-gray-700 font-medium">Low: {counts.low}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by Ref No, Client Name, or Filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading quotations...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && quotations.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quotations yet</h3>
            <p className="text-gray-600 mb-4">
              Upload an Excel file to create your first quotation
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload Excel
            </button>
          </div>
        )}

        {/* No Search Results */}
        {!loading && quotations.length > 0 && sortedQuotations.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">No quotations match "{searchQuery}"</p>
          </div>
        )}

        {/* Quotations Grid */}
        {!loading && sortedQuotations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedQuotations.map((quotation) => (
              <QuotationCard key={quotation._id} quotation={quotation} />
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && sortedQuotations.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Showing {sortedQuotations.length} of {quotations.length} quotations
            </p>
          </div>
        )}
      </div>

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setIsUploadModalOpen(true)}
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Upload Modal */}
      <QuotationUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default QuotationsList;
