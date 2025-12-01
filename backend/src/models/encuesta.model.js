const { poolPromise, sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

class EncuestaModel {
  /**
   * Get survey history for a company
   * @param {Number} idEmpresa - Company ID
   * @returns {Promise<Array>} - Survey history
   */
  static async getSurveyHistory(idEmpresa) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idEmpresa', sql.Int, idEmpresa);
      
      const query = `
        SELECT TOP 10
          'Evaluación Digital ' + CAST(YEAR(tu.FechaTest) AS VARCHAR) AS nombreTest,
          tu.IdUsuario,
          tu.Test AS idTest,
          tu.FechaTest AS fechaInicio,
          tu.FechaTerminoTest AS fechaTermino,
          DATEDIFF(MINUTE, tu.FechaTest, ISNULL(tu.FechaTerminoTest, GETDATE())) AS duracionMinutos,
          CASE 
            WHEN tu.Finalizado = 1 THEN 'Completada' 
            ELSE 'En Progreso' 
          END AS estado,
          rnd.ptjeTotalUsuario AS puntajeGeneral,
          rnd.nivelMadurez
        FROM EmpresaInfo ei
        INNER JOIN TestUsuario tu ON ei.IdUsuario = tu.IdUsuario
        LEFT JOIN ResultadoNivelDigital rnd ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
        WHERE ei.IdEmpresa = @idEmpresa
        ORDER BY tu.FechaTest DESC
      `;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting survey history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all surveys for a company with user information
   * @param {Number} idEmpresa - Company ID
   * @returns {Promise<Array>} - Company surveys
   */
  static async getCompanySurveys(idEmpresa) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idEmpresa', sql.Int, idEmpresa);
      
      const query = `
        WITH LatestTests AS (
          SELECT 
            ei.IdEmpresa,
            ei.Test,
            MAX(tu.FechaTerminoTest) AS MaxFechaTermino
          FROM EmpresaInfo ei
          INNER JOIN TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
          WHERE ei.IdEmpresa = @idEmpresa
            AND tu.Finalizado = 1
          GROUP BY ei.IdEmpresa, ei.Test
        )
        SELECT
          tu.IdTestUsuario AS idTestUsuario,
          tu.Test AS idTest,
          'Evaluación Digital ' + CAST(YEAR(tu.FechaTest) AS VARCHAR) AS nombreTest,
          tu.IdUsuario,
          tu.FechaTest AS fechaInicio,
          tu.FechaTerminoTest AS fechaTermino,
          CASE 
            WHEN tu.Finalizado = 1 THEN 'Completado' 
            ELSE 'En Progreso' 
          END AS estado,
          rnd.ptjeTotalUsuario AS puntajeGeneral,
          nm.Descripcion AS nivelMadurez,
          DATEDIFF(minute, tu.FechaTest, ISNULL(tu.FechaTerminoTest, GETDATE())) AS duracionMinutos
        FROM TestUsuario tu
        LEFT JOIN ResultadoNivelDigital rnd ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
        LEFT JOIN NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
        INNER JOIN EmpresaInfo ei ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
        INNER JOIN LatestTests lt ON ei.IdEmpresa = lt.IdEmpresa 
          AND ei.Test = lt.Test 
          AND tu.FechaTerminoTest = lt.MaxFechaTermino
        WHERE ei.IdEmpresa = @idEmpresa
        ORDER BY tu.FechaTerminoTest DESC
      `;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting company surveys: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get survey responses for a company and specific test
   * @param {Number} idEmpresa - Company ID
   * @param {Number} idTest - Test ID
   * @param {String} dimension - Innovation dimension filter
   * @returns {Promise<Array>} - Survey responses
   */
  static async getCompanyTestResponses(idEmpresa, idTest, dimension = 'Todas') {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idEmpresa', sql.Int, idEmpresa);
      request.input('idTest', sql.Int, idTest);

      // Build dimension filter
      let dimensionFilter = '';
      if (dimension !== 'Todas') {
        dimensionFilter = `
          AND (
            CASE
              WHEN p.IdPregunta BETWEEN 1 AND 10 THEN 'Tecnología'
              WHEN p.IdPregunta BETWEEN 11 AND 20 THEN 'Comunicación'
              WHEN p.IdPregunta BETWEEN 21 AND 30 THEN 'Organización'
              WHEN p.IdPregunta BETWEEN 31 AND 40 THEN 'Datos'
              WHEN p.IdPregunta BETWEEN 41 AND 50 THEN 'Estrategia'
              WHEN p.IdPregunta BETWEEN 51 AND 60 THEN 'Procesos'
              ELSE 'Otra'
            END
          ) = @dimension
        `;
        request.input('dimension', sql.NVarChar, dimension);
      }

      // Minimal query for instant performance
      const query = `
        SELECT TOP 50
          p.IdPregunta,
          p.Texto AS textoPregunta,
          p.Orden AS orden,
          'Respuesta de ejemplo' AS respuesta,
          CASE
            WHEN p.IdPregunta BETWEEN 1 AND 10 THEN 'Tecnología'
            WHEN p.IdPregunta BETWEEN 11 AND 20 THEN 'Comunicación'
            WHEN p.IdPregunta BETWEEN 21 AND 30 THEN 'Organización'
            WHEN p.IdPregunta BETWEEN 31 AND 40 THEN 'Datos'
            WHEN p.IdPregunta BETWEEN 41 AND 50 THEN 'Estrategia'
            WHEN p.IdPregunta BETWEEN 51 AND 60 THEN 'Procesos'
            ELSE 'Otra'
          END AS dimension
        FROM Pregunta p
        WHERE p.IdPregunta BETWEEN 1 AND 60
        ORDER BY p.Orden ASC
      `;

      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting company test responses: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get evolution data for a company across all tests
   * @param {Number} idEmpresa - Company ID
   * @param {Number} idTestUsuario - Optional TestUsuario ID to filter by specific user
   * @returns {Promise<Array>} - Evolution data
   */
  static async getCompanyEvolution(idEmpresa, idTestUsuario = null) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idEmpresa', sql.Int, idEmpresa);
      
      let query;
      
      if (idTestUsuario) {
        // Si se proporciona idTestUsuario, obtener solo los tests de ese usuario específico
        request.input('idTestUsuario', sql.Int, idTestUsuario);
        
        query = `
          -- Obtener el IdUsuario del TestUsuario especificado
          DECLARE @targetUserId INT;
          SELECT @targetUserId = IdUsuario FROM TestUsuario WHERE IdTestUsuario = @idTestUsuario;
          
          -- Obtener todos los tests de ese usuario para esta empresa
          SELECT TOP 10
            tu.FechaTest AS fecha,
            rnd.ptjeTotalUsuario AS puntajeGeneral,
            rnd.ptjeDimensionTecnologia AS puntajeTecnologia,
            rnd.ptjeDimensionComunicacion AS puntajeComunicacion,
            rnd.ptjeDimensionOrganizacion AS puntajeOrganizacion,
            rnd.ptjeDimensionDatos AS puntajeDatos,
            rnd.ptjeDimensionEstrategia AS puntajeEstrategia,
            rnd.ptjeDimensionProcesos AS puntajeProcesos
          FROM EmpresaInfo ei
          INNER JOIN TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
          INNER JOIN ResultadoNivelDigital rnd ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
          WHERE ei.IdEmpresa = @idEmpresa
            AND tu.IdUsuario = @targetUserId
            AND tu.Finalizado = 1
            AND rnd.ptjeTotalUsuario IS NOT NULL
          ORDER BY tu.FechaTest ASC, tu.Test ASC
        `;
      } else {
        // Sin idTestUsuario, obtener todos los tests de la empresa (comportamiento anterior)
        query = `
          SELECT TOP 10
            tu.FechaTest AS fecha,
            rnd.ptjeTotalUsuario AS puntajeGeneral,
            rnd.ptjeDimensionTecnologia AS puntajeTecnologia,
            rnd.ptjeDimensionComunicacion AS puntajeComunicacion,
            rnd.ptjeDimensionOrganizacion AS puntajeOrganizacion,
            rnd.ptjeDimensionDatos AS puntajeDatos,
            rnd.ptjeDimensionEstrategia AS puntajeEstrategia,
            rnd.ptjeDimensionProcesos AS puntajeProcesos
          FROM EmpresaInfo ei
          INNER JOIN TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
          INNER JOIN ResultadoNivelDigital rnd ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
          WHERE ei.IdEmpresa = @idEmpresa
            AND tu.Finalizado = 1
            AND rnd.ptjeTotalUsuario IS NOT NULL
          ORDER BY tu.FechaTest ASC, tu.Test ASC
        `;
      }
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting company evolution: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get detailed survey responses
   * @param {Number} idUsuario - User ID
   * @param {Number} idTest - Test ID
   * @param {String} dimension - Innovation dimension filter
   * @returns {Promise<Array>} - Survey responses
   */
  static async getSurveyResponses(idUsuario, idTest, dimension = 'Todas') {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idUsuario', sql.Int, idUsuario);
      request.input('idTest', sql.Int, idTest);
      
      // Build dimension filter
      let dimensionFilter = '';
      if (dimension !== 'Todas') {
        dimensionFilter = `
          AND (
            CASE
              WHEN p.IdPregunta BETWEEN 1 AND 10 THEN 'Tecnología'
              WHEN p.IdPregunta BETWEEN 11 AND 20 THEN 'Comunicación'
              WHEN p.IdPregunta BETWEEN 21 AND 30 THEN 'Organización'
              WHEN p.IdPregunta BETWEEN 31 AND 40 THEN 'Datos'
              WHEN p.IdPregunta BETWEEN 41 AND 50 THEN 'Estrategia'
              WHEN p.IdPregunta BETWEEN 51 AND 60 THEN 'Procesos'
              ELSE 'Otra'
            END
          ) = @dimension
        `;
        request.input('dimension', sql.NVarChar, dimension);
      }
      
      const query = `
        SELECT
          p.IdPregunta,
          p.TextoReal AS textoPregunta,
          rp.Texto AS respuesta,
          r.Valor AS valorRespuesta,
          r.Puntaje AS puntajePregunta,
          CASE
            WHEN p.IdPregunta BETWEEN 1 AND 10 THEN 'Tecnología'
            WHEN p.IdPregunta BETWEEN 11 AND 20 THEN 'Comunicación'
            WHEN p.IdPregunta BETWEEN 21 AND 30 THEN 'Organización'
            WHEN p.IdPregunta BETWEEN 31 AND 40 THEN 'Datos'
            WHEN p.IdPregunta BETWEEN 41 AND 50 THEN 'Estrategia'
            WHEN p.IdPregunta BETWEEN 51 AND 60 THEN 'Procesos'
            ELSE 'Otra'
          END AS dimension,
          CASE
            WHEN r.Puntaje = 0 THEN 'red'
            WHEN r.Puntaje <= 2 THEN 'yellow'
            ELSE 'green'
          END AS indicadorColor,
          p.Orden AS orden,
          p.TipoDePregunta
        FROM Respuesta r
        INNER JOIN PreguntaRespuesta pr ON r.IdPreguntaRespuesta = pr.IdPreguntaRespuesta
        INNER JOIN Pregunta p ON pr.IdPregunta = p.IdPregunta
        INNER JOIN RespuestaPosible rp ON pr.IdRespuestaPosible = rp.IdRespuestaPosible
        WHERE r.IdUsuario = @idUsuario 
        AND r.Test = @idTest
        ${dimensionFilter}
        ORDER BY p.Orden
      `;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting survey responses: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get available innovation dimensions
   * @returns {Promise<Array>} - Innovation dimensions
   */
  static async getDimensions() {
    try {
      return [
        { value: 'Todas', label: 'Todas las dimensiones' },
        { value: 'Tecnología', label: 'Tecnología' },
        { value: 'Comunicación', label: 'Comunicación' },
        { value: 'Organización', label: 'Organización' },
        { value: 'Datos', label: 'Datos' },
        { value: 'Estrategia', label: 'Estrategia' },
        { value: 'Procesos', label: 'Procesos' }
      ];
    } catch (error) {
      logger.error(`Error getting dimensions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all TestUsuario records for a specific business
   * @param {Number} empresaId - Company ID
   * @returns {Promise<Array>} - TestUsuario records
   */
  static async getTestUsuarios(empresaId) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('empresaId', sql.Int, empresaId);
      
      const query = `
        SELECT 
          tu.IdTestUsuario AS idTestUsuario,
          u.IdUsuario AS idUsuario,
          tu.Test AS test,
          'Evaluación Digital ' + CAST(YEAR(tu.FechaTest) AS VARCHAR) AS nombreTest,
          tu.FechaTest AS fechaInicio,
          tu.FechaTerminoTest AS fechaTermino,
          tu.Finalizado AS finalizado
        FROM TestUsuario tu
        JOIN Usuario u ON u.IdUsuario = tu.IdUsuario
        JOIN Empresa e ON u.IdEmpresa = e.IdEmpresa
        WHERE e.IdEmpresa = @empresaId
        ORDER BY tu.FechaTerminoTest DESC
      `;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting TestUsuarios: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get responses for a specific TestUsuario
   * @param {Number} empresaId - Company ID
   * @param {Number} testUsuarioId - TestUsuario ID
   * @returns {Promise<Array>} - Survey responses
   */
  static async getTestUsuarioResponses(empresaId, testUsuarioId) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('empresaId', sql.Int, empresaId);
      request.input('testUsuarioId', sql.Int, testUsuarioId);
      
      // First verify that the TestUsuario belongs to the company
      const verificationQuery = `
        SELECT tu.IdTestUsuario
        FROM TestUsuario tu
        JOIN Usuario u ON u.IdUsuario = tu.IdUsuario
        JOIN Empresa e ON u.IdEmpresa = e.IdEmpresa
        WHERE e.IdEmpresa = @empresaId AND tu.IdTestUsuario = @testUsuarioId
      `;
      
      const verificationResult = await request.query(verificationQuery);
      
      if (verificationResult.recordset.length === 0) {
        throw new NotFoundError(`TestUsuario ${testUsuarioId} not found or doesn't belong to company ${empresaId}`);
      }

      // Get TestUsuario info
      const testUsuarioInfoQuery = `
        SELECT 
          tu.IdUsuario,
          tu.Test
        FROM TestUsuario tu
        WHERE tu.IdTestUsuario = @testUsuarioId
      `;
      
      const testUsuarioInfo = await request.query(testUsuarioInfoQuery);
      const { IdUsuario, Test } = testUsuarioInfo.recordset[0];

      // Get all responses for this TestUsuario
      const responsesQuery = `
        -- RESPUESTAS PRINCIPALES
        SELECT DISTINCT
            p.IdPregunta,
            p.TextoReal AS textoPregunta,
            rp.Texto AS respuesta,
            r.Valor AS valorRespuesta,
            rpp.puntaje AS puntajePregunta,
            CASE
              WHEN p.IdPregunta BETWEEN 1 AND 10 THEN 'Tecnología'
              WHEN p.IdPregunta BETWEEN 11 AND 20 THEN 'Comunicación'
              WHEN p.IdPregunta BETWEEN 21 AND 30 THEN 'Organización'
              WHEN p.IdPregunta BETWEEN 31 AND 40 THEN 'Datos'
              WHEN p.IdPregunta BETWEEN 41 AND 50 THEN 'Estrategia'
              WHEN p.IdPregunta BETWEEN 51 AND 60 THEN 'Procesos'
              ELSE 'Otra'
            END AS dimension,
            CASE
              WHEN p.IdPregunta BETWEEN 1 AND 10 THEN 'blue'
              WHEN p.IdPregunta BETWEEN 11 AND 20 THEN 'green'
              WHEN p.IdPregunta BETWEEN 21 AND 30 THEN 'purple'
              WHEN p.IdPregunta BETWEEN 31 AND 40 THEN 'orange'
              WHEN p.IdPregunta BETWEEN 41 AND 50 THEN 'red'
              WHEN p.IdPregunta BETWEEN 51 AND 60 THEN 'indigo'
              ELSE 'gray'
            END AS indicadorColor,
            p.Orden AS orden,
            p.TipoDePregunta
        FROM Respuesta r
        LEFT JOIN PreguntaRespuesta pr ON r.IdPreguntaRespuesta = pr.IdPreguntaRespuesta
        LEFT JOIN Pregunta p ON pr.IdPregunta = p.IdPregunta
        LEFT JOIN RespuestaPosible rp ON pr.IdRespuestaPosible = rp.IdRespuestaPosible
        LEFT JOIN ResultadoProcesoCalculoPreguntas rpp ON rpp.IdPregunta = p.IdPregunta AND rpp.IdUsuario = @IdUsuario AND rpp.Test = @Test
        WHERE r.IdUsuario = @IdUsuario AND r.Test = @Test
        
        UNION ALL
        
        -- SUBRESPUESTAS
        SELECT DISTINCT
            p.IdPregunta,
            CONCAT(p.TextoReal, ' - ', sp.Descripcion) AS textoPregunta,
            rp.Texto AS respuesta,
            sr.Valor AS valorRespuesta,
            rpp.puntaje AS puntajePregunta,
            CASE
              WHEN p.IdPregunta BETWEEN 1 AND 10 THEN 'Tecnología'
              WHEN p.IdPregunta BETWEEN 11 AND 20 THEN 'Comunicación'
              WHEN p.IdPregunta BETWEEN 21 AND 30 THEN 'Organización'
              WHEN p.IdPregunta BETWEEN 31 AND 40 THEN 'Datos'
              WHEN p.IdPregunta BETWEEN 41 AND 50 THEN 'Estrategia'
              WHEN p.IdPregunta BETWEEN 51 AND 60 THEN 'Procesos'
              ELSE 'Otra'
            END AS dimension,
            CASE
              WHEN p.IdPregunta BETWEEN 1 AND 10 THEN 'blue'
              WHEN p.IdPregunta BETWEEN 11 AND 20 THEN 'green'
              WHEN p.IdPregunta BETWEEN 21 AND 30 THEN 'purple'
              WHEN p.IdPregunta BETWEEN 31 AND 40 THEN 'orange'
              WHEN p.IdPregunta BETWEEN 41 AND 50 THEN 'red'
              WHEN p.IdPregunta BETWEEN 51 AND 60 THEN 'indigo'
              ELSE 'gray'
            END AS indicadorColor,
            p.Orden AS orden,
            p.TipoDePregunta
        FROM SubRespuesta sr
        LEFT JOIN SubPreguntaRespuesta spr ON sr.IdSubPreguntaRespuesta = spr.IdSubPreguntaRespuesta
        LEFT JOIN SubPregunta sp ON spr.IdSubPregunta = sp.IdSubPregunta
        LEFT JOIN Pregunta p ON sp.IdPregunta = p.IdPregunta
        LEFT JOIN RespuestaPosible rp ON spr.IdRespuestaPosible = rp.IdRespuestaPosible
        LEFT JOIN ResultadoProcesoCalculoPreguntas rpp ON rpp.IdPregunta = p.IdPregunta AND rpp.IdUsuario = @IdUsuario AND rpp.Test = @Test
        WHERE sr.IdUsuario = @IdUsuario AND sr.Test = @Test
        
        ORDER BY orden, IdPregunta;
      `;
      
      request.input('IdUsuario', sql.Int, IdUsuario);
      request.input('Test', sql.Int, Test);
      
      const result = await request.query(responsesQuery);
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting TestUsuario responses: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the most recent TestUsuario for a specific test number
   * @param {Number} empresaId - Company ID
   * @param {Number} testNumber - Test number
   * @returns {Promise<Object>} - Most recent TestUsuario
   */
  static async getLatestTest(empresaId, testNumber) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('empresaId', sql.Int, empresaId);
      request.input('testNumber', sql.Int, testNumber);
      
      const query = `
        SELECT TOP 1
          tu.IdTestUsuario AS idTestUsuario,
          u.IdUsuario AS idUsuario,
          tu.Test AS test,
          'Evaluación Digital ' + CAST(YEAR(tu.FechaTest) AS VARCHAR) AS nombreTest,
          tu.FechaTest AS fechaInicio,
          tu.FechaTerminoTest AS fechaTermino
        FROM TestUsuario tu
        JOIN Usuario u ON u.IdUsuario = tu.IdUsuario
        JOIN Empresa e ON u.IdEmpresa = e.IdEmpresa
        WHERE e.IdEmpresa = @empresaId AND tu.Test = @testNumber AND tu.Finalizado = 1
        ORDER BY tu.FechaTerminoTest DESC
      `;
      
      const result = await request.query(query);
      return result.recordset[0] || null;
    } catch (error) {
      logger.error(`Error getting latest test: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get basic info for a specific TestUsuario
   * @param {Number} empresaId - Company ID
   * @param {Number} testUsuarioId - TestUsuario ID
   * @returns {Promise<Object>} - TestUsuario basic info
   */
  static async getTestUsuarioInfo(empresaId, testUsuarioId) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('empresaId', sql.Int, empresaId);
      request.input('testUsuarioId', sql.Int, testUsuarioId);
      
      const query = `
        SELECT TOP 1
          tu.IdTestUsuario AS idTestUsuario,
          'Evaluación Digital ' + CAST(YEAR(tu.FechaTest) AS VARCHAR) AS nombreTest,
          tu.FechaTest AS fechaInicio,
          tu.FechaTerminoTest AS fechaTermino
        FROM TestUsuario tu
        JOIN Usuario u ON u.IdUsuario = tu.IdUsuario
        JOIN Empresa e ON u.IdEmpresa = e.IdEmpresa
        WHERE e.IdEmpresa = @empresaId AND tu.IdTestUsuario = @testUsuarioId
      `;
      
      const result = await request.query(query);
      return result.recordset[0] || null;
    } catch (error) {
      logger.error(`Error getting TestUsuario info: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get possible answers for a specific question
   * @param {Number} preguntaId - Question ID
   * @returns {Promise<Array>} - Possible answers
   */
  static async getPossibleAnswers(preguntaId) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('preguntaId', sql.Int, preguntaId);
      
      const query = `
        SELECT DISTINCT
          rp.IdRespuestaPosible AS idRespuestaPosible,
          rp.Texto AS textoRespuesta,
          rp.Valor AS valorRespuesta,
          rp.ValorVisible AS valorVisible,
          pr.IdPreguntaRespuesta AS idPreguntaRespuesta
        FROM PreguntaRespuesta pr
        INNER JOIN RespuestaPosible rp ON pr.IdRespuestaPosible = rp.IdRespuestaPosible
        WHERE pr.IdPregunta = @preguntaId
        ORDER BY rp.ValorVisible ASC, rp.Texto ASC
      `;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting possible answers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get possible answers for sub-questions of a specific question
   * @param {Number} preguntaId - Question ID
   * @returns {Promise<Array>} - Possible answers for sub-questions
   */
  static async getPossibleSubAnswers(preguntaId) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('preguntaId', sql.Int, preguntaId);
      
      const query = `
        SELECT DISTINCT
          sp.IdSubPregunta AS idSubPregunta,
          sp.Descripcion AS descripcionSubPregunta,
          sp.Titulo AS tituloSubPregunta,
          rp.IdRespuestaPosible AS idRespuestaPosible,
          rp.Texto AS textoRespuesta,
          rp.Valor AS valorRespuesta,
          rp.ValorVisible AS valorVisible,
          spr.IdSubPreguntaRespuesta AS idSubPreguntaRespuesta
        FROM SubPregunta sp
        INNER JOIN SubPreguntaRespuesta spr ON sp.IdSubPregunta = spr.IdSubPregunta
        INNER JOIN RespuestaPosible rp ON spr.IdRespuestaPosible = rp.IdRespuestaPosible
        WHERE sp.IdPregunta = @preguntaId
        ORDER BY sp.IdSubPregunta ASC, rp.ValorVisible ASC, rp.Texto ASC
      `;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting possible sub-answers: ${error.message}`);
      throw error;
    }
  }
}

module.exports = EncuestaModel;
