const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: function() {
      // Description is required for debit transactions (employee expenses)
      return this.type === 'debit';
    },
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // TTL index - automatically delete documents after 60 days (2 months)
    expires: 5184000 // 60 days in seconds
  }
});

// Index for efficient queries
walletTransactionSchema.index({ userId: 1, createdAt: -1 });

// Virtual for transaction metadata
walletTransactionSchema.virtual('transactionDate').get(function() {
  return this.createdAt;
});

// Ensure virtuals are included in JSON output
walletTransactionSchema.set('toJSON', { virtuals: true });
walletTransactionSchema.set('toObject', { virtuals: true });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

module.exports = WalletTransaction;
