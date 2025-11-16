// File Path: server/src/middleware/ocrRateLimiter.js

const { checkAllLimits } = require('../utils/apiUsageTracker');

/**
 * Rate Limiting Middleware for OCR Operations
 * Checks both monthly and hourly limits before allowing extraction
 */

/**
 * Middleware to check OCR rate limits
 * - Monthly: 1000 Vision API units (warning at 900)
 * - Per user hourly: 10 extractions
 */
const ocrRateLimiter = async (req, res, next) => {
  try {
    // Get user ID from authenticated request
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for OCR operations'
      });
    }

    // Check all limits
    const limitCheck = await checkAllLimits(userId);

    if (!limitCheck.allowed) {
      // Determine status code based on limit type
      const statusCode = 429; // Too Many Requests

      return res.status(statusCode).json({
        success: false,
        message: limitCheck.reason,
        error: 'RATE_LIMIT_EXCEEDED',
        limits: {
          monthly: {
            current: limitCheck.limits.monthly.currentUsage,
            limit: limitCheck.limits.monthly.limit,
            percentage: limitCheck.limits.monthly.percentage,
            remaining: limitCheck.limits.monthly.remaining
          },
          hourly: {
            current: limitCheck.limits.hourly.currentUsage,
            limit: limitCheck.limits.hourly.limit,
            remaining: limitCheck.limits.hourly.remaining,
            resetTime: limitCheck.limits.hourly.resetTime
          }
        }
      });
    }

    // Attach limit info to request for logging
    req.limitInfo = limitCheck.limits;

    // Allow request to proceed
    next();
  } catch (error) {
    console.error('Rate limiter error:', error);

    // On error, allow request to proceed to avoid false blocking
    // Log the error for monitoring
    next();
  }
};

/**
 * Middleware to check only monthly limits (less strict)
 * Used for admin or testing purposes
 */
const monthlyLimitOnly = async (req, res, next) => {
  try {
    const { checkMonthlyVisionLimit } = require('../utils/apiUsageTracker');
    const monthlyLimit = await checkMonthlyVisionLimit();

    if (!monthlyLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: 'Monthly API limit reached',
        error: 'MONTHLY_LIMIT_EXCEEDED',
        limits: {
          current: monthlyLimit.currentUsage,
          limit: monthlyLimit.limit,
          percentage: monthlyLimit.percentage
        }
      });
    }

    next();
  } catch (error) {
    console.error('Monthly limit check error:', error);
    next();
  }
};

/**
 * Middleware to add rate limit info to response headers
 * Provides transparency to clients about their usage
 */
const addRateLimitHeaders = (req, res, next) => {
  if (req.limitInfo) {
    // Add custom headers with rate limit info
    res.setHeader('X-RateLimit-Monthly-Limit', req.limitInfo.monthly.limit);
    res.setHeader('X-RateLimit-Monthly-Remaining', req.limitInfo.monthly.remaining);
    res.setHeader('X-RateLimit-Monthly-Percentage', req.limitInfo.monthly.percentage);

    res.setHeader('X-RateLimit-Hourly-Limit', req.limitInfo.hourly.limit);
    res.setHeader('X-RateLimit-Hourly-Remaining', req.limitInfo.hourly.remaining);
    res.setHeader('X-RateLimit-Hourly-Reset', req.limitInfo.hourly.resetTime.toISOString());
  }

  next();
};

module.exports = {
  ocrRateLimiter,
  monthlyLimitOnly,
  addRateLimitHeaders
};
