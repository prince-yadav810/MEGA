const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  setPrimaryImage,
  getCategories,
  bulkUpload
} = require('../controllers/productController');

const { protect, restrictTo } = require('../middleware/auth');

// Protected routes - all product routes require authentication
router.get('/', protect, getAllProducts);
router.get('/categories', protect, getCategories);
router.get('/:id', protect, getProductById);

// Admin only routes
router.post('/', protect, restrictTo('admin'), createProduct);
router.put('/:id', protect, restrictTo('admin'), updateProduct);
router.delete('/:id', protect, restrictTo('admin'), deleteProduct);

// Image management routes (admin only)
router.delete('/:id/images/:imageId', protect, restrictTo('admin'), deleteProductImage);
router.patch('/:id/images/:imageId/primary', protect, restrictTo('admin'), setPrimaryImage);

// Bulk upload route (admin only)
router.post('/bulk-upload', protect, restrictTo('admin'), bulkUpload);

module.exports = router;
