const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { createNotification } = require('./notificationController');

/**
 * Add credit to employee wallet (Admin only)
 * @route POST /api/wallet/:userId/credit
 */
exports.addCredit = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, description } = req.body;
    const adminId = req.user.id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount greater than 0'
      });
    }

    // Find the employee
    const employee = await User.findById(userId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update wallet balance
    employee.walletBalance = (employee.walletBalance || 0) + amount;
    await employee.save();

    // Create transaction record
    const transaction = await WalletTransaction.create({
      userId: employee._id,
      type: 'credit',
      amount: amount,
      balanceAfter: employee.walletBalance,
      description: description || 'Money added by admin',
      createdBy: adminId
    });

    // Get admin details for notification
    const admin = await User.findById(adminId).select('name');

    // Notify employee
    if (req.io) {
      await createNotification({
        userId: employee._id,
        type: 'success',
        category: 'payment',
        title: 'Money Added to Wallet',
        message: `${admin.name} added ₹${amount.toFixed(2)} to your wallet. Current balance: ₹${employee.walletBalance.toFixed(2)}`,
        entityType: 'wallet',
        entityId: transaction._id
      }, req.io);
    }

    res.status(200).json({
      success: true,
      message: 'Money added to wallet successfully',
      data: {
        transaction,
        newBalance: employee.walletBalance
      }
    });

  } catch (error) {
    console.error('Add credit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add money to wallet',
      error: error.message
    });
  }
};

/**
 * Record expense/debit from employee wallet (Employee)
 * @route POST /api/wallet/:userId/debit
 */
exports.addDebit = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, description } = req.body;
    const employeeId = req.user.id;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount greater than 0'
      });
    }

    // Validate description (required for expenses)
    if (!description || description.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Description is required for expenses'
      });
    }

    // Ensure employee can only update their own wallet
    if (userId !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own wallet'
      });
    }

    // Find the employee
    const employee = await User.findById(userId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update wallet balance (allow negative balance as per requirements)
    employee.walletBalance = (employee.walletBalance || 0) - amount;
    await employee.save();

    // Create transaction record
    const transaction = await WalletTransaction.create({
      userId: employee._id,
      type: 'debit',
      amount: amount,
      balanceAfter: employee.walletBalance,
      description: description.trim(),
      createdBy: employeeId
    });

    // Get all admins and managers for notification
    const admins = await User.find({
      role: { $in: ['admin', 'manager'] },
      isActive: true
    }).select('_id');

    // Notify all admins/managers
    if (req.io && admins.length > 0) {
      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          type: 'info',
          category: 'payment',
          title: 'Employee Expense Recorded',
          message: `${employee.name} spent ₹${amount.toFixed(2)}. Note: ${description}. Remaining balance: ₹${employee.walletBalance.toFixed(2)}`,
          entityType: 'wallet',
          entityId: transaction._id
        }, req.io);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Expense recorded successfully',
      data: {
        transaction,
        newBalance: employee.walletBalance
      }
    });

  } catch (error) {
    console.error('Add debit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record expense',
      error: error.message
    });
  }
};

/**
 * Get wallet balance and basic info
 * @route GET /api/wallet/:userId
 */
exports.getWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    // Employee can only view their own wallet, admin/manager can view any
    if (requesterRole === 'employee' && userId !== requesterId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own wallet'
      });
    }

    // Find the employee
    const employee = await User.findById(userId).select('name email walletBalance');
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        userId: employee._id,
        name: employee.name,
        email: employee.email,
        balance: employee.walletBalance || 0
      }
    });

  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet information',
      error: error.message
    });
  }
};

/**
 * Get wallet transaction history
 * @route GET /api/wallet/:userId/transactions
 */
exports.getTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const { page = 1, limit = 50, type } = req.query;

    // Employee can only view their own transactions, admin/manager can view any
    if (requesterRole === 'employee' && userId !== requesterId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own transactions'
      });
    }

    // Build query
    const query = { userId };
    if (type && ['credit', 'debit'].includes(type)) {
      query.type = type;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch transactions with pagination
    const transactions = await WalletTransaction.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const total = await WalletTransaction.countDocuments(query);

    // Get employee info
    const employee = await User.findById(userId).select('name walletBalance');

    res.status(200).json({
      success: true,
      data: {
        employee: {
          name: employee.name,
          currentBalance: employee.walletBalance || 0
        },
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};
