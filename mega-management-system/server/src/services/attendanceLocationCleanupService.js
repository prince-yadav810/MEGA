// File Path: server/src/services/attendanceLocationCleanupService.js
// Service to clean up location data from attendance records older than 7 days

const cron = require('node-cron');
const Attendance = require('../models/Attendance');

class AttendanceLocationCleanupService {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.stats = {
      totalRuns: 0,
      totalRecordsCleaned: 0,
      lastCleanedCount: 0,
      errors: 0
    };
  }

  /**
   * Start the scheduled cleanup job
   * Runs daily at 2:00 AM
   */
  start() {
    console.log('🧹 Starting Attendance Location Cleanup Service...');
    
    // Run daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      await this.cleanupOldLocationData();
    });

    console.log('✅ Attendance Location Cleanup Service started (runs daily at 2:00 AM)');
  }

  /**
   * Manually trigger the cleanup
   * Useful for testing or manual runs
   */
  async triggerCleanup() {
    return await this.cleanupOldLocationData();
  }

  /**
   * Clean up location data from attendance records older than 7 days
   * Keeps essential data: user, date, checkInTime, checkOutTime, status, workDuration, notes
   * Removes: location, checkOutLocation (coordinates and address data)
   */
  async cleanupOldLocationData() {
    if (this.isRunning) {
      console.log('⚠️  Attendance location cleanup already in progress, skipping...');
      return {
        success: false,
        message: 'Cleanup already in progress'
      };
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('🧹 Starting attendance location data cleanup...');

      // Calculate the date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0); // Start of day

      console.log(`📅 Cleaning records older than: ${sevenDaysAgo.toISOString()}`);

      // Find records older than 7 days that still have location data
      const recordsToClean = await Attendance.find({
        date: { $lt: sevenDaysAgo },
        $or: [
          { 'location.coordinates': { $exists: true } },
          { 'checkOutLocation.coordinates': { $exists: true } }
        ]
      }).select('_id date user');

      console.log(`📊 Found ${recordsToClean.length} records with location data to clean`);

      if (recordsToClean.length === 0) {
        console.log('✨ No old location data to clean');
        this.lastRun = new Date();
        this.stats.totalRuns++;
        this.stats.lastCleanedCount = 0;
        this.isRunning = false;
        
        return {
          success: true,
          message: 'No old location data to clean',
          cleaned: 0,
          duration: Date.now() - startTime
        };
      }

      // Update records to remove location data
      // We unset the location fields but keep everything else
      const result = await Attendance.updateMany(
        {
          date: { $lt: sevenDaysAgo }
        },
        {
          $unset: {
            'location.coordinates': '',
            'location.address': '',
            'location.city': '',
            'location.state': '',
            'location.country': '',
            'location.postalCode': '',
            'checkOutLocation.coordinates': '',
            'checkOutLocation.address': '',
            'checkOutLocation.city': '',
            'checkOutLocation.state': '',
            'checkOutLocation.country': '',
            'checkOutLocation.postalCode': ''
          }
        }
      );

      const duration = Date.now() - startTime;
      
      // Update stats
      this.lastRun = new Date();
      this.stats.totalRuns++;
      this.stats.totalRecordsCleaned += result.modifiedCount;
      this.stats.lastCleanedCount = result.modifiedCount;

      console.log(`✅ Attendance location cleanup completed:`);
      console.log(`   - Records cleaned: ${result.modifiedCount}`);
      console.log(`   - Duration: ${duration}ms`);
      console.log(`   - Storage saved (estimated): ~${(result.modifiedCount * 1).toFixed(2)} KB`);

      this.isRunning = false;

      return {
        success: true,
        message: 'Location data cleaned successfully',
        cleaned: result.modifiedCount,
        duration,
        estimatedStorageSaved: `~${(result.modifiedCount * 1).toFixed(2)} KB`
      };

    } catch (error) {
      console.error('❌ Error during attendance location cleanup:', error);
      this.stats.errors++;
      this.isRunning = false;

      return {
        success: false,
        message: 'Error during cleanup',
        error: error.message
      };
    }
  }

  /**
   * Get cleanup service statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      stats: this.stats
    };
  }
}

// Export singleton instance
module.exports = new AttendanceLocationCleanupService();

