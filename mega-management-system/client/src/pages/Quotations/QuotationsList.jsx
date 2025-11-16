import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  TrendingUp,
  IndianRupee,
  FileSpreadsheet,
  Loader2,
  Plus
} from 'lucide-react';
import { getQuotations } from '../../services/quotationService';
import QuotationUploadModal from '../../components/quotations/QuotationUploadModal';
import QuotationCard from '../../components/quotations/QuotationCard';
import toast from 'react-hot-toast';

/**
 * QuotationsList Page
 * Main page for quotation management
 * Features: Upload Excel via modal, View quotations, Download PDFs
 */
const QuotationsList = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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
    // Add new quotation to the list
    setQuotations((prev) => [newQuotation, ...prev]);
  };

  /**
   * Filter quotations based on search query
   */
  const filteredQuotations = quotations.filter((quotation) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      quotation.refNo?.toLowerCase().includes(query) ||
      quotation.clientName?.toLowerCase().includes(query) ||
      quotation.fileName?.toLowerCase().includes(query)
    );
  });

  /**
   * Calculate statistics
   */
  const stats = {
    total: quotations.length,
    totalValue: quotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0),
    thisMonth: quotations.filter((q) => {
      const quotationDate = new Date(q.date);
      const now = new Date();
      return (
        quotationDate.getMonth() === now.getMonth() &&
        quotationDate.getFullYear() === now.getFullYear()
      );
    }).length
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Total Quotations */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Quotations</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <FileSpreadsheet className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.thisMonth}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <IndianRupee className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quotations List Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">All Quotations</h2>
          </div>

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
        {!loading && quotations.length > 0 && filteredQuotations.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">
              No quotations match "{searchQuery}"
            </p>
          </div>
        )}

        {/* Quotations Grid */}
        {!loading && filteredQuotations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuotations.map((quotation) => (
              <QuotationCard
                key={quotation._id}
                quotation={quotation}
              />
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && filteredQuotations.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Showing {filteredQuotations.length} of {quotations.length} quotations
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
