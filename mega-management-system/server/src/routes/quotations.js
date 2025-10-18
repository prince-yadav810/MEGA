const express = require('express');
const router = express.Router();
const {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  uploadExcel
} = require('../controllers/quotationController');
const { protect } = require('../middleware/auth');

// All quotation routes require authentication
router.route('/')
  .get(protect, getQuotations)
  .post(protect, createQuotation);

router.route('/upload')
  .post(protect, uploadExcel);

router.route('/:id')
  .get(protect, getQuotation)
  .put(protect, updateQuotation)
  .delete(protect, deleteQuotation);

module.exports = router;
