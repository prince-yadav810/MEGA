const mongoose = require('mongoose');

const CallLogSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  outcome: {
    type: String,
    enum: ['Fruitful', 'Not Interested', 'No Answer', 'Busy', 'Callback Requested', 'Need to Visit'],
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  nextCallDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for quick lookups by client
CallLogSchema.index({ client: 1, date: -1 });

module.exports = mongoose.model('CallLog', CallLogSchema);

