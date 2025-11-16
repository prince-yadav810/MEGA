const express = require('express');
const router = express.Router();
const {
  getQuotations,
  getQuotation,
  uploadExcel,
  downloadPdf,
  updateFileName,
  updateStatus,
  updatePriority,
  createLinkedTask,
  deleteQuotation
} = require('../controllers/quotationController');
const { protect } = require('../middleware/auth');
const { uploadExcel: uploadExcelMiddleware } = require('../config/multer');

// All quotation routes require authentication

// Get all quotations
router.get('/', protect, getQuotations);

// Upload Excel and create quotation
router.post('/upload', protect, uploadExcelMiddleware.single('file'), uploadExcel);

// Get, update status, and delete quotation by ID
router.route('/:id')
  .get(protect, getQuotation)
  .delete(protect, deleteQuotation);

// Download PDF
router.get('/:id/download', protect, downloadPdf);

// Update filename
router.patch('/:id/filename', protect, updateFileName);

// Update status
router.patch('/:id/status', protect, updateStatus);

// Update priority
router.patch('/:id/priority', protect, updatePriority);

// Create linked task
router.post('/:id/task', protect, createLinkedTask);

module.exports = router;
