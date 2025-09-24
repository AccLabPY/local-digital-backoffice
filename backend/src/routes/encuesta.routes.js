const express = require('express');
const router = express.Router();
const encuestaController = require('../controllers/encuesta.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { validate, schemas } = require('../utils/validation');

/**
 * @swagger
 * tags:
 *   name: Surveys
 *   description: API for managing surveys and responses
 */

/**
 * @swagger
 * /api/encuestas/empresas/{idEmpresa}/history:
 *   get:
 *     summary: Get survey history for a company
 *     tags: [Surveys]
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
 *         description: Survey history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nombreTest:
 *                     type: string
 *                   IdUsuario:
 *                     type: integer
 *                   idTest:
 *                     type: integer
 *                   fechaInicio:
 *                     type: string
 *                     format: date-time
 *                   fechaTermino:
 *                     type: string
 *                     format: date-time
 *                   duracion:
 *                     type: integer
 *                   estado:
 *                     type: string
 *                   puntajeGeneral:
 *                     type: number
 *                     format: float
 *                   nivelMadurez:
 *                     type: string
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/empresas/:idEmpresa/history', authenticateToken, encuestaController.getSurveyHistory);

/**
 * @swagger
 * /api/encuestas/empresas/{idEmpresa}/surveys:
 *   get:
 *     summary: Get all surveys for a company with user information
 *     tags: [Surveys]
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
 *         description: Company surveys with user info
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idTest:
 *                     type: integer
 *                   nombreTest:
 *                     type: string
 *                   idUsuario:
 *                     type: integer
 *                   fechaInicio:
 *                     type: string
 *                     format: date-time
 *                   fechaTermino:
 *                     type: string
 *                     format: date-time
 *                   estado:
 *                     type: string
 *                   puntajeGeneral:
 *                     type: number
 *                   nivelMadurez:
 *                     type: string
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/empresas/:idEmpresa/surveys', authenticateToken, encuestaController.getCompanySurveys);

/**
 * @swagger
 * /api/encuestas/empresas/{idEmpresa}/tests/{idTest}/responses:
 *   get:
 *     summary: Get survey responses for a company and specific test
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idEmpresa
 *         schema:
 *           type: integer
 *         required: true
 *         description: Company ID
 *       - in: path
 *         name: idTest
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID
 *       - in: query
 *         name: dimension
 *         schema:
 *           type: string
 *           enum: [Todas, Tecnología, Comunicación, Organización, Datos, Estrategia, Procesos]
 *         default: Todas
 *         description: Innovation dimension filter
 *     responses:
 *       200:
 *         description: Survey responses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   IdPregunta:
 *                     type: integer
 *                   textoPregunta:
 *                     type: string
 *                   respuesta:
 *                     type: string
 *                   puntajePregunta:
 *                     type: number
 *                   dimension:
 *                     type: string
 *                   indicadorColor:
 *                     type: string
 *       404:
 *         description: Survey responses not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/empresas/:idEmpresa/tests/:idTest/responses', authenticateToken, encuestaController.getCompanyTestResponses);

/**
 * @swagger
 * /api/encuestas/empresas/{idEmpresa}/evolution:
 *   get:
 *     summary: Get evolution data for a company across all tests
 *     tags: [Surveys]
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
 *         description: Evolution data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fecha:
 *                     type: string
 *                   puntajeGeneral:
 *                     type: number
 *                   puntajeTecnologia:
 *                     type: number
 *                   puntajeComunicacion:
 *                     type: number
 *                   puntajeOrganizacion:
 *                     type: number
 *                   puntajeDatos:
 *                     type: number
 *                   puntajeEstrategia:
 *                     type: number
 *                   puntajeProcesos:
 *                     type: number
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/empresas/:idEmpresa/evolution', authenticateToken, encuestaController.getCompanyEvolution);

/**
 * @swagger
 * /api/encuestas/usuarios/{idUsuario}/tests/{idTest}/responses:
 *   get:
 *     summary: Get detailed survey responses
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *       - in: path
 *         name: idTest
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID
 *       - in: query
 *         name: dimension
 *         schema:
 *           type: string
 *           enum: [Todas, Tecnología, Comunicación, Organización, Datos, Estrategia, Procesos]
 *         default: Todas
 *         description: Innovation dimension filter
 *     responses:
 *       200:
 *         description: Survey responses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   IdPregunta:
 *                     type: integer
 *                   textoPregunta:
 *                     type: string
 *                   respuesta:
 *                     type: string
 *                   puntajePregunta:
 *                     type: integer
 *                   dimension:
 *                     type: string
 *                   indicadorColor:
 *                     type: string
 *       404:
 *         description: Survey responses not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/usuarios/:idUsuario/tests/:idTest/responses', 
  authenticateToken, 
  validate(schemas.surveyFilters, 'query'), 
  encuestaController.getSurveyResponses
);

/**
 * @swagger
 * /api/encuestas/dimensions:
 *   get:
 *     summary: Get available innovation dimensions
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Innovation dimensions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: string
 *                   label:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/dimensions', authenticateToken, encuestaController.getDimensions);

/**
 * @swagger
 * /api/encuestas/usuarios/{idUsuario}/tests/{idTest}/export:
 *   get:
 *     summary: Export survey responses to CSV or Excel
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idUsuario
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *       - in: path
 *         name: idTest
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test ID
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
 *         default: respuestas-encuesta
 *         description: Name of the exported file
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Survey responses not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/usuarios/:idUsuario/tests/:idTest/export', 
  authenticateToken, 
  validate(schemas.exportParams, 'query'), 
  encuestaController.exportResponses
);

module.exports = router;
