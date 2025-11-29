const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  // Company Settings
  company: {
    name: {
      type: String,
      default: 'MEGA Enterprises'
    },
    logo: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    pincode: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    gstNumber: {
      type: String,
      default: ''
    },
    panNumber: {
      type: String,
      default: ''
    },
    defaultCurrency: {
      type: String,
      enum: ['INR', 'USD', 'EUR', 'GBP'],
      default: 'INR'
    },
    financialYearStart: {
      type: String,
      default: 'April' // April for Indian FY
    }
  },

  // Attendance Settings
  attendance: {
    officeStartTime: {
      type: String,
      default: '09:00'
    },
    officeEndTime: {
      type: String,
      default: '18:00'
    },
    lateThresholdMinutes: {
      type: Number,
      default: 15 // After 15 minutes = late
    },
    halfDayHours: {
      type: Number,
      default: 4 // Minimum hours for half-day
    },
    fullDayHours: {
      type: Number,
      default: 8 // Standard full day hours
    },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    geolocationRequired: {
      type: Boolean,
      default: false
    },
    officeLocation: {
      latitude: {
        type: Number,
        default: 0
      },
      longitude: {
        type: Number,
        default: 0
      },
      address: {
        type: String,
        default: ''
      }
    },
    geofenceRadius: {
      type: Number,
      default: 100 // meters
    },
    allowRemoteCheckIn: {
      type: Boolean,
      default: true
    }
  },

  // Quotation Settings
  quotation: {
    prefix: {
      type: String,
      default: 'MEGA'
    },
    nextNumber: {
      type: Number,
      default: 1
    },
    numberFormat: {
      type: String,
      default: '{PREFIX}/{YEAR}/{NUMBER}' // e.g., MEGA/2024/001
    },
    defaultGstRate: {
      type: Number,
      default: 18
    },
    defaultPaymentTerms: {
      type: String,
      default: '50% advance, 50% on delivery'
    },
    defaultOfferValidity: {
      type: Number,
      default: 30 // days
    },
    showBankDetails: {
      type: Boolean,
      default: true
    },
    bankDetails: {
      bankName: {
        type: String,
        default: ''
      },
      accountName: {
        type: String,
        default: ''
      },
      accountNumber: {
        type: String,
        default: ''
      },
      ifscCode: {
        type: String,
        default: ''
      },
      branch: {
        type: String,
        default: ''
      }
    },
    termsAndConditions: {
      type: String,
      default: ''
    },
    footerNote: {
      type: String,
      default: 'Thank you for your business!'
    }
  },

  // Payroll Settings
  payroll: {
    payCycle: {
      type: String,
      enum: ['monthly', 'bi-weekly', 'weekly'],
      default: 'monthly'
    },
    salaryCreditDay: {
      type: Number,
      default: 1 // 1st of the month
    },
    maxAdvancePercent: {
      type: Number,
      default: 50 // Max 50% of salary as advance
    },
    advanceDeductionMethod: {
      type: String,
      enum: ['full', 'installments'],
      default: 'full'
    },
    pfEnabled: {
      type: Boolean,
      default: false
    },
    pfRate: {
      type: Number,
      default: 12 // 12% PF
    },
    tdsEnabled: {
      type: Boolean,
      default: false
    },
    overtimeEnabled: {
      type: Boolean,
      default: false
    },
    overtimeRate: {
      type: Number,
      default: 1.5 // 1.5x regular rate
    }
  },

  // User Management Settings
  userManagement: {
    defaultRole: {
      type: String,
      enum: ['employee', 'manager'],
      default: 'employee'
    },
    passwordMinLength: {
      type: Number,
      default: 8
    },
    passwordRequireUppercase: {
      type: Boolean,
      default: true
    },
    passwordRequireNumbers: {
      type: Boolean,
      default: true
    },
    passwordRequireSpecial: {
      type: Boolean,
      default: true
    },
    sessionTimeoutMinutes: {
      type: Number,
      default: 480 // 8 hours
    },
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    departments: {
      type: [String],
      default: ['Sales', 'Operations', 'Finance', 'HR', 'IT', 'Marketing']
    }
  },

  // Notification Settings (Global)
  notifications: {
    emailEnabled: {
      type: Boolean,
      default: true
    },
    whatsappEnabled: {
      type: Boolean,
      default: false
    },
    smsEnabled: {
      type: Boolean,
      default: false
    },
    dailyDigestTime: {
      type: String,
      default: '09:00'
    },
    reminderBeforeDueHours: {
      type: Number,
      default: 24 // 24 hours before due date
    },
    paymentReminderNotifications: {
      type: Boolean,
      default: true // Notify all employees when payment reminders are sent
    },
    productCreationNotifications: {
      type: Boolean,
      default: true // Notify all employees, managers, and admins when products are created
    }
  },

  // Last updated by
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
SystemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
