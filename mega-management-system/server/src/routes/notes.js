// File path: server/src/routes/notes.js
// REPLACE entire file with this

const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

router.get('/', noteController.getAllNotes);
router.post('/', noteController.createNote);
router.put('/:id', noteController.updateNote);
router.patch('/:id/toggle-pin', noteController.togglePin);
router.delete('/:id', noteController.deleteNote);

module.exports = router;