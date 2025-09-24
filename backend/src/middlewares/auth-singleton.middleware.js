const authService = require('../services/auth.service');
const logger = require('../utils/logger');

/**
 * Middleware que automáticamente obtiene un token válido usando el servicio singleton
 * Evita múltiples llamadas al endpoint de login
 */
const getAuthToken = async (req, res, next) => {
  try {
    // Obtenemos un token válido del servicio singleton
    const token = await authService.getValidToken();
    
    // Agregamos el token al request para que los controladores lo usen
    req.authToken = token;
    
    next();
  } catch (error) {
    logger.error(`Error getting auth token: ${error.message}`);
    res.status(500).json({ 
      error: 'Authentication service unavailable',
      message: error.message 
    });
  }
};

/**
 * Middleware que agrega headers de autorización automáticamente
 */
const addAuthHeaders = (req, res, next) => {
  if (req.authToken) {
    // Agregamos el token a los headers por defecto para requests internos
    req.defaultHeaders = {
      'Authorization': `Bearer ${req.authToken}`,
      'Content-Type': 'application/json',
    };
  }
  next();
};

module.exports = {
  getAuthToken,
  addAuthHeaders
};
