import React from 'react';

const Card = ({ 
  children, 
  variant = 'default',
  padding = 'md',
  shadow = 'sm',
  hover = false,
  className = '',
  ...props 
}) => {
  const baseClasses = 'bg-white rounded-lg border transition-all duration-200';
  
  const variantClasses = {
    default: 'border-gray-200',
    primary: 'border-primary-200 bg-primary-50',
    success: 'border-success-200 bg-success-50',
    warning: 'border-warning-200 bg-warning-50',
    error: 'border-error-200 bg-error-50',
    gradient: 'border-0 bg-gradient-to-br from-primary-500 to-primary-600 text-white'
  };

  const paddingClasses = {
    none: '',
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const hoverClasses = hover ? 'hover:shadow-md hover:shadow-gray-200/50 cursor-pointer' : '';

  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${shadowClasses[shadow]}
    ${hoverClasses}
    ${className}
  `.trim();

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
};

// Card sub-components
const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`border-t border-gray-200 pt-4 mt-4 ${className}`} {...props}>
    {children}
  </div>
);

// Attach sub-components to main Card component
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;