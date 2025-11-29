// File Path: client/src/components/clients/ImageUploadPreview.jsx

import React, { useRef, useState } from 'react';
import { Upload, X, Camera, Image as ImageIcon } from 'lucide-react';

/**
 * Reusable image upload component with preview
 * Supports drag & drop (desktop) and camera/gallery (mobile)
 */
const ImageUploadPreview = ({
  label,
  required = false,
  image,
  onImageSelect,
  onImageRemove,
  accept = 'image/jpeg,image/jpg,image/png',
  maxSize = 5, // MB
  helpText = ''
}) => {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  // Handle file selection
  const handleFileSelect = (file) => {
    setError('');

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG and PNG images are allowed');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Pass file to parent
    onImageSelect(file);
  };

  // Handle file input change
  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle remove
  const handleRemove = () => {
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove();
  };

  // Handle click to open file selector (gallery)
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Handle camera capture (mobile)
  const handleCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-error-500 ml-1">*</span>}
      </label>

      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-lg transition-all ${
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : error
            ? 'border-error-300 bg-error-50'
            : image || preview
            ? 'border-success-300 bg-success-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {/* Hidden file input for gallery (no camera) */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Hidden file input for camera (mobile only) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept={accept}
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
        />

        {/* Preview or Upload UI */}
        {preview || image ? (
          <div className="relative">
            <img
              src={preview || URL.createObjectURL(image)}
              alt="Preview"
              className="w-full h-48 object-contain rounded-lg"
            />

            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-error-500 text-white rounded-full hover:bg-error-600 transition-colors"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>

            {/* File info */}
            <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-60 text-white text-xs p-2 rounded">
              <p className="truncate">
                {image?.name || 'Uploaded image'}
                {image && ` (${(image.size / 1024).toFixed(1)} KB)`}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile View - Camera and Gallery Buttons */}
            <div className="md:hidden p-6 space-y-3">
              <div className="text-center mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Choose an option:</p>
                <p className="text-xs text-gray-500">JPG or PNG (max {maxSize}MB)</p>
              </div>
              
              <button
                type="button"
                onClick={handleCamera}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
              >
                <Camera className="h-5 w-5" />
                <span className="font-medium">Take Photo</span>
              </button>

              <button
                type="button"
                onClick={handleClick}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ImageIcon className="h-5 w-5" />
                <span className="font-medium">Upload from Gallery</span>
              </button>
            </div>

            {/* Desktop View - Drag and Drop */}
            <div
              onClick={handleClick}
              className="hidden md:flex flex-col items-center justify-center p-6 cursor-pointer"
            >
              <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-gray-100">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>

              <p className="text-sm text-gray-600 text-center mb-1">
                <span className="font-medium text-primary-600">Click to upload</span>
                <span className="text-gray-500"> or drag and drop</span>
              </p>

              <p className="text-xs text-gray-500">
                JPG or PNG (max {maxSize}MB)
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-error-600 flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}

      {/* Help text */}
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

export default ImageUploadPreview;
