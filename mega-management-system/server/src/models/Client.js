// File Path: server/src/models/Client.js

const mongoose = require('mongoose');

const ContactPersonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    default: '',
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  email: {
    type: String,
    default: '',
    lowercase: true,
    trim: true
  },
  whatsappNumber: {
    type: String,
    default: '',
    trim: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const ClientSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    index: true
  },
  businessType: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    street: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    country: { type: String, default: 'India', trim: true }
  },
  contactPersons: [ContactPersonSchema],
  companyWebsite: {
    type: String,
    default: '',
    trim: true
  },
  notes: {
    type: String,
    default: '',
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  totalQuotations: {
    type: Number,
    default: 0
  },
  totalOutstanding: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  callFrequency: {
    type: Number,
    default: 10 // Default call frequency in days
  },
  lastCallDate: {
    type: Date,
    default: null
  },
  nextCallDate: {
    type: Date,
    default: function() {
      // Default next call date to created date + frequency if not specified
      const date = new Date();
      return date;
    }
  },
  lastCallOutcome: {
    type: String,
    default: null
  },
  lastContactedDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ClientSchema.index({ companyName: 'text' });
ClientSchema.index({ createdBy: 1 });
ClientSchema.index({ isActive: 1 });

// Virtual for full address
ClientSchema.virtual('fullAddress').get(function() {
  const { street, city, state, pincode, country } = this.address;
  return [street, city, state, pincode, country]
    .filter(Boolean)
    .join(', ');
});

// Method to get primary contact
ClientSchema.methods.getPrimaryContact = function() {
  return this.contactPersons.find(contact => contact.isPrimary) || this.contactPersons[0];
};

// Static method to search clients
ClientSchema.statics.searchClients = function(searchTerm) {
  return this.find({
    $or: [
      { companyName: { $regex: searchTerm, $options: 'i' } },
      { 'contactPersons.name': { $regex: searchTerm, $options: 'i' } },
      { 'contactPersons.email': { $regex: searchTerm, $options: 'i' } }
    ]
  });
};

module.exports = mongoose.model('Client', ClientSchema);