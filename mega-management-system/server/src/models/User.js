const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  department: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['manager', 'employee', 'admin'],
    default: 'employee'
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  salary: {
    type: Number,
    default: 0,
    min: 0
  },
  advances: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    reason: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'deducted'],
      default: 'pending'
    },
    deductedFromSalary: {
      type: Boolean,
      default: false
    },
    deductionMonth: {
      type: String, // Format: 'YYYY-MM'
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedDate: {
      type: Date,
      default: null
    }
  }],
  preferences: {
    appearance: {
      dateFormat: {
        type: String,
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
        default: 'DD/MM/YYYY'
      },
      timeFormat: {
        type: String,
        enum: ['12-hour', '24-hour'],
        default: '12-hour'
      },
      currency: {
        type: String,
        enum: ['INR', 'USD', 'EUR', 'GBP'],
        default: 'INR'
      },
      rowsPerPage: {
        type: Number,
        enum: [10, 25, 50, 100],
        default: 25
      },
      compactMode: {
        type: Boolean,
        default: false
      },
      defaultPage: {
        type: String,
        default: '/dashboard'
      }
    },
    notifications: {
      email: {
        taskAssignments: {
          type: Boolean,
          default: true
        },
        taskDueDate: {
          type: Boolean,
          default: true
        },
        quotationUpdates: {
          type: Boolean,
          default: true
        },
        productStockAlerts: {
          type: Boolean,
          default: true
        },
        systemAnnouncements: {
          type: Boolean,
          default: true
        }
      },
      inApp: {
        desktopNotifications: {
          type: Boolean,
          default: true
        },
        soundAlerts: {
          type: Boolean,
          default: false
        }
      },
      schedule: {
        quietHoursEnabled: {
          type: Boolean,
          default: false
        },
        quietHoursStart: {
          type: String,
          default: '22:00'
        },
        quietHoursEnd: {
          type: String,
          default: '08:00'
        },
        weekendNotifications: {
          type: Boolean,
          default: false
        }
      }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
