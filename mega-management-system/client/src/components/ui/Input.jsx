import React, { forwardRef } from 'react';

const Input = forwardRef(({ 
  label,
  error,
  helper,
  variant = 'default',
  size = 'md',
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconClick,
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  const baseClasses = 'block w-full border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  
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

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const inputClasses = `
    ${baseClasses}
    ${variantClasses[error ? 'error' : variant]}
    ${sizeClasses[size]}
    ${LeftIcon ? 'pl-10' : ''}
    ${RightIcon ? 'pr-10' : ''}
    ${className}
  `.trim();

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className={`${iconSizeClasses[size]} text-gray-400`} />
          </div>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          disabled={disabled}
          {...props}
        />
        
        {RightIcon && (
          <div 
            className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
              onRightIconClick ? 'cursor-pointer' : 'pointer-events-none'
            }`}
            onClick={onRightIconClick}
          >
            <RightIcon className={`${iconSizeClasses[size]} ${
              onRightIconClick ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400'
            }`} />
          </div>
        )}
      </div>
      
      {helper && !error && (
        <p className="text-xs text-gray-500">{helper}</p>
      )}
      
      {error && (
        <p className="text-xs text-error-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;