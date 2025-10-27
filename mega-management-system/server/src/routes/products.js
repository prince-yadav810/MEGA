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

// Manager/Admin only routes
router.post('/', protect, restrictTo('manager', 'admin'), createProduct);
router.put('/:id', protect, restrictTo('manager', 'admin'), updateProduct);
router.delete('/:id', protect, restrictTo('manager', 'admin'), deleteProduct);

// Image management routes (manager/admin only)
router.delete('/:id/images/:imageId', protect, restrictTo('manager', 'admin'), deleteProductImage);
router.patch('/:id/images/:imageId/primary', protect, restrictTo('manager', 'admin'), setPrimaryImage);

// Bulk upload route (manager/admin only)
router.post('/bulk-upload', protect, restrictTo('manager', 'admin'), bulkUpload);

module.exports = router;
