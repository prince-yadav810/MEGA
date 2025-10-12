// File path: server/src/models/Reminder.js
// REPLACE entire file with this

const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  // Basic settings
  reminderDate: {
    type: Date,
    required: true
  },
  reminderTime: {
    type: String,
    required: true
  },
  repeatFrequency: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'],
    default: 'none'
  },
  
  // Advanced settings
  isAdvanced: {
    type: Boolean,
    default: false
  },
  
  // For custom repeat (e.g., every 3 days)
  customInterval: {
    type: Number,
    default: 1
  },
  customIntervalUnit: {
    type: String,
    enum: ['days', 'weeks', 'months'],
    default: 'days'
  },
  
  // For weekly: selected days
  weeklyDays: {
    type: [Number], // 0=Sunday, 1=Monday, etc.
    default: []
  },
  
  // For monthly: type and value
  monthlyType: {
    type: String,
    enum: ['date', 'weekday'], // 'date' = 15th of month, 'weekday' = 2nd Tuesday
    default: 'date'
  },
  monthlyDate: {
    type: Number, // 1-31
    default: 1
  },
  monthlyWeekNumber: {
    type: Number, // 1=first, 2=second, 3=third, 4=fourth, -1=last
    default: 1
  },
  monthlyWeekDay: {
    type: Number, // 0=Sunday, 1=Monday, etc.
    default: 1
  },
  
  // Multiple alert times
  alertTimes: {
    type: [String], // Array of times like ["09:00", "13:00", "18:00"]
    default: []
  },
  
  // Date range for advanced
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  createdByName: {
    type: String,
    default: 'Team Member'
  },
  lastTriggered: {
    type: Date
  }
}, {
  timestamps: true
});

reminderSchema.index({ isActive: 1, reminderDate: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;