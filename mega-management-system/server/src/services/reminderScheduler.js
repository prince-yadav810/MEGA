// File Path: server/src/services/reminderScheduler.js

const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const { createNotification, notifyMultipleUsers } = require('../controllers/notificationController');

class ReminderScheduler {
  constructor(io) {
    this.cronJob = null;
    this.isRunning = false;
    this.io = io; // Socket.IO instance for real-time notifications
    
    this.processedCount = 0;
    this.failedCount = 0;
    this.lastCheckTime = null;
  }

  /**
   * Start the scheduler
   * Runs every minute to check for due reminders
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Reminder Scheduler is already running');
      return;
    }

    // Run every minute to check for due reminders: * * * * *
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkAndTriggerReminders();
    });

    this.isRunning = true;
    console.log('🚀 Reminder Scheduler started');
    console.log('⏰ Checking for due reminders every minute');
    
    // Run immediately on start (after 5 seconds)
    setTimeout(() => this.checkAndTriggerReminders(), 5000);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('🛑 Reminder Scheduler stopped');
    }
  }

  /**
   * Check and trigger due reminders
   */
  async checkAndTriggerReminders() {
    try {
      this.lastCheckTime = new Date();
      console.log(`🔍 Checking for due reminders at ${this.lastCheckTime.toLocaleString()}`);

      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
      const currentDay = now.getDay();

      const reminders = await Reminder.find({ isActive: true });
      const triggeredReminders = [];

      for (const reminder of reminders) {
        try {
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

                // Only trigger if we haven't triggered this specific time today
                if (lastTriggeredDate !== currentDate || lastTriggeredTime !== alertTime) {
                  triggeredReminders.push({ ...reminder.toObject(), triggeredTime: alertTime });
                  reminder.lastTriggered = now;

                  if (reminder.repeatFrequency === 'none') {
                    reminder.isActive = false;
                  }

                  await reminder.save();

                  // Send notifications based on visibility
                  await this.sendReminderNotifications(reminder);
                  this.processedCount++;
                  
                  console.log(`✅ Triggered reminder: "${reminder.title}" at ${alertTime}`);
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error processing reminder ${reminder._id}:`, error);
          this.failedCount++;
        }
      }

      if (triggeredReminders.length > 0) {
        console.log(`📬 Triggered ${triggeredReminders.length} reminder(s)`);
      }

      return { success: true, triggeredCount: triggeredReminders.length };
    } catch (error) {
      console.error('Error in reminder scheduler:', error);
      this.failedCount++;
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notifications for a triggered reminder
   */
  async sendReminderNotifications(reminder) {
    try {
      if (reminder.visibility === 'public') {
        // For public reminders, notify all active users
        const allUsers = await User.find({ isActive: true }).select('_id');
        const userIds = allUsers.map(user => user._id);
        
        await notifyMultipleUsers(
          userIds,
          {
            type: 'info',
            category: 'reminder',
            title: '🔔 Public Reminder Alert',
            message: `${reminder.title}${reminder.description ? ' - ' + reminder.description : ''}`,
            entityType: 'reminder',
            entityId: reminder._id,
            actionUrl: '/notes-reminders',
            createdBy: reminder.createdByName || 'System'
          },
          this.io
        );
        
        console.log(`📢 Public reminder sent to ${userIds.length} user(s)`);
      } else if (reminder.createdBy) {
        // For private reminders, only notify the creator
        await createNotification({
          userId: reminder.createdBy,
          type: 'info',
          category: 'reminder',
          title: '🔔 Reminder Alert',
          message: `${reminder.title}${reminder.description ? ' - ' + reminder.description : ''}`,
          entityType: 'reminder',
          entityId: reminder._id,
          actionUrl: '/notes-reminders',
          createdBy: 'System'
        }, this.io);
        
        console.log(`📬 Private reminder sent to creator`);
      }
    } catch (error) {
      console.error('Error sending reminder notifications:', error);
      throw error;
    }
  }

  /**
   * Manually trigger a check (for testing or Cloud Scheduler)
   */
  async triggerCheck() {
    console.log('🔧 Manual reminder check triggered');
    return await this.checkAndTriggerReminders();
  }

  /**
   * Get scheduler statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      processedCount: this.processedCount,
      failedCount: this.failedCount,
      lastCheckTime: this.lastCheckTime,
      uptime: this.isRunning ? new Date() - this.lastCheckTime : null
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.processedCount = 0;
    this.failedCount = 0;
    console.log('📊 Reminder scheduler statistics reset');
  }
}

module.exports = ReminderScheduler;

