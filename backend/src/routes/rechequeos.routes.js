const express = require('express');
const router = express.Router();
const rechequeosController = require('../controllers/rechequeos.controller');
const { authMiddleware } = require('../middlewares/auth-rbac.middleware');
const { validate, schemas } = require('../utils/validation');

/**
 * @swagger
 * tags:
 *   name: Rechequeos
 *   description: API for managing rechequeos (companies with multiple surveys)
 */

/**
 * @swagger
 * /api/rechequeos/kpis:
 *   get:
 *     summary: Get KPIs for rechequeos dashboard
 *     tags: [Rechequeos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: subSectorActividad
 *         schema:
 *           type: string
 *         description: Filter by sub-activity sector
 *       - in: query
 *         name: fechaIni
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (ISO 8601)
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (ISO 8601)
 *     responses:
 *       200:
 *         description: KPIs data for rechequeos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cobertura:
 *                   type: object
 *                   properties:
 *                     tasaReincidencia:
 *                       type: number
 *                     promChequeosPorEmpresa:
 *                       type: number
 *                     tiempoPromEntreChequeosDias:
 *                       type: number
 *                     distribucion:
 *                       type: object
 *                 magnitud:
 *                   type: object
 *                   properties:
 *                     deltaGlobalProm:
 *                       type: number
 *                     deltaPorDimension:
 *                       type: object
 *                     pctMejoraPositiva:
 *                       type: number
 *                     saltosNivel:
 *                       type: object
 *                 velocidad:
 *                   type: object
 *                   properties:
 *                     tasaMejoraMensual:
 *                       type: number
 *                     indiceConsistencia:
 *                       type: number
 *                     ratioMejoraTemprana:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/kpis', authMiddleware, rechequeosController.getKPIs);

/**
 * @swagger
 * /api/rechequeos/series/evolucion:
 *   get:
 *     summary: Get evolution series data
 *     tags: [Rechequeos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [tamano, region, sector]
 *         default: tamano
 *         description: Category to group by
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
 *         name: subSectorActividad
 *         schema:
 *           type: string
 *         description: Filter by sub-activity sector
 *       - in: query
 *         name: fechaIni
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (ISO 8601)
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (ISO 8601)
 *     responses:
 *       200:
 *         description: Evolution series data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   categoria:
 *                     type: string
 *                   periodo:
 *                     type: string
 *                   puntajePromedio:
 *                     type: number
 *                   empresasUnicas:
 *                     type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/series/evolucion', authMiddleware, rechequeosController.getEvolutionSeries);

/**
 * @swagger
 * /api/rechequeos/heatmap/dimensiones:
 *   get:
 *     summary: Get heatmap data for dimensions vs sectors
 *     tags: [Rechequeos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: subSectorActividad
 *         schema:
 *           type: string
 *         description: Filter by sub-activity sector
 *       - in: query
 *         name: fechaIni
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (ISO 8601)
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (ISO 8601)
 *     responses:
 *       200:
 *         description: Heatmap data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   sector:
 *                     type: string
 *                   tecnologia:
 *                     type: number
 *                   comunicacion:
 *                     type: number
 *                   organizacion:
 *                     type: number
 *                   datos:
 *                     type: number
 *                   estrategia:
 *                     type: number
 *                   procesos:
 *                     type: number
 *                   empresasEnSector:
 *                     type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/heatmap/dimensiones', authMiddleware, rechequeosController.getHeatmapData);

/**
 * @swagger
 * /api/rechequeos/tabla:
 *   get:
 *     summary: Get detailed table data for rechequeos
 *     tags: [Rechequeos]
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
 *         default: 50
 *         description: Number of items per page
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
 *         name: subSectorActividad
 *         schema:
 *           type: string
 *         description: Filter by sub-activity sector
 *       - in: query
 *         name: fechaIni
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (ISO 8601)
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (ISO 8601)
 *     responses:
 *       200:
 *         description: Paginated table data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       IdEmpresa:
 *                         type: integer
 *                       EmpresaNombre:
 *                         type: string
 *                       SectorActividad:
 *                         type: string
 *                       TamanoEmpresa:
 *                         type: string
 *                       Departamento:
 *                         type: string
 *                       Distrito:
 *                         type: string
 *                       TotalChequeos:
 *                         type: integer
 *                       PrimeraFechaFormatted:
 *                         type: string
 *                       UltimaFechaFormatted:
 *                         type: string
 *                       PrimerPuntaje:
 *                         type: number
 *                       UltimoPuntaje:
 *                         type: number
 *                       DeltaGlobal:
 *                         type: number
 *                       PrimerNivel:
 *                         type: string
 *                       UltimoNivel:
 *                         type: string
 *                       TasaMejoraMensual:
 *                         type: number
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
router.get('/tabla', authMiddleware, rechequeosController.getTabla);

/**
 * @swagger
 * /api/rechequeos/filters/options:
 *   get:
 *     summary: Get filter options for rechequeos
 *     tags: [Rechequeos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: subSectorActividad
 *         schema:
 *           type: string
 *         description: Filter by sub-activity sector
 *       - in: query
 *         name: fechaIni
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (ISO 8601)
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (ISO 8601)
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
 *                 subSectoresActividad:
 *                   type: array
 *                   items:
 *                     type: string
 *                 subSectoresPorSector:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/filters/options', authMiddleware, rechequeosController.getFilterOptions);

/**
 * @swagger
 * /api/rechequeos/export:
 *   get:
 *     summary: Export rechequeos data to CSV
 *     tags: [Rechequeos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv]
 *         default: csv
 *         description: Export format
 *       - in: query
 *         name: fileName
 *         schema:
 *           type: string
 *         default: rechequeos
 *         description: Name of the exported file
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
 *         name: subSectorActividad
 *         schema:
 *           type: string
 *         description: Filter by sub-activity sector
 *       - in: query
 *         name: fechaIni
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (ISO 8601)
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (ISO 8601)
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No data found for export
 *       500:
 *         description: Server error
 */
router.get('/export', authMiddleware, rechequeosController.exportData);
router.get('/export-pdf', authMiddleware, rechequeosController.exportComprehensivePDF);

module.exports = router;
