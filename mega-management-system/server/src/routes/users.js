const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const userController = require('../controllers/userController');

// All user routes require authentication

// User preferences routes (accessible to all authenticated users)
router.get('/preferences', protect, userController.getUserPreferences);
router.put('/preferences', protect, userController.updateUserPreferences);

// Admin routes - Only managers/admins can access these routes

// Get all users (team members)
router.get('/', protect, restrictTo('manager', 'admin'), userController.getAllUsers);

// Get single user by ID
router.get('/:id', protect, restrictTo('manager', 'admin'), userController.getUserById);

// Create new team member
router.post('/', protect, restrictTo('manager', 'admin'), userController.createUser);

// Update user
router.put('/:id', protect, restrictTo('manager', 'admin'), userController.updateUser);

// Delete user
router.delete('/:id', protect, restrictTo('manager', 'admin'), userController.deleteUser);

// Add advance payment to user
router.post('/:id/advances', protect, restrictTo('manager', 'admin'), userController.addAdvance);

// Update advance payment for user
router.put('/:id/advances/:advanceId', protect, restrictTo('manager', 'admin'), userController.updateAdvance);

// Get user tasks
router.get('/:id/tasks', protect, restrictTo('manager', 'admin'), userController.getUserTasks);

module.exports = router;


