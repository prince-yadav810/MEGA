const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const { createNotification } = require('./notificationController');

// @desc    Get all products with pagination, search, and filters
// @route   GET /api/products
// @access  Public/Private
exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip(skip)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public/Private
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('priceHistory.changedBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin)
exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    // Handle specifications as Map
    if (productData.specifications && typeof productData.specifications === 'object') {
      productData.specifications = new Map(Object.entries(productData.specifications));
    }

    // Set created by user if available
    if (req.user) {
      productData.createdBy = req.user.id;
      productData.updatedBy = req.user.id;
    }

    // Handle image uploads if files are present
    if (req.files && req.files.images) {
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      const uploadedImages = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        try {
          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(file.tempFilePath || file.path, {
            folder: 'mega/products',
            resource_type: 'auto'
          });

          uploadedImages.push({
            url: result.secure_url,
            publicId: result.public_id,
            isPrimary: i === 0
          });
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }

      productData.images = uploadedImages;
    } else if (productData.images && Array.isArray(productData.images)) {
      // If images are provided as URLs (for testing/seeding)
      productData.images = productData.images.map((img, index) => ({
        url: typeof img === 'string' ? img : img.url,
        publicId: typeof img === 'object' ? img.publicId : '',
        isPrimary: index === 0
      }));
    }

    const product = await Product.create(productData);

    // Create notification for user
    if (req.user) {
      await createNotification({
        userId: req.user.id,
        type: 'success',
        category: 'product',
        title: 'Product Created',
        message: `Product "${product.name}" has been added to the inventory`,
        entityType: 'product',
        entityId: product._id,
        actionUrl: '/products',
        createdBy: req.user.name || 'System'
      }, req.io);
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error in createProduct:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin)
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const updateData = { ...req.body };

    // Handle specifications as Map
    if (updateData.specifications && typeof updateData.specifications === 'object') {
      updateData.specifications = new Map(Object.entries(updateData.specifications));
    }

    // Set updated by user if available
    if (req.user) {
      updateData.updatedBy = req.user.id;
    }

    // Handle new image uploads
    if (req.files && req.files.images) {
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      const uploadedImages = [];

      for (const file of imageFiles) {
        try {
          const result = await cloudinary.uploader.upload(file.tempFilePath || file.path, {
            folder: 'mega/products',
            resource_type: 'auto'
          });

          uploadedImages.push({
            url: result.secure_url,
            publicId: result.public_id,
            isPrimary: uploadedImages.length === 0
          });
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }

      // Append new images to existing ones
      updateData.images = [...(product.images || []), ...uploadedImages];
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    // Create notification for user
    if (req.user) {
      await createNotification({
        userId: req.user.id,
        type: 'success',
        category: 'product',
        title: 'Product Updated',
        message: `Product "${product.name}" has been updated successfully`,
        entityType: 'product',
        entityId: product._id,
        actionUrl: '/products',
        createdBy: req.user.name || 'System'
      }, req.io);
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error in updateProduct:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const productName = product.name;

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (error) {
            console.error('Error deleting image from Cloudinary:', error);
          }
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    // Create notification for user
    if (req.user) {
      await createNotification({
        userId: req.user.id,
        type: 'warning',
        category: 'product',
        title: 'Product Deleted',
        message: `Product "${productName}" has been deleted from the inventory`,
        entityType: 'product',
        entityId: null,
        actionUrl: '/products',
        createdBy: req.user.name || 'System'
      }, req.io);
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private (Admin)
exports.deleteProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const imageIndex = product.images.findIndex(
      img => img._id.toString() === req.params.imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    const image = product.images[imageIndex];

    // Delete from Cloudinary
    if (image.publicId) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
      }
    }

    // Remove from array
    product.images.splice(imageIndex, 1);

    // If deleted image was primary, set first image as primary
    if (image.isPrimary && product.images.length > 0) {
      product.images[0].isPrimary = true;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: product
    });
  } catch (error) {
    console.error('Error in deleteProductImage:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
};

// @desc    Set primary image
// @route   PATCH /api/products/:id/images/:imageId/primary
// @access  Private (Admin)
exports.setPrimaryImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const imageExists = product.images.some(
      img => img._id.toString() === req.params.imageId
    );

    if (!imageExists) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Set all images to non-primary, then set selected as primary
    product.images.forEach(img => {
      img.isPrimary = img._id.toString() === req.params.imageId;
    });

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Primary image updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error in setPrimaryImage:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting primary image',
      error: error.message
    });
  }
};

// @desc    Get all categories
// @route   GET /api/products/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = [
      'Hoses - Canvas',
      'Hoses - PVC',
      'Hoses - Rubber-lined',
      'Connectors',
      'Safety Equipment',
      'Custom'
    ];

    // Get unique custom categories
    const customCategories = await Product.distinct('customCategory', {
      category: 'Custom',
      customCategory: { $ne: null, $ne: '' }
    });

    res.status(200).json({
      success: true,
      data: {
        predefined: categories,
        custom: customCategories
      }
    });
  } catch (error) {
    console.error('Error in getCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// @desc    Bulk upload products from Excel
// @route   POST /api/products/bulk-upload
// @access  Private (Admin)
exports.bulkUpload = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an Excel file'
      });
    }

    const file = req.files.file;
    const excelParser = require('../utils/excelParser');

    // Parse Excel file
    const productsData = await excelParser.parseProductsFile(file);

    if (!productsData || productsData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid products found in the file'
      });
    }

    // Add created/updated by user
    const productsWithUser = productsData.map(product => ({
      ...product,
      createdBy: req.user ? req.user.id : null,
      updatedBy: req.user ? req.user.id : null
    }));

    // Bulk insert
    const results = await Product.insertMany(productsWithUser, {
      ordered: false,
      rawResult: true
    });

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${results.insertedCount} products`,
      data: {
        inserted: results.insertedCount,
        total: productsData.length
      }
    });
  } catch (error) {
    console.error('Error in bulkUpload:', error);

    // Handle partial success
    if (error.writeErrors) {
      const inserted = error.insertedDocs ? error.insertedDocs.length : 0;
      return res.status(207).json({
        success: true,
        message: `Partially uploaded ${inserted} products`,
        data: {
          inserted,
          errors: error.writeErrors.length
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error uploading products',
      error: error.message
    });
  }
};

