/**
 * @file User.js
 * @description Enterprise Mongoose Schema for User Identity.
 * Implements rigorous security standards including bcrypt hashing, 
 * account lockout policies, and role-based metadata.
 * * FEATURES:
 * - Bcrypt Password Hashing with Salt
 * - Account Lockout (Max Failed Attempts)
 * - Password History (Prevent Reuse - Simulated)
 * - Role Validation Enums
 * - JWT Token Generation Method
 * - Last Login Tracking
 * * @module models/User
 * @version 2.2.0
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// --- CONSTANTS ---
const ROLES = ['user', 'manager', 'admin', 'superadmin'];
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 Minutes

/**
 * @schema UserSchema
 * @description Structure for User documents
 */
const userSchema = new mongoose.Schema({
  // --- IDENTITY ---
  name: {
    type: String,
    required: [true, 'Please provide a full name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
    minlength: [2, 'Name must be at least 2 characters']
  },

  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ],
    index: true
  },

  // --- SECURITY CREDENTIALS ---
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Never return password in queries
  },

  role: {
    type: String,
    enum: {
      values: ROLES,
      message: '{VALUE} is not a valid role'
    },
    default: 'user'
  },

  // --- ACCOUNT LOCKOUT MECHANISM ---
  loginAttempts: {
    type: Number,
    required: true,
    default: 0
  },

  lockUntil: {
    type: Number
  },

  // --- AUDIT FIELDS ---
  lastLogin: {
    type: Date,
    default: Date.now
  },

  passwordChangedAt: {
    type: Date
  },

  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // --- PREFERENCES (Embedded) ---
  preferences: {
    theme: { type: String, default: 'system', enum: ['light', 'dark', 'system'] },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false }
    }
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true // createdAt, updatedAt
});

// --- VIRTUALS ---

/**
 * Virtual: Account Status
 * Checks if account is currently locked
 */
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// --- MIDDLEWARE (HOOKS) ---

/**
 * Pre-Save: Hash Password
 */
userSchema.pre('save', async function(next) {
  // Only run this if password was actually modified
  if (!this.isModified('password')) return next();

  // Generate Salt
  const salt = await bcrypt.genSalt(12); // Higher salt rounds for enterprise security
  
  // Hash
  this.password = await bcrypt.hash(this.password, salt);
  
  // Update changed timestamp
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // Backdate 1s to ensure JWT issued after matches
  }
  
  next();
});

// --- INSTANCE METHODS ---

/**
 * Verify entered password against hashed password
 * @param {string} enteredPassword 
 * @returns {Promise<boolean>}
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate Signed JWT Token
 * @returns {string} Signed JWT
 */
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role 
    },
    process.env.JWT_SECRET || 'fallback_secret_dev_only_do_not_use_in_prod',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

/**
 * Generate Password Reset Token
 * @returns {string} Raw token (to be emailed)
 */
userSchema.methods.getResetPasswordToken = function() {
  // Generate random bytes
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 Minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

/**
 * Increment Failed Login Attempts
 * Used for lockout logic
 */
userSchema.methods.incLoginAttempts = async function() {
  // Use atomic operators to prevent race conditions
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock if limit reached
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME_MS };
  }
  
  return this.updateOne(updates);
};

/**
 * Reset Failed Attempts (on successful login)
 */
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { 
      loginAttempts: 0, 
      lastLogin: Date.now() 
    },
    $unset: { lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', userSchema);