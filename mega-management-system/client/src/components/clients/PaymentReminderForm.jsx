// File Path: client/src/components/clients/PaymentReminderForm.jsx

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const PaymentReminderForm = ({ isOpen, onClose, onSubmit, client, isLoading = false }) => {
  const [formData, setFormData] = useState({
    messageTemplate: '',
    frequencyInDays: 2,
    totalMessagesToSend: 5,
    invoiceNumber: '',
    invoiceAmount: '',
    dueDate: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Get primary contact for display
  const primaryContact = client?.contactPersons?.find(c => c.isPrimary) || client?.contactPersons?.[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.messageTemplate.trim()) {
      newErrors.messageTemplate = 'Message template is required';
    }

    if (!formData.frequencyInDays || formData.frequencyInDays < 1) {
      newErrors.frequencyInDays = 'Frequency must be at least 1 day';
    }

    if (!formData.totalMessagesToSend || formData.totalMessagesToSend < 1) {
      newErrors.totalMessagesToSend = 'Must send at least 1 message';
    }

    if (formData.totalMessagesToSend > 10) {
      newErrors.totalMessagesToSend = 'Cannot send more than 10 messages';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      messageTemplate: '',
      frequencyInDays: 2,
      totalMessagesToSend: 5,
      invoiceNumber: '',
      invoiceAmount: '',
      dueDate: '',
      notes: ''
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Generate example message preview
  const getMessagePreview = () => {
    if (!formData.messageTemplate) return '';

    const primaryContactName = primaryContact?.name || 'Sir/Madam';

    return formData.messageTemplate
      .replace(/\{\{\s*clientName\s*\}\}/gi, client?.companyName || '[Client Name]')
      .replace(/\{\{\s*contactName\s*\}\}/gi, primaryContactName)
      .replace(/\{\{\s*companyName\s*\}\}/gi, 'MEGA Enterprises')
      .replace(/\{\{\s*companyPhone\s*\}\}/gi, '[Company Phone]')
      .replace(/\{\{\s*invoiceNumber\s*\}\}/gi, formData.invoiceNumber || '[Invoice Number]')
      .replace(/\{\{\s*invoiceAmount\s*\}\}/gi, formData.invoiceAmount ? `₹${formData.invoiceAmount}` : '[Amount]')
      .replace(/\{\{\s*dueDate\s*\}\}/gi, formData.dueDate || '[Due Date]');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Setup Payment Reminder"
      size="lg"
      footer={
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={isLoading}>
            Create Reminder Campaign
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Info Display */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-primary-900 mb-2">Reminder will be sent to:</h4>
          <div className="space-y-1 text-sm text-primary-800">
            <p><strong>Company:</strong> {client?.companyName}</p>
            {primaryContact && (
              <>
                <p><strong>Contact:</strong> {primaryContact.name}</p>
                {primaryContact.whatsappNumber && (
                  <p><strong>WhatsApp:</strong> {primaryContact.whatsappNumber}</p>
                )}
                {!primaryContact.whatsappNumber && primaryContact.phone && (
                  <p className="text-warning-600">
                    ⚠️ No WhatsApp number found. Using phone: {primaryContact.phone}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Message Template */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message Template *
          </label>
          <textarea
            name="messageTemplate"
            value={formData.messageTemplate}
            onChange={handleChange}
            rows={4}
            className={`block w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.messageTemplate ? 'border-error-500' : 'border-gray-300'
            }`}
            placeholder="Dear {{contactName}}, This is a gentle reminder from {{companyName}} about invoice #{{invoiceNumber}} for {{invoiceAmount}} due on {{dueDate}}. Please confirm payment status. Thank you!"
          />
          {errors.messageTemplate && (
            <p className="text-xs text-error-600 mt-1">{errors.messageTemplate}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Available variables: {'{{clientName}}'}, {'{{contactName}}'}, {'{{companyName}}'}, {'{{invoiceNumber}}'}, {'{{invoiceAmount}}'}, {'{{dueDate}}'}
          </p>
        </div>

        {/* Message Preview */}
        {formData.messageTemplate && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Preview:</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{getMessagePreview()}</p>
          </div>
        )}

        {/* Frequency and Count */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Frequency (Days) *"
            name="frequencyInDays"
            type="number"
            min="1"
            value={formData.frequencyInDays}
            onChange={handleChange}
            error={errors.frequencyInDays}
            placeholder="2"
            helper="Send reminder every X days"
          />
          <Input
            label="Total Messages *"
            name="totalMessagesToSend"
            type="number"
            min="1"
            max="10"
            value={formData.totalMessagesToSend}
            onChange={handleChange}
            error={errors.totalMessagesToSend}
            placeholder="5"
            helper="Total number of reminders to send"
          />
        </div>

        {/* Campaign Summary */}
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-warning-800">
            <strong>Campaign Summary:</strong> {formData.totalMessagesToSend} messages will be sent 
            every {formData.frequencyInDays} day{formData.frequencyInDays > 1 ? 's' : ''} 
            (Total duration: ~{formData.totalMessagesToSend * formData.frequencyInDays} days)
          </div>
        </div>

        {/* Optional Invoice Details */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Details (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Invoice Number"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              placeholder="INV-2024-001"
            />
            <Input
              label="Invoice Amount"
              name="invoiceAmount"
              type="number"
              value={formData.invoiceAmount}
              onChange={handleChange}
              placeholder="50000"
            />
          </div>
          <div className="mt-4">
            <Input
              label="Due Date"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Internal)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Internal notes about this reminder campaign..."
          />
        </div>

        {/* WhatsApp Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> WhatsApp integration is required for automated sending. 
            Messages will be queued and sent automatically according to the schedule.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentReminderForm;