const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const walletController = require('../controllers/walletController');

// All wallet routes require authentication

// Get wallet balance and info
// Admin/Manager can view any employee's wallet, Employee can only view their own
router.get('/:userId', protect, walletController.getWallet);

// Get transaction history
// Admin/Manager can view any employee's transactions, Employee can only view their own
router.get('/:userId/transactions', protect, walletController.getTransactions);

// Add credit to wallet (Super Admin/Admin/Manager only)
router.post('/:userId/credit', protect, restrictTo('super_admin', 'manager', 'admin'), walletController.addCredit);

// Record expense/debit (Employee - own wallet only, validated in controller)
router.post('/:userId/debit', protect, walletController.addDebit);

module.exports = router;
