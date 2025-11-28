const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getMyAttendanceSummary,
  getUserAttendance,
  getUserAttendanceStats,
  getUserAttendanceSummary,
  getAllAttendance,
  updateAttendanceManually,
  getRecentAttendanceWithLocation
} = require('../controllers/attendanceController');

// Employee routes - accessible by all authenticated users
router.post('/check-in', protect, checkIn);
router.put('/check-out', protect, checkOut);
router.get('/today', protect, getTodayAttendance);
router.get('/my-records', protect, getMyAttendance);
router.get('/my-summary', protect, getMyAttendanceSummary);

// Manager/Admin/Super Admin routes - restricted access
router.get('/', protect, restrictTo('super_admin', 'manager', 'admin'), getAllAttendance);
router.get('/user/:userId', protect, restrictTo('super_admin', 'manager', 'admin'), getUserAttendance);
router.get('/user/:userId/stats', protect, restrictTo('super_admin', 'manager', 'admin'), getUserAttendanceStats);
router.get('/user/:userId/summary', protect, getUserAttendanceSummary); // Accessible by user themselves or admin/manager/super_admin

// Super Admin, Admin and manager - manual attendance update
router.put('/user/:userId/manual', protect, restrictTo('super_admin', 'admin', 'manager'), updateAttendanceManually);

// Recent attendance with location (last 7 days) - accessible by user themselves or admin
router.get('/recent/:userId', protect, getRecentAttendanceWithLocation);

module.exports = router;
