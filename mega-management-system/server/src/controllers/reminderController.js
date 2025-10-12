// File path: server/src/controllers/reminderController.js
// REPLACE entire file with this

const Reminder = require('../models/Reminder');

exports.getAllReminders = async (req, res) => {
  try {
    const reminders = await Reminder.find({ isActive: true }).sort({ reminderDate: 1 });
    res.json({ success: true, data: reminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ success: false, message: 'Error fetching reminders', error: error.message });
  }
};

exports.createReminder = async (req, res) => {
  try {
    const { title, reminderDate, reminderTime, repeatFrequency } = req.body;
    
    if (!title || !reminderDate || !reminderTime) {
      return res.status(400).json({ success: false, message: 'Title, date, and time are required' });
    }
    
    const reminder = new Reminder({
      title,
      reminderDate,
      reminderTime,
      repeatFrequency: repeatFrequency || 'none',
      createdByName: 'Team Member'
    });

    await reminder.save();
    res.status(201).json({ success: true, data: reminder, message: 'Reminder created successfully' });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ success: false, message: 'Error creating reminder', error: error.message });
  }
};

exports.updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, reminderDate, reminderTime, repeatFrequency } = req.body;

    const reminder = await Reminder.findByIdAndUpdate(
      id,
      { title, reminderDate, reminderTime, repeatFrequency },
      { new: true, runValidators: true }
    );

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    res.json({ success: true, data: reminder, message: 'Reminder updated successfully' });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ success: false, message: 'Error updating reminder', error: error.message });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const reminder = await Reminder.findByIdAndDelete(id);

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    res.json({ success: true, message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ success: false, message: 'Error deleting reminder', error: error.message });
  }
};

exports.checkDueReminders = async (req, res) => {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    const dueReminders = await Reminder.find({ isActive: true, reminderDate: { $lte: now } });
    const triggeredReminders = [];

    for (const reminder of dueReminders) {
      const reminderDateStr = reminder.reminderDate.toISOString().split('T')[0];
      
      if (reminderDateStr === currentDate && reminder.reminderTime <= currentTime) {
        const lastTriggeredDate = reminder.lastTriggered ? reminder.lastTriggered.toISOString().split('T')[0] : null;
        
        if (lastTriggeredDate !== currentDate) {
          triggeredReminders.push(reminder);
          reminder.lastTriggered = now;
          
          if (reminder.repeatFrequency !== 'none') {
            const nextDate = new Date(reminder.reminderDate);
            
            switch (reminder.repeatFrequency) {
              case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
              case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
              case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
              case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
            }
            
            reminder.reminderDate = nextDate;
          } else {
            reminder.isActive = false;
          }
          
          await reminder.save();
        }
      }
    }

    res.json({ success: true, data: triggeredReminders, count: triggeredReminders.length });
  } catch (error) {
    console.error('Error checking due reminders:', error);
    res.status(500).json({ success: false, message: 'Error checking due reminders', error: error.message });
  }
};