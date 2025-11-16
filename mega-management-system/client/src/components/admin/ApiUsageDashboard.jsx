// File Path: client/src/components/admin/ApiUsageDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

/**
 * API Usage Dashboard for Admins
 * Monitors Google Vision API usage and limits
 */
const ApiUsageDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api-usage/stats');
      setStats(response.data.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch API usage stats:', err);
      setError('Failed to load usage statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading usage statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const { vision, gemini } = stats;

  // Determine status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5" />;
      case 'warning': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">API Usage Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor OCR API usage and limits</p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Vision API Card */}
      <div className={`border-2 rounded-lg p-6 ${getStatusColor(vision.status)}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(vision.status)}
            <div>
              <h3 className="text-lg font-semibold">Google Vision API</h3>
              <p className="text-sm opacity-80">Business Card OCR</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{vision.totalUnits}</p>
            <p className="text-xs opacity-80">units used</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Monthly Limit</span>
            <span className="text-sm font-semibold">{vision.percentage}%</span>
          </div>
          <div className="w-full h-3 bg-white rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                vision.status === 'healthy' ? 'bg-green-500' :
                vision.status === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(vision.percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs mt-1 opacity-80">
            {vision.remaining} of {vision.limit} units remaining
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-50 rounded-lg p-3">
            <p className="text-xs opacity-80 mb-1">Total Requests</p>
            <p className="text-lg font-bold">{vision.totalRequests}</p>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg p-3">
            <p className="text-xs opacity-80 mb-1">Successful</p>
            <p className="text-lg font-bold text-green-600">{vision.successfulRequests}</p>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg p-3">
            <p className="text-xs opacity-80 mb-1">Failed</p>
            <p className="text-lg font-bold text-red-600">{vision.failedRequests}</p>
          </div>
        </div>

        {/* Warning Message */}
        {vision.status === 'critical' && (
          <div className="mt-4 bg-white bg-opacity-70 rounded-lg p-3">
            <p className="text-sm font-medium">
              ⚠️ Critical: Approaching monthly limit! OCR feature will be disabled at 900 units.
            </p>
          </div>
        )}
        {vision.status === 'warning' && (
          <div className="mt-4 bg-white bg-opacity-70 rounded-lg p-3">
            <p className="text-sm font-medium">
              ⚠️ Warning: You've used {vision.percentage}% of your monthly limit.
            </p>
          </div>
        )}
      </div>

      {/* Gemini API Card */}
      <div className="border-2 border-blue-200 bg-blue-50 text-blue-600 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5" />
            <div>
              <h3 className="text-lg font-semibold">Google Gemini API</h3>
              <p className="text-sm opacity-80">AI Data Parsing</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{gemini.totalUnits}</p>
            <p className="text-xs opacity-80">requests</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-50 rounded-lg p-3">
            <p className="text-xs opacity-80 mb-1">Total Requests</p>
            <p className="text-lg font-bold">{gemini.totalRequests}</p>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg p-3">
            <p className="text-xs opacity-80 mb-1">Successful</p>
            <p className="text-lg font-bold text-green-600">{gemini.successfulRequests}</p>
          </div>
          <div className="bg-white bg-opacity-50 rounded-lg p-3">
            <p className="text-xs opacity-80 mb-1">Status</p>
            <p className="text-sm font-bold">Free Tier</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">About API Limits</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Google Vision: 1,000 units/month free (resets on 1st of each month)</li>
          <li>• Each business card scan uses 2 units (front + back images)</li>
          <li>• Rate limit: 10 scans per hour per user</li>
          <li>• OCR feature disabled when approaching 900 units to prevent overages</li>
          <li>• Gemini AI: Free tier (no strict monthly limits)</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiUsageDashboard;
