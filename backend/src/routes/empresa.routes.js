const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresa.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../utils/validation');

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: API for managing companies
 */

/**
 * @swagger
 * /api/empresas:
 *   get:
 *     summary: Get paginated list of companies with filters and search
 *     tags: [Companies]
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
 *         description: Search term for company name, location, or activity sector
 *       - in: query
 *         name: departamento
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: distrito
 *         schema:
 *           type: string
 *         description: Filter by district
 *       - in: query
 *         name: nivelInnovacion
 *         schema:
 *           type: string
 *         description: Filter by innovation level
 *       - in: query
 *         name: sectorActividad
 *         schema:
 *           type: string
 *         description: Filter by activity sector
 *       - in: query
 *         name: estadoEncuesta
 *         schema:
 *           type: boolean
 *         description: Filter by survey status (true = completed, false = in progress)
 *       - in: query
 *         name: finalizado
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 1
 *         description: Filter by finalized status (1 = finalized, 0 = not finalized)
 *     responses:
 *       200:
 *         description: Paginated list of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, validate(schemas.paginationWithFilters, 'query'), empresaController.getEmpresas);

/**
 * @swagger
 * /api/empresas/kpis:
 *   get:
 *     summary: Get KPIs for companies list
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPIs data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEmpresas:
 *                   type: integer
 *                 nivelGeneral:
 *                   type: number
 *                   format: float
 *                 empresasIncipientes:
 *                   type: integer
 *                 totalEmpleados:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/kpis', authenticateToken, validate(schemas.kpiFilters, 'query'), empresaController.getKPIs);

/**
 * @swagger
 * /api/empresas/filters/options:
 *   get:
 *     summary: Get filter options for companies list
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Filter options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 departamentos:
 *                   type: array
 *                   items:
 *                     type: string
 *                 distritos:
 *                   type: array
 *                   items:
 *                     type: string
 *                 nivelesInnovacion:
 *                   type: array
 *                   items:
 *                     type: string
 *                 sectoresActividad:
 *                   type: array
 *                   items:
 *                     type: string
 *                 estadosEncuesta:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: boolean
 *                       label:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/filters/options', authenticateToken, empresaController.getFilterOptions);

/**
 * @swagger
 * /api/empresas/{id}:
 *   get:
 *     summary: Get company details by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyDetails'
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateToken, validate(schemas.idParam, 'params'), empresaController.getEmpresaById);

/**
 * @swagger
 * /api/empresas/export:
 *   get:
 *     summary: Export companies data to CSV or Excel
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *         default: csv
 *         description: Export format
 *       - in: query
 *         name: fileName
 *         schema:
 *           type: string
 *         default: empresas
 *         description: Name of the exported file
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Search term for company name, location, or activity sector
 *       - in: query
 *         name: departamento
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: distrito
 *         schema:
 *           type: string
 *         description: Filter by district
 *       - in: query
 *         name: nivelInnovacion
 *         schema:
 *           type: string
 *         description: Filter by innovation level
 *       - in: query
 *         name: sectorActividad
 *         schema:
 *           type: string
 *         description: Filter by activity sector
 *       - in: query
 *         name: estadoEncuesta
 *         schema:
 *           type: boolean
 *         description: Filter by survey status (true = completed, false = in progress)
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/export', authenticateToken, validate(schemas.exportParams, 'query'), empresaController.exportEmpresas);

module.exports = router;
