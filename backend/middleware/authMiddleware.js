/**
 * ============================================================================
 * AUTH MIDDLEWARE
 * ============================================================================
 * Protects routes by verifying JWT tokens.
 */

const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

/**
 * Protect Route
 * Ensures only authenticated users can access the endpoint.
 */
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Extract token from Authorization Header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    // 2. Alternatively check Cookies
    else if (req.cookies.token) {
        token = req.cookies.token;
    }

    // 3. Validation
    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        // 4. Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Attach User to Request
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return next(new ErrorResponse('User no longer exists', 401));
        }

        next();
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
});

/**
 * Grant access to specific roles
 * @param  {...String} roles - List of allowed roles (e.g., 'admin', 'manager')
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorResponse(
                    `User role '${req.user.role}' is not authorized to access this route`,
                    403
                )
            );
        }
        next();
    };
};