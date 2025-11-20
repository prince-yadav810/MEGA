import React, { useState, useEffect } from 'react';
import { X, Phone, Calendar, Clock, CheckCircle, XCircle, AlertCircle, MapPin } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import clientService from '../../services/clientService';
import toast from 'react-hot-toast';

const CallLogModal = ({ isOpen, onClose, client, onSuccess }) => {
  const [formData, setFormData] = useState({
    outcome: 'Fruitful',
    notes: '',
    nextCallDate: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && client) {
      // Reset form when modal opens
      setFormData({
        outcome: 'Fruitful',
        notes: '',
        nextCallDate: calculateDefaultNextCallDate(client.callFrequency || 10)
      });
    }
  }, [isOpen, client]);

  const calculateDefaultNextCallDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const handleOutcomeChange = (outcome) => {
    let nextDate = formData.nextCallDate;
    
    if (outcome === 'Fruitful' || outcome === 'No Answer' || outcome === 'Busy') {
      // Default frequency
      nextDate = calculateDefaultNextCallDate(client.callFrequency || 10);
    } else if (outcome === 'Callback Requested' || outcome === 'Need to Visit') {
      // Reset to today so they can pick
      nextDate = new Date().toISOString().split('T')[0];
    }
    
    setFormData({ ...formData, outcome, nextCallDate: nextDate });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!client) return;

    setLoading(true);
    try {
      const response = await clientService.logCall({
        clientId: client._id || client.id,
        ...formData
      });

      if (response.success) {
        toast.success('Call logged successfully');
        onSuccess && onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error logging call:', error);
      toast.error('Failed to log call');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const outcomes = [
    { value: 'Fruitful', label: 'Fruitful', color: 'text-green-600', icon: CheckCircle },
    { value: 'Not Interested', label: 'Not Interested', color: 'text-red-600', icon: XCircle },
    { value: 'No Answer', label: 'No Answer', color: 'text-orange-600', icon: Phone },
    { value: 'Busy', label: 'Busy', color: 'text-yellow-600', icon: Clock },
    { value: 'Callback Requested', label: 'Callback Requested', color: 'text-blue-600', icon: Calendar },
    { value: 'Need to Visit', label: 'Need to Visit', color: 'text-purple-600', icon: MapPin }
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-primary-600" />
            Log Call Result
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Client Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Client</p>
            <p className="font-medium text-gray-900">{client?.companyName}</p>
          </div>

          {/* Outcome Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call Outcome
            </label>
            <div className="grid grid-cols-2 gap-2">
              {outcomes.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleOutcomeChange(item.value)}
                  className={`
                    flex items-center justify-center p-2 rounded-lg border text-sm font-medium transition-all
                    ${formData.outcome === item.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                    }
                  `}
                >
                  <item.icon className={`w-4 h-4 mr-2 ${formData.outcome === item.value ? 'text-primary-600' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              placeholder="Add call details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Next Call Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Next Follow-up
            </label>
            <Input
              type="date"
              value={formData.nextCallDate}
              onChange={(e) => setFormData({ ...formData, nextCallDate: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Default is based on {client?.callFrequency || 10}-day frequency
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Log'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CallLogModal;

