const EmpresaModel = require('../models/empresa.model');
const { catchAsync } = require('../middlewares/error.middleware');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const Exporter = require('../utils/exporter');
const logger = require('../utils/logger');
const redisService = require('../services/redis.service');
const { poolPromise, sql } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Helper para convertir strings a int sin problemas con 0
const toInt = (v, def) => (v !== undefined ? parseInt(v, 10) : def);

/**
 * Controller for company-related operations
 */
const empresaController = {
  /**
   * Update company information
   */
  updateEmpresa: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.id);
    const updateData = req.body;
    
    if (!idEmpresa) {
      throw new BadRequestError('ID de empresa es requerido');
    }
    
    // Validate that at least one field to update is provided
    if (!Object.keys(updateData).length) {
      throw new BadRequestError('No se proporcionaron datos para actualizar');
    }
    
    // Check if company exists
    const existingCompany = await EmpresaModel.getEmpresaById(idEmpresa);
    if (!existingCompany) {
      throw new NotFoundError(`Empresa con ID ${idEmpresa} no encontrada`);
    }
    
    // Log the update operation
    logger.info(`Actualización de empresa iniciada - ID: ${idEmpresa}, Usuario: ${req.user?.email || 'desconocido'}, Datos: ${JSON.stringify(updateData)}`);
    
    const result = await EmpresaModel.updateEmpresa(idEmpresa, updateData);
    
    // Invalidate empresa cache
    await redisService.invalidateEmpresaCache();
    
    res.status(200).json({
      success: true,
      message: 'Empresa actualizada exitosamente',
      empresa: result.empresa
    });
  }),
  /**
   * Get paginated list of companies with filters and search
   */
  getEmpresas: catchAsync(async (req, res) => {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const searchTerm = req.query.searchTerm || '';
    const finalizado = toInt(req.query.finalizado, 1); // ✅ YA NO usa "|| 1"
    
    // Función para parsear arrays de la query
    const parseQueryArray = (value) => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    };
    
    // Extract filters from query params
    const filters = {
      departamento: parseQueryArray(req.query.departamento),
      distrito: parseQueryArray(req.query.distrito),
      nivelInnovacion: parseQueryArray(req.query.nivelInnovacion),
      sectorActividad: parseQueryArray(req.query.sectorActividad),
      subSectorActividad: parseQueryArray(req.query.subSectorActividad),
      tamanoEmpresa: parseQueryArray(req.query.tamanoEmpresa),
      estadoEncuesta: req.query.estadoEncuesta === 'true'
        ? true : req.query.estadoEncuesta === 'false' ? false : undefined,
      fechaIni: req.query.fechaIni || null,
      fechaFin: req.query.fechaFin || null
    };
    
    // Generate cache key
    const cacheKey = `empresas:${page}:${limit}:${searchTerm}:${finalizado}:${JSON.stringify(filters)}`;
    
    // Check cache first (5 min cache)
    const cachedResult = await redisService.get(cacheKey);
    if (cachedResult) {
      logger.info('[EMPRESAS] Returning cached empresas list');
      return res.status(200).json(cachedResult);
    }
    
    const result = await EmpresaModel.getEmpresas({ 
      page, 
      limit, 
      searchTerm, 
      filters,
      finalizado
    });
    
    // Cache the result (5 min = 300 seconds)
    await redisService.set(cacheKey, result, 300);
    
    res.status(200).json(result);
  }),
  
  /**
   * Get company details by ID
   */
  getEmpresaById: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.id);
    const idTestUsuario = req.query.idTestUsuario ? parseInt(req.query.idTestUsuario) : null;
    
    const empresa = await EmpresaModel.getEmpresaById(idEmpresa, idTestUsuario);
    
    if (!empresa) {
      throw new NotFoundError(`Company with ID ${idEmpresa} not found`);
    }
    
    res.status(200).json(empresa);
  }),
  
  /**
   * Get KPIs for companies list
   */
  getKPIs: catchAsync(async (req, res) => {
    const finalizado = toInt(req.query.finalizado, 1);

    // Función para parsear arrays de la query
    const parseQueryArray = (value) => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    };
    
    const filters = {
      departamento: parseQueryArray(req.query.departamento),
      distrito: parseQueryArray(req.query.distrito),
      nivelInnovacion: parseQueryArray(req.query.nivelInnovacion),
      sectorActividad: parseQueryArray(req.query.sectorActividad),
      subSectorActividad: parseQueryArray(req.query.subSectorActividad),
      tamanoEmpresa: parseQueryArray(req.query.tamanoEmpresa),
      fechaIni: req.query.fechaIni || null,
      fechaFin: req.query.fechaFin || null
    };

    // Generate cache key
    const cacheKey = `kpis:${finalizado}:${JSON.stringify(filters)}`;
    
    // Check cache first - use short cache (1 min) for KPIs as they change frequently
    const cachedResult = await redisService.get(cacheKey);
    if (cachedResult) {
      logger.info('[EMPRESAS] Returning cached KPIs');
      return res.status(200).json(cachedResult);
    }

    const kpis = await EmpresaModel.getKPIs(finalizado, filters); // ✅ ahora pasa filtros
    
    // Cache the result with short TTL (1 min = 60 seconds)
    await redisService.set(cacheKey, kpis, 60);
    
    res.status(200).json(kpis);
  }),
  
  /**
   * Get filter options for companies list
   */
  getFilterOptions: catchAsync(async (req, res) => {
    // Función para parsear arrays de la query
    const parseQueryArray = (value) => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    };
    
    // Extraer filtros activos de los query params
    const activeFilters = {
      departamento: parseQueryArray(req.query.departamento),
      distrito: parseQueryArray(req.query.distrito),
      nivelInnovacion: parseQueryArray(req.query.nivelInnovacion),
      sectorActividad: parseQueryArray(req.query.sectorActividad),
      subSectorActividad: parseQueryArray(req.query.subSectorActividad),
      tamanoEmpresa: parseQueryArray(req.query.tamanoEmpresa)
    };

    // Generate cache key
    const cacheKey = `filters:${JSON.stringify(activeFilters)}`;
    
    // Check cache first - use long cache (15 min) for filter options as they rarely change
    const cachedResult = await redisService.get(cacheKey);
    if (cachedResult) {
      logger.info('[EMPRESAS] Returning cached filter options');
      return res.status(200).json(cachedResult);
    }

    const filterOptions = await EmpresaModel.getFilterOptions(activeFilters);
    
    // Cache the result with long TTL (15 min = 900 seconds)
    await redisService.set(cacheKey, filterOptions, 900);
    
    res.status(200).json(filterOptions);
  }),
  
  /**
   * Export companies data to CSV or Excel
   */
  exportEmpresas: catchAsync(async (req, res) => {
    const format = req.query.format || 'csv';
    const fileName = req.query.fileName || 'empresas';
    
    // Get all companies without pagination
    const result = await EmpresaModel.getEmpresas({ 
      page: 1, 
      limit: 1000, // Large enough to get all companies
      searchTerm: req.query.searchTerm || '',
      filters: {
        departamento: req.query.departamento,
        distrito: req.query.distrito,
        nivelInnovacion: req.query.nivelInnovacion,
        sectorActividad: req.query.sectorActividad,
        subSectorActividad: req.query.subSectorActividad,
        estadoEncuesta: req.query.estadoEncuesta === 'true' 
          ? true 
          : req.query.estadoEncuesta === 'false' 
            ? false 
            : undefined
      }
    });
    
    let filePath;
    
    if (format === 'excel') {
      filePath = await Exporter.exportToExcel(result.data, fileName);
    } else {
      filePath = await Exporter.exportToCSV(result.data, fileName);
    }
    
    res.download(filePath);
  }),
  
  /**
   * Export empresas data with comprehensive summary (Excel with 2 sheets or PDF)
   */
  exportEmpresasComprehensive: catchAsync(async (req, res) => {
    logger.info(`[EXPORT] ========== Starting export ==========`);
    logger.info(`[EXPORT] Query params: ${JSON.stringify(req.query)}`);
    
    const format = req.query.format || 'xlsx';
    const fileName = req.query.fileName || 'reporte-empresas';
    const finalizado = toInt(req.query.finalizado, 1);
    
    logger.info(`[EXPORT] Parsed - format: ${format}, fileName: ${fileName}, finalizado: ${finalizado}`);
    
    // Parse query arrays
    const parseQueryArray = (value) => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    };
    
    const filters = {
      departamento: parseQueryArray(req.query.departamento),
      distrito: parseQueryArray(req.query.distrito),
      nivelInnovacion: parseQueryArray(req.query.nivelInnovacion),
      sectorActividad: parseQueryArray(req.query.sectorActividad),
      subSectorActividad: parseQueryArray(req.query.subSectorActividad),
      tamanoEmpresa: parseQueryArray(req.query.tamanoEmpresa),
      fechaIni: req.query.fechaIni || null,
      fechaFin: req.query.fechaFin || null
    };
    
    logger.info(`[EXPORT] Filters constructed: ${JSON.stringify(filters)}`);
    
    // Get all companies with filters (no pagination for export)
    const result = await EmpresaModel.getEmpresas({ 
      page: 1, 
      limit: 10000, // Large enough to get all companies
      searchTerm: req.query.searchTerm || '',
      filters,
      finalizado
    });
    
    logger.info(`[EXPORT] Retrieved ${result.data?.length || 0} companies for export`);
    
    if (!result.data || result.data.length === 0) {
      logger.warn('[EXPORT] No data found for export');
      return res.status(404).json({
        status: 'error',
        message: 'No se encontraron datos para exportar con los filtros aplicados'
      });
    }
    
    // Calculate summary data with special handling for "NO TENGO"
    // Para "NO TENGO", contar por IdUsuario; para otras empresas, contar por IdEmpresa
    const uniqueEmpresas = new Set();
    result.data.forEach(item => {
      if (item.empresa === 'NO TENGO') {
        uniqueEmpresas.add(`U_${item.IdUsuario}`);
      } else {
        uniqueEmpresas.add(`E_${item.IdEmpresa}`);
      }
    });
    
    const summaryData = {
      totalChequeos: result.data.length,
      totalEmpresas: uniqueEmpresas.size,
      empresasMicro: result.data.filter(item => item.ventasAnuales && item.ventasAnuales.includes('Micro')).length,
      empresasPequena: result.data.filter(item => item.ventasAnuales && item.ventasAnuales.includes('Pequeña')).length,
      empresasMediana: result.data.filter(item => item.ventasAnuales && item.ventasAnuales.includes('Mediana')).length,
      empresasGrande: result.data.filter(item => item.ventasAnuales && item.ventasAnuales.includes('Grande')).length,
      empresasPorSector: {},
      empresasPorSubSector: {},
      empresasPorNivel: {},
      empresasPorDepartamento: {},
      empresasPorDistrito: {},
      generoGerentes: {}
    };
    
    // Count by category (con manejo especial para NO TENGO)
    const countedSector = new Set();
    const countedSubSector = new Set();
    const countedNivel = new Set();
    const countedDepartamento = new Set();
    const countedDistrito = new Set();
    const countedGenero = new Set();
    
    result.data.forEach(item => {
      const uniqueKey = item.empresa === 'NO TENGO' ? `U_${item.IdUsuario}` : `E_${item.IdEmpresa}`;
      
      // Para sector
      if (item.sectorActividadDescripcion) {
        const key = `${item.sectorActividadDescripcion}_${uniqueKey}`;
        if (!countedSector.has(key)) {
          summaryData.empresasPorSector[item.sectorActividadDescripcion] = 
            (summaryData.empresasPorSector[item.sectorActividadDescripcion] || 0) + 1;
          countedSector.add(key);
        }
      }
      
      // Para sub-sector
      if (item.subSectorActividadDescripcion) {
        const key = `${item.subSectorActividadDescripcion}_${uniqueKey}`;
        if (!countedSubSector.has(key)) {
          summaryData.empresasPorSubSector[item.subSectorActividadDescripcion] = 
            (summaryData.empresasPorSubSector[item.subSectorActividadDescripcion] || 0) + 1;
          countedSubSector.add(key);
        }
      }
      
      // Para nivel de madurez
      if (item.nivelDeMadurezGeneral) {
        const key = `${item.nivelDeMadurezGeneral}_${uniqueKey}`;
        if (!countedNivel.has(key)) {
          summaryData.empresasPorNivel[item.nivelDeMadurezGeneral] = 
            (summaryData.empresasPorNivel[item.nivelDeMadurezGeneral] || 0) + 1;
          countedNivel.add(key);
        }
      }
      
      // Para departamento
      if (item.departamento) {
        const key = `${item.departamento}_${uniqueKey}`;
        if (!countedDepartamento.has(key)) {
          summaryData.empresasPorDepartamento[item.departamento] = 
            (summaryData.empresasPorDepartamento[item.departamento] || 0) + 1;
          countedDepartamento.add(key);
        }
      }
      
      // Para distrito
      if (item.distrito) {
        const key = `${item.distrito}_${uniqueKey}`;
        if (!countedDistrito.has(key)) {
          summaryData.empresasPorDistrito[item.distrito] = 
            (summaryData.empresasPorDistrito[item.distrito] || 0) + 1;
          countedDistrito.add(key);
        }
      }
      
      // Para género
      if (item.genero) {
        const key = `${item.genero}_${uniqueKey}`;
        if (!countedGenero.has(key)) {
          summaryData.generoGerentes[item.genero] = 
            (summaryData.generoGerentes[item.genero] || 0) + 1;
          countedGenero.add(key);
        }
      }
    });
    
    // Agregar datos adicionales al summary
    summaryData.fechaIni = filters.fechaIni;
    summaryData.fechaFin = filters.fechaFin;
    summaryData.totalEmpleados = result.data.reduce((sum, item) => sum + (item.totalEmpleados || 0), 0);
    summaryData.numeroDistritos = Object.keys(summaryData.empresasPorDistrito || {}).length;
    
    // Calcular empresas incipientes (nivel "Inicial") con lógica de NO TENGO
    const empresasInicialesSet = new Set();
    result.data.forEach(item => {
      if (item.nivelDeMadurezGeneral === 'Inicial') {
        const uniqueKey = item.empresa === 'NO TENGO' ? `U_${item.IdUsuario}` : `E_${item.IdEmpresa}`;
        empresasInicialesSet.add(uniqueKey);
      }
    });
    summaryData.empresasIncipientes = empresasInicialesSet.size;
    
    let filePath;
    
    try {
      if (format === 'pdf') {
        logger.info('[EXPORT] Generating PDF...');
        filePath = await Exporter.exportEmpresasToPDF(summaryData, fileName);
        logger.info(`[EXPORT] PDF generated: ${filePath}`);
      } else {
        logger.info('[EXPORT] Generating Excel...');
        filePath = await Exporter.exportEmpresasToExcel(summaryData, result.data, fileName);
        logger.info(`[EXPORT] Excel generated: ${filePath}`);
      }
      
      // Verificar que el archivo existe
      if (!fs.existsSync(filePath)) {
        logger.error(`[EXPORT] File not found: ${filePath}`);
        return res.status(500).json({
          status: 'error',
          message: `El archivo ${format.toUpperCase()} no se pudo generar correctamente`
        });
      }
      
      // Configurar headers para descarga
      const fileExtension = format === 'pdf' ? 'pdf' : 'xlsx';
      const contentType = format === 'pdf' 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.${fileExtension}"`);
      
      // Enviar el archivo
      logger.info(`[EXPORT] Sending file: ${filePath}`);
      res.sendFile(path.resolve(filePath), (err) => {
        if (err) {
          logger.error(`[EXPORT] Error sending file: ${err.message}`);
          if (!res.headersSent) {
            res.status(500).json({
              status: 'error',
              message: 'Error al enviar el archivo'
            });
          }
        } else {
          logger.info(`[EXPORT] File sent successfully: ${filePath}`);
          // Opcional: eliminar el archivo después de descargarlo
          // fs.unlinkSync(filePath);
        }
      });
    } catch (exportError) {
      logger.error(`[EXPORT] Error during file generation: ${exportError.message}`);
      logger.error(`[EXPORT] Stack: ${exportError.stack}`);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: exportError.message || 'Error al generar el archivo de exportación'
        });
      }
    }
  }),

  /**
   * Delete a survey record and associated data
   */
  deleteRecord: catchAsync(async (req, res) => {
    const idTestUsuario = parseInt(req.params.idTestUsuario);
    const { type, idUsuario, idEmpresa } = req.body;
    
    if (!idTestUsuario) {
      throw new BadRequestError('ID de test de usuario es requerido');
    }
    
    if (!type || (type !== 'complete' && type !== 'user' && type !== 'test')) {
      throw new BadRequestError('Tipo de eliminación inválido. Debe ser "test", "user" o "complete"');
    }
    
    if ((type === 'user' || type === 'complete') && !idUsuario) {
      throw new BadRequestError('ID de usuario es requerido para eliminación de usuario o completa');
    }

    if (type === 'complete' && !idEmpresa) {
      throw new BadRequestError('ID de empresa es requerido para eliminación completa');
    }

    // Registrar la acción por seguridad
    logger.info(`Eliminación de registro iniciada - Type: ${type}, IdTestUsuario: ${idTestUsuario}, IdUsuario: ${idUsuario || 'N/A'}, IdEmpresa: ${idEmpresa || 'N/A'}, Usuario: ${req.user?.email || 'desconocido'}`);
    
    let result;
    let message;
    
    if (type === 'test') {
      // Eliminar solo el test específico
      result = await EmpresaModel.deleteTestOnly(idTestUsuario);
      message = 'Chequeo eliminado exitosamente';
    } else if (type === 'user') {
      // Eliminar usuario y todos sus chequeos (pero no la empresa)
      result = await EmpresaModel.deleteUserAndTests(idUsuario);
      message = 'Chequeo y usuario eliminados exitosamente';
    } else {
      // Eliminar todo: empresa, usuario y todos los datos
      result = await EmpresaModel.deleteEverything(idUsuario, idEmpresa);
      message = 'Chequeo, empresa y usuario eliminados exitosamente';
    }

    // Registrar resultado
    logger.info(`Eliminación completada - Type: ${type}, IdTestUsuario: ${idTestUsuario}, Resultado: ${JSON.stringify(result)}`);
    
    // Invalidate empresa cache
    await redisService.invalidateEmpresaCache();
    
    res.status(200).json({
      success: true,
      message,
      result
    });
  }),

  /**
   * Get users assigned to a company
   */
  getCompanyUsers: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.id);
    const idUsuario = req.query.idUsuario ? parseInt(req.query.idUsuario) : null;
    
    if (!idEmpresa) {
      throw new BadRequestError('ID de empresa es requerido');
    }
    
    // Check if company exists
    const existingCompany = await EmpresaModel.getEmpresaById(idEmpresa);
    if (!existingCompany) {
      throw new NotFoundError(`Empresa con ID ${idEmpresa} no encontrada`);
    }
    
    // CASO ESPECIAL: Para empresas "NO TENGO", filtrar por IdUsuario si se proporciona
    const esNoTengo = existingCompany.empresa && existingCompany.empresa.toLowerCase().includes('no tengo');
    
    if (esNoTengo && idUsuario) {
      logger.info(`[GET COMPANY USERS] Empresa "NO TENGO" - Filtrando por IdUsuario: ${idUsuario}`);
    }
    
    const usuarios = await EmpresaModel.getCompanyUsers(idEmpresa, esNoTengo ? idUsuario : null);
    
    res.status(200).json({
      usuarios
    });
  }),

  /**
   * Assign a user to a company
   */
  assignUserToCompany: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.id);
    const { idUsuario } = req.body;
    
    if (!idEmpresa) {
      throw new BadRequestError('ID de empresa es requerido');
    }
    
    if (!idUsuario) {
      throw new BadRequestError('ID de usuario es requerido');
    }
    
    // Check if company exists
    const existingCompany = await EmpresaModel.getEmpresaById(idEmpresa);
    if (!existingCompany) {
      throw new NotFoundError(`Empresa con ID ${idEmpresa} no encontrada`);
    }
    
    // Log the assignment operation
    logger.info(`Asignación de usuario iniciada - ID Empresa: ${idEmpresa}, ID Usuario: ${idUsuario}, Usuario: ${req.user?.email || 'desconocido'}`);
    
    const result = await EmpresaModel.assignUserToCompany(idEmpresa, idUsuario);
    
    res.status(200).json({
      success: true,
      message: 'Usuario asignado exitosamente',
      usuario: result.usuario
    });
  }),

  /**
   * Remove user assignment from a company
   */
  removeUserFromCompany: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.id);
    const idUsuario = parseInt(req.params.userId);
    
    if (!idEmpresa) {
      throw new BadRequestError('ID de empresa es requerido');
    }
    
    if (!idUsuario) {
      throw new BadRequestError('ID de usuario es requerido');
    }
    
    // Check if company exists
    const existingCompany = await EmpresaModel.getEmpresaById(idEmpresa);
    if (!existingCompany) {
      throw new NotFoundError(`Empresa con ID ${idEmpresa} no encontrada`);
    }
    
    // Log the removal operation
    logger.info(`Eliminación de asignación de usuario iniciada - ID Empresa: ${idEmpresa}, ID Usuario: ${idUsuario}, Usuario: ${req.user?.email || 'desconocido'}`);
    
    await EmpresaModel.removeUserFromCompany(idEmpresa, idUsuario);
    
    res.status(200).json({
      success: true,
      message: 'Usuario desasignado exitosamente'
    });
  }),

  /**
   * Get candidates for reassignment (preview)
   */
  getReassignmentCandidates: catchAsync(async (req, res) => {
    const idEmpresa = req.query.idEmpresa ? parseInt(req.query.idEmpresa) : null;
    
    logger.info(`Obtener candidatos de reasignación - ID Empresa: ${idEmpresa || 'todas'}, Usuario: ${req.user?.email || 'desconocido'}`);
    
    const candidates = await EmpresaModel.getReassignmentCandidates(idEmpresa);
    
    res.status(200).json({
      success: true,
      count: candidates.length,
      candidates
    });
  }),

  /**
   * Reassign a chequeo to a different user
   */
  reassignChequeo: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.id);
    const { targetIdUsuario, dryRun = true } = req.body;
    
    if (!idEmpresa) {
      throw new BadRequestError('ID de empresa es requerido');
    }
    
    // Check if company exists
    const existingCompany = await EmpresaModel.getEmpresaById(idEmpresa);
    if (!existingCompany) {
      throw new NotFoundError(`Empresa con ID ${idEmpresa} no encontrada`);
    }
    
    // Log the reassignment operation
    logger.info(`Reasignación de chequeo iniciada - ID Empresa: ${idEmpresa}, Target IdUsuario: ${targetIdUsuario || 'auto'}, Dry Run: ${dryRun}, Usuario: ${req.user?.email || 'desconocido'}`);
    
    const result = await EmpresaModel.reassignChequeo(idEmpresa, targetIdUsuario, dryRun);
    
    res.status(200).json(result);
  }),

  /**
   * Get available users for reassignment for a specific company
   */
  getAvailableUsersForReassignment: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.id);
    
    if (!idEmpresa) {
      throw new BadRequestError('ID de empresa es requerido');
    }
    
    // Check if company exists
    const existingCompany = await EmpresaModel.getEmpresaById(idEmpresa);
    if (!existingCompany) {
      throw new NotFoundError(`Empresa con ID ${idEmpresa} no encontrada`);
    }
    
    const users = await EmpresaModel.getAvailableUsersForReassignment(idEmpresa);
    
    res.status(200).json({
      success: true,
      users
    });
  }),

  /**
   * Get all users for a company (for manual reassignment)
   */
  getAllUsersForCompany: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.id);
    
    if (!idEmpresa) {
      throw new BadRequestError('ID de empresa es requerido');
    }
    
    // Check if company exists
    const existingCompany = await EmpresaModel.getEmpresaById(idEmpresa);
    if (!existingCompany) {
      throw new NotFoundError(`Empresa con ID ${idEmpresa} no encontrada`);
    }
    
    const users = await EmpresaModel.getAllUsersForCompany(idEmpresa);
    
    res.status(200).json({
      success: true,
      users
    });
  }),

  /**
   * Search users dynamically by name, email, or IdUsuario (for manual reassignment)
   */
  searchUsers: catchAsync(async (req, res) => {
    const searchTerm = req.query.search || req.query.searchTerm || '';
    const searchType = req.query.searchType || 'name'; // 'name', 'email', or 'idUsuario'
    const limit = toInt(req.query.limit, 20);
    
    // Validación según el tipo de búsqueda
    if (searchType === 'idUsuario') {
      // Para IdUsuario, debe ser un número
      const idUsuario = parseInt(searchTerm);
      if (isNaN(idUsuario)) {
        return res.status(200).json({
          success: true,
          users: [],
          message: 'El IdUsuario debe ser un número válido'
        });
      }
    } else {
      // Para nombre o email, mínimo 3 caracteres
      if (!searchTerm || searchTerm.length < 3) {
        return res.status(200).json({
          success: true,
          users: [],
          message: 'El término de búsqueda debe tener al menos 3 caracteres'
        });
      }
    }
    
    const users = await EmpresaModel.searchUsers(searchTerm, searchType, limit);
    
    res.status(200).json({
      success: true,
      users
    });
  }),

  /**
   * Manual reassignment of a chequeo
   */
  manualReassignChequeo: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.id);
    const { fromIdUsuario, toIdUsuario, testNumber, dryRun = true } = req.body;
    
    if (!idEmpresa) {
      throw new BadRequestError('ID de empresa es requerido');
    }
    
    if (!fromIdUsuario) {
      throw new BadRequestError('ID de usuario origen es requerido');
    }
    
    if (!toIdUsuario) {
      throw new BadRequestError('ID de usuario destino es requerido');
    }
    
    if (!testNumber) {
      throw new BadRequestError('Número de test es requerido');
    }
    
    // Check if company exists
    const existingCompany = await EmpresaModel.getEmpresaById(idEmpresa);
    if (!existingCompany) {
      throw new NotFoundError(`Empresa con ID ${idEmpresa} no encontrada`);
    }
    
    // Log the manual reassignment operation
    logger.info(`Reasignación manual iniciada - ID Empresa: ${idEmpresa}, From: ${fromIdUsuario}, To: ${toIdUsuario}, Test: ${testNumber}, Dry Run: ${dryRun}, Usuario: ${req.user?.email || 'desconocido'}`);
    
    const result = await EmpresaModel.manualReassignChequeo(idEmpresa, fromIdUsuario, toIdUsuario, testNumber, dryRun);
    
    res.status(200).json(result);
  })
};

/**
 * Export ficha completa de empresa (PDF)
 */
empresaController.exportEmpresaFicha = catchAsync(async (req, res) => {
  const { id: idEmpresa } = req.params;
  const { idTestUsuario } = req.query;
  
  logger.info(`[EXPORT FICHA] Empresa ID: ${idEmpresa}, IdTestUsuario: ${idTestUsuario || 'último'}`);
  
  try {
    // Obtener datos completos de la empresa
    const empresaData = await EmpresaModel.getEmpresaById(idEmpresa, idTestUsuario);
    
    if (!empresaData) {
      return res.status(404).json({
        status: 'error',
        message: `Empresa con ID ${idEmpresa} no encontrada`
      });
    }
    
    // Obtener historial de chequeos (solo finalizados)
    // CASO ESPECIAL: Para empresas "NO TENGO", filtrar también por IdUsuario
    const pool = await poolPromise;
    const request = new sql.Request(pool);
    request.input('idEmpresa', sql.Int, idEmpresa);
    
    // Si es "NO TENGO", necesitamos filtrar también por IdUsuario
    const esNoTengo = empresaData.empresa && empresaData.empresa.toLowerCase().includes('no tengo');
    let historialQuery;
    
    if (esNoTengo && empresaData.IdUsuario) {
      // Para "NO TENGO", filtrar por IdEmpresa Y IdUsuario
      request.input('idUsuario', sql.Int, empresaData.IdUsuario);
      logger.info(`[EXPORT FICHA] Empresa "NO TENGO" detectada - Filtrando por IdUsuario: ${empresaData.IdUsuario}`);
      
      historialQuery = await request.query(`
        SELECT 
          tu.IdTestUsuario,
          tu.Test,
          tu.FechaTest,
          tu.FechaTerminoTest,
          rnd.ptjeTotalUsuario as puntajeGeneral,
          nm.Descripcion as nivelMadurez,
          rnd.ptjeDimensionTecnologia,
          rnd.ptjeDimensionProcesos,
          rnd.ptjeDimensionOrganizacion,
          rnd.ptjeDimensionComunicacion,
          rnd.ptjeDimensionDatos,
          rnd.ptjeDimensionEstrategia
        FROM dbo.TestUsuario tu WITH (NOLOCK)
        INNER JOIN dbo.Usuario u WITH (NOLOCK) ON tu.IdUsuario = u.IdUsuario
        LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) 
          ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
        LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
        WHERE u.IdEmpresa = @idEmpresa
          AND tu.IdUsuario = @idUsuario
          AND tu.Finalizado = 1
        ORDER BY tu.FechaTest DESC
      `);
    } else {
      // Para empresas normales, solo filtrar por IdEmpresa
      historialQuery = await request.query(`
        SELECT 
          tu.IdTestUsuario,
          tu.Test,
          tu.FechaTest,
          tu.FechaTerminoTest,
          rnd.ptjeTotalUsuario as puntajeGeneral,
          nm.Descripcion as nivelMadurez,
          rnd.ptjeDimensionTecnologia,
          rnd.ptjeDimensionProcesos,
          rnd.ptjeDimensionOrganizacion,
          rnd.ptjeDimensionComunicacion,
          rnd.ptjeDimensionDatos,
          rnd.ptjeDimensionEstrategia
        FROM dbo.TestUsuario tu WITH (NOLOCK)
        INNER JOIN dbo.Usuario u WITH (NOLOCK) ON tu.IdUsuario = u.IdUsuario
        LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) 
          ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
        LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
        WHERE u.IdEmpresa = @idEmpresa
          AND tu.Finalizado = 1
        ORDER BY tu.FechaTest DESC
      `);
    }
    
    const historialChequeos = historialQuery.recordset;
    
    logger.info(`[EXPORT FICHA] Historial: ${historialChequeos.length} chequeos encontrados`);
    
    // Preparar datos para el PDF
    const fichaData = {
      empresa: empresaData,
      historial: historialChequeos,
      totalChequeos: historialChequeos.length
    };
    
    // Generar PDF
    const filePath = await Exporter.exportEmpresaFichaToPDF(fichaData, `ficha-empresa-${idEmpresa}`);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      logger.error(`[EXPORT FICHA] File not found: ${filePath}`);
      return res.status(500).json({
        status: 'error',
        message: 'El archivo PDF no se pudo generar correctamente'
      });
    }
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ficha-empresa-${idEmpresa}.pdf"`);
    
    // Enviar el archivo
    logger.info(`[EXPORT FICHA] Sending file: ${filePath}`);
    res.sendFile(path.resolve(filePath), (err) => {
      if (err) {
        logger.error(`[EXPORT FICHA] Error sending file: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({
            status: 'error',
            message: 'Error al enviar el archivo'
          });
        }
      } else {
        logger.info(`[EXPORT FICHA] File sent successfully: ${filePath}`);
      }
    });
    
  } catch (error) {
    logger.error(`[EXPORT FICHA] Error: ${error.message}`);
    logger.error(`[EXPORT FICHA] Stack: ${error.stack}`);
    
    if (!res.headersSent) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Error al generar la ficha PDF'
      });
    }
  }
});

module.exports = empresaController;
