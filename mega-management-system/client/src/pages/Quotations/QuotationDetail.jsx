import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Trash2,
  Edit2,
  Save,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Plus,
  Calendar,
  User,
  FileText,
  Loader2,
  Building2,
  IndianRupee
} from 'lucide-react';
import {
  getQuotation,
  downloadPdf,
  updateFileName,
  updateStatus,
  updatePriority,
  createLinkedTask,
  deleteQuotation
} from '../../services/quotationService';
import userService from '../../services/userService';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

/**
 * QuotationDetail Page
 * Comprehensive view for managing a single quotation
 * Features: Status/Priority management, Task creation, PDF preview
 */
const QuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Editing states
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [savingFileName, setSavingFileName] = useState(false);

  // Status states
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  // Priority states
  const [newPriority, setNewPriority] = useState('');
  const [savingPriority, setSavingPriority] = useState(false);

  // Task creation states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignees: [],
    dueDate: '',
    estimatedTime: ''
  });
  const [users, setUsers] = useState([]);
  const [savingTask, setSavingTask] = useState(false);

  // Fetch quotation on mount
  useEffect(() => {
    fetchQuotation();
    fetchUsers();
  }, [id]);

  /**
   * Fetch quotation details
   */
  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await getQuotation(id);
      if (response.success) {
        setQuotation(response.data);
        setNewFileName(response.data.fileName?.replace('.pdf', '') || '');
        setNewStatus(response.data.status);
        setStatusNote(response.data.statusNote || '');
        setNewPriority(response.data.priority);
      }
    } catch (error) {
      console.error('Error fetching quotation:', error);
      toast.error('Failed to load quotation');
      navigate('/quotations');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch users for task assignment
   */
  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

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
   * Format currency
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
  const handleDownload = async () => {
    if (!quotation.pdfUrl) {
      toast.error('PDF not available for download');
      return;
    }

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
   * Handle delete quotation
   */
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteQuotation(quotation._id);
      toast.success('Quotation deleted successfully');
      navigate('/quotations');
    } catch (error) {
      toast.error(error.message || 'Failed to delete quotation');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  /**
   * Handle save filename
   */
  const handleSaveFileName = async () => {
    if (!newFileName.trim()) {
      toast.error('Filename cannot be empty');
      return;
    }

    setSavingFileName(true);
    try {
      const response = await updateFileName(quotation._id, newFileName);
      setQuotation(response.data);
      setIsEditingFileName(false);
      toast.success('Filename updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update filename');
    } finally {
      setSavingFileName(false);
    }
  };

  /**
   * Handle save status
   */
  const handleSaveStatus = async () => {
    if (newStatus === quotation.status && statusNote === quotation.statusNote) {
      toast.info('No changes to save');
      return;
    }

    setSavingStatus(true);
    try {
      const response = await updateStatus(quotation._id, newStatus, statusNote);
      setQuotation(response.data);
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  /**
   * Handle save priority
   */
  const handleSavePriority = async () => {
    if (newPriority === quotation.priority) {
      toast.info('No changes to save');
      return;
    }

    setSavingPriority(true);
    try {
      const response = await updatePriority(quotation._id, newPriority);
      setQuotation(response.data);
      toast.success('Priority updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update priority');
    } finally {
      setSavingPriority(false);
    }
  };

  /**
   * Handle create task
   */
  const handleCreateTask = async () => {
    if (!taskData.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!taskData.dueDate) {
      toast.error('Due date is required');
      return;
    }

    setSavingTask(true);
    try {
      const response = await createLinkedTask(quotation._id, taskData);
      setQuotation(prev => ({
        ...prev,
        linkedTasks: [...(prev.linkedTasks || []), response.data]
      }));
      setShowTaskForm(false);
      setTaskData({
        title: '',
        description: '',
        priority: 'medium',
        assignees: [],
        dueDate: '',
        estimatedTime: ''
      });
      toast.success('Task created successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to create task');
    } finally {
      setSavingTask(false);
    }
  };

  /**
   * Get status badge config
   */
  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return { icon: CheckCircle, text: 'Approved', color: 'text-green-600', bg: 'bg-green-100' };
      case 'rejected':
        return { icon: XCircle, text: 'Rejected', color: 'text-red-600', bg: 'bg-red-100' };
      default:
        return { icon: Clock, text: 'On Hold', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    }
  };

  /**
   * Get priority badge config
   */
  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'extreme':
        return { icon: Zap, text: 'Extreme', color: 'text-red-600', bg: 'bg-red-100' };
      case 'high':
        return { icon: AlertTriangle, text: 'High', color: 'text-orange-600', bg: 'bg-orange-100' };
      default:
        return { icon: null, text: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading quotation...</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Quotation not found</p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(quotation.status);
  const priorityConfig = getPriorityConfig(quotation.priority);
  const StatusIcon = statusConfig.icon;
  const PriorityIcon = priorityConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/quotations')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Quotations
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quotation.refNo}</h1>
              <p className="text-gray-600">{quotation.clientName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {isDownloading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              Download PDF
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Management */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quotation Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quotation Details</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Client</p>
                  <p className="font-medium">{quotation.clientName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(quotation.date)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <IndianRupee className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Grand Total</p>
                  <p className="font-bold text-green-600 text-lg">{formatCurrency(quotation.grandTotal)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="on_hold">On Hold</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Note {newStatus === 'rejected' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder={newStatus === 'rejected' ? 'Please provide reason for rejection...' : 'Optional note...'}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleSaveStatus}
                disabled={savingStatus}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
              >
                {savingStatus ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Status
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Priority Management */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Priority</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['low', 'high', 'extreme'].map((p) => {
                  const config = getPriorityConfig(p);
                  return (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                        newPriority === p
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={`text-sm font-medium ${config.color}`}>{config.text}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSavePriority}
                disabled={savingPriority}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
              >
                {savingPriority ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Priority
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Filename Editor */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">File Name</h2>
            {isEditingFileName ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter filename"
                  />
                  <span className="text-gray-500">.pdf</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveFileName}
                    disabled={savingFileName}
                    className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
                  >
                    {savingFileName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingFileName(false);
                      setNewFileName(quotation.fileName?.replace('.pdf', '') || '');
                    }}
                    className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <X className="h-4 w-4 mx-auto" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded border flex-1 truncate">
                  {quotation.fileName}
                </p>
                <button
                  onClick={() => setIsEditingFileName(true)}
                  className="ml-2 p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Task Creation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Linked Tasks</h2>
              <button
                onClick={() => setShowTaskForm(true)}
                className="inline-flex items-center px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </button>
            </div>

            {/* Task List */}
            {quotation.linkedTasks && quotation.linkedTasks.length > 0 ? (
              <div className="space-y-3">
                {quotation.linkedTasks.map((task) => (
                  <div key={task._id} className="p-3 bg-gray-50 rounded-lg border">
                    <p className="font-medium text-sm">{task.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Due: {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No tasks linked yet</p>
            )}
          </div>
        </div>

        {/* Right Column - PDF Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">PDF Preview</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: '800px' }}>
              {quotation.pdfUrl ? (
                <iframe
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${quotation.pdfUrl}`}
                  title="Quotation PDF"
                  className="w-full h-full"
                  style={{ border: 'none' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">PDF not available</p>
                    <p className="text-sm text-gray-500 mt-1">
                      The PDF file for this quotation has not been uploaded yet.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      <Modal
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        title="Create Linked Task"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={taskData.title}
              onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
              placeholder={`[${quotation.refNo}] Task title...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={taskData.description}
              onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
              placeholder="Task description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={taskData.priority}
                onChange={(e) => setTaskData({ ...taskData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input
                type="date"
                value={taskData.dueDate}
                onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignees</label>
            <select
              multiple
              value={taskData.assignees}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setTaskData({ ...taskData, assignees: selected });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              size={4}
            >
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
            <input
              type="text"
              value={taskData.estimatedTime}
              onChange={(e) => setTaskData({ ...taskData, estimatedTime: e.target.value })}
              placeholder="e.g., 2h, 1d"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleCreateTask}
              disabled={savingTask}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
            >
              {savingTask ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Create Task
                </>
              )}
            </button>
            <button
              onClick={() => setShowTaskForm(false)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Quotation?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete quotation <strong>{quotation.refNo}</strong> for{' '}
              <strong>{quotation.clientName}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationDetail;
