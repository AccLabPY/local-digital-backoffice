// Custom API error classes to handle different error scenarios

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message) {
    super(message || 'Bad request', 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message || 'Unauthorized access', 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message || 'Forbidden access', 403);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message || 'Resource not found', 404);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message || 'Conflict with current state', 409);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message || 'Validation failed', 422);
  }
}

class DatabaseError extends AppError {
  constructor(message) {
    super(message || 'Database operation failed', 500);
  }
}

class InternalServerError extends AppError {
  constructor(message) {
    super(message || 'Internal server error', 500);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  DatabaseError,
  InternalServerError
};
