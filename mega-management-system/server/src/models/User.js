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
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
