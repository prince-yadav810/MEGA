// File Path: client/src/components/ui/Select.jsx

import React, { forwardRef } from 'react';

const Select = forwardRef(({ 
  label,
  error,
  helper,
  variant = 'default',
  size = 'md',
  disabled = false,
  options = [],
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  const baseClasses = 'block w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed bg-white';
  
  const variantClasses = {
    default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
    success: 'border-success-500 focus:border-success-500 focus:ring-success-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const selectClasses = `
    ${baseClasses}
    ${variantClasses[error ? 'error' : variant]}
    ${sizeClasses[size]}
    ${className}
  `.trim();

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <select
        ref={ref}
        className={selectClasses}
        disabled={disabled}
        {...props}
      >
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {helper && !error && (
        <p className="text-xs text-gray-500">{helper}</p>
      )}
      
      {error && (
        <p className="text-xs text-error-600">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;