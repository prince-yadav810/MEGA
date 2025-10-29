const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  checkInTime: {
    type: Date,
    required: [true, 'Check-in time is required']
  },
  checkOutTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late'],
    default: 'present'
  },
  location: {
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required']
      }
    },
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    city: {
      type: String
    },
    state: {
      type: String
    },
    country: {
      type: String
    },
    postalCode: {
      type: String
    }
  },
  checkOutLocation: {
    coordinates: {
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      }
    },
    address: {
      type: String
    },
    city: {
      type: String
    },
    state: {
      type: String
    },
    country: {
      type: String
    },
    postalCode: {
      type: String
    }
  },
  workDuration: {
    type: Number, // in minutes
    default: 0
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
attendanceSchema.index({ user: 1, date: -1 });
attendanceSchema.index({ date: -1 });

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Method to calculate work duration
attendanceSchema.methods.calculateWorkDuration = function() {
  if (this.checkOutTime && this.checkInTime) {
    const duration = (this.checkOutTime - this.checkInTime) / (1000 * 60); // convert to minutes
    this.workDuration = Math.round(duration);
    return this.workDuration;
  }
  return 0;
};

// Prevent multiple check-ins on the same day
attendanceSchema.index({ user: 1, date: 1 }, {
  unique: true,
  partialFilterExpression: { checkInTime: { $exists: true } }
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
