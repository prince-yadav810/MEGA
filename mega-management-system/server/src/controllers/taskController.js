const Task = require('../models/Task');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { createNotification, notifyMultipleUsers } = require('./notificationController');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, assignee, startDate, endDate, search } = req.query;

    // Build query
    let query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignees = assignee;

    // Date range filter
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(query)
      .populate('assignees', 'name email avatar')
      .populate('client', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatar')
      .populate('client', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name email avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
      error: error.message
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Ensure createdBy is set
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Clean up assignees - filter out invalid IDs or empty array
    console.log('Received assignees from request:', req.body.assignees);
    const assignees = req.body.assignees?.filter(id => id && id.toString().match(/^[0-9a-fA-F]{24}$/)) || [];
    console.log('Filtered assignees:', assignees);

    // Validate that no super admin is assigned - super admins are observers only
    if (assignees.length > 0) {
      const assignedUsers = await User.find({ _id: { $in: assignees } });
      const superAdmins = assignedUsers.filter(user => user.role === 'super_admin');
      
      if (superAdmins.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Super admins cannot be assigned tasks. They are observers only.'
        });
      }
    }

    const taskData = {
      ...req.body,
      assignees, // Use cleaned assignees
      createdBy: req.user._id,
      // Remove client if it's just a name string, not an ObjectId
      client: req.body.client?.match(/^[0-9a-fA-F]{24}$/) ? req.body.client : undefined
    };

    console.log('Creating task with data:', taskData);

    const task = await Task.create(taskData);

    console.log('Task created successfully:', task._id);

    // Populate references before sending response (only if they exist)
    if (task.assignees && task.assignees.length > 0) {
      await task.populate('assignees', 'name email avatar');
    }
    if (task.client) {
      await task.populate('client', 'name email');
    }

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit('task:created', task);
    }

    // Create notifications for assignees ONLY (not everyone)
    if (task.assignees && task.assignees.length > 0) {
      await notifyMultipleUsers(
        task.assignees.map(a => a._id || a),
        {
          type: 'success',
          category: 'task',
          title: 'New Task Assigned',
          message: `You have been assigned to task: "${task.title}" by ${req.user.name}`,
          entityType: 'task',
          entityId: task._id,
          actionUrl: '/workspace/tasks',
          createdBy: req.user.name || 'System',
          isAssignment: true
        },
        req.io
      );
      console.log(`✉️  Notifications sent to ${task.assignees.length} assignee(s)`);
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Store previous values for change tracking
    const previousStatus = task.status;
    const previousPriority = task.priority;
    const previousAssignees = task.assignees.map(id => id.toString());

    // Clean up assignees if provided - filter out invalid IDs
    let updateData = { ...req.body };

    if (req.body.assignees) {
      updateData.assignees = req.body.assignees.filter(id =>
        id && id.toString().match(/^[0-9a-fA-F]{24}$/)
      );

      // Validate that no super admin is assigned - super admins are observers only
      if (updateData.assignees.length > 0) {
        const assignedUsers = await User.find({ _id: { $in: updateData.assignees } });
        const superAdmins = assignedUsers.filter(user => user.role === 'super_admin');
        
        if (superAdmins.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Super admins cannot be assigned tasks. They are observers only.'
          });
        }
      }
    }

    // Remove client if it's not a valid ObjectId
    if (req.body.client && !req.body.client.match(/^[0-9a-fA-F]{24}$/)) {
      delete updateData.client;
    }

    // Handle completedDate for TTL index auto-deletion
    // Tasks with status 'completed' will be auto-deleted 15 days after completion
    if (req.body.status) {
      if (req.body.status === 'completed' && previousStatus !== 'completed') {
        // Task just completed - set completedDate for TTL index
        updateData.completedDate = new Date();
        console.log('✅ Task marked as completed - will auto-delete after 15 days');
      } else if (req.body.status !== 'completed' && previousStatus === 'completed') {
        // Task was un-completed - remove completedDate to prevent TTL deletion
        updateData.completedDate = null;
        console.log('♻️  Task un-completed - removed auto-deletion');
      }
    }

    updateData.updatedBy = req.user._id;

    console.log('Updating task with data:', updateData);

    task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignees', 'name email avatar')
      .populate('client', 'name email');

    console.log('Task updated successfully:', task._id);

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit('task:updated', task);
    }

    // --- NOTIFICATION LOGIC ---
    
    // 1. Find NEW assignees (people who weren't assigned before)
    const newAssignees = task.assignees.filter(
      assignee => !previousAssignees.includes(assignee._id.toString())
    );

    // 2. Notify ONLY NEW assignees about task assignment
    if (newAssignees.length > 0) {
      await notifyMultipleUsers(
        newAssignees.map(a => a._id),
        {
          type: 'success',
          category: 'task',
          title: 'New Task Assigned',
          message: `You have been assigned to task: "${task.title}" by ${req.user.name}`,
          entityType: 'task',
          entityId: task._id,
          actionUrl: '/workspace/tasks',
          createdBy: req.user.name || 'System',
          isAssignment: true
        },
        req.io
      );
      console.log(`✉️  Assignment notification sent to ${newAssignees.length} new assignee(s)`);
    }

    // 3. Prepare change messages for existing assignees
    const changes = [];
    const statusLabels = {
      todo: 'To Do',
      in_progress: 'In Progress',
      completed: 'Completed'
    };
    const priorityLabels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    };

    // Track status change
    if (req.body.status && previousStatus !== req.body.status) {
      changes.push(`Status: ${statusLabels[previousStatus] || previousStatus} → ${statusLabels[req.body.status] || req.body.status}`);
    }

    // Track priority change
    if (req.body.priority && previousPriority !== req.body.priority) {
      changes.push(`Priority: ${priorityLabels[previousPriority] || previousPriority} → ${priorityLabels[req.body.priority] || req.body.priority}`);
    }

    // Track title change
    if (req.body.title && req.body.title !== task.title) {
      changes.push('Title updated');
    }

    // Track description change
    if (req.body.description !== undefined && req.body.description !== task.description) {
      changes.push('Description updated');
    }

    // Track due date change
    if (req.body.dueDate && new Date(req.body.dueDate).getTime() !== new Date(task.dueDate).getTime()) {
      changes.push('Due date updated');
    }

    // 4. Notify ALL assignees (including old ones) if there were significant changes
    if (changes.length > 0 && task.assignees.length > 0) {
      const changeMessage = changes.join(', ');
      await notifyMultipleUsers(
        task.assignees.map(a => a._id),
        {
          type: 'info',
          category: 'task',
          title: 'Task Updated',
          message: `"${task.title}" updated by ${req.user.name}: ${changeMessage}`,
          entityType: 'task',
          entityId: task._id,
          actionUrl: '/workspace/tasks',
          createdBy: req.user.name || 'System'
        },
        req.io
      );
      console.log(`✉️  Update notification sent to ${task.assignees.length} assignee(s): ${changeMessage}`);
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', '_id name')
      .populate('createdBy', '_id name');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const taskTitle = task.title;
    const assignees = task.assignees;
    const creator = task.createdBy;

    await task.deleteOne();

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit('task:deleted', { id: req.params.id });
    }

    // Collect all users to notify (assignees + creator)
    const usersToNotify = new Set();
    
    // Add all assignees
    if (assignees && assignees.length > 0) {
      assignees.forEach(a => usersToNotify.add(a._id.toString()));
    }
    
    // Add creator (if not already in the set and if creator exists)
    if (creator && creator._id) {
      usersToNotify.add(creator._id.toString());
    }

    // Send notifications to all relevant users
    if (usersToNotify.size > 0) {
      await notifyMultipleUsers(
        Array.from(usersToNotify),
        {
          type: 'warning',
          category: 'task',
          title: 'Task Deleted',
          message: `Task "${taskTitle}" has been deleted by ${req.user.name}`,
          actionUrl: '/workspace/tasks',
          createdBy: req.user.name || 'System'
        },
        req.io
      );
      console.log(`✉️  Delete notification sent to ${usersToNotify.size} user(s) (creator + assignees)`);
    }

    res.json({
      success: true,
      message: 'Task deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: error.message
    });
  }
};

// @desc    Get tasks by status
// @route   GET /api/tasks/status/:status
// @access  Private
exports.getTasksByStatus = async (req, res) => {
  try {
    const tasks = await Task.find({ status: req.params.status })
      .populate('assignees', 'name email avatar')
      .populate('client', 'name email')
      .sort({ priority: -1, dueDate: 1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignees', '_id');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = {
      user: req.user._id,
      text: req.body.text
    };

    task.comments.push(comment);
    await task.save();

    await task.populate('comments.user', 'name email avatar');

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit('task:comment', { taskId: task._id, comment });
    }

    // Notify assignees (except the commenter)
    if (task.assignees && task.assignees.length > 0) {
      const usersToNotify = task.assignees
        .map(a => a._id)
        .filter(id => id.toString() !== req.user._id.toString());

      if (usersToNotify.length > 0) {
        await notifyMultipleUsers(
          usersToNotify,
          {
            type: 'info',
            category: 'task',
            title: 'New Comment on Task',
            message: `${req.user.name} commented on "${task.title}"`,
            entityType: 'task',
            entityId: task._id,
            actionUrl: '/workspace/tasks',
            createdBy: req.user.name || 'System'
          },
          req.io
        );
      }
    }

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
exports.getTaskStats = async (req, res) => {
  try {
    const total = await Task.countDocuments();
    const completed = await Task.countDocuments({ status: 'completed' });
    const inProgress = await Task.countDocuments({ status: 'in_progress' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue = await Task.countDocuments({
      dueDate: { $lt: today },
      status: { $ne: 'completed' }
    });

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueToday = await Task.countDocuments({
      dueDate: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $ne: 'completed' }
    });

    res.json({
      success: true,
      data: {
        total,
        completed,
        inProgress,
        overdue,
        dueToday
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching task statistics',
      error: error.message
    });
  }
};
