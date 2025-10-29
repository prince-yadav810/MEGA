const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMyAttendance,
  getUserAttendance,
  getUserAttendanceStats,
  getAllAttendance
} = require('../controllers/attendanceController');

// Employee routes - accessible by all authenticated users
router.post('/check-in', protect, checkIn);
router.put('/check-out', protect, checkOut);
router.get('/today', protect, getTodayAttendance);
router.get('/my-records', protect, getMyAttendance);

// Manager/Admin routes - restricted access
router.get('/', protect, restrictTo('manager', 'admin'), getAllAttendance);
router.get('/user/:userId', protect, restrictTo('manager', 'admin'), getUserAttendance);
router.get('/user/:userId/stats', protect, restrictTo('manager', 'admin'), getUserAttendanceStats);

module.exports = router;
