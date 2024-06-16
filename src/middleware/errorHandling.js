// Wrapper function to handle asynchronous route handlers
// This will catch any errors thrown in the async function and pass them to the next middleware (error handler)
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => {
      // Pass the error to the next middleware (error handler) with the error stack for debugging
      return next(new Error(err.stack));
    });
  };
};

// Global error handler middleware
// This will catch all errors passed to next() and send a standardized error response
export const globalErrorHandler = (err, req, res, next) => {
  // Send a JSON response with the error message and status code
  // If no status code is provided in the error object, default to 500 (Internal Server Error)
  return res.status(err.cause || 500).json({ message: err.message });
};
