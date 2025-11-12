const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Client email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);