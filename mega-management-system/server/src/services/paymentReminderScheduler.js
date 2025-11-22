// File Path: server/src/services/paymentReminderScheduler.js

const cron = require('node-cron');
const PaymentReminder = require('../models/PaymentReminder');
const whatsappService = require('./whatsappService');

class PaymentReminderScheduler {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
    this.lastRunTime = null;
    this.processedCount = 0;
    this.failedCount = 0;
  }

  /**
   * Start the scheduler
   * Runs every 5 minutes to check for due reminders
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Payment Reminder Scheduler is already running');
      return;
    }

    // Run every 5 minutes: */5 * * * *
    // For testing, you can change to every minute: * * * * *
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      await this.checkAndSendReminders();
    });

    this.isRunning = true;
    console.log('🚀 Payment Reminder Scheduler started');
    console.log('⏰ Checking for due reminders every 5 minutes');
    
    // Run immediately on start
    setTimeout(() => this.checkAndSendReminders(), 5000);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('🛑 Payment Reminder Scheduler stopped');
    }
  }

  /**
   * Check for due reminders and send messages
   */
  async checkAndSendReminders() {
    try {
      this.lastRunTime = new Date();
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🔍 Checking for due payment reminders at ${this.lastRunTime.toLocaleString()}`);
      console.log('='.repeat(70));

      // Find all active reminders that are due
      const dueReminders = await PaymentReminder.find({
        status: 'active',
        $or: [
          { nextScheduledDate: { $lte: new Date() } },
          { nextScheduledDate: null, messagesSent: 0 } // First message
        ],
        messagesSent: { $lt: 100 } // Safety limit
      })
        .populate('client', 'companyName contactPersons')
        .populate('createdBy', 'name email')
        .limit(50); // Process max 50 at a time to avoid overwhelming the system

      if (dueReminders.length === 0) {
        console.log('✅ No due reminders found');
        console.log('='.repeat(70) + '\n');
        return;
      }

      console.log(`📋 Found ${dueReminders.length} due reminder(s)`);

      let successCount = 0;
      let failCount = 0;

      // Process each reminder
      for (const reminder of dueReminders) {
        try {
          // Check if we've reached the total messages limit
          if (reminder.messagesSent >= reminder.totalMessagesToSend) {
            console.log(`⏭️  Skipping reminder ${reminder._id} - Already sent all messages`);
            reminder.status = 'completed';
            reminder.completedAt = new Date();
            reminder.nextScheduledDate = null;
            await reminder.save();
            continue;
          }

          console.log(`\n📤 Processing reminder for: ${reminder.client.companyName}`);
          console.log(`   Invoice: ${reminder.invoiceNumber || 'N/A'}`);
          console.log(`   Messages sent: ${reminder.messagesSent}/${reminder.totalMessagesToSend}`);

          // Prepare reminder data for WhatsApp service
          const reminderData = {
            client: reminder.client,
            contactPerson: reminder.contactPerson,
            messageTemplate: reminder.messageTemplate,
            invoiceNumber: reminder.invoiceNumber,
            invoiceAmount: reminder.invoiceAmount,
            dueDate: reminder.dueDate
          };

          // Send WhatsApp message
          const result = await whatsappService.sendPaymentReminder(reminderData);

          if (result.success) {
            // Mark message as sent
            await reminder.markMessageSent(
              result.status,
              result.messageId,
              result.errorMessage || ''
            );

            successCount++;
            this.processedCount++;

            console.log(`   ✅ Message sent successfully`);
            console.log(`   📊 Progress: ${reminder.messagesSent}/${reminder.totalMessagesToSend}`);
            
            if (reminder.status === 'completed') {
              console.log(`   🎉 Campaign completed for ${reminder.client.companyName}`);
            } else {
              console.log(`   ⏰ Next scheduled: ${reminder.nextScheduledDate?.toLocaleString() || 'N/A'}`);
            }
          } else {
            // Mark as failed but don't stop the campaign
            await reminder.markMessageSent(
              'failed',
              '',
              result.errorMessage || 'Unknown error'
            );

            failCount++;
            this.failedCount++;

            console.log(`   ❌ Failed to send message: ${result.errorMessage}`);
          }

          // Add a small delay between messages to avoid rate limiting
          await this.sleep(1000); // 1 second delay

        } catch (error) {
          console.error(`❌ Error processing reminder ${reminder._id}:`, error.message);
          failCount++;
          this.failedCount++;

          // Log the error in message logs
          try {
            await reminder.markMessageSent('failed', '', error.message);
          } catch (saveError) {
            console.error('Failed to save error log:', saveError.message);
          }
        }
      }

      console.log(`\n${'='.repeat(70)}`);
      console.log(`📊 Batch Summary:`);
      console.log(`   ✅ Success: ${successCount}`);
      console.log(`   ❌ Failed: ${failCount}`);
      console.log(`   📈 Total processed (lifetime): ${this.processedCount}`);
      console.log(`   📉 Total failed (lifetime): ${this.failedCount}`);
      console.log('='.repeat(70) + '\n');

    } catch (error) {
      console.error('❌ Error in reminder scheduler:', error);
      console.error(error.stack);
    }
  }

  /**
   * Manually trigger a check (for testing or manual trigger)
   */
  async triggerCheck() {
    console.log('🔧 Manual trigger initiated');
    await this.checkAndSendReminders();
  }

  /**
   * Get scheduler statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      processedCount: this.processedCount,
      failedCount: this.failedCount,
      successRate: this.processedCount > 0 
        ? ((this.processedCount - this.failedCount) / this.processedCount * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.processedCount = 0;
    this.failedCount = 0;
    console.log('📊 Statistics reset');
  }

  /**
   * Sleep utility for delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get all upcoming reminders (next 7 days)
   */
  async getUpcomingReminders(days = 7) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const reminders = await PaymentReminder.find({
        status: 'active',
        nextScheduledDate: {
          $gte: new Date(),
          $lte: futureDate
        }
      })
        .populate('client', 'companyName')
        .sort('nextScheduledDate')
        .limit(100);

      return reminders;
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
      return [];
    }
  }

  /**
   * Get overdue reminders
   */
  async getOverdueReminders() {
    try {
      const reminders = await PaymentReminder.find({
        status: 'active',
        nextScheduledDate: { $lt: new Date() },
        messagesSent: { $lt: 100 }
      })
        .populate('client', 'companyName')
        .sort('nextScheduledDate');

      return reminders;
    } catch (error) {
      console.error('Error fetching overdue reminders:', error);
      return [];
    }
  }
}

// Export singleton instance
module.exports = new PaymentReminderScheduler();

