const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const userController = require('../controllers/userController');

// All user routes require authentication
// Only managers/admins can access these routes

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

module.exports = router;


