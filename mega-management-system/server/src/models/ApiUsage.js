// File Path: server/src/models/ApiUsage.js

const mongoose = require('mongoose');

/**
 * API Usage Model
 * Tracks Google Vision API usage for monitoring and rate limiting
 */

const ApiUsageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['google-vision', 'gemini'],
    index: true
  },
  operation: {
    type: String,
    required: true,
    enum: ['business-card-extraction', 'text-detection', 'ai-parsing']
  },
  unitsUsed: {
    type: Number,
    required: true,
    default: 1
  },
  success: {
    type: Boolean,
    required: true,
    default: true
  },
  errorMessage: {
    type: String,
    default: ''
  },
  metadata: {
    frontImageSize: Number,
    backImageSize: Number,
    processingTime: Number, // in milliseconds
    extractedTextLength: Number,
    companyName: String
  },
  ipAddress: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
ApiUsageSchema.index({ userId: 1, createdAt: -1 });
ApiUsageSchema.index({ serviceType: 1, createdAt: -1 });
ApiUsageSchema.index({ userId: 1, serviceType: 1, createdAt: -1 });

// Index for monthly usage queries
ApiUsageSchema.index({
  serviceType: 1,
  createdAt: -1
});

// Static method to get user's hourly usage
ApiUsageSchema.statics.getUserHourlyUsage = async function(userId) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const count = await this.countDocuments({
    userId,
    serviceType: 'google-vision',
    createdAt: { $gte: oneHourAgo }
  });

  return count;
};

// Static method to get monthly usage (for all users)
ApiUsageSchema.statics.getMonthlyUsage = async function(serviceType = 'google-vision') {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await this.aggregate([
    {
      $match: {
        serviceType,
        createdAt: { $gte: startOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        totalUnits: { $sum: '$unitsUsed' },
        totalRequests: { $sum: 1 },
        successfulRequests: {
          $sum: { $cond: ['$success', 1, 0] }
        }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      totalUnits: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0
    };
  }

  return {
    totalUnits: result[0].totalUnits,
    totalRequests: result[0].totalRequests,
    successfulRequests: result[0].successfulRequests,
    failedRequests: result[0].totalRequests - result[0].successfulRequests
  };
};

// Static method to get usage statistics by user
ApiUsageSchema.statics.getUserStats = async function(userId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$serviceType',
        totalUnits: { $sum: '$unitsUsed' },
        totalRequests: { $sum: 1 },
        successfulRequests: {
          $sum: { $cond: ['$success', 1, 0] }
        },
        averageProcessingTime: { $avg: '$metadata.processingTime' }
      }
    }
  ]);

  return result;
};

// Static method to get daily usage breakdown for charts
ApiUsageSchema.statics.getDailyUsageBreakdown = async function(days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          serviceType: '$serviceType'
        },
        totalUnits: { $sum: '$unitsUsed' },
        totalRequests: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);

  return result;
};

module.exports = mongoose.model('ApiUsage', ApiUsageSchema);
