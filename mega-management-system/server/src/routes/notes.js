// File path: server/src/routes/notes.js
// REPLACE entire file with this

const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.get('/', protect, noteController.getAllNotes);
router.post('/', protect, noteController.createNote);
router.put('/:id', protect, noteController.updateNote);
router.patch('/:id/toggle-pin', protect, noteController.togglePin);
router.delete('/:id', protect, noteController.deleteNote);

module.exports = router;