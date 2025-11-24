const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

// All settings routes require authentication

// Get all settings (admin only)
router.get('/', protect, restrictTo('admin'), settingsController.getSettings);

// Company settings - admin only for updates, all authenticated can read
router.get('/company', protect, settingsController.getCompanySettings);
router.put('/company', protect, restrictTo('admin'), settingsController.updateCompanySettings);

// Attendance settings - admin only for updates, managers can read
router.get('/attendance', protect, restrictTo('manager', 'admin'), settingsController.getAttendanceSettings);
router.put('/attendance', protect, restrictTo('admin'), settingsController.updateAttendanceSettings);

// Quotation settings - admin only for updates, managers can read
router.get('/quotation', protect, restrictTo('manager', 'admin'), settingsController.getQuotationSettings);
router.put('/quotation', protect, restrictTo('admin'), settingsController.updateQuotationSettings);

// Payroll settings - admin only
router.get('/payroll', protect, restrictTo('admin'), settingsController.getPayrollSettings);
router.put('/payroll', protect, restrictTo('admin'), settingsController.updatePayrollSettings);

// User management settings - admin only
router.get('/user-management', protect, restrictTo('admin'), settingsController.getUserManagementSettings);
router.put('/user-management', protect, restrictTo('admin'), settingsController.updateUserManagementSettings);

// Global notification settings - admin only
router.get('/notifications', protect, restrictTo('admin'), settingsController.getNotificationSettings);
router.put('/notifications', protect, restrictTo('admin'), settingsController.updateNotificationSettings);

// Departments - all authenticated can read for dropdowns
router.get('/departments', protect, settingsController.getDepartments);

module.exports = router;
