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
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative']
  },
  sellPrice: {
    type: Number,
    min: [0, 'Sell price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  stock: {
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Stock quantity cannot be negative'],
      default: 0
    },
    unit: {
      type: String,
      default: 'pieces',
      enum: ['pieces', 'pairs', 'sets', 'meters', 'kg', 'liters']
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: [0, 'Low stock threshold cannot be negative']
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
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

// Pre-save hook to generate SKU if not provided\
ProductSchema.pre('save', async function(next) {
  if (!this.sku) {
    // Generate SKU: 5 unique numbers (10000-99999)
    let sku;
    let isUnique = false;

    while (!isUnique) {
      sku = Math.floor(10000 + Math.random() * 90000).toString();
      const existingProduct = await this.constructor.findOne({ sku });
      if (!existingProduct) {
        isUnique = true;
      }
    }

    this.sku = sku;
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

// Virtual for primary image
ProductSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || (this.images.length > 0 ? this.images[0] : null);
});

// Ensure virtuals are included in JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);
