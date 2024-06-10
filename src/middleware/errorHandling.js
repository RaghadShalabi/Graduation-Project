export const asyncHandler = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => {
      return next(new Error(err.stack));
    });
  };
};

export const globalErrorHandler = (err, req, res, next) => {
  return res.status(err.cause || 500).json({ message: err.message });
};
