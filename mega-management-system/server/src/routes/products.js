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
  bulkUpload,
  getLowStockProducts
} = require('../controllers/productController');

// Note: Uncomment auth middleware when authentication is implemented
// const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/low-stock', getLowStockProducts);
router.get('/:id', getProductById);

// Protected routes (admin only)
// Add auth middleware: router.post('/', protect, authorize('admin'), createProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Image management routes
router.delete('/:id/images/:imageId', deleteProductImage);
router.patch('/:id/images/:imageId/primary', setPrimaryImage);

// Bulk upload route
router.post('/bulk-upload', bulkUpload);

module.exports = router;
