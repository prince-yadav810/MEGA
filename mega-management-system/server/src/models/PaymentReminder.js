// File Path: server/src/models/PaymentReminder.js

const mongoose = require('mongoose');

const MessageLogSchema = new mongoose.Schema({
  sentAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'queued', 'sent', 'delivered', 'failed', 'read'],
    default: 'sent'
  },
  errorMessage: {
    type: String,
    default: ''
  },
  whatsappMessageId: {
    type: String,
    default: ''
  }
}, { _id: true });

const PaymentReminderSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  contactPerson: {
    name: String,
    phone: String,
    whatsappNumber: String
  },
  invoiceNumber: {
    type: String,
    default: '',
    trim: true
  },
  invoiceAmount: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    default: null
  },
  messageTemplate: {
    type: String,
    required: [true, 'Message template is required'],
    trim: true
  },
  frequencyInDays: {
    type: Number,
    required: [true, 'Frequency is required'],
    min: 1,
    default: 2
  },
  totalMessagesToSend: {
    type: Number,
    required: [true, 'Number of messages is required'],
    min: 1,
    max: 10,
    default: 5
  },
  messagesSent: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'stopped'],
    default: 'active',
    index: true
  },
  lastSentDate: {
    type: Date,
    default: null
  },
  nextScheduledDate: {
    type: Date,
    default: null
  },
  messageLogs: [MessageLogSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stoppedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  stoppedAt: {
    type: Date,
    default: null
  },
  stoppedReason: {
    type: String,
    default: '',
    trim: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: '',
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
PaymentReminderSchema.index({ status: 1, nextScheduledDate: 1 });
PaymentReminderSchema.index({ client: 1, status: 1 });

// Virtual to check if reminder is complete
PaymentReminderSchema.virtual('isComplete').get(function() {
  return this.messagesSent >= this.totalMessagesToSend;
});

// Virtual to calculate progress percentage
PaymentReminderSchema.virtual('progressPercentage').get(function() {
  return Math.round((this.messagesSent / this.totalMessagesToSend) * 100);
});

// Method to calculate next scheduled date
PaymentReminderSchema.methods.calculateNextScheduledDate = function() {
  if (!this.lastSentDate) {
    return new Date(); // Send immediately if never sent
  }
  const nextDate = new Date(this.lastSentDate);
  nextDate.setDate(nextDate.getDate() + this.frequencyInDays);
  return nextDate;
};

// Method to mark message as sent
PaymentReminderSchema.methods.markMessageSent = async function(messageStatus = 'sent', whatsappMessageId = '', errorMessage = '') {
  this.messagesSent += 1;
  this.lastSentDate = new Date();
  
  // Add to message logs
  this.messageLogs.push({
    sentAt: new Date(),
    status: messageStatus,
    whatsappMessageId,
    errorMessage
  });
  
  // Calculate next scheduled date
  if (this.messagesSent < this.totalMessagesToSend) {
    this.nextScheduledDate = this.calculateNextScheduledDate();
  } else {
    this.status = 'completed';
    this.completedAt = new Date();
    this.nextScheduledDate = null;
  }
  
  return this.save();
};

// Static method to get active reminders due for sending
PaymentReminderSchema.statics.getDueReminders = function() {
  return this.find({
    status: 'active',
    nextScheduledDate: { $lte: new Date() },
    messagesSent: { $lt: this.totalMessagesToSend }
  }).populate('client createdBy');
};

// Static method to get reminders by client
PaymentReminderSchema.statics.getClientReminders = function(clientId) {
  return this.find({ client: clientId })
    .populate('createdBy')
    .sort('-createdAt');
};

module.exports = mongoose.model('PaymentReminder', PaymentReminderSchema);