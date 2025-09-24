const EncuestaModel = require('../models/encuesta.model');
const { catchAsync } = require('../middlewares/error.middleware');
const { NotFoundError } = require('../utils/errors');
const Exporter = require('../utils/exporter');

/**
 * Controller for survey-related operations
 */
const encuestaController = {
  /**
   * Get survey history for a company
   */
  getSurveyHistory: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.idEmpresa);
    
    const history = await EncuestaModel.getSurveyHistory(idEmpresa);
    
    res.status(200).json(history);
  }),

  /**
   * Get all surveys for a company with user information
   */
  getCompanySurveys: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.idEmpresa);
    
    const surveys = await EncuestaModel.getCompanySurveys(idEmpresa);
    
    res.status(200).json(surveys);
  }),

  /**
   * Get survey responses for a company and specific test
   */
  getCompanyTestResponses: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.idEmpresa);
    const idTest = parseInt(req.params.idTest);
    const dimension = req.query.dimension || 'Todas';
    
    const responses = await EncuestaModel.getCompanyTestResponses(idEmpresa, idTest, dimension);
    
    if (!responses || responses.length === 0) {
      throw new NotFoundError(`No survey responses found for company ${idEmpresa} and test ${idTest}`);
    }
    
    res.status(200).json(responses);
  }),

  /**
   * Get evolution data for a company across all tests
   */
  getCompanyEvolution: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.idEmpresa);
    
    const evolution = await EncuestaModel.getCompanyEvolution(idEmpresa);
    
    res.status(200).json(evolution);
  }),
  
  /**
   * Get detailed survey responses
   */
  getSurveyResponses: catchAsync(async (req, res) => {
    const idUsuario = parseInt(req.params.idUsuario);
    const idTest = parseInt(req.params.idTest);
    const dimension = req.query.dimension || 'Todas';
    
    const responses = await EncuestaModel.getSurveyResponses(idUsuario, idTest, dimension);
    
    if (!responses || responses.length === 0) {
      throw new NotFoundError(`No survey responses found for user ${idUsuario} and test ${idTest}`);
    }
    
    res.status(200).json(responses);
  }),
  
  /**
   * Get available innovation dimensions
   */
  getDimensions: catchAsync(async (req, res) => {
    const dimensions = await EncuestaModel.getDimensions();
    res.status(200).json(dimensions);
  }),
  
  /**
   * Export survey responses to CSV or Excel
   */
  exportResponses: catchAsync(async (req, res) => {
    const idUsuario = parseInt(req.params.idUsuario);
    const idTest = parseInt(req.params.idTest);
    const format = req.query.format || 'csv';
    const fileName = req.query.fileName || 'respuestas-encuesta';
    
    const responses = await EncuestaModel.getSurveyResponses(idUsuario, idTest, 'Todas');
    
    if (!responses || responses.length === 0) {
      throw new NotFoundError(`No survey responses found for user ${idUsuario} and test ${idTest}`);
    }
    
    let filePath;
    
    if (format === 'excel') {
      filePath = await Exporter.exportToExcel(responses, fileName);
    } else {
      filePath = await Exporter.exportToCSV(responses, fileName);
    }
    
    res.download(filePath);
  })
};

module.exports = encuestaController;
