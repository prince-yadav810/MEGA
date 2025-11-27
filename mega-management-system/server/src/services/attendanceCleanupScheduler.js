// File Path: server/src/services/attendanceCleanupScheduler.js

const cron = require('node-cron');
const Attendance = require('../models/Attendance');

class AttendanceCleanupScheduler {
  constructor() {
    this.cronJob = null;
    this.isRunning = false;
    this.lastRunTime = null;
    this.cleanedCount = 0;
    this.errorCount = 0;
  }

  /**
   * Start the scheduler
   * Runs daily at 2 AM to clean up location data older than 7 days
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Attendance Cleanup Scheduler is already running');
      return;
    }

    // Run daily at 2 AM: 0 2 * * *
    // For testing, you can change to every minute: * * * * *
    this.cronJob = cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldLocationData();
    });

    this.isRunning = true;
    console.log('🚀 Attendance Cleanup Scheduler started');
    console.log('⏰ Cleaning up old location data daily at 2:00 AM');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('🛑 Attendance Cleanup Scheduler stopped');
    }
  }

  /**
   * Clean up location data and timestamps from records older than 7 days
   */
  async cleanupOldLocationData() {
    try {
      this.lastRunTime = new Date();
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🧹 Starting attendance data cleanup at ${this.lastRunTime.toLocaleString()}`);
      console.log('='.repeat(70));

      // Calculate the date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0); // Start of day

      console.log(`📅 Cleaning records older than: ${sevenDaysAgo.toLocaleDateString()}`);

      // Find attendance records older than 7 days that still have location data
      const recordsToClean = await Attendance.find({
        date: { $lt: sevenDaysAgo },
        $or: [
          { 'location': { $exists: true, $ne: null } },
          { 'checkOutLocation': { $exists: true, $ne: null } },
          { 'checkInTime': { $exists: true, $ne: null } },
          { 'checkOutTime': { $exists: true, $ne: null } }
        ]
      }).limit(100); // Process max 100 at a time to avoid overwhelming the system

      if (recordsToClean.length === 0) {
        console.log('✅ No records found that need cleanup');
        console.log('='.repeat(70) + '\n');
        return;
      }

      console.log(`📋 Found ${recordsToClean.length} record(s) to clean`);

      let successCount = 0;
      let failCount = 0;

      // Process each record
      for (const record of recordsToClean) {
        try {
          // Clear location data and timestamps while preserving status and workDuration
          record.location = null;
          record.checkOutLocation = null;
          record.checkInTime = null;
          record.checkOutTime = null;

          await record.save();

          successCount++;
          this.cleanedCount++;

          if (successCount % 10 === 0) {
            console.log(`   ✅ Cleaned ${successCount} records...`);
          }

        } catch (error) {
          console.error(`❌ Error cleaning record ${record._id}:`, error.message);
          failCount++;
          this.errorCount++;
        }
      }

      console.log(`\n${'='.repeat(70)}`);
      console.log(`📊 Cleanup Summary:`);
      console.log(`   ✅ Successfully cleaned: ${successCount}`);
      console.log(`   ❌ Failed: ${failCount}`);
      console.log(`   📈 Total cleaned (lifetime): ${this.cleanedCount}`);
      console.log(`   📉 Total errors (lifetime): ${this.errorCount}`);
      console.log('='.repeat(70) + '\n');

    } catch (error) {
      console.error('❌ Error in attendance cleanup scheduler:', error);
      console.error(error.stack);
    }
  }

  /**
   * Manually trigger cleanup (for testing or manual trigger)
   */
  async triggerCleanup() {
    console.log('🔧 Manual cleanup trigger initiated');
    await this.cleanupOldLocationData();
  }

  /**
   * Get scheduler statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      cleanedCount: this.cleanedCount,
      errorCount: this.errorCount,
      successRate: this.cleanedCount > 0
        ? ((this.cleanedCount - this.errorCount) / this.cleanedCount * 100).toFixed(2) + '%'
        : 'N/A'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.cleanedCount = 0;
    this.errorCount = 0;
    console.log('📊 Statistics reset');
  }
}

// Export singleton instance
module.exports = new AttendanceCleanupScheduler();
