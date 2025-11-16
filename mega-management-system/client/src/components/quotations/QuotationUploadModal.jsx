import React from 'react';
import Modal from '../common/Modal';
import QuotationUpload from './QuotationUpload';

/**
 * QuotationUploadModal Component
 * Wraps the QuotationUpload component in a modal dialog
 */
const QuotationUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const handleUploadSuccess = (newQuotation) => {
    if (onUploadSuccess) {
      onUploadSuccess(newQuotation);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Quotation"
      size="lg"
      closeOnOverlay={false}
    >
      <QuotationUpload onUploadSuccess={handleUploadSuccess} />
    </Modal>
  );
};

export default QuotationUploadModal;
