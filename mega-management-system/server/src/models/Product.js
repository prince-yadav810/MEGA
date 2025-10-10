const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  sku: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  specifications: {
    type: Map,
    of: String,
    default: new Map()
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Hoses - Canvas',
      'Hoses - PVC',
      'Hoses - Rubber-lined',
      'Connectors',
      'Safety Equipment',
      'Custom'
    ],
    default: 'Custom'
  },
  customCategory: {
    type: String,
    trim: true,
    maxlength: [100, 'Custom category cannot exceed 100 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  stock: {
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Stock quantity cannot be negative']
    },
    unit: {
      type: String,
      default: 'pieces',
      trim: true
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    }
  },
  priceHistory: [{
    price: Number,
    currency: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ProductSchema.index({ sku: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ 'stock.quantity': 1 });

// Pre-save hook to generate SKU if not provided
ProductSchema.pre('save', async function(next) {
  if (!this.sku) {
    // Generate SKU: PROD-YYYYMMDD-XXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.sku = `PROD-${dateStr}-${random}`;
  }

  // Ensure only one primary image
  if (this.images && this.images.length > 0) {
    const primaryCount = this.images.filter(img => img.isPrimary).length;
    if (primaryCount === 0) {
      this.images[0].isPrimary = true;
    } else if (primaryCount > 1) {
      this.images.forEach((img, index) => {
        img.isPrimary = index === 0;
      });
    }
  }

  next();
});

// Pre-save hook to track price changes
ProductSchema.pre('save', function(next) {
  if (this.isModified('price') && !this.isNew) {
    this.priceHistory.push({
      price: this.price,
      currency: this.currency,
      changedAt: new Date()
    });
  }
  next();
});

// Virtual for low stock alert
ProductSchema.virtual('isLowStock').get(function() {
  return this.stock.quantity <= this.stock.lowStockThreshold;
});

// Virtual for primary image
ProductSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || (this.images.length > 0 ? this.images[0] : null);
});

// Ensure virtuals are included in JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);
