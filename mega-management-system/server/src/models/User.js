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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
