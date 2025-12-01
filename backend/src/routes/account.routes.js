const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { authMiddleware } = require('../middlewares/auth-rbac.middleware');

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: API for account management
 */

/**
 * @swagger
 * /api/account/me:
 *   get:
 *     summary: Obtener datos del usuario logueado
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authMiddleware, accountController.getMe);

/**
 * @swagger
 * /api/account/me:
 *   put:
 *     summary: Actualizar datos del usuario logueado
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               organization:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: User data updated
 *       401:
 *         description: Not authenticated
 */
router.put('/me', authMiddleware, accountController.updateMe);

/**
 * @swagger
 * /api/account/me/password:
 *   put:
 *     summary: Cambiar contraseña del usuario logueado
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password updated
 *       401:
 *         description: Not authenticated
 */
router.put('/me/password', authMiddleware, accountController.changePassword);

module.exports = router;

