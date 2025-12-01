const express = require('express');
const router = express.Router();
const usuariosSistemaController = require('../controllers/usuariosSistema.controller');
const { authMiddleware, requireRole } = require('../middlewares/auth-rbac.middleware');
const { catchAsync } = require('../middlewares/error.middleware');

/**
 * Rutas para Usuarios del Sistema (UsuariosSistema)
 * Solo accesible para superadmin
 */

// Aplicar autenticación y verificar rol superadmin
router.use(authMiddleware);
router.use(requireRole('superadmin'));

/**
 * GET /api/usuarios-sistema
 * Obtener todos los usuarios del sistema
 */
router.get('/', catchAsync(usuariosSistemaController.getAll));

/**
 * GET /api/usuarios-sistema/:id
 * Obtener usuario del sistema por ID
 */
router.get('/:id', catchAsync(usuariosSistemaController.getById));

/**
 * POST /api/usuarios-sistema
 * Crear nuevo usuario del sistema
 */
router.post('/', catchAsync(usuariosSistemaController.create));

/**
 * PUT /api/usuarios-sistema/:id
 * Actualizar usuario del sistema
 */
router.put('/:id', catchAsync(usuariosSistemaController.update));

/**
 * PUT /api/usuarios-sistema/:id/password
 * Resetear contraseña de usuario del sistema
 */
router.put('/:id/password', catchAsync(usuariosSistemaController.updatePassword));

/**
 * PUT /api/usuarios-sistema/:id/toggle-active
 * Activar/desactivar usuario del sistema
 */
router.put('/:id/toggle-active', catchAsync(usuariosSistemaController.toggleActive));

/**
 * DELETE /api/usuarios-sistema/:id
 * Eliminar (desactivar) usuario del sistema
 */
router.delete('/:id', catchAsync(usuariosSistemaController.delete));

module.exports = router;

