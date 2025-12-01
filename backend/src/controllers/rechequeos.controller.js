const RechequeosModel = require('../models/rechequeos.model');
const RechequeosModelOptimizedViews = require('../models/rechequeos.model.optimized-views');
const { catchAsync } = require('../middlewares/error.middleware');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const Exporter = require('../utils/exporter');
const logger = require('../utils/logger');
const redisService = require('../services/redis.service'); // Redis with fallback
const fs = require('fs');
const path = require('path');

// Check for optimized views on startup
let USE_OPTIMIZED_VIEWS = false;
let viewsChecked = false;
let viewsCheckPromise = null;

async function checkOptimizedViews() {
  if (viewsChecked) {
    return USE_OPTIMIZED_VIEWS;
  }

  if (!viewsCheckPromise) {
    viewsCheckPromise = (async () => {
      const hasViews = await RechequeosModelOptimizedViews.hasOptimizedViews();
      USE_OPTIMIZED_VIEWS = hasViews;
      viewsChecked = true;
      viewsCheckPromise = null;

      if (hasViews) {
        logger.info('✅ Optimized SQL views found - using ultra-fast queries');
      } else {
        logger.warn('⚠️ Optimized SQL views not found - using original queries (slower)');
      }

      return USE_OPTIMIZED_VIEWS;
    })().catch((error) => {
      viewsCheckPromise = null;
      viewsChecked = true;
      USE_OPTIMIZED_VIEWS = false;
      logger.error(`Error checking optimized views: ${error.message}`);
      return false;
    });
  }

  return viewsCheckPromise;
}

// Helper para convertir strings a int sin problemas con 0
const toInt = (v, def) => (v !== undefined ? parseInt(v, 10) : def);

/**
 * Controller for rechequeos-related operations
 */
const rechequeosController = {
  /**
   * Get KPIs for rechequeos dashboard
   */
  getKPIs: catchAsync(async (req, res) => {
    // Check for optimized views
    const useOptimizedViews = await checkOptimizedViews();
    const Model = useOptimizedViews ? RechequeosModelOptimizedViews : RechequeosModel;
    const filters = Model.parseFilters(req.query);
    
    // Determine if this is the "default" (no filters) query
    const hasFilters = Object.values(filters).some(val => {
      if (Array.isArray(val)) return val.length > 0;
      if (val === null || val === undefined || val === '') return false;
      if (val === 'UltimaFechaTermino' || val === 'desc') return false; // Default sorting
      return true;
    });
    
    // Generate cache key
    const cacheKey = redisService.generateKey('rechequeos:kpis:v3', filters);
    
    // Use longer TTL for default (no filters) query - 15 minutes instead of 5
    const cacheTTL = hasFilters ? 300 : 900; // 5 min with filters, 15 min without
    
    // Check Redis cache first
    const cachedResult = await redisService.get(cacheKey);
    if (cachedResult) {
      logger.info('[RECHEQUEOS] Returning cached KPIs from Redis/Memory');
      return res.status(200).json(cachedResult);
    }
    
    logger.info(`[RECHEQUEOS] Getting KPIs (${useOptimizedViews ? 'OPTIMIZED VIEWS' : 'original queries'})`);
    
    const kpis = await Model.getKPIs(filters);
    
    // Cache the result
    await redisService.set(cacheKey, kpis, cacheTTL);
    
    logger.info(`[RECHEQUEOS] KPIs calculated successfully (cached for ${cacheTTL}s)`);
    res.status(200).json(kpis);
  }),

  /**
   * Get detailed table data (alias for getTableData)
   */
  getTabla: catchAsync(async (req, res) => {
    const useOptimizedViews = await checkOptimizedViews();
    const Model = useOptimizedViews ? RechequeosModelOptimizedViews : RechequeosModel;
    const filters = Model.parseFilters(req.query);
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 50);
    
    // Determine if this is the "default" (no filters) query
    const hasFilters = Object.values(filters).some(val => {
      if (Array.isArray(val)) return val.length > 0;
      if (val === null || val === undefined || val === '') return false;
      if (val === 'UltimaFechaTermino' || val === 'desc') return false; // Default sorting
      return true;
    });
    
    // Generate cache key including search and sorting
    const cacheKey = redisService.generateKey('rechequeos:tabla:v3', { 
      ...filters, 
      page, 
      limit
    });
    
    // Use longer TTL for default (no filters) query - 15 minutes instead of 5
    const cacheTTL = hasFilters ? 300 : 900; // 5 min with filters, 15 min without
    
    // Check Redis cache first
    const cachedResult = await redisService.get(cacheKey);
    if (cachedResult) {
      logger.info('[RECHEQUEOS] Returning cached tabla data from Redis/Memory');
      return res.status(200).json(cachedResult);
    }
    
    logger.info(`[RECHEQUEOS] Getting tabla data (${useOptimizedViews ? 'OPTIMIZED VIEWS' : 'original queries'})`);
    
    const result = await Model.getTableData({ page, limit, filters });
    
    // Cache the result
    await redisService.set(cacheKey, result, cacheTTL);
    
    logger.info(`[RECHEQUEOS] Tabla data retrieved successfully (cached for ${cacheTTL}s)`);
    res.status(200).json(result);
  }),

  /**
   * Get evolution series data
   */
  getEvolutionSeries: catchAsync(async (req, res) => {
    const filters = RechequeosModel.parseFilters(req.query);
    const category = req.query.category || 'tamano'; // tamano, region, sector
    
    // Generate cache key
    const cacheKey = `rechequeos:evolution:${category}:${JSON.stringify(filters)}`;
    
    // Check cache first - use long cache (15 min) for evolution series
    const cachedResult = await redisService.get(cacheKey);
    if (cachedResult) {
      logger.info('[RECHEQUEOS] Returning cached evolution series');
      return res.status(200).json(cachedResult);
    }
    
    logger.info(`[RECHEQUEOS] Getting evolution series for category: ${category}`);
    
    const series = await RechequeosModel.getEvolutionSeries(filters, category);
    
    // Cache the result (15 min = 900 seconds)
    await redisService.set(cacheKey, series, 900);
    
    res.status(200).json(series);
  }),

  /**
   * Get heatmap data for dimensions vs sectors
   */
  getHeatmapData: catchAsync(async (req, res) => {
    const filters = RechequeosModel.parseFilters(req.query);
    
    // Generate cache key
    const cacheKey = `rechequeos:heatmap:${JSON.stringify(filters)}`;
    
    // Check cache first - use long cache (15 min) for heatmap
    const cachedResult = await redisService.get(cacheKey);
    if (cachedResult) {
      logger.info('[RECHEQUEOS] Returning cached heatmap');
      return res.status(200).json(cachedResult);
    }
    
    logger.info(`[RECHEQUEOS] Getting heatmap data`);
    
    const heatmap = await RechequeosModel.getHeatmapData(filters);
    
    // Cache the result (15 min = 900 seconds)
    await redisService.set(cacheKey, heatmap, 900);
    
    res.status(200).json(heatmap);
  }),

  /**
   * Get detailed table data for rechequeos
   */
  getTableData: catchAsync(async (req, res) => {
    const useOptimizedViews = await checkOptimizedViews();
    const Model = useOptimizedViews ? RechequeosModelOptimizedViews : RechequeosModel;
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 50);
    const filters = Model.parseFilters(req.query);
    
    // Generate cache key
    const cacheKey = redisService.generateKey('rechequeos:tabledata:v3', { ...filters, page, limit });
    
    // Check Redis cache first
    const cachedResult = await redisService.get(cacheKey);
    if (cachedResult) {
      logger.info('[RECHEQUEOS] Returning cached table data from Redis/Memory');
      return res.status(200).json(cachedResult);
    }
    
    logger.info(`[RECHEQUEOS] Getting table data (${useOptimizedViews ? 'OPTIMIZED' : 'original'})`);
    
    const result = await Model.getTableData({ 
      page, 
      limit, 
      filters 
    });
    
    // Cache the result - 5 minutes
    await redisService.set(cacheKey, result, 300);
    
    logger.info('[RECHEQUEOS] Table data retrieved successfully');
    res.status(200).json(result);
  }),

  /**
   * Get filter options for rechequeos
   */
  getFilterOptions: catchAsync(async (req, res) => {
    const activeFilters = RechequeosModel.parseFilters(req.query);
    
    // Generate cache key
    const cacheKey = `rechequeos:filters:${JSON.stringify(activeFilters)}`;
    
    // Check cache first - use long cache (15 min) for filter options
    const cachedResult = await redisService.get(cacheKey);
    if (cachedResult) {
      logger.info('[RECHEQUEOS] Returning cached filter options');
      return res.status(200).json(cachedResult);
    }
    
    logger.info(`[RECHEQUEOS] Getting filter options`);
    
    const options = await RechequeosModel.getFilterOptions(activeFilters);
    
    // Cache the result (15 min = 900 seconds)
    await redisService.set(cacheKey, options, 900);
    
    res.status(200).json(options);
  }),

  /**
   * Export rechequeos data to CSV
   */
  exportData: catchAsync(async (req, res) => {
    const filters = RechequeosModel.parseFilters(req.query);
    const format = req.query.format || 'csv';
    const fileName = req.query.fileName || 'rechequeos';
    
    logger.info(`[RECHEQUEOS] Exporting data to ${format}`);
    
    // Get all data without pagination for export
    const result = await RechequeosModel.getTableData({ 
      page: 1, 
      limit: 10000, // Large limit for export
      filters 
    });
    
    if (!result.data || result.data.length === 0) {
      throw new NotFoundError('No hay datos para exportar con los filtros seleccionados');
    }
    
    // Prepare data for export
    const exportData = result.data.map(row => ({
      'ID Empresa': row.IdEmpresa,
      'Empresa': row.EmpresaNombre,
      'Sector': row.SectorActividad,
      'Tamaño': row.TamanoEmpresa,
      'Departamento': row.Departamento,
      'Distrito': row.Distrito,
      'Total Chequeos': row.TotalChequeos,
      'Primera Fecha': row.PrimeraFechaFormatted,
      'Última Fecha': row.UltimaFechaFormatted,
      'Puntaje Inicial': row.PrimerPuntaje,
      'Puntaje Final': row.UltimoPuntaje,
      'Delta Global': row.DeltaGlobal,
      'Delta Tecnología': row.DeltaTecnologia,
      'Delta Comunicación': row.DeltaComunicacion,
      'Delta Organización': row.DeltaOrganizacion,
      'Delta Datos': row.DeltaDatos,
      'Delta Estrategia': row.DeltaEstrategia,
      'Delta Procesos': row.DeltaProcesos,
      'Nivel Inicial': row.PrimerNivel,
      'Nivel Final': row.UltimoNivel,
      'Días Entre Chequeos': row.DiasEntreChequeos,
      'Tasa Mejora Mensual': row.TasaMejoraMensual,
      'Salto Bajo-Medio': row.SaltoBajoMedio ? 'Sí' : 'No',
      'Salto Medio-Alto': row.SaltoMedioAlto ? 'Sí' : 'No'
    }));
    
    // Export using the existing exporter utility (static method)
    const fileBuffer = await Exporter.exportToCSV(exportData, fileName);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    res.status(200).send(fileBuffer);
  }),

  /**
   * Export rechequeos comprehensive report to PDF
   */
  exportComprehensivePDF: catchAsync(async (req, res) => {
    try {
      const filters = RechequeosModel.parseFilters(req.query);
      const fileName = req.query.fileName || 'rechequeos-report';
      
      logger.info(`[RECHEQUEOS PDF] Starting export with filters:`, filters);
      
      // Ejecutar consultas en paralelo para mejorar rendimiento
      const [kpis, tableResult] = await Promise.all([
        RechequeosModel.getKPIs(filters),
        RechequeosModel.getTableData({ 
          page: 1, 
          limit: 50, // Reducido para PDF (suficiente para primera página)
          filters 
        })
      ]);
      
      logger.info(`[RECHEQUEOS PDF] KPIs retrieved:`, kpis);
      logger.info(`[RECHEQUEOS PDF] Table data retrieved: ${tableResult.data?.length || 0} rows`);
      
      if (!kpis && (!tableResult.data || tableResult.data.length === 0)) {
        throw new NotFoundError('No hay datos para exportar con los filtros seleccionados');
      }
      
      // Prepare summary data for PDF (incluir todos los filtros activos)
      const summaryData = {
        kpis: kpis || {},
        tableData: tableResult.data || [],
        fechaIni: filters.fechaIni || null,
        fechaFin: filters.fechaFin || null,
        filters: filters // Pasar todos los filtros para mostrarlos en el header
      };
      
      logger.info(`[RECHEQUEOS PDF] Generating PDF with ${summaryData.tableData.length} rows`);
      
      // Generate PDF
      const filePath = await Exporter.exportRechequeosComprehensiveToPDF(summaryData, fileName);
      
      logger.info(`[RECHEQUEOS PDF] PDF generated at: ${filePath}`);
      
      // Verify file exists
      if (!fs.existsSync(filePath)) {
        logger.error(`[RECHEQUEOS PDF] File not found: ${filePath}`);
        throw new Error('El archivo PDF no se pudo generar correctamente');
      }
      
      // Send file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}.pdf"`);
      
      logger.info(`[RECHEQUEOS PDF] Sending file: ${filePath}`);
      res.sendFile(path.resolve(filePath), (err) => {
        if (err) {
          logger.error(`[RECHEQUEOS PDF] Error sending file: ${err.message}`);
          if (!res.headersSent) {
            res.status(500).json({
              status: 'error',
              message: 'Error al enviar el archivo PDF'
            });
          }
        } else {
          logger.info(`[RECHEQUEOS PDF] File sent successfully`);
        }
      });
    } catch (error) {
      logger.error(`[RECHEQUEOS PDF] Error in exportComprehensivePDF:`, error);
      throw error;
    }
  })
};

module.exports = rechequeosController;
