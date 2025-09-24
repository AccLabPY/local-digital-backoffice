const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`);
  
  // Operational, trusted error: send message to client
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  
  // SQL Server specific errors
  if (err.originalError && err.originalError.info) {
    return res.status(500).json({
      status: 'error',
      message: 'Database error',
      details: process.env.NODE_ENV === 'development' ? err.originalError.info.message : undefined
    });
  }
  
  // Unknown error: don't leak error details in production
  return res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong'
      : err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * Catch async errors and forward them to the error handler
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle 404 - Not Found errors
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = {
  errorHandler,
  catchAsync,
  notFound
};
