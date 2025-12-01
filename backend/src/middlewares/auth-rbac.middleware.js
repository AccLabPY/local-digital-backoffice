const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const PermissionsModel = require('../models/permissions.model');
const logger = require('../utils/logger');
const { poolPromise, sql } = require('../config/database');

/**
 * Middleware principal de autenticación
 * Valida el token JWT y adjunta los datos del usuario a req.user
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers['authorization'];
    
    // Validar que el header exista y tenga el formato correcto
    if (!authHeader || typeof authHeader !== 'string') {
      logger.error('[Auth] No Authorization header provided or invalid type');
      throw new UnauthorizedError('Token de autenticación requerido');
    }

    // Extraer token del formato "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.error(`[Auth] Invalid Authorization header format: ${authHeader.substring(0, 50)}...`);
      throw new UnauthorizedError('Formato de token inválido');
    }

    const token = parts[1];

    // Validar que el token sea una cadena
    if (!token || typeof token !== 'string') {
      logger.error(`[Auth] Token is not a string. Type: ${typeof token}, Value: ${token}`);
      throw new UnauthorizedError('Token de autenticación inválido');
    }

    // Log token info for debugging
    logger.info(`[Auth] Token received (first 20 chars): ${token.substring(0, 20)}...`);
    logger.info(`[Auth] JWT_SECRET configured: ${config.jwt.secret ? 'YES' : 'NO'}`);

    // Verificar si el token está revocado
    const pool = await poolPromise;
    const revokedCheck = await pool.request()
      .input('token', sql.VarChar(sql.MAX), token)
      .query(`
        SELECT COUNT(*) as Count
        FROM TokensRevocados
        WHERE Token = @token AND FechaExpiracion > SYSUTCDATETIME()
      `);

    if (revokedCheck.recordset[0].Count > 0) {
      logger.error('[Auth] Token is revoked');
      throw new UnauthorizedError('Token revocado');
    }

    // Verificar y decodificar token
    logger.info('[Auth] Attempting to verify token...');
    const decoded = jwt.verify(token, config.jwt.secret);
    logger.info('[Auth] Token verified successfully');
    
    // Adjuntar datos del usuario a la request
    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
      type: decoded.type || 'system', // 'system' o 'empresa'
      roleId: decoded.roleId
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('El token ha expirado'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Token inválido'));
    }
    return next(error);
  }
};

/**
 * Middleware para requerir roles específicos
 * Uso: requireRole('superadmin', 'contributor')
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      // Verificar que el tipo sea 'system'
      if (req.user.type !== 'system') {
        throw new ForbiddenError('Acceso denegado');
      }

      // Verificar si el rol del usuario está en los roles permitidos
      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(`Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar permisos sobre un recurso específico
 * Uso: requireResource('PAGE_EMPRESAS', 'view')
 * Actions: 'view', 'create', 'edit', 'delete'
 */
const requireResource = (resourceCode, action = 'view') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Usuario no autenticado');
      }

      // Verificar que el tipo sea 'system'
      if (req.user.type !== 'system') {
        throw new ForbiddenError('Acceso denegado');
      }

      // Superadmin tiene acceso a todo
      if (req.user.role === 'superadmin') {
        return next();
      }

      // Verificar permiso específico
      const hasPermission = await PermissionsModel.checkPermission(
        req.user.roleId,
        resourceCode,
        action
      );

      if (!hasPermission) {
        logger.warn(`Permission denied: User ${req.user.email} (role: ${req.user.role}) attempted to ${action} resource ${resourceCode}`);
        throw new ForbiddenError(`No tienes permiso para realizar esta acción en este recurso`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para requerir autenticación de tipo 'system'
 */
const requireSystemAuth = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    if (req.user.type !== 'system') {
      throw new ForbiddenError('Acceso denegado. Se requiere autenticación de sistema');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para requerir autenticación de tipo 'empresa'
 */
const requireEmpresaAuth = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    if (req.user.type !== 'empresa') {
      throw new ForbiddenError('Acceso denegado. Se requiere autenticación de empresa');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero lo valida si existe
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    // Verificar token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
      type: decoded.type || 'system',
      roleId: decoded.roleId
    };

    next();
  } catch (error) {
    // Si el token es inválido, continuar sin usuario
    next();
  }
};

module.exports = {
  authMiddleware,
  requireRole,
  requireResource,
  requireSystemAuth,
  requireEmpresaAuth,
  optionalAuth
};

