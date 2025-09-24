const { poolPromise, sql } = require('../config/database');
const logger = require('../utils/logger');

class GraficoModel {
  /**
   * Get general evolution data for a company
   * @param {Number} idEmpresa - Company ID
   * @returns {Promise<Array>} - Evolution data
   */
  static async getGeneralEvolution(idEmpresa) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idEmpresa', sql.Int, idEmpresa);
      
      const query = `
        SELECT
          CONVERT(VARCHAR(10), tu.FechaTest, 120) AS fecha,
          rnd.ptjeTotalUsuario AS puntaje,
          nm.Descripcion AS nivelMadurez
        FROM TestUsuario tu
        INNER JOIN ResultadoNivelDigital rnd ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
        INNER JOIN NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
        INNER JOIN EmpresaInfo ei ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
        WHERE ei.IdEmpresa = @idEmpresa AND tu.Finalizado = 1
        ORDER BY tu.FechaTest ASC
      `;
      
      const result = await request.query(query);
      
      // If there are less than 3 data points, generate additional ones for demonstration
      if (result.recordset.length < 3) {
        const baseData = result.recordset.length > 0 ? result.recordset[0] : { 
          puntaje: 2.5, 
          nivelMadurez: 'Básico'
        };
        
        const today = new Date();
        
        for (let i = result.recordset.length; i < 3; i++) {
          // Generate dates 3 months apart
          const newDate = new Date(today);
          newDate.setMonth(today.getMonth() - (3 * (3 - i)));
          
          // Random score variation (-0.5 to +0.5)
          const scoreVariation = Math.random() - 0.5;
          const newScore = Math.max(1, Math.min(5, parseFloat(baseData.puntaje) + scoreVariation));
          
          // Determine maturity level based on score
          let level = 'Inicial';
          if (newScore >= 4) level = 'Avanzado';
          else if (newScore >= 3) level = 'Intermedio';
          else if (newScore >= 2) level = 'Básico';
          
          result.recordset.push({
            fecha: newDate.toISOString().split('T')[0],
            puntaje: newScore,
            nivelMadurez: level,
            isSimulated: true
          });
        }
        
        // Sort by date
        result.recordset.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      }
      
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting general evolution: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get dimension evolution data for a company
   * @param {Number} idEmpresa - Company ID
   * @returns {Promise<Array>} - Evolution data by dimension
   */
  static async getDimensionEvolution(idEmpresa) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idEmpresa', sql.Int, idEmpresa);
      
      const query = `
        SELECT
          CONVERT(VARCHAR(10), tu.FechaTest, 120) AS fecha,
          rnd.ptjeDimensionTecnologia AS tecnologia,
          rnd.ptjeDimensionComunicacion AS comunicacion,
          rnd.ptjeDimensionOrganizacion AS organizacion,
          rnd.ptjeDimensionDatos AS datos,
          rnd.ptjeDimensionEstrategia AS estrategia,
          rnd.ptjeDimensionProcesos AS procesos
        FROM TestUsuario tu
        INNER JOIN ResultadoNivelDigital rnd ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
        INNER JOIN EmpresaInfo ei ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
        WHERE ei.IdEmpresa = @idEmpresa AND tu.Finalizado = 1
        ORDER BY tu.FechaTest ASC
      `;
      
      const result = await request.query(query);
      
      // If there are less than 3 data points, generate additional ones for demonstration
      if (result.recordset.length < 3) {
        const baseData = result.recordset.length > 0 ? result.recordset[0] : {
          tecnologia: 2.5,
          comunicacion: 2.2,
          organizacion: 2.8,
          datos: 2.3,
          estrategia: 2.6,
          procesos: 2.4
        };
        
        const today = new Date();
        
        for (let i = result.recordset.length; i < 3; i++) {
          // Generate dates 3 months apart
          const newDate = new Date(today);
          newDate.setMonth(today.getMonth() - (3 * (3 - i)));
          
          // Create variations for each dimension
          const generateVariation = (base) => {
            const variation = (Math.random() - 0.5) * 0.8;
            return Math.max(1, Math.min(5, parseFloat(base) + variation));
          };
          
          result.recordset.push({
            fecha: newDate.toISOString().split('T')[0],
            tecnologia: generateVariation(baseData.tecnologia),
            comunicacion: generateVariation(baseData.comunicacion),
            organizacion: generateVariation(baseData.organizacion),
            datos: generateVariation(baseData.datos),
            estrategia: generateVariation(baseData.estrategia),
            procesos: generateVariation(baseData.procesos),
            isSimulated: true
          });
        }
        
        // Sort by date
        result.recordset.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      }
      
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting dimension evolution: ${error.message}`);
      throw error;
    }
  }
}

module.exports = GraficoModel;
