// File Path: server/src/routes/clients.js

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const paymentReminderController = require('../controllers/paymentReminderController');
const { uploadBusinessCard } = require('../config/multer');
const { ocrRateLimiter, addRateLimitHeaders } = require('../middleware/ocrRateLimiter');

// Mock authentication middleware for development
// TODO: Replace with actual auth middleware in production
const mockAuth = (req, res, next) => {
  req.user = {
    id: '507f1f77bcf86cd799439011', // Mock user ID
    name: 'Manager User',
    email: 'admin@mega.com',
    role: 'manager'
  };
  next();
};

// Client routes
router.route('/')
  .get(mockAuth, clientController.getAllClients)
  .post(mockAuth, clientController.createClient);

router.get('/stats', mockAuth, clientController.getClientStats);

// Business card OCR route
router.post(
  '/extract-from-card',
  mockAuth,
  ocrRateLimiter,
  addRateLimitHeaders,
  uploadBusinessCard.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
  ]),
  clientController.extractFromCard
);

router.patch('/:id/call-frequency', mockAuth, clientController.updateCallFrequency);
router.patch('/:id/toggle-active', mockAuth, clientController.toggleClientActive);

router.route('/:id')
  .get(mockAuth, clientController.getClientById)
  .put(mockAuth, clientController.updateClient)
  .delete(mockAuth, clientController.deleteClient);


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
