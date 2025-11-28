const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

// All settings routes require authentication

// Get all settings (super_admin, admin and manager)
router.get('/', protect, restrictTo('super_admin', 'admin', 'manager'), settingsController.getSettings);

// Company settings - super_admin, admin and manager for updates, all authenticated can read
router.get('/company', protect, settingsController.getCompanySettings);
router.put('/company', protect, restrictTo('super_admin', 'admin', 'manager'), settingsController.updateCompanySettings);

// Attendance settings - super_admin, admin and manager for updates and reads
router.get('/attendance', protect, restrictTo('super_admin', 'manager', 'admin'), settingsController.getAttendanceSettings);
router.put('/attendance', protect, restrictTo('super_admin', 'admin', 'manager'), settingsController.updateAttendanceSettings);

// Quotation settings - super_admin, admin and manager for updates and reads
router.get('/quotation', protect, restrictTo('super_admin', 'manager', 'admin'), settingsController.getQuotationSettings);
router.put('/quotation', protect, restrictTo('super_admin', 'admin', 'manager'), settingsController.updateQuotationSettings);

// Payroll settings - super_admin, admin and manager
router.get('/payroll', protect, restrictTo('super_admin', 'admin', 'manager'), settingsController.getPayrollSettings);
router.put('/payroll', protect, restrictTo('super_admin', 'admin', 'manager'), settingsController.updatePayrollSettings);

// User management settings - super_admin, admin and manager
router.get('/user-management', protect, restrictTo('super_admin', 'admin', 'manager'), settingsController.getUserManagementSettings);
router.put('/user-management', protect, restrictTo('super_admin', 'admin', 'manager'), settingsController.updateUserManagementSettings);

// Global notification settings - super_admin, admin and manager
router.get('/notifications', protect, restrictTo('super_admin', 'admin', 'manager'), settingsController.getNotificationSettings);
router.put('/notifications', protect, restrictTo('super_admin', 'admin', 'manager'), settingsController.updateNotificationSettings);

// Departments - all authenticated can read for dropdowns
router.get('/departments', protect, settingsController.getDepartments);

module.exports = router;
