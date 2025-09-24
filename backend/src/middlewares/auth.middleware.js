const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');
const config = require('../config/config');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return next(new UnauthorizedError('Authentication token is required'));
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token has expired'));
    }
    return next(new UnauthorizedError('Invalid token'));
  }
};

module.exports = {
  authenticateToken
};
