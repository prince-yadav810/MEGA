// File path: server/src/controllers/reminderController.js
// REPLACE entire file with this

const Reminder = require('../models/Reminder');
const { createNotification } = require('./notificationController');

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
    const reminderData = req.body;
    
    if (!reminderData.title || !reminderData.reminderDate || !reminderData.reminderTime) {
      return res.status(400).json({ success: false, message: 'Title, date, and time are required' });
    }
    
    const reminder = new Reminder({
      ...reminderData,
      createdByName: 'Team Member'
    });

    await reminder.save();

    // Create notification for user
    if (req.user) {
      await createNotification({
        userId: req.user.id,
        type: 'success',
        category: 'reminder',
        title: 'Reminder Created',
        message: `Reminder "${reminder.title}" has been created successfully`,
        entityType: 'reminder',
        entityId: reminder._id,
        actionUrl: '/notes-reminders',
        createdBy: req.user.name || 'Team Member'
      }, req.io);
    }

    res.status(201).json({ success: true, data: reminder, message: 'Reminder created successfully' });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ success: false, message: 'Error creating reminder', error: error.message });
  }
};

exports.updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const reminderData = req.body;

    const reminder = await Reminder.findByIdAndUpdate(id, reminderData, { new: true, runValidators: true });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    // Create notification for user
    if (req.user) {
      await createNotification({
        userId: req.user.id,
        type: 'success',
        category: 'reminder',
        title: 'Reminder Updated',
        message: `Reminder "${reminder.title}" has been updated successfully`,
        entityType: 'reminder',
        entityId: reminder._id,
        actionUrl: '/notes-reminders',
        createdBy: req.user.name || 'Team Member'
      }, req.io);
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

    // Create notification for user
    if (req.user) {
      await createNotification({
        userId: req.user.id,
        type: 'warning',
        category: 'reminder',
        title: 'Reminder Deleted',
        message: `Reminder "${reminder.title}" has been deleted successfully`,
        entityType: 'reminder',
        entityId: null,
        actionUrl: '/notes-reminders',
        createdBy: req.user.name || 'Team Member'
      }, req.io);
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
    const currentDay = now.getDay();

    const reminders = await Reminder.find({ isActive: true });
    const triggeredReminders = [];

    for (const reminder of reminders) {
      // Check if reminder is within date range
      if (reminder.startDate && now < new Date(reminder.startDate)) continue;
      if (reminder.endDate && now > new Date(reminder.endDate)) {
        reminder.isActive = false;
        await reminder.save();
        continue;
      }

      const reminderDateStr = reminder.reminderDate.toISOString().split('T')[0];
      let shouldTrigger = false;

      // Check if today matches the reminder pattern
      if (reminder.repeatFrequency === 'none') {
        shouldTrigger = reminderDateStr === currentDate;
      } else if (reminder.repeatFrequency === 'daily') {
        shouldTrigger = true;
      } else if (reminder.repeatFrequency === 'weekly') {
        if (reminder.isAdvanced && reminder.weeklyDays.length > 0) {
          shouldTrigger = reminder.weeklyDays.includes(currentDay);
        } else {
          const daysDiff = Math.floor((now - new Date(reminder.reminderDate)) / (1000 * 60 * 60 * 24));
          shouldTrigger = daysDiff >= 0 && daysDiff % 7 === 0;
        }
      } else if (reminder.repeatFrequency === 'monthly') {
        if (reminder.isAdvanced && reminder.monthlyType === 'weekday') {
          const weekNumber = Math.ceil(now.getDate() / 7);
          shouldTrigger = reminder.monthlyWeekNumber === weekNumber && reminder.monthlyWeekDay === currentDay;
        } else {
          shouldTrigger = now.getDate() === (reminder.monthlyDate || new Date(reminder.reminderDate).getDate());
        }
      } else if (reminder.repeatFrequency === 'yearly') {
        const reminderMonth = new Date(reminder.reminderDate).getMonth();
        const reminderDay = new Date(reminder.reminderDate).getDate();
        shouldTrigger = now.getMonth() === reminderMonth && now.getDate() === reminderDay;
      } else if (reminder.repeatFrequency === 'custom' && reminder.isAdvanced) {
        const daysDiff = Math.floor((now - new Date(reminder.reminderDate)) / (1000 * 60 * 60 * 24));
        const interval = reminder.customInterval || 1;
        const unit = reminder.customIntervalUnit || 'days';
        
        if (unit === 'days') {
          shouldTrigger = daysDiff >= 0 && daysDiff % interval === 0;
        }
      }

      if (shouldTrigger) {
        // Check alert times
        const timesToCheck = reminder.alertTimes && reminder.alertTimes.length > 0 
          ? reminder.alertTimes 
          : [reminder.reminderTime];

        for (const alertTime of timesToCheck) {
          if (alertTime <= currentTime) {
            const lastTriggeredDate = reminder.lastTriggered ? reminder.lastTriggered.toISOString().split('T')[0] : null;
            const lastTriggeredTime = reminder.lastTriggered ? reminder.lastTriggered.toTimeString().split(' ')[0].substring(0, 5) : null;

            if (lastTriggeredDate !== currentDate || lastTriggeredTime !== alertTime) {
              triggeredReminders.push({ ...reminder.toObject(), triggeredTime: alertTime });
              reminder.lastTriggered = now;

              if (reminder.repeatFrequency === 'none') {
                reminder.isActive = false;
              }

              await reminder.save();

              // Create notification for triggered reminder
              if (reminder.createdBy) {
                await createNotification({
                  userId: reminder.createdBy,
                  type: 'warning',
                  category: 'reminder',
                  title: 'Reminder Alert',
                  message: `Reminder: ${reminder.title}${reminder.description ? ' - ' + reminder.description : ''}`,
                  entityType: 'reminder',
                  entityId: reminder._id,
                  actionUrl: '/notes-reminders',
                  createdBy: 'System'
                }, req.io);
              }
            }
          }
        }
      }
    }

    res.json({ success: true, data: triggeredReminders, count: triggeredReminders.length });
  } catch (error) {
    console.error('Error checking due reminders:', error);
    res.status(500).json({ success: false, message: 'Error checking due reminders', error: error.message });
  }
};