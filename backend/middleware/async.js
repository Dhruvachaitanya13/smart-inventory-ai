/**
 * Async Handler Wrapper
 * Eliminates the need for try-catch blocks in every controller function.
 * @param {Function} fn - The async function to wrap
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;