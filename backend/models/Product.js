/**
 * @file Product.js
 * @description Enterprise Mongoose Schema for Inventory Products.
 * Defines the data structure, validation rules, indexing strategies, and middleware hooks.
 * * FEATURES:
 * - Strict Type Validation & Enums
 * - Automatic SKU Generation (Pre-save hook)
 * - Full-Text Search Indexes
 * - Virtual Properties (Total Value, Stock Status)
 * - Static Aggregation Methods for Analytics
 * - Soft Delete Capability (isDeleted flag)
 * * @module models/Product
 * @version 3.1.0
 */

const mongoose = require('mongoose');

// --- CONSTANTS ---
const CATEGORIES = [
  'Electronics', 'Laptops', 'Audio', 'Accessories', 'Monitors', 
  'Tablets', 'Furniture', 'Networking', 'Hardware', 'Phones', 
  'Wearables', 'Servers', 'Gaming', 'Office Supplies', 'Other'
];

const DATA_SOURCES = ['manual', 'demo', 'import', 'api', 'sync'];

/**
 * @schema ProductSchema
 * @description Defines the structure of the Product document.
 */
const productSchema = new mongoose.Schema({
  // --- CORE IDENTITY ---
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Validation Error: A product must be assigned to a user account.'],
    ref: 'User',
    index: true, // Optimize queries by user
  },
  
  name: {
    type: String,
    required: [true, 'Validation Error: Product name is mandatory.'],
    trim: true,
    maxlength: [150, 'Product name cannot exceed 150 characters.'],
    minlength: [3, 'Product name must be at least 3 characters.'],
    index: true, // Text search optimization
  },

  sku: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true,
    // Note: Required validation is handled in pre-save hook if missing
    index: true,
  },

  // --- CLASSIFICATION ---
  category: {
    type: String,
    required: [true, 'Validation Error: Product category is required.'],
    enum: {
      values: CATEGORIES,
      message: '{VALUE} is not a supported category. Please choose from the list.',
    },
    default: 'Other',
    index: true, // Faceted search optimization
  },

  tags: {
    type: [String],
    index: true,
    validate: {
      validator: function(v) {
        return v.length <= 10;
      },
      message: 'A product can have a maximum of 10 tags.'
    }
  },

  // --- INVENTORY METRICS ---
  quantity: {
    type: Number,
    required: [true, 'Validation Error: Stock quantity is required.'],
    min: [0, 'Quantity cannot be negative.'],
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number.',
    },
  },

  minStockLevel: {
    type: Number,
    default: 10,
    min: [0, 'Minimum stock level cannot be negative.'],
    description: 'Threshold for triggering low-stock alerts.'
  },

  maxStockLevel: {
    type: Number,
    default: 1000,
    description: 'Threshold for overstock warnings.'
  },

  // --- FINANCIALS ---
  price: {
    type: Number,
    required: [true, 'Validation Error: Unit price is required.'],
    min: [0.01, 'Price must be at least $0.01.'],
    set: val => Math.round(val * 100) / 100, // Round to 2 decimal places
  },

  cost: {
    type: Number,
    default: 0.00,
    description: 'Cost of Goods Sold (COGS) for profit margin analysis.',
  },

  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'JPY'],
  },

  // --- METADATA & PROVENANCE ---
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description limit is 2000 characters.'],
    default: 'No detailed description provided.',
  },

  source: {
    type: String,
    enum: DATA_SOURCES,
    default: 'manual',
    immutable: true, // Cannot change origin after creation
  },

  supplier: {
    name: { type: String, trim: true, default: 'Unknown Supplier' },
    contact: { type: String, trim: true },
    leadTime: { type: Number, default: 7 }, // Days
  },

  // --- STATUS FLAGS ---
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },

  isDeleted: {
    type: Boolean,
    default: false, // Soft delete implementation
    index: true,
  },

}, {
  // --- SCHEMA OPTIONS ---
  timestamps: true, // createdAt, updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  optimisticConcurrency: true, // Prevents write conflicts
});

// --- INDEX DEFINITIONS ---
// Compound index for unique product names per user (optional business rule)
// productSchema.index({ user: 1, name: 1 }, { unique: true });

// Full-Text Search Index
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  sku: 'text', 
  category: 'text' 
}, {
  weights: {
    name: 10,
    sku: 5,
    category: 3,
    description: 1
  },
  name: 'TextIndex'
});

// --- VIRTUAL PROPERTIES ---

/**
 * Virtual: Total Inventory Value
 */
productSchema.virtual('totalValue').get(function() {
  return (this.price * this.quantity).toFixed(2);
});

/**
 * Virtual: Stock Status
 */
productSchema.virtual('status').get(function() {
  if (this.quantity === 0) return 'OUT_OF_STOCK';
  if (this.quantity <= this.minStockLevel) return 'LOW_STOCK';
  if (this.quantity >= this.maxStockLevel) return 'OVER_STOCK';
  return 'IN_STOCK';
});

/**
 * Virtual: Profit Margin
 */
productSchema.virtual('margin').get(function() {
  if (!this.cost || this.cost === 0) return 100; // 100% margin if cost is 0 (service/digital)
  return (((this.price - this.cost) / this.price) * 100).toFixed(1);
});

// --- MIDDLEWARE (HOOKS) ---

/**
 * Pre-Save Hook: Auto-generate SKU if missing
 */
productSchema.pre('save', async function(next) {
  if (!this.sku) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = this.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    this.sku = `${prefix}-${Date.now().toString().slice(-4)}-${randomSuffix}`;
  }
  next();
});

/**
 * Pre-Find Hook: Exclude soft-deleted items by default
 */
productSchema.pre(/^find/, function(next) {
  if (this.options.includeDeleted !== true) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

// --- STATIC METHODS (ANALYTICS) ---

/**
 * Calculate detailed inventory statistics for a specific user
 * @param {ObjectId} userId 
 */
productSchema.statics.getDashboardStats = async function(userId) {
  const pipeline = [
    { $match: { user: userId, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalUnits: { $sum: '$quantity' },
        totalValuation: { $sum: { $multiply: ['$price', '$quantity'] } },
        avgPrice: { $avg: '$price' },
        lowStockCount: { 
          $sum: { 
            $cond: [{ $lte: ['$quantity', '$minStockLevel'] }, 1, 0] 
          } 
        },
        outOfStockCount: {
          $sum: {
            $cond: [{ $eq: ['$quantity', 0] }, 1, 0]
          }
        },
        categories: { $addToSet: '$category' }
      }
    }
  ];

  const results = await this.aggregate(pipeline);
  return results.length ? results[0] : null;
};

/**
 * Aggregation for Category Distribution Chart
 * @param {ObjectId} userId 
 */
productSchema.statics.getCategoryDistribution = async function(userId) {
  return this.aggregate([
    { $match: { user: userId, isDeleted: { $ne: true } } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        value: { $sum: { $multiply: ['$price', '$quantity'] } }
      }
    },
    { $sort: { value: -1 } }
  ]);
};

// --- INSTANCE METHODS ---

/**
 * Soft Delete the product
 */
productSchema.methods.softDelete = function() {
  this.isDeleted = true;
  return this.save();
};

/**
 * Check if restock is needed
 */
productSchema.methods.needsRestock = function() {
  return this.quantity <= this.minStockLevel;
};

// Export the Model
module.exports = mongoose.model('Product', productSchema);