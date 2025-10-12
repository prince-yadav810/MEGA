// File Path: server/src/controllers/paymentReminderController.js

const PaymentReminder = require('../models/PaymentReminder');
const Client = require('../models/Client');

// @desc    Get all payment reminders
// @route   GET /api/clients/payment-reminders
// @access  Private
exports.getAllReminders = async (req, res) => {
  try {
    const { status, clientId, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (clientId) {
      query.client = clientId;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reminders = await PaymentReminder.find(query)
      .populate('client', 'companyName contactPersons')
      .populate('createdBy', 'name email')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await PaymentReminder.countDocuments(query);
    
    res.json({
      success: true,
      count: reminders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: reminders
    });
  } catch (error) {
    console.error('Get all reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment reminders',
      error: error.message
    });
  }
};

// @desc    Get reminders for a specific client
// @route   GET /api/clients/:clientId/payment-reminders
// @access  Private
exports.getClientReminders = async (req, res) => {
  try {
    const reminders = await PaymentReminder.find({ client: req.params.clientId })
      .populate('createdBy', 'name email')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    console.error('Get client reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching client reminders',
      error: error.message
    });
  }
};

// @desc    Create new payment reminder campaign
// @route   POST /api/clients/:clientId/payment-reminders
// @access  Private
exports.createReminder = async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Get primary contact or first contact
    const primaryContact = client.getPrimaryContact();
    
    if (!primaryContact) {
      return res.status(400).json({
        success: false,
        message: 'Client must have at least one contact person'
      });
    }
    
    const reminderData = {
      client: req.params.clientId,
      contactPerson: {
        name: primaryContact.name,
        phone: primaryContact.phone,
        whatsappNumber: primaryContact.whatsappNumber
      },
      invoiceNumber: req.body.invoiceNumber || '',
      invoiceAmount: req.body.invoiceAmount || 0,
      dueDate: req.body.dueDate || null,
      messageTemplate: req.body.messageTemplate,
      frequencyInDays: req.body.frequencyInDays,
      totalMessagesToSend: req.body.totalMessagesToSend,
      createdBy: req.user.id,
      notes: req.body.notes || ''
    };
    
    // Calculate first scheduled date
    const reminder = await PaymentReminder.create(reminderData);
    reminder.nextScheduledDate = reminder.calculateNextScheduledDate();
    await reminder.save();
    
    await reminder.populate('client createdBy');
    
    // Emit socket notification
    if (req.io) {
      req.io.emit('payment-reminder:created', {
        reminder,
        createdBy: req.user
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Payment reminder campaign created successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating payment reminder',
      error: error.message
    });
  }
};

// @desc    Stop/pause payment reminder
// @route   PATCH /api/clients/payment-reminders/:id/stop
// @access  Private
exports.stopReminder = async (req, res) => {
  try {
    const reminder = await PaymentReminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Payment reminder not found'
      });
    }
    
    if (reminder.status === 'completed' || reminder.status === 'stopped') {
      return res.status(400).json({
        success: false,
        message: 'Reminder is already stopped or completed'
      });
    }
    
    reminder.status = 'stopped';
    reminder.stoppedBy = req.user.id;
    reminder.stoppedAt = new Date();
    reminder.stoppedReason = req.body.reason || 'Manually stopped';
    reminder.nextScheduledDate = null;
    
    await reminder.save();
    await reminder.populate('client createdBy stoppedBy');
    
    // Emit socket notification
    if (req.io) {
      req.io.emit('payment-reminder:stopped', {
        reminder,
        stoppedBy: req.user
      });
    }
    
    res.json({
      success: true,
      message: 'Payment reminder stopped successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Stop reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while stopping payment reminder',
      error: error.message
    });
  }
};

// @desc    Resume payment reminder
// @route   PATCH /api/clients/payment-reminders/:id/resume
// @access  Private
exports.resumeReminder = async (req, res) => {
  try {
    const reminder = await PaymentReminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Payment reminder not found'
      });
    }
    
    if (reminder.status !== 'stopped' && reminder.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Reminder can only resume from stopped or paused status'
      });
    }
    
    if (reminder.messagesSent >= reminder.totalMessagesToSend) {
      return res.status(400).json({
        success: false,
        message: 'All messages have already been sent'
      });
    }
    
    reminder.status = 'active';
    reminder.nextScheduledDate = reminder.calculateNextScheduledDate();
    
    await reminder.save();
    await reminder.populate('client createdBy');
    
    // Emit socket notification
    if (req.io) {
      req.io.emit('payment-reminder:resumed', {
        reminder,
        resumedBy: req.user
      });
    }
    
    res.json({
      success: true,
      message: 'Payment reminder resumed successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Resume reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resuming payment reminder',
      error: error.message
    });
  }
};

// @desc    Delete payment reminder
// @route   DELETE /api/clients/payment-reminders/:id
// @access  Private (Admin only)
exports.deleteReminder = async (req, res) => {
  try {
    const reminder = await PaymentReminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Payment reminder not found'
      });
    }
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete payment reminders'
      });
    }
    
    await reminder.deleteOne();
    
    res.json({
      success: true,
      message: 'Payment reminder deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting payment reminder',
      error: error.message
    });
  }
};

// @desc    Manually send reminder message (for testing or manual trigger)
// @route   POST /api/clients/payment-reminders/:id/send
// @access  Private
exports.sendReminderManually = async (req, res) => {
  try {
    const reminder = await PaymentReminder.findById(req.params.id)
      .populate('client');
    
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Payment reminder not found'
      });
    }
    
    if (reminder.messagesSent >= reminder.totalMessagesToSend) {
      return res.status(400).json({
        success: false,
        message: 'All messages have already been sent'
      });
    }
    
    // TODO: Integrate with WhatsApp API here
    // For now, just mark as sent
    await reminder.markMessageSent('sent', '', '');
    
    // Emit socket notification
    if (req.io) {
      req.io.emit('payment-reminder:message-sent', {
        reminder,
        sentBy: req.user
      });
      
      // If completed, send completion notification
      if (reminder.status === 'completed') {
        req.io.emit('payment-reminder:completed', {
          reminder,
          client: reminder.client
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Reminder message sent successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Send reminder manually error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending reminder',
      error: error.message
    });
  }
};

// @desc    Get reminder statistics
// @route   GET /api/clients/payment-reminders/stats
// @access  Private
exports.getReminderStats = async (req, res) => {
  try {
    const totalReminders = await PaymentReminder.countDocuments();
    const activeReminders = await PaymentReminder.countDocuments({ status: 'active' });
    const completedReminders = await PaymentReminder.countDocuments({ status: 'completed' });
    const stoppedReminders = await PaymentReminder.countDocuments({ status: 'stopped' });
    
    const totalMessagesSent = await PaymentReminder.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$messagesSent' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalReminders,
        activeReminders,
        completedReminders,
        stoppedReminders,
        totalMessagesSent: totalMessagesSent[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get reminder stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reminder statistics',
      error: error.message
    });
  }
};