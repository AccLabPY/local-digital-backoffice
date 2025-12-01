const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/roles.controller');
const { authMiddleware, requireRole } = require('../middlewares/auth-rbac.middleware');
const { catchAsync } = require('../middlewares/error.middleware');

/**
 * Rutas para Resources (Recursos del sistema)
 * Solo accesible para superadmin
 */

// Aplicar autenticación y verificar rol superadmin
router.use(authMiddleware);
router.use(requireRole('superadmin'));

/**
 * GET /api/resources
 * Obtener todos los recursos
 */
router.get('/', catchAsync(rolesController.getAllResources));

/**
 * GET /api/resources/:id
 * Obtener recurso por ID
 */
router.get('/:id', catchAsync(rolesController.getResourceById));

module.exports = router;

