const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

// All settings routes require authentication

// Get all settings (admin and manager)
router.get('/', protect, restrictTo('admin', 'manager'), settingsController.getSettings);

// Company settings - admin and manager for updates, all authenticated can read
router.get('/company', protect, settingsController.getCompanySettings);
router.put('/company', protect, restrictTo('admin', 'manager'), settingsController.updateCompanySettings);

// Attendance settings - admin and manager for updates and reads
router.get('/attendance', protect, restrictTo('manager', 'admin'), settingsController.getAttendanceSettings);
router.put('/attendance', protect, restrictTo('admin', 'manager'), settingsController.updateAttendanceSettings);

// Quotation settings - admin and manager for updates and reads
router.get('/quotation', protect, restrictTo('manager', 'admin'), settingsController.getQuotationSettings);
router.put('/quotation', protect, restrictTo('admin', 'manager'), settingsController.updateQuotationSettings);

// Payroll settings - admin and manager
router.get('/payroll', protect, restrictTo('admin', 'manager'), settingsController.getPayrollSettings);
router.put('/payroll', protect, restrictTo('admin', 'manager'), settingsController.updatePayrollSettings);

// User management settings - admin and manager
router.get('/user-management', protect, restrictTo('admin', 'manager'), settingsController.getUserManagementSettings);
router.put('/user-management', protect, restrictTo('admin', 'manager'), settingsController.updateUserManagementSettings);

// Global notification settings - admin and manager
router.get('/notifications', protect, restrictTo('admin', 'manager'), settingsController.getNotificationSettings);
router.put('/notifications', protect, restrictTo('admin', 'manager'), settingsController.updateNotificationSettings);

// Departments - all authenticated can read for dropdowns
router.get('/departments', protect, settingsController.getDepartments);

module.exports = router;
