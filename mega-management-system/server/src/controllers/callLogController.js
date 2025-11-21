const CallLog = require('../models/CallLog');
const Client = require('../models/Client');
const Reminder = require('../models/Reminder');
const { createNotification } = require('./notificationController');

exports.logCall = async (req, res) => {
  try {
    const { clientId, outcome, notes, nextCallDate } = req.body;

    // Validate client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Calculate next call date based on outcome if not provided
    let calculatedNextCallDate = nextCallDate;
    if (!calculatedNextCallDate) {
      // If fruitful or standard outcomes, use default frequency
      if (['Fruitful', 'No Answer', 'Busy', 'Not Interested'].includes(outcome)) {
        const frequency = client.callFrequency || 10;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + frequency);
        calculatedNextCallDate = nextDate;
      } else {
        // Default to tomorrow for other cases if not specified
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1);
        calculatedNextCallDate = nextDate;
      }
    }

    // Create Call Log
    const callLog = await CallLog.create({
      client: clientId,
      performedBy: req.user._id,
      outcome,
      notes,
      nextCallDate: calculatedNextCallDate
    });

    // Update Client with last call info and next call date
    client.lastCallDate = new Date();
    client.lastCallOutcome = outcome;
    client.nextCallDate = calculatedNextCallDate;
    await client.save();

    // Create reminder if outcome requires callback or visit
    if (outcome === 'Callback Requested' || outcome === 'Need to Visit') {
      try {
        const reminderTitle = outcome === 'Callback Requested' 
          ? `Call Back: ${client.companyName}`
          : `Visit Required: ${client.companyName}`;
        
        // Parse the nextCallDate to get date and set default time
        const reminderDate = new Date(calculatedNextCallDate);
        const reminderTime = '09:00'; // Default time

        const reminder = await Reminder.create({
          title: reminderTitle,
          reminderDate: reminderDate,
          reminderTime: reminderTime,
          repeatFrequency: 'none',
          isActive: true,
          createdBy: req.user._id || req.user.id,
          createdByName: req.user.name || 'Team Member'
        });

        // Create notification for the reminder
        if (req.user && req.io) {
          await createNotification({
            userId: req.user.id,
            type: 'warning',
            category: 'reminder',
            title: 'Reminder Created',
            message: `${reminderTitle} scheduled for ${reminderDate.toLocaleDateString()}`,
            entityType: 'reminder',
            entityId: reminder._id,
            actionUrl: '/notes-reminders',
            createdBy: req.user.name || 'System'
          }, req.io);
        }
      } catch (reminderError) {
        console.error('Error creating reminder:', reminderError);
        // Don't fail the call log if reminder creation fails
      }
    }

    res.status(201).json({
      success: true,
      data: callLog,
      message: 'Call logged successfully'
    });
  } catch (error) {
    console.error('Error logging call:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging call',
      error: error.message
    });
  }
};

exports.getClientLogs = async (req, res) => {
  try {
    const { clientId } = req.params;

    const logs = await CallLog.find({ client: clientId })
      .populate('performedBy', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching client logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client logs',
      error: error.message
    });
  }
};

