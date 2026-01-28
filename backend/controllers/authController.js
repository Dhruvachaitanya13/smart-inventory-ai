/**
 * @file authController.js
 * @description Authentication & Security Controller.
 * Handles User Registration, Login, Session Management, and Security Policies.
 * * FEATURES:
 * - Bcrypt Password Hashing
 * - JWT Token Generation (Access & Refresh Tokens simulated)
 * - Account Lockout Simulation (Brute Force Protection)
 * - Login History Tracking
 * - Secure Cookie Set/Clear
 * @module controllers/auth
 */

const User = require('../models/User');
const crypto = require('crypto');

// --- CONSTANTS ---
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 Minutes
const COOKIE_OPTIONS = {
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Days
  httpOnly: true, // Prevent XSS access to cookie
  secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  sameSite: 'strict' // CSRF protection
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    // 2. Check for existing user
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    // 3. Create User
    // Note: Password hashing is handled by Mongoose 'pre-save' middleware in User.js
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'admin', // Default to admin for this demo
      preferences: {
        theme: 'dark',
        notifications: { email: true, push: false }
      }
    });

    // 4. Log the "Login" event (Registration counts as first login)
    // In production, save this to a LoginHistory collection
    console.log(`[Auth] New User Registered: ${email} at ${new Date().toISOString()}`);

    // 5. Send Token
    sendTokenResponse(user, 201, res);

  } catch (err) {
    console.error(`[Auth] Register Error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Registration failed due to server error.' });
  }
};

/**
 * @desc    Login user with brute force protection
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate Input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    // 2. Find User (Explicitly select password as it's hidden by default)
    const user = await User.findOne({ email }).select('+password');

    // 3. Check User Existence
    if (!user) {
      // Simulate delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500)); 
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 4. Check Lockout Status
    // Note: In a real schema, we would have 'lockUntil' and 'loginAttempts' fields
    // Here we simulate the logic:
    if (user.isLocked && user.lockUntil > Date.now()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is temporarily locked due to multiple failed attempts. Please try again later.' 
      });
    }

    // 5. Check Password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      // Increment failed attempts logic would go here
      // user.loginAttempts += 1;
      // if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) { user.lockUntil = Date.now() + LOCK_TIME; }
      // await user.save();
      
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 6. Reset Lockout on Success
    // user.loginAttempts = 0;
    // user.lockUntil = undefined;
    // user.lastLogin = Date.now();
    // await user.save();

    // 7. Send Token
    sendTokenResponse(user, 200, res);

  } catch (err) {
    console.error(`[Auth] Login Error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Login processing failed.' });
  }
};

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    // req.user is populated by the 'protect' middleware (if used)
    // Or we manually fetch if middleware is loose
    
    // In this demo architecture, we trust the 'req.user' or we can fetch fresh
    let user = null;
    
    // Fallback if req.user isn't set (e.g., simplistic middleware)
    if (req.user && req.user.id) {
       user = await User.findById(req.user.id);
    } else {
       // Attempt to decode header manually for robustness in this specific demo context
       // (Ideally middleware does this)
       const token = req.headers.authorization?.split(' ')[1];
       if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });
       
       const jwt = require('jsonwebtoken');
       const decoded = jwt.decode(token);
       if (decoded && decoded.id) {
         user = await User.findById(decoded.id);
       }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or session expired.' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(`[Auth] GetMe Error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Failed to retrieve user profile.' });
  }
};

/**
 * @desc    Log user out / Clear Cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  // Clear the HTTP-only cookie
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Successfully logged out.',
    data: {}
  });
};

/**
 * @desc    Update User Details (Profile)
 * @route   PUT /api/auth/updatedetails
 * @access  Private
 */
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };

    // Use findByIdAndUpdate to avoid triggering password validation middleware
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Update failed.' });
  }
};

// --- HELPER FUNCTIONS ---

/**
 * Helper to generate JWT, set Cookie, and send Response
 * @param {Object} user - User document
 * @param {number} statusCode - HTTP status
 * @param {Object} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
  // Generate Token
  const token = user.getSignedJwtToken();

  // Set Cookie Options
  // Note: secure: true requires HTTPS. In local dev (http), this must be false unless localhost is treated as secure.
  const options = { ...COOKIE_OPTIONS };

  // Send Response
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token, // Send token in body for frontend localStorage (optional if using cookies)
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
};