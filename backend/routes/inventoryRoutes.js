/**
 * @file inventoryRoutes.js
 * @description API Routes for Inventory Management.
 * Maps HTTP endpoints to Controller functions.
 */

const express = require('express');
const router = express.Router();

// Controllers
const { 
  getProducts, 
  createProduct, 
  deleteProduct, 
  updateProduct,
  importProducts 
} = require('../controllers/inventoryController');

const { seedData } = require('../controllers/seedController');

// Middleware (Optional: Add 'protect' middleware here if not global)
// const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/inventory/seed
 * @desc    Reset database with demo data
 * @access  Private
 */
router.post('/seed', seedData);

/**
 * @route   POST /api/inventory/import
 * @desc    Bulk import products from CSV
 * @access  Private
 */
router.post('/import', importProducts);

/**
 * @route   GET /api/inventory
 * @desc    Get all products (supports pagination, search, filter)
 * @access  Private
 */
router.get('/', getProducts);

/**
 * @route   POST /api/inventory
 * @desc    Create a single product
 * @access  Private
 */
router.post('/', createProduct);

/**
 * @route   PUT /api/inventory/:id
 * @desc    Update a product by ID
 * @access  Private
 */
router.put('/:id', updateProduct);

/**
 * @route   DELETE /api/inventory/:id
 * @desc    Delete a product by ID
 * @access  Private
 */
router.delete('/:id', deleteProduct);

module.exports = router;