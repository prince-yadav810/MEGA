const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const cloudinary = require('../config/cloudinary');

/**
 * Get all team members
 * @route GET /api/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Fetch all users except passwords
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * Get a single user by ID
 * @route GET /api/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

/**
 * Create a new team member
 * @route POST /api/users
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, department, role, avatar, salary } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists. Please use a different email address.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      department,
      role: role || 'employee',
      avatar: avatar || '',
      salary: salary || 0,
      isActive: true
    });

    // Return user without password
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      department: newUser.department,
      role: newUser.role,
      avatar: newUser.avatar,
      salary: newUser.salary,
      advances: newUser.advances,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Team member created successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Create user error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists. Please use a different email address.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

/**
 * Update a user
 * @route PUT /api/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, phone, department, role, avatar, isActive, password, salary } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and already exists
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists. Please use a different email address.'
        });
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (phone) user.phone = phone;
    if (department) user.department = department;
    if (role) user.role = role;
    if (avatar !== undefined) user.avatar = avatar;
    if (isActive !== undefined) user.isActive = isActive;
    if (salary !== undefined) user.salary = salary;

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Return updated user without password
    const userResponse = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Update user error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists. Please use a different email address.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

/**
 * Delete a user
 * @route DELETE /api/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const Attendance = require('../models/Attendance');
    const Task = require('../models/Task');
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (req.user && user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Delete related data
    // 1. Delete all attendance records for this user
    await Attendance.deleteMany({ user: req.params.id });
    console.log(`🗑️  Deleted attendance records for user: ${user.name}`);

    // 2. Remove user from all tasks (unassign them from tasks)
    const tasksUpdated = await Task.updateMany(
      { assignees: req.params.id },
      { $pull: { assignees: req.params.id } }
    );
    console.log(`🗑️  Removed user from ${tasksUpdated.modifiedCount} task(s)`);

    // 3. Delete user from MongoDB (includes all embedded data: advances, wallet, salary, etc.)
    await User.findByIdAndDelete(req.params.id);
    console.log(`🗑️  Deleted user: ${user.name}`);

    res.status(200).json({
      success: true,
      message: 'User and all related data deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * Add advance payment to a user
 * @route POST /api/users/:id/advances
 */
exports.addAdvance = async (req, res) => {
  try {
    const { amount, reason, status } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid advance amount'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add advance to user's advances array
    user.advances.push({
      amount,
      date: new Date(),
      reason: reason || '',
      status: status || 'pending'
    });

    await user.save();

    // Get admin/manager details for notification
    const admin = await User.findById(req.user.id).select('name');

    // Notify employee (non-blocking - don't fail if notification fails)
    if (req.io) {
      try {
        await createNotification({
          userId: user._id,
          type: 'success',
          category: 'payment',
          title: 'Advance Payment Received',
          message: `${admin.name} gave you an advance of ₹${amount.toFixed(2)}${reason ? `. Reason: ${reason}` : ''}`,
          entityType: 'payment',
          actionUrl: '/workspace/team',
          createdBy: admin.name
        }, req.io);
        console.log(`📬 Advance notification sent to employee: ${user.name}`);
      } catch (notificationError) {
        console.error('Notification error (non-blocking):', notificationError);
        // Continue - notification failure shouldn't fail the entire operation
      }
    }

    // Return updated user without password
    const userResponse = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Advance added successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Add advance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add advance',
      error: error.message
    });
  }
};

/**
 * Update advance payment for a user
 * @route PUT /api/users/:id/advances/:advanceId
 */
exports.updateAdvance = async (req, res) => {
  try {
    const { amount, reason, status } = req.body;
    const { id, advanceId } = req.params;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid advance amount'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the advance in the user's advances array
    const advance = user.advances.id(advanceId);

    if (!advance) {
      return res.status(404).json({
        success: false,
        message: 'Advance not found'
      });
    }

    // Store old amount to compare
    const oldAmount = advance.amount;
    const amountChanged = oldAmount !== amount;

    // Update advance fields
    advance.amount = amount;
    advance.reason = reason || advance.reason;
    if (status) {
      advance.status = status;
    }

    await user.save();

    // Get admin/manager details for notification
    const admin = await User.findById(req.user.id).select('name');

    // Notify employee if amount changed (non-blocking - don't fail if notification fails)
    if (req.io && amountChanged) {
      try {
        await createNotification({
          userId: user._id,
          type: 'info',
          category: 'payment',
          title: 'Advance Payment Updated',
          message: `${admin.name} updated your advance from ₹${oldAmount.toFixed(2)} to ₹${amount.toFixed(2)}${reason ? `. Reason: ${reason}` : ''}`,
          entityType: 'payment',
          actionUrl: '/workspace/team',
          createdBy: admin.name
        }, req.io);
        console.log(`📬 Advance update notification sent to employee: ${user.name}`);
      } catch (notificationError) {
        console.error('Notification error (non-blocking):', notificationError);
        // Continue - notification failure shouldn't fail the entire operation
      }
    }

    // Return updated user without password
    const userResponse = await User.findById(user._id).select('-password');

    res.status(200).json({
      success: true,
      message: 'Advance updated successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Update advance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update advance',
      error: error.message
    });
  }
};

/**
 * Get user tasks
 * @route GET /api/users/:id/tasks
 */
exports.getUserTasks = async (req, res) => {
  try {
    const Task = require('../models/Task');

    const tasks = await Task.find({
      assignees: req.params.id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks
    });

  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user tasks',
      error: error.message
    });
  }
};

/**
 * Upload user avatar to Cloudinary
 * @route POST /api/users/:id/avatar
 */
exports.uploadUserAvatar = async (req, res) => {
  try {
    console.log('📸 User avatar upload request received for user:', req.params.id);

    // Check if file was uploaded
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an avatar image'
      });
    }

    const avatarFile = req.files.avatar;
    console.log(`📂 File received: ${avatarFile.name} (${avatarFile.size} bytes, ${avatarFile.mimetype})`);

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(avatarFile.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload a JPG, PNG, GIF, or WebP image'
      });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (avatarFile.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB'
      });
    }

    // Find user
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`👤 Uploading avatar for user: ${user.name} (${user.email})`);

    // Delete old profile image from Cloudinary if exists
    if (user.profileImage && user.profileImage.publicId) {
      try {
        console.log(`🗑️  Deleting old avatar: ${user.profileImage.publicId}`);
        await cloudinary.uploader.destroy(user.profileImage.publicId);
        console.log('✅ Old avatar deleted successfully');
      } catch (deleteError) {
        console.error('⚠️  Error deleting old avatar:', deleteError.message);
        // Continue with upload even if deletion fails
      }
    }

    // Upload to Cloudinary
    console.log('☁️  Uploading to Cloudinary...');
    const result = await cloudinary.uploader.upload(avatarFile.tempFilePath, {
      folder: 'mega/avatars',
      public_id: `user_${user._id}_${Date.now()}`,
      resource_type: 'image',
      type: 'upload',
      access_mode: 'public',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    console.log('✅ Cloudinary upload successful!');
    console.log(`   URL: ${result.secure_url}`);
    console.log(`   Public ID: ${result.public_id}`);

    // Update user profile image
    user.profileImage = {
      url: result.secure_url,
      publicId: result.public_id
    };

    // Also update avatar field for backward compatibility
    user.avatar = result.secure_url;

    await user.save();

    console.log('💾 User profile updated successfully');

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: result.secure_url,
        profileImage: {
          url: result.secure_url,
          publicId: result.public_id
        }
      }
    });

  } catch (error) {
    console.error('❌ Upload user avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar',
      error: error.message
    });
  }
};

/**
 * Get current user preferences
 * @route GET /api/user/preferences
 */
exports.getUserPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('preferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If no preferences exist, return default values
    const preferences = user.preferences || {
      appearance: {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12-hour',
        currency: 'INR',
        rowsPerPage: 25,
        compactMode: false,
        defaultPage: '/dashboard'
      },
      notifications: {
        email: {
          taskAssignments: true,
          taskDueDate: true,
          quotationUpdates: true,
          productStockAlerts: true,
          systemAnnouncements: true
        },
        inApp: {
          desktopNotifications: true,
          soundAlerts: false
        },
        schedule: {
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          weekendNotifications: false
        }
      }
    };

    res.status(200).json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: error.message
    });
  }
};

/**
 * Update current user preferences
 * @route PUT /api/user/preferences
 */
exports.updateUserPreferences = async (req, res) => {
  try {
    const { appearance, notifications, work } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize preferences if they don't exist
    if (!user.preferences) {
      user.preferences = {
        appearance: {},
        notifications: {},
        work: {}
      };
    }

    // Update appearance preferences if provided
    if (appearance) {
      user.preferences.appearance = {
        ...user.preferences.appearance,
        ...appearance
      };
    }

    // Update notification preferences if provided
    if (notifications) {
      // Handle nested structure for notifications
      if (notifications.email) {
        if (!user.preferences.notifications.email) {
          user.preferences.notifications.email = {};
        }
        user.preferences.notifications.email = {
          ...user.preferences.notifications.email,
          ...notifications.email
        };
      }

      if (notifications.inApp) {
        if (!user.preferences.notifications.inApp) {
          user.preferences.notifications.inApp = {};
        }
        user.preferences.notifications.inApp = {
          ...user.preferences.notifications.inApp,
          ...notifications.inApp
        };
      }

      if (notifications.schedule) {
        if (!user.preferences.notifications.schedule) {
          user.preferences.notifications.schedule = {};
        }
        user.preferences.notifications.schedule = {
          ...user.preferences.notifications.schedule,
          ...notifications.schedule
        };
      }
    }

    // Update work preferences if provided
    if (work) {
      if (!user.preferences.work) {
        user.preferences.work = {};
      }
      user.preferences.work = {
        ...user.preferences.work,
        ...work
      };
    }

    // Mark the preferences field as modified (required for nested objects in Mongoose)
    user.markModified('preferences');
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: user.preferences
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
};
