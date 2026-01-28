/**
 * ===================================================================================
 * GLOBAL ERROR HANDLER
 * ===================================================================================
 * Intercepts all errors in the application and sends a formatted JSON response.
 * Handles specific Mongoose errors (Duplicate Key, Validation, Bad ID).
 *
 * @module middleware/error
 */

const ErrorResponse = require('../utils/errorResponse'); 
// Ensure you have utils/errorResponse.js created (Simple class extending Error)

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for dev
  console.log('--------------------------------------------------'.red);
  console.log(`Error Name: ${err.name}`.yellow);
  console.log(`Error Message: ${err.message}`.yellow);
  console.log(err.stack);
  console.log('--------------------------------------------------'.red);

  // 1. Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid ID format: ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // 2. Mongoose Duplicate Key (Code 11000)
  if (err.code === 11000) {
    // Extract the field that caused the duplicate
    const field = Object.keys(err.keyValue);
    const message = `Duplicate field value entered for '${field}'. Please use another value.`;
    error = new ErrorResponse(message, 400);
  }

  // 3. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    // Extract all validation messages from the error object
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // 4. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid Token. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token Expired. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  // Send Response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    // In production, do not send stack trace
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;