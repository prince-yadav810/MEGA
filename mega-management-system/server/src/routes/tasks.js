const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTasksByStatus,
  addComment,
  getTaskStats
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// Validation rules
const taskValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'scheduled', 'completed']).withMessage('Invalid status')
];

// Task routes (with auth middleware)
router.get('/stats', protect, getTaskStats);
router.get('/status/:status', protect, getTasksByStatus);
router.get('/', protect, getTasks);
router.get('/:id', protect, getTask);
router.post('/', protect, taskValidation, createTask);
router.put('/:id', protect, taskValidation, updateTask);
router.delete('/:id', protect, deleteTask);
router.post('/:id/comments', protect, addComment);

module.exports = router;
