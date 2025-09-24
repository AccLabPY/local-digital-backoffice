const EmpresaModel = require('../models/empresa.model');
const { catchAsync } = require('../middlewares/error.middleware');
const { NotFoundError } = require('../utils/errors');
const Exporter = require('../utils/exporter');

// Helper para convertir strings a int sin problemas con 0
const toInt = (v, def) => (v !== undefined ? parseInt(v, 10) : def);

/**
 * Controller for company-related operations
 */
const empresaController = {
  /**
   * Get paginated list of companies with filters and search
   */
  getEmpresas: catchAsync(async (req, res) => {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const searchTerm = req.query.searchTerm || '';
    const finalizado = toInt(req.query.finalizado, 1); // ✅ YA NO usa "|| 1"
    
    // Extract filters from query params
    const filters = {
      departamento: req.query.departamento || undefined,
      distrito: req.query.distrito || undefined,
      nivelInnovacion: req.query.nivelInnovacion || undefined,
      sectorActividad: req.query.sectorActividad || undefined,
      estadoEncuesta: req.query.estadoEncuesta === 'true'
        ? true : req.query.estadoEncuesta === 'false' ? false : undefined
    };
    
    const result = await EmpresaModel.getEmpresas({ 
      page, 
      limit, 
      searchTerm, 
      filters,
      finalizado
    });
    
    res.status(200).json(result);
  }),
  
  /**
   * Get company details by ID
   */
  getEmpresaById: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.id);
    
    const empresa = await EmpresaModel.getEmpresaById(idEmpresa);
    
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

    const filters = {
      departamento: req.query.departamento || undefined,
      distrito: req.query.distrito || undefined,
      nivelInnovacion: req.query.nivelInnovacion || undefined,
      sectorActividad: req.query.sectorActividad || undefined
    };

    const kpis = await EmpresaModel.getKPIs(finalizado, filters); // ✅ ahora pasa filtros
    res.status(200).json(kpis);
  }),
  
  /**
   * Get filter options for companies list
   */
  getFilterOptions: catchAsync(async (req, res) => {
    const filterOptions = await EmpresaModel.getFilterOptions();
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
  })
};

module.exports = empresaController;
