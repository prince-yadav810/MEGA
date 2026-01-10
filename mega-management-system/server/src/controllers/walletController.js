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

    // Notify employee (non-blocking - don't fail if notification fails)
    if (req.io) {
      try {
        await createNotification({
          userId: employee._id,
          type: 'success',
          category: 'payment',
          title: 'Money Added to Wallet',
          message: `${admin.name} added ₹${amount.toFixed(2)} to your wallet. Current balance: ₹${employee.walletBalance.toFixed(2)}`,
          entityType: 'wallet',
          entityId: transaction._id
        }, req.io);
      } catch (notificationError) {
        console.error('Notification error (non-blocking):', notificationError);
        // Continue - notification failure shouldn't fail the entire operation
      }
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
    // Convert both to strings for comparison (userId is string, employeeId might be ObjectId)
    if (userId.toString() !== employeeId.toString()) {
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

    // Notify all admins/managers (non-blocking - don't fail if notification fails)
    if (req.io && admins.length > 0) {
      try {
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
      } catch (notificationError) {
        console.error('Notification error (non-blocking):', notificationError);
        // Continue - notification failure shouldn't fail the entire operation
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
    // Convert both to strings for comparison (userId is string, requesterId might be ObjectId)
    if (requesterRole === 'employee' && userId.toString() !== requesterId.toString()) {
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
    // Convert both to strings for comparison (userId is string, requesterId might be ObjectId)
    if (requesterRole === 'employee' && userId.toString() !== requesterId.toString()) {
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

/**
 * Get wallet analytics/statistics (Admin/Manager only)
 * @route GET /api/wallet/analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    const matchStage = dateFilter.$gte || dateFilter.$lte
      ? { createdAt: dateFilter }
      : {};

    // Get aggregated stats
    const [stats] = await WalletTransaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalCredits: {
            $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] }
          },
          totalDebits: {
            $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] }
          },
          creditCount: {
            $sum: { $cond: [{ $eq: ['$type', 'credit'] }, 1, 0] }
          },
          debitCount: {
            $sum: { $cond: [{ $eq: ['$type', 'debit'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get active wallets count (employees with non-zero balance)
    const activeWallets = await User.countDocuments({
      role: 'employee',
      walletBalance: { $ne: 0 }
    });

    // Get total employees
    const totalEmployees = await User.countDocuments({ role: 'employee' });

    // Get total wallet balance across all employees
    const [balanceStats] = await User.aggregate([
      { $match: { role: 'employee' } },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: { $ifNull: ['$walletBalance', 0] } },
          avgBalance: { $avg: { $ifNull: ['$walletBalance', 0] } }
        }
      }
    ]);

    // Get recent transactions for trend
    const recentTransactions = await WalletTransaction.find(matchStage)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name')
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      data: {
        totalDistributed: stats?.totalCredits || 0,
        totalSpent: stats?.totalDebits || 0,
        creditCount: stats?.creditCount || 0,
        debitCount: stats?.debitCount || 0,
        activeWallets,
        totalEmployees,
        totalBalance: balanceStats?.totalBalance || 0,
        avgBalance: balanceStats?.avgBalance || 0,
        recentTransactions
      }
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

/**
 * Add credit to multiple employees at once (Admin/Manager only)
 * @route POST /api/wallet/bulk-credit
 */
exports.bulkCredit = async (req, res) => {
  try {
    const { employeeIds, amount, description } = req.body;
    const adminId = req.user.id;

    // Validate inputs
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one employee ID'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount greater than 0'
      });
    }

    // Get admin details
    const admin = await User.findById(adminId).select('name');

    const results = [];
    const errors = [];

    // Process each employee
    for (const employeeId of employeeIds) {
      try {
        const employee = await User.findById(employeeId);
        if (!employee) {
          errors.push({ employeeId, error: 'Employee not found' });
          continue;
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
          description: description || 'Bulk credit by admin',
          createdBy: adminId
        });

        results.push({
          employeeId: employee._id,
          employeeName: employee.name,
          newBalance: employee.walletBalance,
          transactionId: transaction._id
        });

        // Notify employee (non-blocking)
        if (req.io) {
          try {
            await createNotification({
              userId: employee._id,
              type: 'success',
              category: 'payment',
              title: 'Money Added to Wallet',
              message: `${admin.name} added ₹${amount.toFixed(2)} to your wallet. Current balance: ₹${employee.walletBalance.toFixed(2)}`,
              entityType: 'wallet',
              entityId: transaction._id
            }, req.io);
          } catch (notificationError) {
            console.error('Notification error (non-blocking):', notificationError);
          }
        }
      } catch (err) {
        errors.push({ employeeId, error: err.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully credited ${results.length} employees`,
      data: {
        successful: results,
        failed: errors,
        totalCredited: results.length * amount
      }
    });

  } catch (error) {
    console.error('Bulk credit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk credit',
      error: error.message
    });
  }
};
