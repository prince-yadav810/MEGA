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

// Routes
router.route('/')
  .get(getQuotations)
  .post(createQuotation);

router.route('/upload')
  .post(uploadExcel);

router.route('/:id')
  .get(getQuotation)
  .put(updateQuotation)
  .delete(deleteQuotation);

module.exports = router;
