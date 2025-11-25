const express = require('express');
const router = express.Router();
const {
  getQuotations,
  getQuotation,
  uploadExcel,
  downloadPdf,
  previewPdf,
  updateFileName,
  updateStatus,
  updatePriority,
  createLinkedTask,
  deleteQuotation,
  updateAdvertisementProducts,
  regenerateQuotationPdf
} = require('../controllers/quotationController');
const { protect } = require('../middleware/auth');

// All quotation routes require authentication

// Get all quotations
router.get('/', protect, getQuotations);

// Upload Excel and create quotation (uses express-fileupload middleware from server.js)
router.post('/upload', protect, uploadExcel);

// Get, update status, and delete quotation by ID
router.route('/:id')
  .get(protect, getQuotation)
  .delete(protect, deleteQuotation);

// Download PDF
router.get('/:id/download', protect, downloadPdf);

// Preview PDF (get PDF URL for viewing)
router.get('/:id/preview', protect, previewPdf);

// Update filename
router.patch('/:id/filename', protect, updateFileName);

// Update status
router.patch('/:id/status', protect, updateStatus);

// Update priority
router.patch('/:id/priority', protect, updatePriority);

// Update advertisement products
router.put('/:id/advertisements', protect, updateAdvertisementProducts);

// Regenerate PDF
router.post('/:id/regenerate-pdf', protect, regenerateQuotationPdf);

// Create linked task
router.post('/:id/task', protect, createLinkedTask);

module.exports = router;
