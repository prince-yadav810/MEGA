// File path: server/src/routes/reminders.js
// REPLACE entire file with this

const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.get('/', protect, reminderController.getAllReminders);
router.post('/', protect, reminderController.createReminder);
router.put('/:id', protect, reminderController.updateReminder);
router.delete('/:id', protect, reminderController.deleteReminder);
router.get('/check-due', protect, reminderController.checkDueReminders);

// Attachment routes
router.delete('/:reminderId/attachments/:attachmentId', protect, reminderController.deleteAttachment);
router.patch('/:reminderId/attachments/:attachmentId/rename', protect, reminderController.renameAttachment);

module.exports = router;