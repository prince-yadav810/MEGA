const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const userController = require('../controllers/userController');

// All user routes require authentication

// User preferences routes (accessible to all authenticated users)
router.get('/preferences', protect, userController.getUserPreferences);
router.put('/preferences', protect, userController.updateUserPreferences);

// Admin routes - Only super_admin/managers/admins can access these routes

// Get all users (team members) - Accessible to all authenticated users for task assignment
router.get('/', protect, userController.getAllUsers);

// Get single user by ID
router.get('/:id', protect, restrictTo('super_admin', 'manager', 'admin'), userController.getUserById);

// Create new team member
router.post('/', protect, restrictTo('super_admin', 'manager', 'admin'), userController.createUser);

// Update user
router.put('/:id', protect, restrictTo('super_admin', 'manager', 'admin'), userController.updateUser);

// Delete user
router.delete('/:id', protect, restrictTo('super_admin', 'manager', 'admin'), userController.deleteUser);

// Add advance payment to user
router.post('/:id/advances', protect, restrictTo('super_admin', 'manager', 'admin'), userController.addAdvance);

// Update advance payment for user
router.put('/:id/advances/:advanceId', protect, restrictTo('super_admin', 'manager', 'admin'), userController.updateAdvance);

// Upload user avatar
router.post('/:id/avatar', protect, restrictTo('super_admin', 'manager', 'admin'), userController.uploadUserAvatar);

// Get user tasks
router.get('/:id/tasks', protect, restrictTo('super_admin', 'manager', 'admin'), userController.getUserTasks);

module.exports = router;


