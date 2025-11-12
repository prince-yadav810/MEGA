// File Path: client/src/components/clients/ConfidenceIndicator.jsx

import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

/**
 * Confidence Indicator Component
 * Shows visual indicators for AI extraction confidence levels
 * - HIGH: Green check, normal styling
 * - MEDIUM: Yellow warning, yellow border + tooltip
 * - LOW: Red alert, red border + warning
 */

const ConfidenceIndicator = ({ level, inline = false, showIcon = true, showText = false }) => {
  const configs = {
    high: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      textColor: 'text-green-700',
      label: 'High confidence',
      tooltip: 'Data appears accurate'
    },
    medium: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-400',
      textColor: 'text-yellow-700',
      label: 'Medium confidence',
      tooltip: 'Please verify this information'
    },
    low: {
      icon: AlertCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-400',
      textColor: 'text-red-700',
      label: 'Low confidence',
      tooltip: 'Uncertain - check carefully'
    }
  };

  const config = configs[level?.toLowerCase()] || configs.low;
  const Icon = config.icon;

  if (inline) {
    // Inline mode - small icon with tooltip
    return (
      <span
        className="inline-flex items-center gap-1 cursor-help"
        title={config.tooltip}
      >
        {showIcon && <Icon className={`h-4 w-4 ${config.iconColor}`} />}
        {showText && (
          <span className={`text-xs font-medium ${config.textColor}`}>
            {config.label}
          </span>
        )}
      </span>
    );
  }

  // Badge mode - full badge with icon and text
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} cursor-help`}
      title={config.tooltip}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  );
};

/**
 * Higher-order component to wrap input fields with confidence styling
 */
export const withConfidence = (InputComponent) => {
  return ({ confidence = 'high', ...props }) => {
    const borderColors = {
      high: 'focus:ring-primary-500 focus:border-primary-500 border-gray-300',
      medium: 'focus:ring-yellow-500 focus:border-yellow-500 border-yellow-400',
      low: 'focus:ring-red-500 focus:border-red-500 border-red-400'
    };

    const bgColors = {
      high: '',
      medium: 'bg-yellow-50',
      low: 'bg-red-50'
    };

    return (
      <div className="relative">
        <InputComponent
          {...props}
          className={`${props.className || ''} ${borderColors[confidence]} ${bgColors[confidence]}`}
        />
        {confidence !== 'high' && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <ConfidenceIndicator level={confidence} inline={true} showIcon={true} />
          </div>
        )}
      </div>
    );
  };
};

/**
 * Section confidence indicator (for groups of fields)
 */
export const SectionConfidence = ({ level, title }) => {
  if (level === 'high') return null; // Don't show anything for high confidence

  const configs = {
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      text: 'text-yellow-800',
      message: '⚠️ Please verify the information below'
    },
    low: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-800',
      message: '🔴 Low confidence - check carefully'
    }
  };

  const config = configs[level?.toLowerCase()] || configs.low;

  return (
    <div className={`${config.bg} ${config.border} border-l-4 p-3 rounded mb-3`}>
      <div className="flex items-center gap-2">
        <ConfidenceIndicator level={level} inline={true} showIcon={true} />
        <p className={`text-sm font-medium ${config.text}`}>
          {title && `${title}: `}{config.message}
        </p>
      </div>
    </div>
  );
};

export default ConfidenceIndicator;
