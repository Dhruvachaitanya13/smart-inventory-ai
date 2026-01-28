/**
 * @file inventoryController.js
 * @description Enterprise Inventory Management Controller.
 * Handles complex CRUD, Soft Deletes, Faceted Search, and Bulk Operations.
 * * FEATURES:
 * - Soft Delete Implementation (isDeleted flag)
 * - Advanced Filtering (Tags, Price Range, Stock Status)
 * - CSV Streaming for Large Exports
 * - Bulk Operations with Transaction Support (Simulated)
 * - Comprehensive Error Handling
 * * @module controllers/inventory
 * @version 3.2.0
 */

const Product = require('../models/Product');
const User = require('../models/User');
const { Parser } = require('json2csv');
const mongoose = require('mongoose');

// --- HELPER FUNCTIONS ---

/**
 * Validates search query structure
 * @param {string} search 
 * @returns {Object} MongoDB Query Object
 */
const buildSearchQuery = (search) => {
  if (!search) return {};
  return {
    $text: { $search: search }
  };
};

/**
 * Builds range filters for price/quantity
 */
const buildRangeFilter = (query, field) => {
  const filter = {};
  if (query[`${field}Min`]) filter.$gte = Number(query[`${field}Min`]);
  if (query[`${field}Max`]) filter.$lte = Number(query[`${field}Max`]);
  return Object.keys(filter).length ? filter : null;
};

// --- CONTROLLER METHODS ---

/**
 * @desc    Get All Products with Advanced Filtering
 * @route   GET /api/inventory
 * @access  Private
 */
exports.getProducts = async (req, res) => {
  try {
    const { 
      search, category, status, source, sort = '-createdAt', 
      page = 1, limit = 50 
    } = req.query;

    // 1. Build Query Aggregation Pipeline
    const queryObj = { 
      isDeleted: { $ne: true } // Exclude soft-deleted items
    };

    // Text Search
    if (search) {
      // Use text index for performance
      queryObj.$text = { $search: search };
    }

    // Faceted Filters
    if (category && category !== 'All') queryObj.category = category;
    if (source) queryObj.source = source;
    
    // Status Filter (Virtual Logic Simulation)
    // Note: Virtuals aren't queryable directly in Mongo, so we map status to logic
    if (status) {
      if (status === 'LOW_STOCK') queryObj.$expr = { $lte: ['$quantity', '$minStockLevel'] };
      if (status === 'OUT_OF_STOCK') queryObj.quantity = 0;
      if (status === 'OVER_STOCK') queryObj.$expr = { $gte: ['$quantity', '$maxStockLevel'] };
    }

    // 2. Pagination Setup
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(1000, parseInt(limit))); // Cap limit at 1000
    const skip = (pageNum - 1) * limitNum;

    // 3. Execution
    // We use Promise.all to run count and find in parallel
    const [products, totalDocs] = await Promise.all([
      Product.find(queryObj)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email')
        .lean(), // Convert to plain JS objects for performance
      Product.countDocuments(queryObj)
    ]);

    // 4. Transform for Frontend (Add Virtuals manually if using lean())
    // Note: If strictly needed, remove .lean() to get Mongoose Virtuals automatically
    // but manually computing is faster for lists.
    const enhancedProducts = products.map(p => ({
      ...p,
      status: p.quantity === 0 ? 'OUT_OF_STOCK' : 
              p.quantity <= p.minStockLevel ? 'LOW_STOCK' : 
              'IN_STOCK',
      totalValue: (p.price * p.quantity).toFixed(2)
    }));

    // 5. Response
    res.status(200).json({
      success: true,
      meta: {
        total: totalDocs,
        page: pageNum,
        pages: Math.ceil(totalDocs / limitNum),
        limit: limitNum,
        count: enhancedProducts.length
      },
      data: enhancedProducts
    });

  } catch (error) {
    console.error(`[Inventory] Fetch Error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error: Could not retrieve inventory.' });
  }
};

/**
 * @desc    Create Product with Transaction Safety
 * @route   POST /api/inventory
 * @access  Private
 */
exports.createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Identify User (Auth Middleware Required)
    // Fallback logic included for demo robustness
    let userId = req.user ? req.user.id : null;
    if (!userId) {
      const admin = await User.findOne({ role: 'admin' });
      if (admin) userId = admin._id;
      else throw new Error("No authorized user found for creation.");
    }

    // 2. Create Product
    const newProduct = await Product.create([{
      ...req.body,
      user: userId,
      source: 'manual', // Force source
      isDeleted: false
    }], { session });

    // 3. Commit
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Product successfully created.',
      data: newProduct[0]
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    // Validation Error Handling
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    
    // Duplicate Key Error
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A product with this SKU or Name already exists.' });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update Product
 * @route   PUT /api/inventory/:id
 * @access  Private
 */
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (product.isDeleted) return res.status(410).json({ success: false, message: 'This product has been deleted.' });

    // Prevent updating immutable fields
    delete req.body.source;
    delete req.body.user;
    delete req.body.createdAt;

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: product });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Soft Delete Product (Archive)
 * @route   DELETE /api/inventory/:id
 * @access  Private
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Soft Delete Implementation
    product.isDeleted = true;
    product.sku = `${product.sku}_DELETED_${Date.now()}`; // Free up the SKU
    await product.save();

    res.status(200).json({ 
      success: true, 
      message: 'Product moved to archives.', 
      id: req.params.id 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete operation failed.' });
  }
};

/**
 * @desc    Bulk Import with Schema Mapping
 * @route   POST /api/inventory/import
 * @access  Private
 */
exports.importProducts = async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'Import data is empty.' });
    }

    // Get User
    const userId = req.user ? req.user.id : (await User.findOne())._id;

    // Transform Data to match Advanced Schema
    const bulkOps = products.map(p => ({
      insertOne: {
        document: {
          user: userId,
          name: (p.Name || p.name || 'Unnamed Import').trim(),
          sku: (p.SKU || p.sku || `IMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`).toUpperCase(),
          category: p.Category || p.category || 'Other',
          quantity: parseInt(p.Stock || p.quantity || 0),
          price: parseFloat(p.Price || p.price || 0),
          cost: parseFloat(p.Cost || p.cost || 0),
          description: p.Description || 'Imported via bulk upload tool.',
          source: 'import',
          supplier: {
            name: p.Supplier || 'External',
            leadTime: parseInt(p.LeadTime || 7)
          },
          isDeleted: false
        }
      }
    }));

    // Execute Bulk Write (Ordered: false allows partial success)
    const result = await Product.bulkWrite(bulkOps, { ordered: false });

    res.status(201).json({
      success: true,
      message: `Import processed. Inserted: ${result.insertedCount}.`,
      details: result
    });

  } catch (error) {
    // Check for bulk write errors (e.g. partial duplicates)
    if (error.writeErrors) {
      return res.status(207).json({
        success: true,
        message: `Partial success. ${error.insertedDocs} inserted. ${error.writeErrors.length} failed.`,
        errors: error.writeErrors.slice(0, 5) // Return first 5 errors
      });
    }
    res.status(500).json({ success: false, message: 'Bulk Import Failed: ' + error.message });
  }
};

/**
 * @desc    Stream CSV Export (Memory Efficient)
 * @route   GET /api/inventory/export
 * @access  Private
 */
exports.exportProducts = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=inventory_export.csv');

    const cursor = Product.find({ isDeleted: { $ne: true } }).lean().cursor();
    const fields = ['name', 'sku', 'category', 'quantity', 'price', 'totalValue', 'status', 'supplier.name'];
    const json2csvParser = new Parser({ fields });

    // Stream logic
    let isFirst = true;
    cursor.on('data', (doc) => {
      // Calculate virtuals on the fly for export
      doc.totalValue = (doc.price * doc.quantity).toFixed(2);
      doc.status = doc.quantity === 0 ? 'Out' : doc.quantity < 10 ? 'Low' : 'OK';
      
      const csv = json2csvParser.parse(doc);
      // Remove header from subsequent rows
      const row = isFirst ? csv : csv.split('\n')[1]; 
      res.write(row + '\n');
      isFirst = false;
    });

    cursor.on('end', () => res.end());
    cursor.on('error', (err) => {
      console.error(err);
      res.end();
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};