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

// Manager/Admin/Super Admin only routes
router.post('/', protect, restrictTo('super_admin', 'manager', 'admin'), createProduct);
router.put('/:id', protect, restrictTo('super_admin', 'manager', 'admin'), updateProduct);
router.delete('/:id', protect, restrictTo('super_admin', 'manager', 'admin'), deleteProduct);

// Image management routes (super_admin/manager/admin only)
router.delete('/:id/images/:imageId', protect, restrictTo('super_admin', 'manager', 'admin'), deleteProductImage);
router.patch('/:id/images/:imageId/primary', protect, restrictTo('super_admin', 'manager', 'admin'), setPrimaryImage);

// Bulk upload route (super_admin/manager/admin only)
router.post('/bulk-upload', protect, restrictTo('super_admin', 'manager', 'admin'), bulkUpload);

module.exports = router;
