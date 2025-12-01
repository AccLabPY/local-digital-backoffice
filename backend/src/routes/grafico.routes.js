const express = require('express');
const router = express.Router();
const graficoController = require('../controllers/grafico.controller');
const { authMiddleware } = require('../middlewares/auth-rbac.middleware');

/**
 * @swagger
 * tags:
 *   name: Charts
 *   description: API for chart data
 */

/**
 * @swagger
 * /api/graficos/empresas/{idEmpresa}/general-evolution:
 *   get:
 *     summary: Get general evolution data for a company
 *     tags: [Charts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idEmpresa
 *         schema:
 *           type: integer
 *         required: true
 *         description: Company ID
 *     responses:
 *       200:
 *         description: General evolution data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fecha:
 *                     type: string
 *                     format: date
 *                   puntaje:
 *                     type: number
 *                     format: float
 *                   nivelMadurez:
 *                     type: string
 *                   isSimulated:
 *                     type: boolean
 *                     description: Flag to indicate if the data point is simulated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/empresas/:idEmpresa/general-evolution', authMiddleware, graficoController.getGeneralEvolution);

/**
 * @swagger
 * /api/graficos/empresas/{idEmpresa}/dimension-evolution:
 *   get:
 *     summary: Get dimension evolution data for a company
 *     tags: [Charts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idEmpresa
 *         schema:
 *           type: integer
 *         required: true
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Dimension evolution data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fecha:
 *                     type: string
 *                     format: date
 *                   tecnologia:
 *                     type: number
 *                     format: float
 *                   comunicacion:
 *                     type: number
 *                     format: float
 *                   organizacion:
 *                     type: number
 *                     format: float
 *                   datos:
 *                     type: number
 *                     format: float
 *                   estrategia:
 *                     type: number
 *                     format: float
 *                   procesos:
 *                     type: number
 *                     format: float
 *                   isSimulated:
 *                     type: boolean
 *                     description: Flag to indicate if the data point is simulated
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/empresas/:idEmpresa/dimension-evolution', authMiddleware, graficoController.getDimensionEvolution);

module.exports = router;
