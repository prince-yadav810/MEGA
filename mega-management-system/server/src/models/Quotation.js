const mongoose = require('mongoose');

const QuotationSchema = new mongoose.Schema({
  number: {
    type: String,
    required: [true, 'Quotation number is required'],
    unique: true,
    trim: true
  },
  client: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [500, 'Title cannot be more than 500 characters']
  },
  amount: {
    type: String,
    required: [true, 'Amount is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },
  validUntil: {
    type: Date,
    required: [true, 'Valid until date is required']
  },
  items: {
    type: Number,
    default: 0
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
QuotationSchema.index({ number: 1 });
QuotationSchema.index({ client: 1 });
QuotationSchema.index({ status: 1 });
QuotationSchema.index({ validUntil: 1 });

module.exports = mongoose.model('Quotation', QuotationSchema);
