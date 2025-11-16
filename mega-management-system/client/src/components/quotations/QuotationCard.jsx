import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  IndianRupee,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { downloadPdf } from '../../services/quotationService';
import toast from 'react-hot-toast';

/**
 * QuotationCard Component
 * Displays quotation metadata with status and priority badges
 * Clicking the card navigates to the detail page
 */
const QuotationCard = ({ quotation }) => {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = React.useState(false);

  /**
   * Format date
   */
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  /**
   * Format currency in Indian Rupees
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  /**
   * Handle download PDF
   */
  const handleDownload = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      await downloadPdf(quotation._id, quotation.fileName);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Navigate to detail page
   */
  const handleCardClick = () => {
    navigate(`/quotations/${quotation._id}`);
  };

  /**
   * Get status badge config
   */
  const getStatusBadge = () => {
    switch (quotation.status) {
      case 'approved':
        return {
          icon: CheckCircle,
          text: 'Approved',
          className: 'bg-green-100 text-green-700 border-green-200'
        };
      case 'rejected':
        return {
          icon: XCircle,
          text: 'Rejected',
          className: 'bg-red-100 text-red-700 border-red-200'
        };
      case 'on_hold':
      default:
        return {
          icon: Clock,
          text: 'On Hold',
          className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
        };
    }
  };

  /**
   * Get priority badge config
   */
  const getPriorityBadge = () => {
    switch (quotation.priority) {
      case 'extreme':
        return {
          icon: Zap,
          text: 'Extreme',
          className: 'bg-red-100 text-red-700 border-red-200 animate-pulse'
        };
      case 'high':
        return {
          icon: AlertTriangle,
          text: 'High',
          className: 'bg-orange-100 text-orange-700 border-orange-200'
        };
      case 'low':
      default:
        return {
          icon: null,
          text: 'Low',
          className: 'bg-gray-100 text-gray-600 border-gray-200'
        };
    }
  };

  const statusBadge = getStatusBadge();
  const priorityBadge = getPriorityBadge();
  const StatusIcon = statusBadge.icon;
  const PriorityIcon = priorityBadge.icon;

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 cursor-pointer transform hover:-translate-y-1"
    >
      {/* Header with PDF icon and download */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white bg-opacity-20 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div className="text-white">
            <p className="font-semibold text-lg">{quotation.refNo}</p>
            <p className="text-xs text-primary-100">Quotation</p>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
          title="Download PDF"
        >
          {isDownloading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Download className="h-5 w-5 text-white" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Client Name */}
        <div className="flex items-start space-x-3">
          <Building2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 font-medium">Client</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {quotation.clientName}
            </p>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-start space-x-3">
          <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium">Date</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(quotation.date)}
            </p>
          </div>
        </div>

        {/* Grand Total */}
        <div className="flex items-start space-x-3">
          <IndianRupee className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium">Grand Total</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(quotation.grandTotal)}
            </p>
            <p className="text-xs text-gray-500">
              ({quotation.items?.length || 0} items)
            </p>
          </div>
        </div>
      </div>

      {/* Status & Priority Badges */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          {/* Status Badge */}
          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${statusBadge.className}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            <span>{statusBadge.text}</span>
          </div>

          {/* Priority Badge */}
          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${priorityBadge.className}`}>
            {PriorityIcon && <PriorityIcon className="h-3.5 w-3.5" />}
            <span>{priorityBadge.text}</span>
          </div>
        </div>

        {/* Created Date */}
        <p className="text-xs text-gray-400 mt-2">
          Created {formatDate(quotation.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default QuotationCard;
