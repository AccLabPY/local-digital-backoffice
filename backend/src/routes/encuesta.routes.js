const express = require('express');
const router = express.Router();
const encuestaController = require('../controllers/encuesta.controller');
const { authMiddleware } = require('../middlewares/auth-rbac.middleware');
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
router.get('/empresas/:idEmpresa/history', authMiddleware, encuestaController.getSurveyHistory);

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
router.get('/empresas/:idEmpresa/surveys', authMiddleware, encuestaController.getCompanySurveys);

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
router.get('/empresas/:idEmpresa/tests/:idTest/responses', authMiddleware, encuestaController.getCompanyTestResponses);

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
router.get('/empresas/:idEmpresa/evolution', authMiddleware, encuestaController.getCompanyEvolution);

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
  authMiddleware, 
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
router.get('/dimensions', authMiddleware, encuestaController.getDimensions);

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
  authMiddleware, 
  validate(schemas.exportParams, 'query'), 
  encuestaController.exportResponses
);

/**
 * @swagger
 * /api/encuestas/empresas/{empresaId}/testUsuarios:
 *   get:
 *     summary: Get all TestUsuario records for a specific business
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: empresaId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Company ID
 *     responses:
 *       200:
 *         description: TestUsuario records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idTestUsuario:
 *                     type: integer
 *                   idUsuario:
 *                     type: integer
 *                   test:
 *                     type: integer
 *                   nombreTest:
 *                     type: string
 *                   fechaInicio:
 *                     type: string
 *                     format: date-time
 *                   fechaTermino:
 *                     type: string
 *                     format: date-time
 *                   finalizado:
 *                     type: boolean
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/empresas/:empresaId/testUsuarios', authMiddleware, encuestaController.getTestUsuarios);

/**
 * @swagger
 * /api/encuestas/empresas/{empresaId}/testUsuarios/{testUsuarioId}/responses:
 *   get:
 *     summary: Get responses for a specific TestUsuario
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: empresaId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Company ID
 *       - in: path
 *         name: testUsuarioId
 *         schema:
 *           type: integer
 *         required: true
 *         description: TestUsuario ID
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
 *                   orden:
 *                     type: integer
 *                   TipoDePregunta:
 *                     type: integer
 *       404:
 *         description: TestUsuario not found or doesn't belong to company
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/empresas/:empresaId/testUsuarios/:testUsuarioId/responses', authMiddleware, encuestaController.getTestUsuarioResponses);

/**
 * @swagger
 * /api/encuestas/empresas/{empresaId}/latestTest/{testNumber}:
 *   get:
 *     summary: Get the most recent TestUsuario for a specific test number
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: empresaId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Company ID
 *       - in: path
 *         name: testNumber
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test number
 *     responses:
 *       200:
 *         description: Most recent TestUsuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idTestUsuario:
 *                   type: integer
 *                 idUsuario:
 *                   type: integer
 *                 test:
 *                   type: integer
 *                 nombreTest:
 *                   type: string
 *                 fechaInicio:
 *                   type: string
 *                   format: date-time
 *                 fechaTermino:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: No completed test found for this company
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/empresas/:empresaId/latestTest/:testNumber', authMiddleware, encuestaController.getLatestTest);

/**
 * @swagger
 * /api/encuestas/empresas/{empresaId}/testUsuarios/{testUsuarioId}/info:
 *   get:
 *     summary: Get basic info for a specific TestUsuario
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: empresaId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Company ID
 *       - in: path
 *         name: testUsuarioId
 *         schema:
 *           type: integer
 *         required: true
 *         description: TestUsuario ID
 *     responses:
 *       200:
 *         description: TestUsuario basic info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idTestUsuario:
 *                   type: integer
 *                 nombreTest:
 *                   type: string
 *                 fechaInicio:
 *                   type: string
 *                   format: date-time
 *                 fechaTermino:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: TestUsuario not found or doesn't belong to company
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/empresas/:empresaId/testUsuarios/:testUsuarioId/info', authMiddleware, encuestaController.getTestUsuarioInfo);

/**
 * @swagger
 * /api/encuestas/preguntas/{preguntaId}/respuestas-posibles:
 *   get:
 *     summary: Get possible answers for a specific question
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: preguntaId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Possible answers for the question
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idRespuestaPosible:
 *                     type: integer
 *                   textoRespuesta:
 *                     type: string
 *                   valorRespuesta:
 *                     type: string
 *                   valorVisible:
 *                     type: integer
 *                   idPreguntaRespuesta:
 *                     type: integer
 *       404:
 *         description: Question not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/preguntas/:preguntaId/respuestas-posibles', authMiddleware, encuestaController.getPossibleAnswers);

/**
 * @swagger
 * /api/encuestas/preguntas/{preguntaId}/subrespuestas-posibles:
 *   get:
 *     summary: Get possible answers for sub-questions of a specific question
 *     tags: [Surveys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: preguntaId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Possible answers for sub-questions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idSubPregunta:
 *                     type: integer
 *                   descripcionSubPregunta:
 *                     type: string
 *                   tituloSubPregunta:
 *                     type: string
 *                   idRespuestaPosible:
 *                     type: integer
 *                   textoRespuesta:
 *                     type: string
 *                   valorRespuesta:
 *                     type: string
 *                   valorVisible:
 *                     type: integer
 *                   idSubPreguntaRespuesta:
 *                     type: integer
 *       404:
 *         description: Question not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/preguntas/:preguntaId/subrespuestas-posibles', authMiddleware, encuestaController.getPossibleSubAnswers);

module.exports = router;
