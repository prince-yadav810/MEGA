// File Path: server/src/utils/apiUsageTracker.js

const ApiUsage = require('../models/ApiUsage');

/**
 * API Usage Tracker Utility
 * Tracks and monitors API usage for rate limiting and billing
 */

// Constants
const MONTHLY_VISION_LIMIT = 1000; // Free tier limit
const VISION_WARNING_THRESHOLD = 900; // Warn at 90%
const UNITS_PER_BUSINESS_CARD = 2; // Front + back images

/**
 * Logs API usage to database
 * @param {Object} params - Usage parameters
 * @returns {Promise<void>}
 */
async function logApiUsage({
  userId,
  serviceType,
  operation,
  unitsUsed = 1,
  success = true,
  errorMessage = '',
  metadata = {},
  ipAddress = ''
}) {
  try {
    await ApiUsage.create({
      userId,
      serviceType,
      operation,
      unitsUsed,
      success,
      errorMessage,
      metadata,
      ipAddress
    });
  } catch (error) {
    // Don't throw error to avoid blocking the main operation
    console.error('Failed to log API usage:', error);
  }
}

/**
 * Checks if monthly Google Vision API limit is reached
 * @returns {Promise<Object>} { allowed: boolean, currentUsage: number, limit: number, percentage: number }
 */
async function checkMonthlyVisionLimit() {
  try {
    const usage = await ApiUsage.getMonthlyUsage('google-vision');

    const allowed = usage.totalUnits < VISION_WARNING_THRESHOLD;
    const percentage = Math.round((usage.totalUnits / MONTHLY_VISION_LIMIT) * 100);

    return {
      allowed,
      currentUsage: usage.totalUnits,
      limit: MONTHLY_VISION_LIMIT,
      warningThreshold: VISION_WARNING_THRESHOLD,
      percentage,
      remaining: MONTHLY_VISION_LIMIT - usage.totalUnits,
      message: allowed
        ? `${usage.totalUnits} / ${MONTHLY_VISION_LIMIT} units used this month (${percentage}%)`
        : `Monthly limit approaching: ${usage.totalUnits} / ${MONTHLY_VISION_LIMIT} units used (${percentage}%)`
    };
  } catch (error) {
    console.error('Failed to check monthly Vision API limit:', error);
    // Allow operation to continue on error
    return {
      allowed: true,
      currentUsage: 0,
      limit: MONTHLY_VISION_LIMIT,
      warningThreshold: VISION_WARNING_THRESHOLD,
      percentage: 0,
      remaining: MONTHLY_VISION_LIMIT,
      message: 'Unable to check usage limits'
    };
  }
}

/**
 * Checks user's hourly rate limit
 * @param {string} userId - User ID
 * @param {number} maxPerHour - Maximum extractions per hour (default: 10)
 * @returns {Promise<Object>} { allowed: boolean, currentUsage: number, limit: number, resetTime: Date }
 */
async function checkUserHourlyLimit(userId, maxPerHour = 10) {
  try {
    const hourlyUsage = await ApiUsage.getUserHourlyUsage(userId);

    const allowed = hourlyUsage < maxPerHour;
    const resetTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    return {
      allowed,
      currentUsage: hourlyUsage,
      limit: maxPerHour,
      remaining: maxPerHour - hourlyUsage,
      resetTime,
      message: allowed
        ? `${hourlyUsage} / ${maxPerHour} extractions used this hour`
        : `Hourly limit reached: ${hourlyUsage} / ${maxPerHour} extractions. Reset at ${resetTime.toLocaleTimeString()}`
    };
  } catch (error) {
    console.error('Failed to check user hourly limit:', error);
    // Allow operation to continue on error
    return {
      allowed: true,
      currentUsage: 0,
      limit: maxPerHour,
      remaining: maxPerHour,
      resetTime: new Date(Date.now() + 60 * 60 * 1000),
      message: 'Unable to check rate limits'
    };
  }
}

/**
 * Checks all limits before processing business card
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { allowed: boolean, reason: string, limits: Object }
 */
async function checkAllLimits(userId) {
  const monthlyLimit = await checkMonthlyVisionLimit();
  const hourlyLimit = await checkUserHourlyLimit(userId);

  const allowed = monthlyLimit.allowed && hourlyLimit.allowed;

  let reason = '';
  if (!monthlyLimit.allowed) {
    reason = 'Monthly Google Vision API limit reached. Please try again next month or upgrade your plan.';
  } else if (!hourlyLimit.allowed) {
    reason = `You have reached your hourly limit of ${hourlyLimit.limit} extractions. Please try again later.`;
  }

  return {
    allowed,
    reason,
    limits: {
      monthly: monthlyLimit,
      hourly: hourlyLimit
    }
  };
}

/**
 * Logs business card extraction usage
 * @param {Object} params - Extraction parameters
 * @returns {Promise<void>}
 */
async function logBusinessCardExtraction({
  userId,
  success,
  errorMessage = '',
  frontImageSize,
  backImageSize,
  processingTime,
  extractedTextLength,
  companyName,
  ipAddress
}) {
  // Log Google Vision usage (2 units per card: front + back)
  const visionUnits = backImageSize ? 2 : 1; // 2 if back image exists, 1 otherwise

  await logApiUsage({
    userId,
    serviceType: 'google-vision',
    operation: 'business-card-extraction',
    unitsUsed: visionUnits,
    success,
    errorMessage,
    metadata: {
      frontImageSize,
      backImageSize,
      processingTime,
      extractedTextLength,
      companyName
    },
    ipAddress
  });

  // Log Gemini usage (separate tracking, free tier)
  if (success) {
    await logApiUsage({
      userId,
      serviceType: 'gemini',
      operation: 'ai-parsing',
      unitsUsed: 1,
      success: true,
      metadata: {
        extractedTextLength,
        companyName
      },
      ipAddress
    });
  }
}

/**
 * Gets usage statistics for admin dashboard
 * @returns {Promise<Object>} Usage statistics
 */
async function getUsageStatistics() {
  try {
    const monthlyVision = await ApiUsage.getMonthlyUsage('google-vision');
    const monthlyGemini = await ApiUsage.getMonthlyUsage('gemini');
    const dailyBreakdown = await ApiUsage.getDailyUsageBreakdown(30);

    const visionPercentage = Math.round(
      (monthlyVision.totalUnits / MONTHLY_VISION_LIMIT) * 100
    );

    return {
      vision: {
        ...monthlyVision,
        limit: MONTHLY_VISION_LIMIT,
        percentage: visionPercentage,
        remaining: MONTHLY_VISION_LIMIT - monthlyVision.totalUnits,
        status: visionPercentage >= 90 ? 'critical' : visionPercentage >= 70 ? 'warning' : 'healthy'
      },
      gemini: {
        ...monthlyGemini,
        status: 'unlimited' // Free tier
      },
      dailyBreakdown
    };
  } catch (error) {
    console.error('Failed to get usage statistics:', error);
    return null;
  }
}

/**
 * Gets user-specific usage statistics
 * @param {string} userId - User ID
 * @param {number} days - Number of days to include (default: 30)
 * @returns {Promise<Object>} User usage statistics
 */
async function getUserUsageStats(userId, days = 30) {
  try {
    const stats = await ApiUsage.getUserStats(userId, days);

    return {
      period: `Last ${days} days`,
      stats,
      totalExtractions: stats.reduce((sum, s) => sum + s.totalRequests, 0)
    };
  } catch (error) {
    console.error('Failed to get user usage stats:', error);
    return null;
  }
}

module.exports = {
  logApiUsage,
  checkMonthlyVisionLimit,
  checkUserHourlyLimit,
  checkAllLimits,
  logBusinessCardExtraction,
  getUsageStatistics,
  getUserUsageStats,
  MONTHLY_VISION_LIMIT,
  VISION_WARNING_THRESHOLD,
  UNITS_PER_BUSINESS_CARD
};
