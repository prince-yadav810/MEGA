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

// Validation rules for creating tasks
const createTaskValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'in_progress', 'completed']).withMessage('Invalid status'),
  body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100')
];

// Validation rules for updating tasks (all fields optional)
const updateTaskValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('dueDate').optional().isISO8601().withMessage('Valid due date is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status').optional().isIn(['todo', 'in_progress', 'completed']).withMessage('Invalid status'),
  body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100')
];

// Task routes (with auth middleware)
router.get('/stats', protect, getTaskStats);
router.get('/status/:status', protect, getTasksByStatus);
router.get('/', protect, getTasks);
router.get('/:id', protect, getTask);
router.post('/', protect, createTaskValidation, createTask);
router.put('/:id', protect, updateTaskValidation, updateTask);
router.delete('/:id', protect, deleteTask);
router.post('/:id/comments', protect, addComment);

module.exports = router;
