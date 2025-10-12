// File path: server/src/models/Reminder.js
// REPLACE entire file with this

const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
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
    enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
    default: 'none'
  },
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