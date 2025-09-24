const GraficoModel = require('../models/grafico.model');
const { catchAsync } = require('../middlewares/error.middleware');

/**
 * Controller for chart-related operations
 */
const graficoController = {
  /**
   * Get general evolution data for a company
   */
  getGeneralEvolution: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.idEmpresa);
    
    const evolutionData = await GraficoModel.getGeneralEvolution(idEmpresa);
    
    res.status(200).json(evolutionData);
  }),
  
  /**
   * Get dimension evolution data for a company
   */
  getDimensionEvolution: catchAsync(async (req, res) => {
    const idEmpresa = parseInt(req.params.idEmpresa);
    
    const dimensionData = await GraficoModel.getDimensionEvolution(idEmpresa);
    
    res.status(200).json(dimensionData);
  })
};

module.exports = graficoController;
