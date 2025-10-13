// File path: server/src/routes/reminders.js
// REPLACE entire file with this

const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');

router.get('/', reminderController.getAllReminders);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);
router.get('/check-due', reminderController.checkDueReminders);

module.exports = router;