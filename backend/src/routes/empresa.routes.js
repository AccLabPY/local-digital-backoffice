const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresa.controller');
const { authMiddleware } = require('../middlewares/auth-rbac.middleware');
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
router.get('/', authMiddleware, validate(schemas.paginationWithFilters, 'query'), empresaController.getEmpresas);

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
router.get('/kpis', authMiddleware, validate(schemas.kpiFilters, 'query'), empresaController.getKPIs);

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
 *                 tamanosEmpresa:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Company size options (Micro, Pequeña, Mediana, Grande)
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
router.get('/filters/options', authMiddleware, empresaController.getFilterOptions);

/**
 * @swagger
 * /api/empresas/export:
 *   get:
 *     summary: Export companies data to CSV or Excel
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get('/export', authMiddleware, validate(schemas.exportParams, 'query'), empresaController.exportEmpresas);

/**
 * @swagger
 * /api/empresas/export-test:
 *   get:
 *     summary: Test endpoint to debug export
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get('/export-test', authMiddleware, (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Test endpoint works',
    query: req.query
  });
});

/**
 * @swagger
 * /api/empresas/export-comprehensive:
 *   get:
 *     summary: Export empresas comprehensive report with summary and details (Excel or PDF)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 */
router.get('/export-comprehensive', authMiddleware, empresaController.exportEmpresasComprehensive);

/**
 * @swagger
 * /api/empresas/{id}/export-ficha:
 *   get:
 *     summary: Export complete company ficha as PDF
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
 *       - in: query
 *         name: idTestUsuario
 *         schema:
 *           type: integer
 *         description: Test user ID (optional - for specific test)
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id/export-ficha', authMiddleware, validate(schemas.idParam, 'params'), empresaController.exportEmpresaFicha);

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
router.get('/:id', authMiddleware, validate(schemas.idParam, 'params'), empresaController.getEmpresaById);

/**
 * @swagger
 * /api/empresas/{id}:
 *   patch:
 *     summary: Update company information
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               empresa:
 *                 type: string
 *                 description: Company name
 *               ruc:
 *                 type: string
 *                 description: RUC number
 *               idDepartamento:
 *                 type: integer
 *                 description: Department ID
 *               idLocalidad:
 *                 type: integer
 *                 description: Location ID
 *               idSectorActividad:
 *                 type: integer
 *                 description: Activity sector ID
 *               idSubSectorActividad:
 *                 type: integer
 *                 description: Activity subsector ID
 *               idVentas:
 *                 type: integer
 *                 description: Annual sales ID
 *               totalEmpleados:
 *                 type: integer
 *                 description: Total number of employees
 *               anioCreacion:
 *                 type: integer
 *                 description: Company foundation year
 *               sexoGerenteGeneral:
 *                 type: string
 *                 description: Gender of general manager
 *               sexoPropietarioPrincipal:
 *                 type: string
 *                 description: Gender of principal owner
 *               idUsuario:
 *                 type: integer
 *                 description: Assigned user ID
 *     responses:
 *       200:
 *         description: Company updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 empresa:
 *                   $ref: '#/components/schemas/CompanyDetails'
 *       400:
 *         description: Bad request - missing parameters or invalid data
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/:id', authMiddleware, validate(schemas.idParam, 'params'), empresaController.updateEmpresa);

/**
 * @swagger
 * /api/empresas/{idTestUsuario}/delete:
 *   delete:
 *     summary: Delete a survey record and associated data
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idTestUsuario
 *         schema:
 *           type: integer
 *         required: true
 *         description: Test user ID to delete
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [complete, partial]
 *                 description: Type of deletion - complete (user and all data) or partial (specific test only)
 *               idUsuario:
 *                 type: integer
 *                 description: User ID (required for complete deletion)
 *             required:
 *               - type
 *     responses:
 *       200:
 *         description: Deletion successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *       400:
 *         description: Bad request - missing parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:idTestUsuario/delete', authMiddleware, empresaController.deleteRecord);

/**
 * @swagger
 * /api/empresas/{id}/usuarios:
 *   get:
 *     summary: Get users assigned to a company
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
 *         description: List of users assigned to the company
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuarios:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       idUsuario:
 *                         type: integer
 *                       nombreCompleto:
 *                         type: string
 *                       email:
 *                         type: string
 *                       rol:
 *                         type: string
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id/usuarios', authMiddleware, validate(schemas.idParam, 'params'), empresaController.getCompanyUsers);

/**
 * @swagger
 * /api/empresas/{id}/usuarios:
 *   post:
 *     summary: Assign a user to a company
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idUsuario:
 *                 type: integer
 *                 description: User ID to assign
 *             required:
 *               - idUsuario
 *     responses:
 *       200:
 *         description: User assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 usuario:
 *                   type: object
 *       400:
 *         description: Bad request
 *       404:
 *         description: Company or user not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/usuarios', authMiddleware, validate(schemas.idParam, 'params'), empresaController.assignUserToCompany);

/**
 * @swagger
 * /api/empresas/{id}/usuarios/{userId}:
 *   delete:
 *     summary: Remove user assignment from a company
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
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID to remove
 *     responses:
 *       200:
 *         description: User assignment removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Company, user, or assignment not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:id/usuarios/:userId', authMiddleware, empresaController.removeUserFromCompany);

/**
 * @swagger
 * /api/empresas/reassignment/candidates:
 *   get:
 *     summary: Get candidates for reassignment (preview)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: idEmpresa
 *         schema:
 *           type: integer
 *         description: Company ID (optional - if provided, only show for this company)
 *     responses:
 *       200:
 *         description: List of candidates for reassignment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 candidates:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/reassignment/candidates', authMiddleware, empresaController.getReassignmentCandidates);

/**
 * @swagger
 * /api/empresas/{id}/reassign:
 *   post:
 *     summary: Reassign a chequeo to a different user
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetIdUsuario:
 *                 type: integer
 *                 description: New user ID to reassign to (optional - if not provided, uses the older user)
 *               dryRun:
 *                 type: boolean
 *                 default: true
 *                 description: If true, only show preview without making changes
 *     responses:
 *       200:
 *         description: Reassignment result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *       400:
 *         description: Bad request
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/reassign', authMiddleware, validate(schemas.idParam, 'params'), empresaController.reassignChequeo);

/**
 * @swagger
 * /api/empresas/{id}/available-users-reassignment:
 *   get:
 *     summary: Get available users for reassignment for a specific company
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
 *         description: List of available users for reassignment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id/available-users-reassignment', authMiddleware, validate(schemas.idParam, 'params'), empresaController.getAvailableUsersForReassignment);

/**
 * @swagger
 * /api/empresas/{id}/all-users:
 *   get:
 *     summary: Get all users for a company (for manual reassignment)
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
 *         description: List of all users for the company
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id/all-users', authMiddleware, validate(schemas.idParam, 'params'), empresaController.getAllUsersForCompany);

/**
 * @swagger
 * /api/empresas/search/users:
 *   get:
 *     summary: Search users dynamically by name or email (for manual reassignment)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: true
 *         description: Search term (minimum 3 characters for name/email, any number for IdUsuario)
 *       - in: query
 *         name: searchType
 *         schema:
 *           type: string
 *           enum: [name, email, idUsuario]
 *           default: name
 *         description: Type of search (name, email, or idUsuario)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: List of matching users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/search/users', authMiddleware, empresaController.searchUsers);

/**
 * @swagger
 * /api/empresas/{id}/manual-reassign:
 *   post:
 *     summary: Manual reassignment of a chequeo
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromIdUsuario:
 *                 type: integer
 *                 description: Current user ID
 *               toIdUsuario:
 *                 type: integer
 *                 description: Target user ID
 *               testNumber:
 *                 type: integer
 *                 description: Test number to reassign
 *               dryRun:
 *                 type: boolean
 *                 default: true
 *                 description: If true, only show preview
 *             required:
 *               - fromIdUsuario
 *               - toIdUsuario
 *               - testNumber
 *     responses:
 *       200:
 *         description: Reassignment result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 result:
 *                   type: object
 *       400:
 *         description: Bad request
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:id/manual-reassign', authMiddleware, validate(schemas.idParam, 'params'), empresaController.manualReassignChequeo);

module.exports = router;
