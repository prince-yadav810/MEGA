// File Path: client/src/components/common/Modal.jsx

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', 
  showCloseButton = true,
  closeOnOverlay = true,
  fullScreen = false,
  footer
}) => {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-7xl'
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlay) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 pb-24 sm:pb-4 animate-fade-in overflow-auto"
      onClick={handleOverlayClick}
    >
      <div
        className={`
          bg-white rounded-lg shadow-xl w-full
          ${fullScreen ? 'h-full' : 'max-h-[75vh] sm:max-h-[90vh]'}
          ${fullScreen ? 'max-w-full' : sizeClasses[size]}
          flex flex-col
          animate-slide-in
          my-auto
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0">
          {children}
        </div>

        {/* Footer - Always visible at bottom */}
        {footer && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;