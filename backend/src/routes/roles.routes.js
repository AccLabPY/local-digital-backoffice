const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/roles.controller');
const { authMiddleware, requireRole } = require('../middlewares/auth-rbac.middleware');
const { catchAsync } = require('../middlewares/error.middleware');

/**
 * Rutas para Roles y Recursos
 * Solo accesible para superadmin
 */

// Aplicar autenticación y verificar rol superadmin
router.use(authMiddleware);
router.use(requireRole('superadmin'));

/**
 * GET /api/roles/overview
 * Obtener resumen completo de roles, recursos y permisos
 */
router.get('/overview', catchAsync(rolesController.getOverview));

/**
 * GET /api/roles
 * Obtener todos los roles
 */
router.get('/', catchAsync(rolesController.getAllRoles));

/**
 * GET /api/roles/:id
 * Obtener rol por ID
 */
router.get('/:id', catchAsync(rolesController.getRoleById));

/**
 * GET /api/roles/:id/permissions
 * Obtener permisos de un rol
 */
router.get('/:id/permissions', catchAsync(rolesController.getRolePermissions));

/**
 * PUT /api/roles/:roleId/resources/:resourceId/permissions
 * Actualizar permisos de un rol para un recurso
 */
router.put('/:roleId/resources/:resourceId/permissions', catchAsync(rolesController.updatePermission));

module.exports = router;

