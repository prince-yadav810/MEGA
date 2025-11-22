const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: false,
    trim: true,
    default: '',
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'completed'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  completedDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  timeTracked: {
    type: String,
    default: '0h'
  },
  estimatedTime: {
    type: String,
    default: '0h'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
TaskSchema.index({ status: 1, priority: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ assignees: 1 });
TaskSchema.index({ createdBy: 1 });

// Update completedDate when status changes to completed
TaskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', TaskSchema);
