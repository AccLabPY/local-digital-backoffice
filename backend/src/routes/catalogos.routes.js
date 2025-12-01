const express = require('express');
const router = express.Router();
const catalogosController = require('../controllers/catalogos.controller');
const { authMiddleware } = require('../middlewares/auth-rbac.middleware');

/**
 * @swagger
 * tags:
 *   name: Catalogos
 *   description: API for getting catalog data
 */

/**
 * @swagger
 * /api/catalogos/ventas-anuales:
 *   get:
 *     summary: Get all ventas anuales options
 *     tags: [Catalogos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of ventas anuales options
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/ventas-anuales', authMiddleware, catalogosController.getVentasAnuales);

/**
 * @swagger
 * /api/catalogos/usuarios:
 *   get:
 *     summary: Get all users for assignment
 *     tags: [Catalogos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for user name or email
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   email:
 *                     type: string
 *                   empresa:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/usuarios', authMiddleware, catalogosController.getUsuarios);

/**
 * @swagger
 * /api/catalogos/empresas:
 *   get:
 *     summary: Get all companies for assignment
 *     tags: [Catalogos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for company name or RUT
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   rut:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/empresas', authMiddleware, catalogosController.getEmpresas);

module.exports = router;
