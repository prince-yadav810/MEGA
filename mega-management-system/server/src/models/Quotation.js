const mongoose = require('mongoose');

const QuotationSchema = new mongoose.Schema({
  // PDF Storage
  pdfUrl: {
    type: String,
    required: [true, 'PDF URL is required'],
    trim: true
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },

  // Extracted from Excel
  refNo: {
    type: String,
    required: [true, 'Reference number is required'],
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Quotation date is required']
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },

  // Line Items from Excel
  items: [{
    srNo: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    rate: {
      type: Number,
      required: true
    },
    gstPercent: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],

  // Calculations
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required']
  },
  gst: {
    type: Number,
    required: [true, 'GST amount is required']
  },
  grandTotal: {
    type: Number,
    required: [true, 'Grand total is required']
  },

  // Terms & Conditions (extracted from Excel)
  paymentTerms: {
    type: String,
    trim: true,
    default: 'PAYMENT IMMEDIATE'
  },
  offerValidity: {
    type: String,
    trim: true,
    default: 'OFFER VALIDITY 1 WEEKS'
  },

  // Status & Priority tracking
  status: {
    type: String,
    enum: ['on_hold', 'approved', 'rejected'],
    default: 'on_hold'
  },
  statusNote: {
    type: String,
    trim: true,
    default: ''
  },
  priority: {
    type: String,
    enum: ['low', 'high', 'extreme'],
    default: 'low'
  },

  // Linked Tasks
  linkedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],

  // User tracking
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
QuotationSchema.index({ refNo: 1 });
QuotationSchema.index({ clientName: 1 });
QuotationSchema.index({ status: 1 });
QuotationSchema.index({ priority: 1 });
QuotationSchema.index({ date: -1 }); // Sort by date descending

module.exports = mongoose.model('Quotation', QuotationSchema);
