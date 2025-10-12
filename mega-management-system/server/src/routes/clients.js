// File Path: server/src/routes/clients.js

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const paymentReminderController = require('../controllers/paymentReminderController');

// Mock authentication middleware for development
// TODO: Replace with actual auth middleware in production
const mockAuth = (req, res, next) => {
  req.user = {
    id: '507f1f77bcf86cd799439011', // Mock user ID
    name: 'Admin User',
    email: 'admin@mega.com',
    role: 'admin'
  };
  next();
};

// Client routes
router.route('/')
  .get(mockAuth, clientController.getAllClients)
  .post(mockAuth, clientController.createClient);

router.get('/stats', mockAuth, clientController.getClientStats);

router.route('/:id')
  .get(mockAuth, clientController.getClientById)
  .put(mockAuth, clientController.updateClient)
  .delete(mockAuth, clientController.deleteClient);

router.patch('/:id/toggle-active', mockAuth, clientController.toggleClientActive);

// Payment reminder routes
router.get('/payment-reminders/all', mockAuth, paymentReminderController.getAllReminders);
router.get('/payment-reminders/stats', mockAuth, paymentReminderController.getReminderStats);

router.route('/:clientId/payment-reminders')
  .get(mockAuth, paymentReminderController.getClientReminders)
  .post(mockAuth, paymentReminderController.createReminder);

router.patch('/payment-reminders/:id/stop', mockAuth, paymentReminderController.stopReminder);
router.patch('/payment-reminders/:id/resume', mockAuth, paymentReminderController.resumeReminder);
router.post('/payment-reminders/:id/send', mockAuth, paymentReminderController.sendReminderManually);
router.delete('/payment-reminders/:id', mockAuth, paymentReminderController.deleteReminder);

module.exports = router;