// File Path: client/src/components/clients/AddClientModal.jsx

import React, { useState } from 'react';
import { FileText, Scan } from 'lucide-react';
import Modal from '../common/Modal';
import ClientForm from '../forms/ClientForm';
import BusinessCardUpload from './BusinessCardUpload';
import ExtractedDataReview from './ExtractedDataReview';
import clientService from '../../services/clientService';

/**
 * Add Client Modal - Wrapper component
 * Provides toggle between Manual Entry and Business Card Scan
 */
const AddClientModal = ({ isOpen, onClose, onSuccess }) => {
  const [entryMode, setEntryMode] = useState(null); // null = selection screen, 'manual', or 'scan'
  const [extractedResult, setExtractedResult] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when modal closes
  const handleClose = () => {
    setEntryMode(null);
    setExtractedResult(null);
    setShowReview(false);
    setIsSaving(false);
    onClose();
  };

  // Handle successful extraction
  const handleExtractionComplete = (result) => {
    setExtractedResult(result);
    setShowReview(true);
  };

  // Handle save from review modal
  const handleSaveExtractedData = async (formData) => {
    setIsSaving(true);
    try {
      const result = await clientService.createClient(formData);
      if (result.success) {
        onSuccess(result.data);
        handleClose();
      }
    } catch (error) {
      console.error('Failed to save client:', error);
      alert('Failed to save client. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle retry extraction
  const handleRetry = () => {
    setExtractedResult(null);
    setShowReview(false);
  };

  // Handle switch to manual
  const handleSwitchToManual = () => {
    setEntryMode('manual');
    setShowReview(false);
  };

  // If showing review modal, render it
  if (showReview && extractedResult) {
    return (
      <ExtractedDataReview
        isOpen={true}
        onClose={handleClose}
        extractedData={extractedResult.extractedData}
        confidence={extractedResult.confidence}
        duplicates={extractedResult.duplicates}
        onSave={handleSaveExtractedData}
        onRetry={handleRetry}
        onSwitchToManual={handleSwitchToManual}
        isLoading={isSaving}
      />
    );
  }

  // Show selection screen if no mode chosen
  if (entryMode === null) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Add New Client"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center mb-6">
            Choose how you'd like to add this client
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Manual Entry Option */}
            <button
              onClick={() => setEntryMode('manual')}
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
            >
              <FileText className="h-12 w-12 text-gray-400 group-hover:text-primary-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Manual Entry</h3>
              <p className="text-sm text-gray-500 text-center">
                Fill in client details manually
              </p>
            </button>

            {/* Scan Business Card Option */}
            <button
              onClick={() => setEntryMode('scan')}
              className="flex flex-col items-center justify-center p-6 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group bg-gradient-to-br from-primary-50 to-white"
            >
              <Scan className="h-12 w-12 text-primary-500 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Scan Business Card</h3>
              <p className="text-sm text-gray-500 text-center">
                Upload card image for auto-fill
              </p>
              <span className="mt-2 text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded">
                ✨ AI-Powered
              </span>
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Show manual entry form
  if (entryMode === 'manual') {
    return (
      <ClientForm
        isOpen={isOpen}
        onClose={handleClose}
        onSubmit={async (formData) => {
          setIsSaving(true);
          try {
            const result = await clientService.createClient(formData);
            if (result.success) {
              onSuccess(result.data);
              handleClose();
            }
          } catch (error) {
            console.error('Failed to save client:', error);
            alert('Failed to save client. Please try again.');
          } finally {
            setIsSaving(false);
          }
        }}
        isLoading={isSaving}
      />
    );
  }

  // Show business card scan interface
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Client - Scan Business Card"
      size="lg"
    >
      <div className="space-y-6">
        {/* Mode Switch Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setEntryMode('manual')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Switch to Manual Entry
          </button>
        </div>

        {/* Business Card Upload */}
        <BusinessCardUpload
          onExtractionComplete={handleExtractionComplete}
          onCancel={handleClose}
        />
      </div>
    </Modal>
  );
};

export default AddClientModal;
