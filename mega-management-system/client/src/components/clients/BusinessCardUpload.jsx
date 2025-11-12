// File Path: client/src/components/clients/BusinessCardUpload.jsx

import React, { useState } from 'react';
import { Scan, Loader2, AlertCircle } from 'lucide-react';
import ImageUploadPreview from './ImageUploadPreview';
import Button from '../ui/Button';

/**
 * Business Card Upload Component
 * Handles the upload and extraction workflow
 */
const BusinessCardUpload = ({ onExtractionComplete, onCancel }) => {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');

  // Handle extraction process
  const handleExtract = async () => {
    if (!frontImage) {
      setError('Please upload the front image of the business card');
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      // Import the client service
      const clientService = (await import('../../services/clientService')).default;

      // Create FormData
      const formData = new FormData();
      formData.append('frontImage', frontImage);
      if (backImage) {
        formData.append('backImage', backImage);
      }

      // Step 1: Reading text
      setProcessingStep('Reading text from images...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Visual delay

      // Step 2: Analyzing data
      setProcessingStep('Analyzing business card data...');

      // Call API
      const result = await clientService.extractFromCard(formData);

      if (!result.success) {
        throw new Error(result.message || 'Failed to extract business card data');
      }

      // Step 3: Checking duplicates
      setProcessingStep('Checking for duplicates...');
      await new Promise(resolve => setTimeout(resolve, 300)); // Visual delay

      // Pass result to parent
      onExtractionComplete(result);
    } catch (err) {
      console.error('Extraction error:', err);

      // Handle rate limit errors
      if (err.response?.status === 429) {
        const limitInfo = err.response?.data?.limits;
        if (limitInfo?.monthly?.percentage >= 90) {
          setError('Monthly OCR limit reached. Please add clients manually or try next month.');
        } else if (limitInfo?.hourly) {
          setError(`Hourly limit reached. You can try again in ${new Date(limitInfo.hourly.resetTime).toLocaleTimeString()}.`);
        } else {
          setError('Rate limit exceeded. Please try again later.');
        }
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to extract business card. Please try manual entry.');
      }
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Scan className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Upload Business Card Images</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
              <li>Front image is required</li>
              <li>Back image is optional (recommended if available)</li>
              <li>Use clear, well-lit photos</li>
              <li>JPG or PNG only, max 5MB each</li>
              <li>Processing takes 5-8 seconds</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Front Image Upload */}
      <ImageUploadPreview
        label="Front of Business Card"
        required={true}
        image={frontImage}
        onImageSelect={setFrontImage}
        onImageRemove={() => setFrontImage(null)}
        helpText="Upload a clear photo of the front side"
      />

      {/* Back Image Upload */}
      <ImageUploadPreview
        label="Back of Business Card (Optional)"
        required={false}
        image={backImage}
        onImageSelect={setBackImage}
        onImageRemove={() => setBackImage(null)}
        helpText="Upload back side if it contains additional information"
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-1">Extraction Failed</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-primary-900 mb-1">
              {processingStep}
            </p>
            <p className="text-xs text-primary-600">
              This may take 5-8 seconds...
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          icon={Scan}
          onClick={handleExtract}
          disabled={!frontImage || isProcessing}
          loading={isProcessing}
        >
          {isProcessing ? 'Extracting...' : 'Extract Information'}
        </Button>
      </div>
    </div>
  );
};

export default BusinessCardUpload;
