const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { authMiddleware, requireRole, requireResource } = require('../middlewares/auth-rbac.middleware');
const { validate, schemas } = require('../utils/validation');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API for managing users
 */

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Get paginated list of users with search
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Search term for user name, email, or company
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, requireResource('USUARIOS_LIST_VIEW', 'view'), usuarioController.getUsuarios);

/**
 * @swagger
 * /api/usuarios/companies:
 *   get:
 *     summary: Get companies for dropdown selection
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/companies', authMiddleware, usuarioController.getCompaniesForDropdown);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', authMiddleware, requireResource('USUARIOS_LIST_VIEW', 'view'), validate(schemas.idParam, 'params'), usuarioController.getUsuarioById);

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombreCompleto:
 *                 type: string
 *               email:
 *                 type: string
 *               contraseña:
 *                 type: string
 *               idEmpresa:
 *                 type: integer
 *               rutEmpresa:
 *                 type: string
 *               nombreEmpresa:
 *                 type: string
 *               cargoEmpresa:
 *                 type: string
 *             required:
 *               - nombreCompleto
 *               - email
 *               - contraseña
 *               - idEmpresa
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request - missing or invalid data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, requireResource('USUARIOS_CREATE', 'create'), usuarioController.createUsuario);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   patch:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombreCompleto:
 *                 type: string
 *               email:
 *                 type: string
 *               idEmpresa:
 *                 type: integer
 *               cargoEmpresa:
 *                 type: string
 *               isConnected:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Bad request - missing or invalid data
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/:id', authMiddleware, requireResource('USUARIOS_ACTION_EDIT', 'edit'), validate(schemas.idParam, 'params'), usuarioController.updateUsuario);

/**
 * @swagger
 * /api/usuarios/{id}/password:
 *   patch:
 *     summary: Update user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *             required:
 *               - newPassword
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Bad request - missing or invalid data
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/:id/password', authMiddleware, requireResource('USUARIOS_ACTION_CHANGE_PASSWORD', 'edit'), validate(schemas.idParam, 'params'), usuarioController.updatePassword);

/**
 * @swagger
 * /api/usuarios/{id}/email:
 *   patch:
 *     summary: Update user email only
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       400:
 *         description: Bad request - missing or invalid data
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/:id/email', authMiddleware, requireResource('USUARIOS_ACTION_UPDATE_EMAIL', 'edit'), validate(schemas.idParam, 'params'), usuarioController.updateEmail);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deleteType:
 *                 type: string
 *                 enum: [partial, complete]
 *                 description: Type of deletion (partial = delete user and tests, complete = delete user, tests, and company)
 *             required:
 *               - deleteType
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Bad request - missing or invalid data
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, requireResource('USUARIOS_ACTION_DELETE', 'delete'), validate(schemas.idParam, 'params'), usuarioController.deleteUsuario);

module.exports = router;
