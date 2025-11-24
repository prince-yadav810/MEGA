// File Path: server/src/routes/clients.js

const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const paymentReminderController = require('../controllers/paymentReminderController');
const { uploadBusinessCard } = require('../config/multer');
const { ocrRateLimiter, addRateLimitHeaders } = require('../middleware/ocrRateLimiter');
const { protect } = require('../middleware/auth');

// Use proper JWT authentication
const auth = protect;

// Client routes
router.route('/')
  .get(auth, clientController.getAllClients)
  .post(auth, clientController.createClient);

router.get('/stats', auth, clientController.getClientStats);

// Business card OCR route
router.post(
  '/extract-from-card',
  auth,
  ocrRateLimiter,
  addRateLimitHeaders,
  uploadBusinessCard.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 }
  ]),
  clientController.extractFromCard
);

router.patch('/:id/call-frequency', auth, clientController.updateCallFrequency);
router.patch('/:id/toggle-active', auth, clientController.toggleClientActive);

router.route('/:id')
  .get(auth, clientController.getClientById)
  .put(auth, clientController.updateClient)
  .delete(auth, clientController.deleteClient);


// Payment reminder routes
router.get('/payment-reminders/all', auth, paymentReminderController.getAllReminders);
router.get('/payment-reminders/stats', auth, paymentReminderController.getReminderStats);

router.route('/:clientId/payment-reminders')
  .get(auth, paymentReminderController.getClientReminders)
  .post(auth, paymentReminderController.createReminder);

router.patch('/payment-reminders/:id/stop', auth, paymentReminderController.stopReminder);
router.patch('/payment-reminders/:id/resume', auth, paymentReminderController.resumeReminder);
router.post('/payment-reminders/:id/send', auth, paymentReminderController.sendReminderManually);
router.delete('/payment-reminders/:id', auth, paymentReminderController.deleteReminder);

module.exports = router;
