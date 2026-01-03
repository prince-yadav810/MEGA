// File Path: client/src/components/clients/BusinessCardUpload.jsx

import React, { useState } from 'react';
import { Scan, Loader2, AlertCircle, Copy, Check, Edit3 } from 'lucide-react';
import ImageUploadPreview from './ImageUploadPreview';
import Button from '../ui/Button';

/**
 * Business Card Upload Component
 * Handles the upload and extraction workflow
 * Features graceful degradation with raw text fallback
 */
const BusinessCardUpload = ({ onExtractionComplete, onCancel }) => {
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');
  const [extractedRawText, setExtractedRawText] = useState(null);
  const [copied, setCopied] = useState(false);

  // Copy raw text to clipboard
  const handleCopyRawText = async () => {
    if (!extractedRawText) return;

    const textToCopy = extractedRawText.front +
      (extractedRawText.back ? '\n\nBack:\n' + extractedRawText.back : '');

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle extraction process
  const handleExtract = async () => {
    if (!frontImage) {
      setError('Please upload the front image of the business card');
      return;
    }

    setError('');
    setExtractedRawText(null);
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
        // Store raw text if available for manual fallback
        if (result.extractedText) {
          setExtractedRawText(result.extractedText);
        }
        throw new Error(result.message || 'Failed to extract business card data');
      }

      // Step 3: Checking duplicates
      setProcessingStep('Checking for duplicates...');
      await new Promise(resolve => setTimeout(resolve, 300)); // Visual delay

      // Pass result to parent
      onExtractionComplete(result);
    } catch (err) {
      console.error('Extraction error:', err);

      // Try to get raw text from error response for fallback
      const rawTextFromError = err.response?.data?.extractedText;
      if (rawTextFromError) {
        setExtractedRawText(rawTextFromError);
      }

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
        const suggestion = err.response?.data?.suggestion;
        setError(
          (err.response?.data?.message || err.message || 'Failed to extract business card.') +
          (suggestion ? ` ${suggestion}` : ' Please try manual entry.')
        );
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

      {/* Error Display with Fallback Options */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-1">Extraction Failed</p>
              <p className="text-sm text-red-700 mb-3">{error}</p>

              {/* Manual Entry Button - Always show on error */}
              <Button
                variant="outline"
                size="sm"
                icon={Edit3}
                onClick={onCancel}
                className="mb-2"
              >
                Switch to Manual Entry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Raw Text Fallback - Show when extraction fails but text was extracted */}
      {extractedRawText && (extractedRawText.front || extractedRawText.back) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-medium text-amber-800">
              📝 Extracted Text (copy for manual entry)
            </p>
            <Button
              variant="ghost"
              size="xs"
              onClick={handleCopyRawText}
              className="text-amber-700 hover:text-amber-900"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy All
                </>
              )}
            </Button>
          </div>

          <div className="bg-white rounded border border-amber-200 p-3 text-xs font-mono text-gray-700 max-h-40 overflow-y-auto">
            {extractedRawText.front && (
              <div className="mb-2">
                <span className="font-semibold text-amber-800">Front:</span>
                <pre className="whitespace-pre-wrap mt-1">{extractedRawText.front}</pre>
              </div>
            )}
            {extractedRawText.back && (
              <div>
                <span className="font-semibold text-amber-800">Back:</span>
                <pre className="whitespace-pre-wrap mt-1">{extractedRawText.back}</pre>
              </div>
            )}
          </div>

          <p className="text-xs text-amber-600 mt-2">
            💡 Tip: Copy this text and use it to fill in the client details manually
          </p>
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
          {error ? 'Manual Entry' : 'Cancel'}
        </Button>
        <Button
          icon={Scan}
          onClick={handleExtract}
          disabled={!frontImage || isProcessing}
          loading={isProcessing}
        >
          {isProcessing ? 'Extracting...' : error ? 'Retry Extraction' : 'Extract Information'}
        </Button>
      </div>
    </div>
  );
};

export default BusinessCardUpload;
