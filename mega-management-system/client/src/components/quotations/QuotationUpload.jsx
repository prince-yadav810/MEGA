import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, Loader2, AlertCircle } from 'lucide-react';
import { uploadExcel } from '../../services/quotationService';
import toast from 'react-hot-toast';

/**
 * QuotationUpload Component
 * Allows users to upload Excel files to create quotations
 * Features: Drag-and-drop, progress tracking, validation
 */
const QuotationUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // File size limit (5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  /**
   * Validate Excel file
   */
  const validateFile = (file) => {
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      throw new Error('Invalid file type. Please upload an Excel file (.xlsx or .xls)');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit');
    }

    return true;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = (selectedFile) => {
    try {
      setError(null);
      validateFile(selectedFile);
      setFile(selectedFile);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  /**
   * Handle drag events
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handle drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  /**
   * Remove selected file
   */
  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Upload file
   */
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const response = await uploadExcel(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      toast.success('Quotation created successfully!');
      handleRemoveFile();

      // Call parent callback
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to upload Excel file. Please check the format and try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-white'}
          ${uploading ? 'pointer-events-none opacity-60' : 'cursor-pointer hover:border-primary-400'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && !uploading && fileInputRef.current?.click()}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploading}
        />

        {/* Upload Icon and Text */}
        {!file && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-primary-100 rounded-full">
                <FileSpreadsheet className="h-12 w-12 text-primary-600" />
              </div>
            </div>

            <div>
              <p className="text-lg font-medium text-gray-700">
                Drop your Excel file here or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: .xlsx, .xls (max 5MB)
              </p>
            </div>
          </div>
        )}

        {/* Selected File Info */}
        {file && (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              {!uploading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Uploading...</span>
                  <span className="font-medium text-primary-600">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            {!uploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                className="w-full sm:w-auto px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Upload className="h-5 w-5" />
                <span>Upload & Generate PDF</span>
              </button>
            )}
          </div>
        )}

        {/* Uploading Indicator */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto" />
              <p className="mt-2 text-gray-700 font-medium">Processing quotation...</p>
              <p className="text-sm text-gray-500">This may take a few seconds</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Upload Failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Excel File Requirements:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Reference number in Row 4, Column E</li>
          <li>Date in Row 4</li>
          <li>Client name in Row 5, Column B</li>
          <li>Line items starting from Row 7</li>
          <li>Total in Row 40, Column H</li>
        </ul>
      </div>
    </div>
  );
};

export default QuotationUpload;
