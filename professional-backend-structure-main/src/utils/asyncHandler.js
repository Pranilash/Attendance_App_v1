/**
 * Wraps an asynchronous Express request handler and forwards errors to next().
 * @param {Function} requestHandler - Asynchronous route handler.
 * @returns {Function} Express middleware function.
 */
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    };
};

export { asyncHandler };