const express = require('express');
const router = express.Router();
const { login, getCurrentUser, logout, updateProfile, changePassword, uploadAvatar } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Protected
 */
router.get('/me', protect, getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Protected
 */
router.post('/logout', protect, logout);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile (name only)
 * @access  Protected
 */
router.put('/profile', protect, updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Protected
 */
router.post('/change-password', protect, changePassword);

/**
 * @route   POST /api/auth/upload-avatar
 * @desc    Upload user avatar
 * @access  Protected
 */
router.post('/upload-avatar', protect, uploadAvatar);

module.exports = router;
