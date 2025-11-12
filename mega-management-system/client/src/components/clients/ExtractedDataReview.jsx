// File Path: client/src/components/clients/ExtractedDataReview.jsx

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Save, RotateCcw, FileText } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import ConfidenceIndicator, { SectionConfidence } from './ConfidenceIndicator';
import DuplicateWarning from './DuplicateWarning';

/**
 * Extracted Data Review Modal
 * Large modal for reviewing and editing AI-extracted business card data
 */
const ExtractedDataReview = ({
  isOpen,
  onClose,
  extractedData,
  confidence,
  duplicates,
  onSave,
  onRetry,
  onSwitchToManual,
  isLoading = false
}) => {
  const [formData, setFormData] = useState(null);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when modal opens
  useEffect(() => {
    if (extractedData) {
      setFormData({
        ...extractedData,
        contactPersons: extractedData.contactPersons?.length > 0
          ? extractedData.contactPersons
          : [{
              name: '',
              designation: '',
              phone: '',
              email: '',
              whatsappNumber: '',
              isPrimary: true
            }]
      });
      setOverrideConfirmed(false);
      setErrors({});
    }
  }, [extractedData]);

  if (!formData) return null;

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [name]: value }
    }));
  };

  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...formData.contactPersons];
    updatedContacts[index][field] = value;
    setFormData(prev => ({ ...prev, contactPersons: updatedContacts }));
  };

  const setPrimaryContact = (index) => {
    const updatedContacts = formData.contactPersons.map((contact, i) => ({
      ...contact,
      isPrimary: i === index
    }));
    setFormData(prev => ({ ...prev, contactPersons: updatedContacts }));
  };

  const addContactPerson = () => {
    setFormData(prev => ({
      ...prev,
      contactPersons: [
        ...prev.contactPersons,
        { name: '', designation: '', phone: '', email: '', whatsappNumber: '', isPrimary: false }
      ]
    }));
  };

  const removeContactPerson = (index) => {
    if (formData.contactPersons.length === 1) return;

    const updatedContacts = formData.contactPersons.filter((_, i) => i !== index);
    if (formData.contactPersons[index].isPrimary && updatedContacts.length > 0) {
      updatedContacts[0].isPrimary = true;
    }

    setFormData(prev => ({ ...prev, contactPersons: updatedContacts }));
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.companyName?.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.contactPersons[0]?.name?.trim()) {
      newErrors.firstContactName = 'Primary contact name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!validate()) return;

    // Check for duplicates
    const hasDuplicates = duplicates?.exactMatch ||
      (duplicates?.similarCompanies && duplicates.similarCompanies.length > 0) ||
      duplicates?.existingContact;

    if (hasDuplicates && !overrideConfirmed) {
      // Scroll to top to show duplicate warnings
      document.getElementById('duplicate-warnings')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    onSave(formData);
  };

  // Handle override
  const handleOverride = () => {
    setOverrideConfirmed(true);
  };

  // Handle view existing client
  const handleViewExisting = (clientId) => {
    window.open(`/clients/${clientId}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Extracted Data"
      size="full"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={RotateCcw}
              onClick={onRetry}
              disabled={isLoading}
            >
              Retry Extraction
            </Button>
            <Button
              variant="ghost"
              icon={FileText}
              onClick={onSwitchToManual}
              disabled={isLoading}
            >
              Switch to Manual
            </Button>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              icon={Save}
              onClick={handleSave}
              loading={isLoading}
            >
              Save Client
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Review the extracted information below.</strong> Fields are editable.
            Color indicators show AI confidence:
            <span className="inline-flex items-center gap-1 ml-2">
              <ConfidenceIndicator level="high" inline showIcon />
              <span className="text-xs">High</span>
              <ConfidenceIndicator level="medium" inline showIcon />
              <span className="text-xs">Medium</span>
              <ConfidenceIndicator level="low" inline showIcon />
              <span className="text-xs">Low</span>
            </span>
          </p>
        </div>

        {/* Duplicate Warnings */}
        <div id="duplicate-warnings">
          <DuplicateWarning
            duplicates={duplicates}
            onViewExisting={handleViewExisting}
            onOverride={handleOverride}
            showOverrideButton={!overrideConfirmed}
          />

          {overrideConfirmed && (duplicates?.exactMatch || duplicates?.similarCompanies?.length > 0 || duplicates?.existingContact) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800">
                ✓ Override confirmed. You can now save this client.
              </p>
            </div>
          )}
        </div>

        {/* Company Information */}
        <div>
          <SectionConfidence level={confidence?.companyName} title="Company Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={confidence?.companyName !== 'high' ? `border-2 rounded-lg p-3 ${
              confidence?.companyName === 'medium' ? 'border-yellow-300 bg-yellow-50' : 'border-red-300 bg-red-50'
            }` : ''}>
              <Input
                label="Company Name *"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                error={errors.companyName}
                placeholder="Enter company name"
              />
              {confidence?.companyName !== 'high' && (
                <div className="mt-2">
                  <ConfidenceIndicator level={confidence?.companyName} inline showIcon showText />
                </div>
              )}
            </div>
            <Input
              label="Business Type"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              placeholder="e.g., Manufacturing, Trading"
            />
          </div>
        </div>

        {/* Address Information */}
        <div>
          <SectionConfidence level={confidence?.address} title="Address" />
          <div className={`space-y-4 ${confidence?.address !== 'high' ? `border-2 rounded-lg p-4 ${
            confidence?.address === 'medium' ? 'border-yellow-300 bg-yellow-50' : 'border-red-300 bg-red-50'
          }` : ''}`}>
            <Input
              label="Street Address"
              name="street"
              value={formData.address?.street || ''}
              onChange={handleAddressChange}
              placeholder="Enter street address"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="City"
                name="city"
                value={formData.address?.city || ''}
                onChange={handleAddressChange}
                placeholder="Enter city"
              />
              <Input
                label="State"
                name="state"
                value={formData.address?.state || ''}
                onChange={handleAddressChange}
                placeholder="Enter state"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Pincode"
                name="pincode"
                value={formData.address?.pincode || ''}
                onChange={handleAddressChange}
                placeholder="Enter pincode"
              />
              <Input
                label="Country"
                name="country"
                value={formData.address?.country || 'India'}
                onChange={handleAddressChange}
                placeholder="Enter country"
              />
            </div>
            {confidence?.address !== 'high' && (
              <div className="mt-2">
                <ConfidenceIndicator level={confidence?.address} inline showIcon showText />
              </div>
            )}
          </div>
        </div>

        {/* Contact Persons */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Contact Persons</h3>
              {confidence?.contactPersons !== 'high' && (
                <ConfidenceIndicator level={confidence?.contactPersons} inline showIcon showText />
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={Plus}
              onClick={addContactPerson}
            >
              Add Contact
            </Button>
          </div>

          <SectionConfidence level={confidence?.contactPersons} />

          <div className="space-y-4">
            {formData.contactPersons.map((contact, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg relative ${
                  confidence?.contactPersons === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                  confidence?.contactPersons === 'low' ? 'border-red-300 bg-red-50' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setPrimaryContact(index)}
                      className={`p-1 rounded ${
                        contact.isPrimary ? 'text-warning-500' : 'text-gray-300 hover:text-warning-400'
                      }`}
                      title={contact.isPrimary ? 'Primary Contact' : 'Set as Primary'}
                    >
                      <Star className={`h-4 w-4 ${contact.isPrimary ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-sm font-medium text-gray-700">
                      Contact Person {index + 1}
                      {contact.isPrimary && (
                        <span className="ml-2 text-xs text-warning-600">(Primary)</span>
                      )}
                    </span>
                  </div>
                  {formData.contactPersons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContactPerson(index)}
                      className="p-1 text-error-500 hover:bg-error-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    label="Name *"
                    value={contact.name}
                    onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                    error={index === 0 ? errors.firstContactName : ''}
                    placeholder="Enter name"
                  />
                  <Input
                    label="Designation"
                    value={contact.designation}
                    onChange={(e) => handleContactChange(index, 'designation', e.target.value)}
                    placeholder="e.g., Manager, Director"
                  />
                  <Input
                    label="Phone"
                    value={contact.phone}
                    onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                    placeholder="email@example.com"
                  />
                  <Input
                    label="WhatsApp Number"
                    value={contact.whatsappNumber}
                    onChange={(e) => handleContactChange(index, 'whatsappNumber', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
          <div className="space-y-4">
            <Input
              label="Company Website"
              name="companyWebsite"
              type="url"
              value={formData.companyWebsite || ''}
              onChange={handleChange}
              placeholder="https://example.com"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={3}
                className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Additional information (GST, certifications, etc.)"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExtractedDataReview;
