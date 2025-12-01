const { poolPromise, sql } = require('../config/database');
const logger = require('../utils/logger');

class EmpresaModel {
  /**
   * Update company information
   * @param {Number} idEmpresa - Company ID to update 
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated company data
   */
  static async updateEmpresa(idEmpresa, updateData) {
    try {
      const pool = await poolPromise;
      const transaction = pool.transaction();
      
      try {
        await transaction.begin();
        
        // First update the Empresa table (name, ruc)
        if (updateData.empresa || updateData.ruc) {
          const empresaRequest = new sql.Request(transaction);
          empresaRequest.input('idEmpresa', sql.Int, idEmpresa);
          
          let updateEmpresaQuery = 'UPDATE Empresa SET ';
          const updateFields = [];
          
          if (updateData.empresa) {
            empresaRequest.input('nombre', sql.VarChar(100), updateData.empresa);
            updateFields.push('Nombre = @nombre');
          }
          
          if (updateData.ruc) {
            empresaRequest.input('ruc', sql.VarChar(50), updateData.ruc);
            updateFields.push('Rut = @ruc');
          }
          
          updateEmpresaQuery += updateFields.join(', ') + ' WHERE IdEmpresa = @idEmpresa';
          await empresaRequest.query(updateEmpresaQuery);
        }
        
        // Get the latest EmpresaInfo record for this empresa
        const findInfoRequest = new sql.Request(transaction);
        findInfoRequest.input('idEmpresa', sql.Int, idEmpresa);
        
        const empresaInfoQuery = `
          SELECT TOP 1 *
          FROM EmpresaInfo
          WHERE IdEmpresa = @idEmpresa
          ORDER BY IdEmpresaInfo DESC
        `;
        
        const infoResult = await findInfoRequest.query(empresaInfoQuery);
        const currentInfo = infoResult.recordset[0];
        
        if (!currentInfo) {
          throw new Error('No EmpresaInfo record found for this company');
        }
        
        // Now update the EmpresaInfo table with all the fields
        const infoRequest = new sql.Request(transaction);
        infoRequest.input('idEmpresaInfo', sql.Int, currentInfo.IdEmpresaInfo);
        
        // Map input parameters based on provided update data
        if (updateData.idDepartamento !== undefined) infoRequest.input('idDepartamento', sql.Int, updateData.idDepartamento);
        if (updateData.idLocalidad !== undefined) infoRequest.input('idLocalidad', sql.Int, updateData.idLocalidad);
        if (updateData.idSectorActividad !== undefined) infoRequest.input('idSectorActividad', sql.Int, updateData.idSectorActividad);
        if (updateData.idSubSectorActividad !== undefined) infoRequest.input('idSubSectorActividad', sql.Int, updateData.idSubSectorActividad);
        if (updateData.idVentas !== undefined) infoRequest.input('idVentas', sql.Int, updateData.idVentas);
        if (updateData.totalEmpleados !== undefined) infoRequest.input('totalEmpleados', sql.Int, updateData.totalEmpleados);
        if (updateData.anioCreacion !== undefined) infoRequest.input('anioCreacion', sql.Int, updateData.anioCreacion);
        if (updateData.sexoGerenteGeneral !== undefined) infoRequest.input('sexoGerenteGeneral', sql.VarChar(50), updateData.sexoGerenteGeneral);
        if (updateData.sexoPropietarioPrincipal !== undefined) infoRequest.input('sexoPropietarioPrincipal', sql.VarChar(50), updateData.sexoPropietarioPrincipal);
        if (updateData.idUsuario !== undefined) {
          // Handle special case for current user
          if (updateData.idUsuario === 'current_user') {
            // Don't update the user ID, keep the current one
            // This is a special case where we want to keep the existing user
          } else {
            infoRequest.input('idUsuario', sql.Int, updateData.idUsuario);
          }
        }
        
        // Build the update query dynamically based on provided fields
        let updateInfoQuery = 'UPDATE EmpresaInfo SET ';
        const updateInfoFields = [];
        
        if (updateData.idDepartamento !== undefined) updateInfoFields.push('IdDepartamento = @idDepartamento');
        if (updateData.idLocalidad !== undefined) updateInfoFields.push('IdLocalidad = @idLocalidad');
        if (updateData.idSectorActividad !== undefined) updateInfoFields.push('IdSectorActividad = @idSectorActividad');
        if (updateData.idSubSectorActividad !== undefined) updateInfoFields.push('IdSubSectorActividad = @idSubSectorActividad');
        if (updateData.idVentas !== undefined) updateInfoFields.push('IdVentas = @idVentas');
        if (updateData.totalEmpleados !== undefined) updateInfoFields.push('TotalEmpleados = @totalEmpleados');
        if (updateData.anioCreacion !== undefined) updateInfoFields.push('AnnoCreacion = @anioCreacion');
        if (updateData.sexoGerenteGeneral !== undefined) updateInfoFields.push('SexoGerenteGeneral = @sexoGerenteGeneral');
        if (updateData.sexoPropietarioPrincipal !== undefined) updateInfoFields.push('SexoPropietarioPrincipal = @sexoPropietarioPrincipal');
        if (updateData.idUsuario !== undefined && updateData.idUsuario !== 'current_user') {
          updateInfoFields.push('IdUsuario = @idUsuario');
        }
        
        if (updateInfoFields.length > 0) {
          updateInfoQuery += updateInfoFields.join(', ') + ' WHERE IdEmpresaInfo = @idEmpresaInfo';
          await infoRequest.query(updateInfoQuery);
        }
        
        // Commit the transaction
        await transaction.commit();
        
        // Get updated company data
        const updatedCompany = await this.getEmpresaById(idEmpresa);
        
        return {
          success: true,
          empresa: updatedCompany
        };
      } catch (error) {
        // Rollback the transaction in case of error
        await transaction.rollback();
        logger.error(`Error updating company: ${error.message}`);
        throw error;
      }
    } catch (error) {
      logger.error(`Error in updateEmpresa: ${error.message}`);
      throw error;
    }
  }
  /**
   * Delete a specific test and its associated data
   * @param {Number} idTestUsuario - Test user ID to delete
   * @returns {Promise<Object>} - Result of deletion
   */
  static async deleteTestOnly(idTestUsuario) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idTestUsuario', sql.Int, idTestUsuario);
      
      // First get the test details to log
      const testDetailsQuery = `
        SELECT tu.IdTestUsuario, tu.IdUsuario, tu.Test, tu.FechaTest, u.Email
        FROM TestUsuario tu
        LEFT JOIN Usuario u ON tu.IdUsuario = u.IdUsuario
        WHERE tu.IdTestUsuario = @idTestUsuario
      `;
      
      const testDetailsResult = await request.query(testDetailsQuery);
      const testDetails = testDetailsResult.recordset[0] || {};
      
      // Begin transaction for safe deletion
      await pool.request().query('BEGIN TRANSACTION');
      
      try {
        // Delete related records for this specific test
        // The order is important to respect foreign key constraints
        const deleteResultadoNivelDigitalOriginalQuery = `
          DELETE FROM ResultadoNivelDigitalOriginal 
          WHERE IdUsuario = ${testDetails.IdUsuario} AND Test = ${testDetails.Test}
        `;
        await pool.request().query(deleteResultadoNivelDigitalOriginalQuery);
        
        const deleteDimensionUsuarioQuery = `
          DELETE FROM DimensionUsuario 
          WHERE IdUsuario = ${testDetails.IdUsuario} AND Test = ${testDetails.Test}
        `;
        await pool.request().query(deleteDimensionUsuarioQuery);
        
        const deleteRecomendacionUsuarioQuery = `
          DELETE FROM RecomendacionUsuario 
          WHERE IdUsuario = ${testDetails.IdUsuario} AND Test = ${testDetails.Test}
        `;
        await pool.request().query(deleteRecomendacionUsuarioQuery);
        
        const deleteRespuestaQuery = `
          DELETE FROM Respuesta 
          WHERE IdUsuario = ${testDetails.IdUsuario} AND Test = ${testDetails.Test}
        `;
        await pool.request().query(deleteRespuestaQuery);
        
        const deleteResultadoNivelDigitalQuery = `
          DELETE FROM ResultadoNivelDigital 
          WHERE IdUsuario = ${testDetails.IdUsuario} AND Test = ${testDetails.Test}
        `;
        await pool.request().query(deleteResultadoNivelDigitalQuery);
        
        const deleteResultadoProcesoCalculoPreguntasQuery = `
          DELETE FROM ResultadoProcesoCalculoPreguntas 
          WHERE IdUsuario = ${testDetails.IdUsuario} AND Test = ${testDetails.Test}
        `;
        await pool.request().query(deleteResultadoProcesoCalculoPreguntasQuery);
        
        const deleteSubRespuestaQuery = `
          DELETE FROM SubRespuesta 
          WHERE IdUsuario = ${testDetails.IdUsuario} AND Test = ${testDetails.Test}
        `;
        await pool.request().query(deleteSubRespuestaQuery);
        
        // Delete the TestUsuario record itself
        const deleteTestUsuarioQuery = `
          DELETE FROM TestUsuario 
          WHERE IdTestUsuario = @idTestUsuario
        `;
        await pool.request().query(deleteTestUsuarioQuery);
        
        // Commit the transaction
        await pool.request().query('COMMIT');
        
        return {
          success: true,
          deletedTest: {
            idTestUsuario: testDetails.IdTestUsuario,
            idUsuario: testDetails.IdUsuario,
            test: testDetails.Test,
            email: testDetails.Email,
            fechaTest: testDetails.FechaTest
          }
        };
      } catch (error) {
        // Rollback the transaction in case of error
        await pool.request().query('ROLLBACK');
        logger.error(`Error deleting test: ${error.message}`);
        throw error;
      }
    } catch (error) {
      logger.error(`Error in deleteTestOnly: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a user and all their tests (but not the empresa)
   * @param {Number} idUsuario - User ID to delete
   * @returns {Promise<Object>} - Result of deletion
   */
  static async deleteUserAndTests(idUsuario) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idUsuario', sql.Int, idUsuario);
      
      // First get the user details to log
      const userDetailsQuery = `
        SELECT 
          u.IdUsuario, 
          u.Email,
          u.RutEmpresa,
          (SELECT COUNT(*) FROM TestUsuario WHERE IdUsuario = u.IdUsuario) AS TestCount
        FROM Usuario u
        WHERE u.IdUsuario = @idUsuario
      `;
      
      const userDetailsResult = await request.query(userDetailsQuery);
      const userDetails = userDetailsResult.recordset[0] || {};
      
      // Begin transaction for safe deletion
      await pool.request().query('BEGIN TRANSACTION');
      
      try {
        // Delete all related records for this user (but not empresa)
        const deleteResultadoNivelDigitalOriginalQuery = `
          DELETE FROM ResultadoNivelDigitalOriginal WHERE IdUsuario = @idUsuario
        `;
        await pool.request().input('idUsuario', sql.Int, idUsuario).query(deleteResultadoNivelDigitalOriginalQuery);
        
        const deleteDimensionUsuarioQuery = `
          DELETE FROM DimensionUsuario WHERE IdUsuario = @idUsuario
        `;
        await pool.request().input('idUsuario', sql.Int, idUsuario).query(deleteDimensionUsuarioQuery);
        
        const deleteRecomendacionUsuarioQuery = `
          DELETE FROM RecomendacionUsuario WHERE IdUsuario = @idUsuario
        `;
        await pool.request().input('idUsuario', sql.Int, idUsuario).query(deleteRecomendacionUsuarioQuery);
        
        const deleteRespuestaQuery = `
          DELETE FROM Respuesta WHERE IdUsuario = @idUsuario
        `;
        await pool.request().input('idUsuario', sql.Int, idUsuario).query(deleteRespuestaQuery);
        
        const deleteResultadoNivelDigitalQuery = `
          DELETE FROM ResultadoNivelDigital WHERE IdUsuario = @idUsuario
        `;
        await pool.request().input('idUsuario', sql.Int, idUsuario).query(deleteResultadoNivelDigitalQuery);
        
        const deleteResultadoProcesoCalculoPreguntasQuery = `
          DELETE FROM ResultadoProcesoCalculoPreguntas WHERE IdUsuario = @idUsuario
        `;
        await pool.request().input('idUsuario', sql.Int, idUsuario).query(deleteResultadoProcesoCalculoPreguntasQuery);
        
        const deleteSubRespuestaQuery = `
          DELETE FROM SubRespuesta WHERE IdUsuario = @idUsuario
        `;
        await pool.request().input('idUsuario', sql.Int, idUsuario).query(deleteSubRespuestaQuery);
        
        // Delete tests
        const deleteTestUsuarioQuery = `
          DELETE FROM TestUsuario WHERE IdUsuario = @idUsuario
        `;
        await pool.request().input('idUsuario', sql.Int, idUsuario).query(deleteTestUsuarioQuery);
        
        // Delete EmpresaInfo for this user
        const deleteEmpresaInfoQuery = `
          DELETE FROM EmpresaInfo WHERE IdUsuario = @idUsuario
        `;
        await pool.request().input('idUsuario', sql.Int, idUsuario).query(deleteEmpresaInfoQuery);
        
        // Finally delete the user
        const deleteUsuarioQuery = `
          DELETE FROM Usuario WHERE IdUsuario = @idUsuario
        `;
        await pool.request().input('idUsuario', sql.Int, idUsuario).query(deleteUsuarioQuery);
        
        // Commit the transaction
        await pool.request().query('COMMIT');
        
        return {
          success: true,
          deletedUser: {
            idUsuario: userDetails.IdUsuario,
            email: userDetails.Email,
            testCount: userDetails.TestCount
          }
        };
      } catch (error) {
        // Rollback the transaction in case of error
        await pool.request().query('ROLLBACK');
        logger.error(`Error deleting user and tests: ${error.message}`);
        throw error;
      }
    } catch (error) {
      logger.error(`Error in deleteUserAndTests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete everything: user, empresa, and all associated data
   * @param {Number} idUsuario - User ID to delete
   * @param {Number} idEmpresa - Empresa ID to delete
   * @returns {Promise<Object>} - Result of deletion
   */
  static async deleteEverything(idUsuario, idEmpresa) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idUsuario', sql.Int, idUsuario);
      request.input('idEmpresa', sql.Int, idEmpresa);
      
      // First get the user details to log
      const userDetailsQuery = `
        SELECT 
          u.IdUsuario, 
          u.Email,
          u.RutEmpresa,
          (SELECT COUNT(*) FROM TestUsuario WHERE IdUsuario = u.IdUsuario) AS TestCount
        FROM Usuario u
        WHERE u.IdUsuario = @idUsuario
      `;
      
      const userDetailsResult = await request.query(userDetailsQuery);
      const userDetails = userDetailsResult.recordset[0] || {};
      
      // Begin transaction for safe deletion
      await pool.request().query('BEGIN TRANSACTION');
      
      try {
        // Delete all users associated with this empresa first
        const deleteAllUsersQuery = `
          SELECT IdUsuario FROM Usuario WHERE RutEmpresa = '${userDetails.RutEmpresa}'
        `;
        const allUsersResult = await pool.request().query(deleteAllUsersQuery);
        const allUsers = allUsersResult.recordset.map(u => u.IdUsuario);
        
        // Delete all data for all users of this empresa
        for (const userId of allUsers) {
          await pool.request().input('userId', sql.Int, userId).query(`
            DELETE FROM ResultadoNivelDigitalOriginal WHERE IdUsuario = @userId
          `);
          
          await pool.request().input('userId', sql.Int, userId).query(`
            DELETE FROM DimensionUsuario WHERE IdUsuario = @userId
          `);
          
          await pool.request().input('userId', sql.Int, userId).query(`
            DELETE FROM RecomendacionUsuario WHERE IdUsuario = @userId
          `);
          
          await pool.request().input('userId', sql.Int, userId).query(`
            DELETE FROM Respuesta WHERE IdUsuario = @userId
          `);
          
          await pool.request().input('userId', sql.Int, userId).query(`
            DELETE FROM ResultadoNivelDigital WHERE IdUsuario = @userId
          `);
          
          await pool.request().input('userId', sql.Int, userId).query(`
            DELETE FROM ResultadoProcesoCalculoPreguntas WHERE IdUsuario = @userId
          `);
          
          await pool.request().input('userId', sql.Int, userId).query(`
            DELETE FROM SubRespuesta WHERE IdUsuario = @userId
          `);
          
          await pool.request().input('userId', sql.Int, userId).query(`
            DELETE FROM TestUsuario WHERE IdUsuario = @userId
          `);
          
          await pool.request().input('userId', sql.Int, userId).query(`
            DELETE FROM EmpresaInfo WHERE IdUsuario = @userId
          `);
        }
        
        // Delete all users
        await pool.request().query(`
          DELETE FROM Usuario WHERE RutEmpresa = '${userDetails.RutEmpresa}'
        `);
        
        // Delete empresa data
        await pool.request().input('idEmpresa', sql.Int, idEmpresa).query(`
          DELETE FROM EmpresaPregunta WHERE IdEmpresa = @idEmpresa
        `);
        
        await pool.request().input('idEmpresa', sql.Int, idEmpresa).query(`
          DELETE FROM EmpresaTest WHERE IdEmpresa = @idEmpresa
        `);
        
        await pool.request().input('idEmpresa', sql.Int, idEmpresa).query(`
          DELETE FROM Empresa WHERE IdEmpresa = @idEmpresa
        `);
        
        // Commit the transaction
        await pool.request().query('COMMIT');
        
        return {
          success: true,
          deletedUsers: allUsers.length,
          deletedEmpresa: {
            idEmpresa: idEmpresa,
            rutEmpresa: userDetails.RutEmpresa
          }
        };
      } catch (error) {
        // Rollback the transaction in case of error
        await pool.request().query('ROLLBACK');
        logger.error(`Error deleting everything: ${error.message}`);
        throw error;
      }
    } catch (error) {
      logger.error(`Error in deleteEverything: ${error.message}`);
      throw error;
    }
  }
  /**
   * Get companies with pagination and filters
   * @param {Object} options - Query options
   * @param {Number} options.page - Page number
   * @param {Number} options.limit - Number of items per page
   * @param {String} options.searchTerm - Search term
   * @param {Object} options.filters - Filter options
   * @returns {Promise<Object>} - Paginated result with companies and count
   */
  static async getEmpresas({ page = 1, limit = 10, searchTerm = '', filters = {}, finalizado = 1 }) {
    try {
      const offset = (page - 1) * limit;

      // normaliza filtros - arreglar lógica del toggle
      const onlyFinal = filters.estadoEncuesta === undefined ? finalizado : (filters.estadoEncuesta === true ? 1 : 0);

      const pool = await poolPromise;

      // Construir condiciones SQL para filtros
      const buildWhereClause = () => {
        const conditions = [];
        let allParams = [];
        
        // Función para mapear niveles de innovación
        const mapInnovationLevel = (level) => {
          // Los nombres ya están correctos en la base de datos, no necesitamos mapear
          return level;
        };
        
        // Función para agregar condición IN para arrays
        const addInCondition = (field, values, table, paramPrefix, joinField) => {
          if (values && Array.isArray(values) && values.length > 0) {
            const paramNames = [];
            const params = [];
            
            values.forEach((value, index) => {
              const paramName = `${paramPrefix}${index}`;
              paramNames.push(`@${paramName}`);
              params.push({ name: paramName, value });
            });
            
            // Construir condiciones usando EXISTS con la relación correcta
            // Para SubRegion, usar IdSubRegion como clave primaria
            const primaryKey = table.includes('SubRegion') ? 'IdSubRegion' : joinField;
            const condition = `EXISTS (SELECT 1 FROM ${table} t WITH (NOLOCK) WHERE t.${field} IN (${paramNames.join(', ')}) AND t.${primaryKey} = ei.${joinField})`;
            conditions.push(condition);
            return params;
          }
          return [];
        };
        
        // Agregar condiciones para cada filtro
        if (filters.departamento && Array.isArray(filters.departamento) && filters.departamento.length > 0) {
          // Separar "Capital" de los departamentos normales
          const departamentosNormales = filters.departamento.filter(d => d !== 'Capital');
          const incluirCapital = filters.departamento.includes('Capital');
          
          if (departamentosNormales.length > 0) {
            const depParams = addInCondition('Nombre', departamentosNormales, 'dbo.Departamentos', 'dep', 'IdDepartamento');
            allParams = [...allParams, ...depParams];
          }
          
          if (incluirCapital) {
            conditions.push(`EXISTS (
              SELECT 1 FROM dbo.SubRegion sr_cap 
              WHERE sr_cap.IdSubRegion = ei.IdLocalidad 
              AND sr_cap.IdRegion = 20
            )`);
          }
        }
        
        if (filters.distrito && Array.isArray(filters.distrito) && filters.distrito.length > 0) {
          // Separar "OTRO" de los distritos normales
          const distritosNormales = filters.distrito.filter(d => d !== 'OTRO');
          const incluirOtro = filters.distrito.includes('OTRO');
          
          if (distritosNormales.length > 0) {
            const distParams = addInCondition('Nombre', distritosNormales, 'dbo.SubRegion', 'dist', 'IdLocalidad');
            allParams = [...allParams, ...distParams];
          }
          
          if (incluirOtro) {
            conditions.push('ei.IdLocalidad IS NULL');
          }
        }
        
        if (filters.nivelInnovacion && Array.isArray(filters.nivelInnovacion) && filters.nivelInnovacion.length > 0) {
          // Mapear nombres actualizados a los originales en la base de datos
          const dbNivelesInnovacion = filters.nivelInnovacion.map(mapInnovationLevel);
          const paramNames = [];
          const params = [];
          
          dbNivelesInnovacion.forEach((value, index) => {
            const paramName = `nivel${index}`;
            paramNames.push(`@${paramName}`);
            params.push({ name: paramName, value });
          });
          
          // Para nivel de innovación, necesitamos unir con ResultadoNivelDigital
          const condition = `EXISTS (SELECT 1 FROM dbo.ResultadoNivelDigital rnd WITH (NOLOCK) 
            INNER JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
            WHERE rnd.IdUsuario = ei.IdUsuario AND rnd.Test = ei.Test 
            AND nm.Descripcion IN (${paramNames.join(', ')}))`;
          conditions.push(condition);
          allParams = [...allParams, ...params];
        }
        
        if (filters.sectorActividad && Array.isArray(filters.sectorActividad) && filters.sectorActividad.length > 0) {
          const sectorParams = addInCondition('Descripcion', filters.sectorActividad, 'dbo.SectorActividad', 'sector', 'IdSectorActividad');
          allParams = [...allParams, ...sectorParams];
        }
        
        if (filters.subSectorActividad && Array.isArray(filters.subSectorActividad) && filters.subSectorActividad.length > 0) {
          const subsectorParams = addInCondition('Descripcion', filters.subSectorActividad, 'dbo.SubSectorActividad', 'subsector', 'IdSubSectorActividad');
          allParams = [...allParams, ...subsectorParams];
        }
        
        if (filters.tamanoEmpresa && Array.isArray(filters.tamanoEmpresa) && filters.tamanoEmpresa.length > 0) {
          const tamanoParams = [];
          const paramNames = [];
          
          filters.tamanoEmpresa.forEach((value, index) => {
            const paramName = `tamano${index}`;
            paramNames.push(`@${paramName}`);
            tamanoParams.push({ name: paramName, value });
          });
          
          // Para tamaño de empresa, necesitamos unir con VentasAnuales
          const condition = `EXISTS (SELECT 1 FROM dbo.VentasAnuales va WITH (NOLOCK) 
            WHERE va.IdVentasAnuales = ei.IdVentas 
            AND va.Nombre IN (${paramNames.join(', ')}))`;
          conditions.push(condition);
          allParams = [...allParams, ...tamanoParams];
        }
        
        // NO agregar filtros de fecha aquí - se manejan por separado en el CTE Filtered
        // porque tu.FechaTest solo está disponible en ese contexto y para evitar duplicación de parámetros
        
        return { 
          whereConditions: conditions,
          allParams 
        };
      };
      
      const { whereConditions, allParams } = buildWhereClause();
      
      // Parámetros básicos (no relacionados con filtros)
      const addBasicParams = (req) => {
        req.input('offset',     sql.Int,           offset);
        req.input('limit',      sql.Int,           limit);
        req.input('searchTerm', sql.NVarChar(200), searchTerm || null);
        req.input('finalizado', sql.Bit,           onlyFinal);
        
        // Agregar parámetros de filtros
        allParams.forEach(param => {
          req.input(param.name, sql.NVarChar(500), param.value);
        });
        
        // Agregar parámetros de fecha con el tipo correcto
        dateParams.forEach(param => {
          req.input(param.name, sql.Date, param.value);
        });
      };

      // Separar condiciones que requieren NivelMadurez de las que no
      const basicConditions = [];
      let nivelInnovacionCondition = '';
      let nivelInnovacionParams = [];
      
      // Procesar condiciones básicas
      whereConditions.forEach(condition => {
        if (condition.includes('ResultadoNivelDigital') && condition.includes('NivelMadurez')) {
          // Esta es la condición de nivel de innovación - la guardamos por separado
          nivelInnovacionCondition = condition;
        } else {
          basicConditions.push(condition);
        }
      });
      
      // Extraer parámetros de nivel de innovación
      allParams.forEach(param => {
        if (param.name.startsWith('nivel')) {
          nivelInnovacionParams.push(param);
        }
      });

      // Construir condiciones de fecha para el CTE Filtered
      const dateConditions = [];
      const dateParams = [];
      if (filters.fechaIni) {
        dateConditions.push('tu.FechaTest >= @fechaIni');
        dateParams.push({ name: 'fechaIni', value: filters.fechaIni });
      }
      if (filters.fechaFin) {
        dateConditions.push('tu.FechaTest <= @fechaFin');
        dateParams.push({ name: 'fechaFin', value: filters.fechaFin });
      }
      const dateConditionsText = dateConditions.length > 0 ? 'AND ' + dateConditions.join(' AND ') : '';

      const DATA_QUERY = `
/* ===== 1 fila por IdTestUsuario, con paginado y total correctos ===== */
WITH Filtered AS (
  SELECT tu.IdTestUsuario, tu.IdUsuario, tu.Test, tu.FechaTest, tu.FechaTerminoTest
  FROM dbo.TestUsuario tu WITH (NOLOCK)
  WHERE (@finalizado IS NULL OR tu.Finalizado = @finalizado)
    AND EXISTS (SELECT 1 FROM dbo.Respuesta r WITH (NOLOCK)
                WHERE r.IdUsuario = tu.IdUsuario AND r.Test = tu.Test)
    ${dateConditionsText}
),
Enriched AS (
  /* 1 solo EmpresaInfo por (usuario,test) */
SELECT 
    f.IdTestUsuario, f.IdUsuario, f.Test, f.FechaTest, f.FechaTerminoTest,
    ei.IdEmpresa, ei.IdDepartamento, ei.IdLocalidad, ei.IdSectorActividad, ei.IdSubSectorActividad, ei.IdVentas,
    ei.AnnoCreacion, ei.TotalEmpleados, ei.SexoGerenteGeneral, ei.SexoPropietarioPrincipal,
    sr.IdRegion
  FROM Filtered f
  OUTER APPLY (
    SELECT TOP (1) ei.*
    FROM dbo.EmpresaInfo ei WITH (NOLOCK)
    WHERE ei.IdUsuario = f.IdUsuario AND ei.Test = f.Test
    ORDER BY ei.IdEmpresa DESC
  ) ei
  OUTER APPLY (
    SELECT TOP (1) sr.IdRegion
    FROM dbo.SubRegion sr WITH (NOLOCK)
    WHERE sr.IdSubRegion = ei.IdLocalidad
  ) sr
  WHERE 1=1
    ${basicConditions.length > 0 ? 'AND ' + basicConditions.join(' AND ') : ''}
  AND (
       @searchTerm IS NULL
    OR EXISTS (SELECT 1 FROM dbo.Empresa e WITH (NOLOCK)
               WHERE e.IdEmpresa = ei.IdEmpresa AND e.Nombre LIKE @searchTerm + '%')
    OR EXISTS (SELECT 1 FROM dbo.Departamentos dep WITH (NOLOCK)
               WHERE dep.IdDepartamento = ei.IdDepartamento AND dep.Nombre LIKE @searchTerm + '%')
    OR EXISTS (SELECT 1 FROM dbo.SubRegion sr WITH (NOLOCK)
               WHERE sr.IdSubRegion = ei.IdLocalidad AND sr.Nombre LIKE @searchTerm + '%')
    OR EXISTS (SELECT 1 FROM dbo.SectorActividad sa WITH (NOLOCK)
               WHERE sa.IdSectorActividad = ei.IdSectorActividad AND sa.Descripcion LIKE @searchTerm + '%')
  )
),
Dedup AS (
  SELECT e.*,
         ROW_NUMBER() OVER (PARTITION BY e.IdTestUsuario ORDER BY e.FechaTest DESC, e.IdTestUsuario DESC) AS rn
  FROM Enriched e
),
/* Aplicar filtro de nivel de innovación después de obtener NivelMadurez */
WithNivelMadurez AS (
  SELECT d.*,
         nm.Descripcion as NivelMadurezDescripcion
  FROM Dedup d
  OUTER APPLY (
    SELECT TOP (1) rnd.IdNivelMadurez
    FROM dbo.ResultadoNivelDigital rnd WITH (NOLOCK)
    WHERE rnd.IdUsuario = d.IdUsuario AND rnd.Test = d.Test
    ORDER BY rnd.IdResultadoNivelDigital DESC
  ) rnd
  OUTER APPLY (
    SELECT TOP (1) nm.Descripcion
    FROM dbo.NivelMadurez nm WITH (NOLOCK)
    WHERE nm.IdNivelMadurez = rnd.IdNivelMadurez
  ) nm
  WHERE d.rn = 1
    ${nivelInnovacionCondition ? 'AND ' + nivelInnovacionCondition.replace('ei.IdUsuario', 'd.IdUsuario').replace('ei.Test', 'd.Test') : ''}
),
/* ⚠️ Cerramos aquí la cardinalidad y el total para que no "explote" luego */
Base AS (
  SELECT
    w.*,
    ROW_NUMBER() OVER (ORDER BY w.FechaTest DESC, w.IdTestUsuario DESC) AS RowNum,
    COUNT(*) OVER() AS TotalRows
  FROM WithNivelMadurez w
),
/* Paginamos sobre Base primero (1×IdTestUsuario) */
Page AS (
  SELECT *
  FROM Base
  WHERE RowNum BETWEEN @offset + 1 AND @offset + @limit
)
/* Decoramos la página con nombres/descr. usando APPLY (1:1), sin multiplicar */
SELECT
  p.IdTestUsuario,
  p.IdUsuario,
  p.IdEmpresa,
  e.Nombre                           AS empresa,
  u.NombreCompleto                   AS nombreCompleto,
  u.Email                            AS email,
  COALESCE(sr.Nombre, 'OTRO')        AS distrito,
  CASE 
    WHEN sr.IdRegion = 20 THEN 'Capital'
    ELSE dep.Nombre 
  END                                AS departamento,
  sa.Descripcion                     AS sectorActividadDescripcion,
  ssa.Descripcion                    AS subSectorActividadDescripcion,
  p.TotalEmpleados AS totalEmpleados,
  va.Nombre                          AS ventasAnuales,
  rnd.ptjeTotalUsuario               AS puntajeNivelDeMadurezGeneral,
  p.NivelMadurezDescripcion          AS nivelDeMadurezGeneral,
  rnd.ptjeDimensionTecnologia       AS ptjeDimensionTecnologia,
  rnd.ptjeDimensionComunicacion      AS ptjeDimensionComunicacion,
  rnd.ptjeDimensionOrganizacion      AS ptjeDimensionOrganizacion,
  rnd.ptjeDimensionDatos             AS ptjeDimensionDatos,
  rnd.ptjeDimensionEstrategia        AS ptjeDimensionEstrategia,
  rnd.ptjeDimensionProcesos           AS ptjeDimensionProcesos,
  CONVERT(VARCHAR(10), p.FechaTest, 103) + ' ' + CONVERT(VARCHAR(8), p.FechaTest, 14) AS fechaTest,
  p.TotalRows
FROM Page p
OUTER APPLY (SELECT TOP (1) e.*   FROM dbo.Empresa        e  WHERE e.IdEmpresa          = p.IdEmpresa)        e
OUTER APPLY (SELECT TOP (1) u.*   FROM dbo.Usuario        u  WHERE u.IdUsuario          = p.IdUsuario)        u
OUTER APPLY (SELECT TOP (1) dep.* FROM dbo.Departamentos  dep WHERE dep.IdDepartamento   = p.IdDepartamento)  dep
OUTER APPLY (SELECT TOP (1) sr.*  FROM dbo.SubRegion      sr  WHERE sr.IdSubRegion       = p.IdLocalidad)     sr
OUTER APPLY (SELECT TOP (1) sa.*  FROM dbo.SectorActividad sa WHERE sa.IdSectorActividad = p.IdSectorActividad) sa
OUTER APPLY (SELECT TOP (1) ssa.* FROM dbo.SubSectorActividad ssa WHERE ssa.IdSubSectorActividad = p.IdSubSectorActividad) ssa
OUTER APPLY (SELECT TOP (1) va.*  FROM dbo.VentasAnuales  va  WHERE va.IdVentasAnuales   = p.IdVentas)        va
OUTER APPLY (
  SELECT TOP (1) rnd.IdNivelMadurez, 
         rnd.ptjeTotalUsuario,
         rnd.ptjeDimensionTecnologia,
         rnd.ptjeDimensionComunicacion,
         rnd.ptjeDimensionOrganizacion,
         rnd.ptjeDimensionDatos,
         rnd.ptjeDimensionEstrategia,
         rnd.ptjeDimensionProcesos
  FROM dbo.ResultadoNivelDigital rnd
  WHERE rnd.IdUsuario = p.IdUsuario AND rnd.Test = p.Test
  ORDER BY rnd.IdResultadoNivelDigital DESC
) rnd
ORDER BY p.RowNum
OPTION (RECOMPILE);
`;

      // Construir la consulta final reemplazando los marcadores
      let finalQuery = DATA_QUERY;
      
      // Reemplazar condiciones básicas
      const basicConditionsText = basicConditions.length > 0 ? 'AND ' + basicConditions.join(' AND ') : '';
      finalQuery = finalQuery.replace('${basicConditions.length > 0 ? \'AND \' + basicConditions.join(\' AND \') : \'\'}', basicConditionsText);
      
      // Reemplazar condición de nivel de innovación
      const nivelInnovacionText = nivelInnovacionCondition ? 'AND ' + nivelInnovacionCondition.replace(/ei\.IdUsuario/g, 'd.IdUsuario').replace(/ei\.Test/g, 'd.Test') : '';
      finalQuery = finalQuery.replace('${nivelInnovacionCondition ? \'AND \' + nivelInnovacionCondition.replace(\'ei.IdUsuario\', \'d.IdUsuario\').replace(\'ei.Test\', \'d.Test\') : \'\'}', nivelInnovacionText);

      // Debug: Log the generated query when filtering by nivelInnovacion
      if (filters.nivelInnovacion && filters.nivelInnovacion.length > 0) {
        logger.info(`[DEBUG] Filtering by nivelInnovacion: ${JSON.stringify(filters.nivelInnovacion)}`);
        logger.info(`[DEBUG] Basic conditions: ${JSON.stringify(basicConditions)}`);
        logger.info(`[DEBUG] Original NivelInnovacion condition: ${nivelInnovacionCondition}`);
        const replacedCondition = nivelInnovacionCondition.replace(/ei\.IdUsuario/g, 'd.IdUsuario').replace(/ei\.Test/g, 'd.Test');
        logger.info(`[DEBUG] Replaced NivelInnovacion condition: ${replacedCondition}`);
        logger.info(`[DEBUG] NivelInnovacion text to insert: ${nivelInnovacionText}`);
        
        // Find the WithNivelMadurez section and show it
        const withNivelIndex = finalQuery.indexOf('WithNivelMadurez AS');
        if (withNivelIndex > -1) {
          const snippet = finalQuery.substring(withNivelIndex - 100, withNivelIndex + 800);
          logger.info(`[DEBUG] WithNivelMadurez section: ${snippet}`);
        }
      }

      // ejecuta (SOLO una query ahora)
      const dataReq = pool.request(); 
      addBasicParams(dataReq);
      const dataRs = await dataReq.query(finalQuery);

      const totalCount = dataRs.recordset[0]?.TotalRows ?? 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: dataRs.recordset,
        pagination: { total: totalCount, page, limit, totalPages }
      };
    } catch (err) {
      logger.error(`Error getting empresas: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Get company details by ID
   * @param {Number} idEmpresa - Company ID
   * @param {Number} idTestUsuario - Optional TestUsuario ID to get specific test details
   * @returns {Promise<Object>} - Company details
   */
  static async getEmpresaById(idEmpresa, idTestUsuario = null) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idEmpresa', sql.Int, idEmpresa);
      
      let query;
      
      if (idTestUsuario) {
        // Si se proporciona idTestUsuario, obtener datos específicos de ese test
        request.input('idTestUsuario', sql.Int, idTestUsuario);
        
        query = `
          SELECT
            e.IdEmpresa,
            e.Nombre AS empresa,
            e.Rut AS ruc,
            sr.Nombre AS distrito,
            dep.Nombre AS departamento,
            CASE 
              WHEN sr.Nombre IS NOT NULL AND dep.Nombre IS NOT NULL THEN CONCAT(sr.Nombre, ', ', dep.Nombre)
              WHEN sr.Nombre IS NOT NULL THEN sr.Nombre
              WHEN dep.Nombre IS NOT NULL THEN dep.Nombre
              ELSE 'S/D'
            END AS ubicacion,
            sa.Descripcion AS sectorActividadDescripcion,
            ssa.Descripcion AS subSectorActividadDescripcion,
            ei.AnnoCreacion AS anioCreacion,
            ei.TotalEmpleados,
            va.Nombre AS ventasAnuales,
            ei.SexoGerenteGeneral,
            ei.SexoPropietarioPrincipal,
            u.NombreCompleto AS nombreEncuestado,
            u.Email AS emailEncuestado,
            tu.IdUsuario,
            tu.Test,
            tu.IdTestUsuario,
            rnd.ptjeTotalUsuario AS puntajeGeneral,
            nm.Descripcion AS nivelMadurez,
            rnd.ptjeDimensionTecnologia AS puntajeTecnologia,
            rnd.ptjeDimensionComunicacion AS puntajeComunicacion,
            rnd.ptjeDimensionOrganizacion AS puntajeOrganizacion,
            rnd.ptjeDimensionDatos AS puntajeDatos,
            rnd.ptjeDimensionEstrategia AS puntajeEstrategia,
            rnd.ptjeDimensionProcesos AS puntajeProcesos,
            tu.FechaTest
          FROM Empresa e
          INNER JOIN TestUsuario tu ON tu.IdTestUsuario = @idTestUsuario
          INNER JOIN EmpresaInfo ei ON e.IdEmpresa = ei.IdEmpresa AND ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
          LEFT JOIN Usuario u ON ei.IdUsuario = u.IdUsuario
          LEFT JOIN Departamentos dep ON ei.IdDepartamento = dep.IdDepartamento
          LEFT JOIN SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
          LEFT JOIN SectorActividad sa ON ei.IdSectorActividad = sa.IdSectorActividad
          LEFT JOIN SubSectorActividad ssa ON ei.IdSubSectorActividad = ssa.IdSubSectorActividad
          LEFT JOIN VentasAnuales va ON ei.IdVentas = va.IdVentasAnuales
          LEFT JOIN ResultadoNivelDigital rnd ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
          LEFT JOIN NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
          WHERE e.IdEmpresa = @idEmpresa
        `;
      } else {
        // Si no se proporciona idTestUsuario, obtener el test más reciente
        // Ordenar por Test (número más alto primero) y luego por FechaTest (más reciente primero)
        query = `
          WITH LatestTest AS (
            SELECT TOP 1 
              tu.IdUsuario,
              tu.Test,
              tu.IdTestUsuario,
              tu.FechaTest
            FROM EmpresaInfo ei
            INNER JOIN TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
            WHERE ei.IdEmpresa = @idEmpresa
            ORDER BY tu.Test DESC, tu.FechaTest DESC
          )
          SELECT
            e.IdEmpresa,
            e.Nombre AS empresa,
            e.Rut AS ruc,
            sr.Nombre AS distrito,
            dep.Nombre AS departamento,
            CASE 
              WHEN sr.Nombre IS NOT NULL AND dep.Nombre IS NOT NULL THEN CONCAT(sr.Nombre, ', ', dep.Nombre)
              WHEN sr.Nombre IS NOT NULL THEN sr.Nombre
              WHEN dep.Nombre IS NOT NULL THEN dep.Nombre
              ELSE 'S/D'
            END AS ubicacion,
            sa.Descripcion AS sectorActividadDescripcion,
            ssa.Descripcion AS subSectorActividadDescripcion,
            ei.AnnoCreacion AS anioCreacion,
            ei.TotalEmpleados,
            va.Nombre AS ventasAnuales,
            ei.SexoGerenteGeneral,
            ei.SexoPropietarioPrincipal,
            u.NombreCompleto AS nombreEncuestado,
            u.Email AS emailEncuestado,
            lt.IdUsuario,
            lt.Test,
            lt.IdTestUsuario,
            rnd.ptjeTotalUsuario AS puntajeGeneral,
            nm.Descripcion AS nivelMadurez,
            rnd.ptjeDimensionTecnologia AS puntajeTecnologia,
            rnd.ptjeDimensionComunicacion AS puntajeComunicacion,
            rnd.ptjeDimensionOrganizacion AS puntajeOrganizacion,
            rnd.ptjeDimensionDatos AS puntajeDatos,
            rnd.ptjeDimensionEstrategia AS puntajeEstrategia,
            rnd.ptjeDimensionProcesos AS puntajeProcesos,
            lt.FechaTest
          FROM Empresa e
          INNER JOIN EmpresaInfo ei ON e.IdEmpresa = ei.IdEmpresa
          INNER JOIN LatestTest lt ON ei.IdUsuario = lt.IdUsuario AND ei.Test = lt.Test
          LEFT JOIN Usuario u ON ei.IdUsuario = u.IdUsuario
          LEFT JOIN Departamentos dep ON ei.IdDepartamento = dep.IdDepartamento
          LEFT JOIN SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
          LEFT JOIN SectorActividad sa ON ei.IdSectorActividad = sa.IdSectorActividad
          LEFT JOIN SubSectorActividad ssa ON ei.IdSubSectorActividad = ssa.IdSubSectorActividad
          LEFT JOIN VentasAnuales va ON ei.IdVentas = va.IdVentasAnuales
          LEFT JOIN ResultadoNivelDigital rnd ON lt.IdUsuario = rnd.IdUsuario AND lt.Test = rnd.Test
          LEFT JOIN NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
          WHERE e.IdEmpresa = @idEmpresa
        `;
      }
      
      const result = await request.query(query);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      
      return result.recordset[0];
    } catch (error) {
      logger.error(`Error getting empresa by ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get KPIs for companies list
   * @param {Number} finalizado - Filter by finalized status (1 = finalized, 0 = not finalized)
   * @param {Object} filters - Additional filters (departamento, distrito, nivelInnovacion, sectorActividad)
   * @returns {Promise<Object>} - KPI data
   */
  static async getKPIs(finalizado = 1, filters = {}) {
    try {
      const pool = await poolPromise;
      
      // Construir condiciones SQL para filtros
      const buildWhereClause = () => {
        const conditions = [];
        let allParams = [];
        
        // Función para mapear niveles de innovación
        const mapInnovationLevel = (level) => {
          // Los nombres ya están correctos en la base de datos, no necesitamos mapear
          return level;
        };
        
        // Función para agregar condición IN para arrays
        const addInCondition = (field, values, table, paramPrefix, joinField) => {
          if (values && Array.isArray(values) && values.length > 0) {
            const paramNames = [];
            const params = [];
            
            values.forEach((value, index) => {
              const paramName = `${paramPrefix}${index}`;
              paramNames.push(`@${paramName}`);
              params.push({ name: paramName, value });
            });
            
            // Construir condiciones usando EXISTS con la relación correcta
            // Para SubRegion, usar IdSubRegion como clave primaria
            const primaryKey = table.includes('SubRegion') ? 'IdSubRegion' : joinField;
            const condition = `EXISTS (SELECT 1 FROM ${table} t WITH (NOLOCK) WHERE t.${field} IN (${paramNames.join(', ')}) AND t.${primaryKey} = ei.${joinField})`;
            conditions.push(condition);
            return params;
          }
          return [];
        };
        
        // Agregar condiciones para cada filtro
        if (filters.departamento && Array.isArray(filters.departamento) && filters.departamento.length > 0) {
          // Separar "Capital" de los departamentos normales
          const departamentosNormales = filters.departamento.filter(d => d !== 'Capital');
          const incluirCapital = filters.departamento.includes('Capital');
          
          if (departamentosNormales.length > 0) {
            const depParams = addInCondition('Nombre', departamentosNormales, 'dbo.Departamentos', 'dep', 'IdDepartamento');
            allParams = [...allParams, ...depParams];
          }
          
          if (incluirCapital) {
            conditions.push(`EXISTS (
              SELECT 1 FROM dbo.SubRegion sr_cap 
              WHERE sr_cap.IdSubRegion = ei.IdLocalidad 
              AND sr_cap.IdRegion = 20
            )`);
          }
        }
        
        if (filters.distrito && Array.isArray(filters.distrito) && filters.distrito.length > 0) {
          // Separar "OTRO" de los distritos normales
          const distritosNormales = filters.distrito.filter(d => d !== 'OTRO');
          const incluirOtro = filters.distrito.includes('OTRO');
          
          if (distritosNormales.length > 0) {
            const distParams = addInCondition('Nombre', distritosNormales, 'dbo.SubRegion', 'dist', 'IdLocalidad');
            allParams = [...allParams, ...distParams];
          }
          
          if (incluirOtro) {
            conditions.push('ei.IdLocalidad IS NULL');
          }
        }
        
        if (filters.nivelInnovacion && Array.isArray(filters.nivelInnovacion) && filters.nivelInnovacion.length > 0) {
          // Mapear nombres actualizados a los originales en la base de datos
          const dbNivelesInnovacion = filters.nivelInnovacion.map(mapInnovationLevel);
          const paramNames = [];
          const params = [];
          
          dbNivelesInnovacion.forEach((value, index) => {
            const paramName = `nivel${index}`;
            paramNames.push(`@${paramName}`);
            params.push({ name: paramName, value });
          });
          
          // Para nivel de innovación, necesitamos unir con ResultadoNivelDigital
          const condition = `EXISTS (SELECT 1 FROM dbo.ResultadoNivelDigital rnd WITH (NOLOCK) 
            INNER JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
            WHERE rnd.IdUsuario = ei.IdUsuario AND rnd.Test = ei.Test 
            AND nm.Descripcion IN (${paramNames.join(', ')}))`;
          conditions.push(condition);
          allParams = [...allParams, ...params];
        }
        
        if (filters.sectorActividad && Array.isArray(filters.sectorActividad) && filters.sectorActividad.length > 0) {
          const sectorParams = addInCondition('Descripcion', filters.sectorActividad, 'dbo.SectorActividad', 'sector', 'IdSectorActividad');
          allParams = [...allParams, ...sectorParams];
        }
        
        if (filters.subSectorActividad && Array.isArray(filters.subSectorActividad) && filters.subSectorActividad.length > 0) {
          const subsectorParams = addInCondition('Descripcion', filters.subSectorActividad, 'dbo.SubSectorActividad', 'subsector', 'IdSubSectorActividad');
          allParams = [...allParams, ...subsectorParams];
        }
        
        if (filters.tamanoEmpresa && Array.isArray(filters.tamanoEmpresa) && filters.tamanoEmpresa.length > 0) {
          const tamanoParams = [];
          const paramNames = [];
          
          filters.tamanoEmpresa.forEach((value, index) => {
            const paramName = `tamano${index}`;
            paramNames.push(`@${paramName}`);
            tamanoParams.push({ name: paramName, value });
          });
          
          // Para tamaño de empresa, necesitamos unir con VentasAnuales
          const condition = `EXISTS (SELECT 1 FROM dbo.VentasAnuales va WITH (NOLOCK) 
            WHERE va.IdVentasAnuales = ei.IdVentas 
            AND va.Nombre IN (${paramNames.join(', ')}))`;
          conditions.push(condition);
          allParams = [...allParams, ...tamanoParams];
        }
        
        // NO agregar filtros de fecha aquí - se manejan por separado en el CTE TestsUnicos
        // porque tu.FechaTest solo está disponible en ese contexto
        
        return { 
          whereConditions: conditions,
          allParams 
        };
      };
      
      const { whereConditions, allParams } = buildWhereClause();
      
      // Construir condiciones de fecha para el CTE TestsUnicos
      const dateConditions = [];
      const dateParams = [];
      if (filters.fechaIni) {
        dateConditions.push('tu.FechaTest >= @fechaIni');
        dateParams.push({ name: 'fechaIni', value: filters.fechaIni });
      }
      if (filters.fechaFin) {
        dateConditions.push('tu.FechaTest <= @fechaFin');
        dateParams.push({ name: 'fechaFin', value: filters.fechaFin });
      }
      const dateConditionsText = dateConditions.length > 0 ? 'AND ' + dateConditions.join(' AND ') : '';
      
      const req = pool.request();
      req.input('finalizado', sql.Bit, finalizado);
      
      // Agregar parámetros de filtros
      allParams.forEach(param => {
        req.input(param.name, sql.NVarChar(500), param.value);
      });
      
      // Agregar parámetros de fecha con el tipo correcto
      dateParams.forEach(param => {
        req.input(param.name, sql.Date, param.value);
      });

      const KPI_QUERY = `
      WITH TestsUnicos AS (
        SELECT DISTINCT tu.IdUsuario, tu.Test, tu.IdTestUsuario, tu.Finalizado
        FROM dbo.TestUsuario tu WITH (NOLOCK)
        WHERE tu.Finalizado = @finalizado
        ${dateConditionsText}
      ),
      EmpresasInfo AS (
        SELECT 
          ei.IdEmpresa, 
          ei.IdUsuario, 
          ei.Test, 
          ei.TotalEmpleados,
          ei.IdDepartamento,
          ei.IdLocalidad,
          ei.IdSectorActividad,
          ei.IdSubSectorActividad,
          ei.IdVentas,
          e.Nombre AS NombreEmpresa
        FROM dbo.EmpresaInfo ei WITH (NOLOCK)
        INNER JOIN TestsUnicos tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
        LEFT JOIN dbo.Empresa e WITH (NOLOCK) ON ei.IdEmpresa = e.IdEmpresa
      ),
      ResultadosNivel AS (
        SELECT 
          rnd.IdUsuario,
          rnd.Test,
          rnd.ptjeTotalUsuario,
          nm.Descripcion AS NivelMadurez
        FROM dbo.ResultadoNivelDigital rnd WITH (NOLOCK)
        INNER JOIN TestsUnicos tu ON rnd.IdUsuario = tu.IdUsuario AND rnd.Test = tu.Test
        LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
      ),
      Base AS (
        SELECT 
          -- Para "NO TENGO", contar por IdUsuario; para otras empresas, contar por IdEmpresa
          COUNT(DISTINCT 
            CASE 
              WHEN ei.NombreEmpresa = 'NO TENGO' THEN CONCAT('U_', ei.IdUsuario)
              ELSE CONCAT('E_', ei.IdEmpresa)
            END
          ) AS totalEmpresas,
          AVG(ISNULL(rn.ptjeTotalUsuario, 0)) AS nivelGeneral,
          -- Para incipientes también aplicar la misma lógica
          COUNT(DISTINCT 
            CASE 
              WHEN rn.NivelMadurez = 'Inicial' THEN 
                CASE 
                  WHEN ei.NombreEmpresa = 'NO TENGO' THEN CONCAT('U_', ei.IdUsuario)
                  ELSE CONCAT('E_', ei.IdEmpresa)
                END
            END
          ) AS empresasIncipientes,
          SUM(CASE WHEN ei.TotalEmpleados > 0 THEN ei.TotalEmpleados ELSE 0 END) AS totalEmpleados
        FROM EmpresasInfo ei
        LEFT JOIN ResultadosNivel rn ON ei.IdUsuario = rn.IdUsuario AND ei.Test = rn.Test
        WHERE 1=1
        ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
      )
      SELECT
        totalEmpresas,
        CONVERT(DECIMAL(5,2), nivelGeneral) AS nivelGeneral,
        empresasIncipientes,
        totalEmpleados
      FROM Base
      OPTION (RECOMPILE);
      `;

      // Reemplazar los marcadores de posición en la consulta
      const finalQuery = KPI_QUERY.replace('${whereConditions.length > 0 ? \'AND \' + whereConditions.join(\' AND \') : \'\'}', 
        whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : '');
        
      const rs = await req.query(finalQuery);
      const row = rs.recordset[0] || {};
      
      // Handle null nivelGeneral properly
      const nivelGeneral = row.nivelGeneral;
      const nivelGeneralFormatted = nivelGeneral !== null && nivelGeneral !== undefined 
        ? (typeof nivelGeneral.toFixed === 'function' ? nivelGeneral.toFixed(2) : Number(nivelGeneral).toFixed(2))
        : '0.00';
      
      return {
        totalEmpresas: row.totalEmpresas || 0,
        nivelGeneral: nivelGeneralFormatted,
        empresasIncipientes: row.empresasIncipientes || 0,
        totalEmpleados: row.totalEmpleados || 0
      };
    } catch (error) {
      logger.error(`Error getting KPIs: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get filter options for companies list
   * @param {Object} activeFilters - Currently active filters to restrict options
   * @returns {Promise<Object>} - Filter options
   */
  static async getFilterOptions(activeFilters = {}) {
    try {
      const pool = await poolPromise;
      
      // Construir filtros SQL basados en los filtros activos
      const buildWhereClause = () => {
        const conditions = [];
        const params = {};
        let paramIndex = 0;
        
        // Función para agregar condición y parámetro
        const addCondition = (field, value, table = 'ei') => {
          if (value) {
            paramIndex++;
            const paramName = `p${paramIndex}`;
            conditions.push(`${table}.${field} = @${paramName}`);
            params[paramName] = value;
          }
        };
        
        // Función para agregar condición IN para arrays
        const addInCondition = (field, values, table, paramPrefix, joinField) => {
          if (values && Array.isArray(values) && values.length > 0) {
            const paramNames = [];
            
            values.forEach((value, index) => {
              const paramName = `${paramPrefix}${index}`;
              // Asegurarse de que el valor sea una cadena
              params[paramName] = sql.NVarChar(500);
              paramNames.push(`@${paramName}`);
            });
            
            // Construir condiciones usando EXISTS con la relación correcta
            // Si joinField no se proporciona, usar la condición simple
            const condition = joinField 
              ? `EXISTS (SELECT 1 FROM ${table} t WITH (NOLOCK) WHERE t.${field} IN (${paramNames.join(', ')}) AND t.${joinField} = ei.${joinField})`
              : `EXISTS (SELECT 1 FROM ${table} WHERE ${table}.${field} IN (${paramNames.join(', ')}))`;
            conditions.push(condition);
            return paramNames.map((name, index) => ({ 
              name: name.substring(1), // Quitar el @ inicial
              value: values[index]
            }));
          }
          return [];
        };
        
        // Función para mapear niveles de innovación
        const mapInnovationLevel = (level) => {
          // Los nombres ya están correctos en la base de datos, no necesitamos mapear
          return level;
        };
        
        // Almacenar todos los parámetros que necesitaremos agregar después
        let allParams = [];
        
        // Agregar condiciones basadas en filtros activos
        if (activeFilters.departamento && Array.isArray(activeFilters.departamento) && activeFilters.departamento.length > 0) {
          const depParams = addInCondition('Nombre', activeFilters.departamento, 'Departamentos', 'dep');
          allParams = [...allParams, ...depParams];
        }
        
        if (activeFilters.distrito && Array.isArray(activeFilters.distrito) && activeFilters.distrito.length > 0) {
          // Separar "OTRO" de los distritos normales
          const distritosNormales = activeFilters.distrito.filter(d => d !== 'OTRO');
          const incluirOtro = activeFilters.distrito.includes('OTRO');
          
          if (distritosNormales.length > 0) {
            const distParams = addInCondition('Nombre', distritosNormales, 'SubRegion', 'dist', 'IdSubRegion');
            allParams = [...allParams, ...distParams];
          }
          
          if (incluirOtro) {
            conditions.push('ei.IdLocalidad IS NULL');
          }
        }
        
        if (activeFilters.nivelInnovacion && Array.isArray(activeFilters.nivelInnovacion) && activeFilters.nivelInnovacion.length > 0) {
          // Mapear nombres actualizados a los originales en la base de datos
          const dbNivelesInnovacion = activeFilters.nivelInnovacion.map(mapInnovationLevel);
          const nivelParams = addInCondition('Descripcion', dbNivelesInnovacion, 'NivelMadurez', 'nivel');
          allParams = [...allParams, ...nivelParams];
        }
        
        if (activeFilters.sectorActividad && Array.isArray(activeFilters.sectorActividad) && activeFilters.sectorActividad.length > 0) {
          const sectorParams = addInCondition('Descripcion', activeFilters.sectorActividad, 'SectorActividad', 'sector');
          allParams = [...allParams, ...sectorParams];
        }
        
        if (activeFilters.subSectorActividad && Array.isArray(activeFilters.subSectorActividad) && activeFilters.subSectorActividad.length > 0) {
          const subsectorParams = addInCondition('Descripcion', activeFilters.subSectorActividad, 'SubSectorActividad', 'subsector');
          allParams = [...allParams, ...subsectorParams];
        }
        
        return {
          whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
          params,
          allParams
        };
      };
      
      const { whereClause, params, allParams } = buildWhereClause();
      
      // Base de la consulta para encontrar TestUsuario con filtros aplicados
      const baseTestQuery = `
        SELECT DISTINCT tu.IdTestUsuario
        FROM TestUsuario tu
        INNER JOIN EmpresaInfo ei ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
        LEFT JOIN Departamentos dep ON ei.IdDepartamento = dep.IdDepartamento
        LEFT JOIN SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
        LEFT JOIN SectorActividad sa ON ei.IdSectorActividad = sa.IdSectorActividad
        LEFT JOIN SubSectorActividad ssa ON ei.IdSubSectorActividad = ssa.IdSubSectorActividad
        LEFT JOIN ResultadoNivelDigital rnd ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
        LEFT JOIN NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
        ${whereClause}
      `;
      
      // Departamentos con filtros aplicados - Optimizado (incluye Capital para ASUNCIÓN)
      const departamentosQuery = `
        SELECT DISTINCT dep.Nombre
        FROM Departamentos dep
        INNER JOIN (
          SELECT DISTINCT ei.IdDepartamento
          FROM EmpresaInfo ei
          INNER JOIN TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
          WHERE tu.Finalizado = 1
          ${activeFilters.nivelInnovacion && activeFilters.nivelInnovacion.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM ResultadoNivelDigital rnd 
              INNER JOIN NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
              WHERE rnd.IdUsuario = ei.IdUsuario AND rnd.Test = ei.Test 
              AND nm.Descripcion IN ('${activeFilters.nivelInnovacion.join("','")}')
            )` : ''}
          ${activeFilters.tamanoEmpresa && activeFilters.tamanoEmpresa.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM VentasAnuales va 
              WHERE va.IdVentasAnuales = ei.IdVentas 
              AND va.Nombre IN ('${activeFilters.tamanoEmpresa.join("','")}')
            )` : ''}
        ) AS filtered_ei ON dep.IdDepartamento = filtered_ei.IdDepartamento
        WHERE dep.Nombre IS NOT NULL
        
        UNION
        
        SELECT 'Capital' AS Nombre
        WHERE EXISTS (
          SELECT 1 FROM EmpresaInfo ei_cap 
          INNER JOIN TestUsuario tu_cap ON ei_cap.IdUsuario = tu_cap.IdUsuario AND ei_cap.Test = tu_cap.Test
          LEFT JOIN SubRegion sr_cap ON ei_cap.IdLocalidad = sr_cap.IdSubRegion
          WHERE tu_cap.Finalizado = 1 AND sr_cap.IdRegion = 20
          ${activeFilters.nivelInnovacion && activeFilters.nivelInnovacion.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM ResultadoNivelDigital rnd 
              INNER JOIN NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
              WHERE rnd.IdUsuario = ei_cap.IdUsuario AND rnd.Test = ei_cap.Test 
              AND nm.Descripcion IN ('${activeFilters.nivelInnovacion.join("','")}')
            )` : ''}
          ${activeFilters.tamanoEmpresa && activeFilters.tamanoEmpresa.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM VentasAnuales va 
              WHERE va.IdVentasAnuales = ei_cap.IdVentas 
              AND va.Nombre IN ('${activeFilters.tamanoEmpresa.join("','")}')
            )` : ''}
        )
        
        ORDER BY Nombre
      `;
      
      // Distritos con filtros aplicados - Optimizado (incluye OTRO para NULL)
      const distritosQuery = `
        SELECT DISTINCT COALESCE(sr.Nombre, 'OTRO') AS Nombre
        FROM (
          SELECT DISTINCT ei.IdLocalidad
          FROM EmpresaInfo ei
          INNER JOIN TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
          WHERE tu.Finalizado = 1
          ${activeFilters.departamento && activeFilters.departamento.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM Departamentos dep 
              WHERE dep.IdDepartamento = ei.IdDepartamento 
              AND dep.Nombre IN ('${activeFilters.departamento.join("','")}')
            )` : ''}
          ${activeFilters.distrito && activeFilters.distrito.length > 0 ? 
            (activeFilters.distrito.includes('OTRO') ? 
              `AND (ei.IdLocalidad IS NULL OR EXISTS (
                SELECT 1 FROM SubRegion sr 
                WHERE sr.IdSubRegion = ei.IdLocalidad 
                AND sr.Nombre IN ('${activeFilters.distrito.filter(d => d !== 'OTRO').join("','")}')
              ))` :
              `AND EXISTS (
                SELECT 1 FROM SubRegion sr 
                WHERE sr.IdSubRegion = ei.IdLocalidad 
                AND sr.Nombre IN ('${activeFilters.distrito.join("','")}')
              )`
            ) : ''}
          ${activeFilters.nivelInnovacion && activeFilters.nivelInnovacion.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM ResultadoNivelDigital rnd 
              INNER JOIN NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
              WHERE rnd.IdUsuario = ei.IdUsuario AND rnd.Test = ei.Test 
              AND nm.Descripcion IN ('${activeFilters.nivelInnovacion.join("','")}')
            )` : ''}
          ${activeFilters.tamanoEmpresa && activeFilters.tamanoEmpresa.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM VentasAnuales va 
              WHERE va.IdVentasAnuales = ei.IdVentas 
              AND va.Nombre IN ('${activeFilters.tamanoEmpresa.join("','")}')
            )` : ''}
        ) AS filtered_ei
        LEFT JOIN SubRegion sr ON sr.IdSubRegion = filtered_ei.IdLocalidad
        ORDER BY COALESCE(sr.Nombre, 'OTRO')
      `;
      
      // Nivel de Innovación con filtros aplicados - Optimizado
      const nivelInnovacionQuery = `
        SELECT DISTINCT nm.Descripcion
        FROM NivelMadurez nm
        WHERE nm.Descripcion IS NOT NULL
        ORDER BY nm.Descripcion
      `;
      
      // Sector de Actividad con filtros aplicados - Optimizado
      const sectorActividadQuery = `
        SELECT DISTINCT sa.Descripcion
        FROM SectorActividad sa
        INNER JOIN (
          SELECT DISTINCT ei.IdSectorActividad
          FROM EmpresaInfo ei
          INNER JOIN TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
          WHERE tu.Finalizado = 1
          ${activeFilters.departamento && activeFilters.departamento.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM Departamentos dep 
              WHERE dep.IdDepartamento = ei.IdDepartamento 
              AND dep.Nombre IN ('${activeFilters.departamento.join("','")}')
            )` : ''}
          ${activeFilters.distrito && activeFilters.distrito.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM SubRegion sr 
              WHERE sr.IdSubRegion = ei.IdLocalidad 
              AND sr.Nombre IN ('${activeFilters.distrito.join("','")}')
            )` : ''}
          ${activeFilters.nivelInnovacion && activeFilters.nivelInnovacion.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM ResultadoNivelDigital rnd 
              INNER JOIN NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
              WHERE rnd.IdUsuario = ei.IdUsuario AND rnd.Test = ei.Test 
              AND nm.Descripcion IN ('${activeFilters.nivelInnovacion.join("','")}')
            )` : ''}
          ${activeFilters.tamanoEmpresa && activeFilters.tamanoEmpresa.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM VentasAnuales va 
              WHERE va.IdVentasAnuales = ei.IdVentas 
              AND va.Nombre IN ('${activeFilters.tamanoEmpresa.join("','")}')
            )` : ''}
        ) AS filtered_ei ON sa.IdSectorActividad = filtered_ei.IdSectorActividad
        WHERE sa.Descripcion IS NOT NULL
        ORDER BY sa.Descripcion
      `;
      
      // SubSector de Actividad con relación a Sector y filtros aplicados - Optimizado
      const subSectorActividadQuery = `
        SELECT 
          ssa.Descripcion AS subSectorDescripcion,
          sa.Descripcion AS sectorDescripcion
        FROM SubSectorActividad ssa
        LEFT JOIN SectorActividad sa ON ssa.IdSectorActividad = sa.IdSectorActividad
        INNER JOIN (
          SELECT DISTINCT ei.IdSubSectorActividad
          FROM EmpresaInfo ei
          INNER JOIN TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
          WHERE tu.Finalizado = 1
          ${activeFilters.departamento && activeFilters.departamento.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM Departamentos dep 
              WHERE dep.IdDepartamento = ei.IdDepartamento 
              AND dep.Nombre IN ('${activeFilters.departamento.join("','")}')
            )` : ''}
          ${activeFilters.distrito && activeFilters.distrito.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM SubRegion sr 
              WHERE sr.IdSubRegion = ei.IdLocalidad 
              AND sr.Nombre IN ('${activeFilters.distrito.join("','")}')
            )` : ''}
          ${activeFilters.sectorActividad && activeFilters.sectorActividad.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM SectorActividad sa 
              WHERE sa.IdSectorActividad = ei.IdSectorActividad 
              AND sa.Descripcion IN ('${activeFilters.sectorActividad.join("','")}')
            )` : ''}
          ${activeFilters.nivelInnovacion && activeFilters.nivelInnovacion.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM ResultadoNivelDigital rnd 
              INNER JOIN NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
              WHERE rnd.IdUsuario = ei.IdUsuario AND rnd.Test = ei.Test 
              AND nm.Descripcion IN ('${activeFilters.nivelInnovacion.join("','")}')
            )` : ''}
          ${activeFilters.tamanoEmpresa && activeFilters.tamanoEmpresa.length > 0 ? 
            `AND EXISTS (
              SELECT 1 FROM VentasAnuales va 
              WHERE va.IdVentasAnuales = ei.IdVentas 
              AND va.Nombre IN ('${activeFilters.tamanoEmpresa.join("','")}')
            )` : ''}
        ) AS filtered_ei ON ssa.IdSubSectorActividad = filtered_ei.IdSubSectorActividad
        WHERE ssa.Descripcion IS NOT NULL
        ORDER BY sa.Descripcion, ssa.Descripcion
      `;
      
      // Tamaño de Empresa con filtros aplicados - Optimizado
      const tamanoEmpresaQuery = `
        SELECT va.Nombre
        FROM (
          SELECT DISTINCT va.Nombre,
            CASE 
              WHEN va.Nombre = 'Micro' THEN 1
              WHEN va.Nombre = 'Pequeña' THEN 2
              WHEN va.Nombre = 'Mediana' THEN 3
              WHEN va.Nombre = 'Grande' THEN 4
              ELSE 5
            END AS Orden
          FROM VentasAnuales va
          INNER JOIN (
            SELECT DISTINCT ei.IdVentas
            FROM EmpresaInfo ei
            INNER JOIN TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
            WHERE tu.Finalizado = 1
            ${activeFilters.departamento && activeFilters.departamento.length > 0 ? 
              `AND EXISTS (
                SELECT 1 FROM Departamentos dep 
                WHERE dep.IdDepartamento = ei.IdDepartamento 
                AND dep.Nombre IN ('${activeFilters.departamento.join("','")}')
              )` : ''}
            ${activeFilters.distrito && activeFilters.distrito.length > 0 ? 
              `AND EXISTS (
                SELECT 1 FROM SubRegion sr 
                WHERE sr.IdSubRegion = ei.IdLocalidad 
                AND sr.Nombre IN ('${activeFilters.distrito.join("','")}')
              )` : ''}
            ${activeFilters.nivelInnovacion && activeFilters.nivelInnovacion.length > 0 ? 
              `AND EXISTS (
                SELECT 1 FROM ResultadoNivelDigital rnd 
                INNER JOIN NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
                WHERE rnd.IdUsuario = ei.IdUsuario AND rnd.Test = ei.Test 
                AND nm.Descripcion IN ('${activeFilters.nivelInnovacion.join("','")}')
              )` : ''}
            ${activeFilters.sectorActividad && activeFilters.sectorActividad.length > 0 ? 
              `AND EXISTS (
                SELECT 1 FROM SectorActividad sa 
                WHERE sa.IdSectorActividad = ei.IdSectorActividad 
                AND sa.Descripcion IN ('${activeFilters.sectorActividad.join("','")}')
              )` : ''}
            ${activeFilters.subSectorActividad && activeFilters.subSectorActividad.length > 0 ? 
              `AND EXISTS (
                SELECT 1 FROM SubSectorActividad ssa 
                WHERE ssa.IdSubSectorActividad = ei.IdSubSectorActividad 
                AND ssa.Descripcion IN ('${activeFilters.subSectorActividad.join("','")}')
              )` : ''}
          ) AS filtered_ei ON va.IdVentasAnuales = filtered_ei.IdVentas
          WHERE va.Nombre IS NOT NULL
        ) AS va
        ORDER BY va.Orden
      `;
      
      // Crear solicitudes con parámetros
      const createRequest = async (query) => {
        const request = pool.request();
        return request.query(query);
      };
      
      // Execute all queries in parallel
      const [
        departamentosResult,
        distritosResult,
        nivelInnovacionResult,
        sectorActividadResult,
        subSectorActividadResult,
        tamanoEmpresaResult
      ] = await Promise.all([
        createRequest(departamentosQuery),
        createRequest(distritosQuery),
        createRequest(nivelInnovacionQuery),
        createRequest(sectorActividadQuery),
        createRequest(subSectorActividadQuery),
        createRequest(tamanoEmpresaQuery)
      ]);
      
      // Los nombres ya están correctos en la base de datos, no necesitamos mapear
      const nivelesInnovacion = nivelInnovacionResult.recordset.map(item => item.Descripcion).sort();
      
      // Agrupar subsectores por sector
      const subSectoresPorSector = {};
      subSectorActividadResult.recordset.forEach(item => {
        const sector = item.sectorDescripcion || 'Otro';
        const subSector = item.subSectorDescripcion || 'Otro';
        
        if (!subSectoresPorSector[sector]) {
          subSectoresPorSector[sector] = [];
        }
        if (!subSectoresPorSector[sector].includes(subSector)) {
          subSectoresPorSector[sector].push(subSector);
        }
      });
      
      // Obtener lista única de subsectores
      const subSectoresActividad = [...new Set(subSectorActividadResult.recordset.map(item => item.subSectorDescripcion || 'Otro'))].sort();
      
      return {
        departamentos: departamentosResult.recordset.map(item => item.Nombre || 'Otro').sort(),
        distritos: distritosResult.recordset.map(item => item.Nombre || 'Otro').sort(),
        nivelesInnovacion,
        sectoresActividad: sectorActividadResult.recordset.map(item => item.Descripcion || 'Otro').sort(),
        subSectoresActividad,
        subSectoresPorSector,
        tamanosEmpresa: tamanoEmpresaResult.recordset.map(item => item.Nombre),
        estadosEncuesta: [
          { value: true, label: 'Completado' },
          { value: false, label: 'En Progreso' }
        ]
      };
    } catch (error) {
      logger.error(`Error getting filter options: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get users assigned to a company
   * @param {Number} idEmpresa - Company ID
   * @returns {Promise<Array>} - List of users assigned to the company
   */
  static async getCompanyUsers(idEmpresa, idUsuario = null) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idEmpresa', sql.Int, idEmpresa);
      
      let query = `
        SELECT DISTINCT
          u.IdUsuario,
          u.NombreCompleto,
          u.Email,
          u.CargoEmpresa,
          u.IsConnected,
          u.UltimaActividad
        FROM Usuario u
        INNER JOIN EmpresaInfo ei ON u.IdUsuario = ei.IdUsuario
        WHERE ei.IdEmpresa = @idEmpresa
      `;
      
      // CASO ESPECIAL: Para "NO TENGO", filtrar también por IdUsuario
      if (idUsuario) {
        request.input('idUsuario', sql.Int, idUsuario);
        query += ` AND u.IdUsuario = @idUsuario`;
      }
      
      query += ` ORDER BY u.NombreCompleto`;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting company users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Assign a user to a company
   * @param {Number} idEmpresa - Company ID
   * @param {Number} idUsuario - User ID
   * @returns {Promise<Object>} - Result of assignment
   */
  static async assignUserToCompany(idEmpresa, idUsuario) {
    try {
      const pool = await poolPromise;
      const transaction = pool.transaction();
      
      try {
        await transaction.begin();
        
        // Check if user exists
        const userRequest = new sql.Request(transaction);
        userRequest.input('idUsuario', sql.Int, idUsuario);
        const userQuery = 'SELECT IdUsuario, NombreCompleto, Email FROM Usuario WHERE IdUsuario = @idUsuario';
        const userResult = await userRequest.query(userQuery);
        
        if (userResult.recordset.length === 0) {
          throw new Error('Usuario no encontrado');
        }
        
        // Check if user is already assigned to this company
        const checkRequest = new sql.Request(transaction);
        checkRequest.input('idEmpresa', sql.Int, idEmpresa);
        checkRequest.input('idUsuario', sql.Int, idUsuario);
        const checkQuery = `
          SELECT COUNT(*) as count 
          FROM EmpresaInfo 
          WHERE IdEmpresa = @idEmpresa AND IdUsuario = @idUsuario
        `;
        const checkResult = await checkRequest.query(checkQuery);
        
        if (checkResult.recordset[0].count > 0) {
          throw new Error('El usuario ya está asignado a esta empresa');
        }
        
        // Create new EmpresaInfo record for this assignment
        const assignRequest = new sql.Request(transaction);
        assignRequest.input('idEmpresa', sql.Int, idEmpresa);
        assignRequest.input('idUsuario', sql.Int, idUsuario);
        
        const assignQuery = `
          INSERT INTO EmpresaInfo (
            IdEmpresa, 
            IdUsuario,
            Test
          ) 
          VALUES (
            @idEmpresa, 
            @idUsuario,
            1
          )
        `;
        
        await assignRequest.query(assignQuery);
        
        await transaction.commit();
        
        return {
          success: true,
          usuario: userResult.recordset[0]
        };
      } catch (error) {
        await transaction.rollback();
        logger.error(`Error assigning user to company: ${error.message}`);
        throw error;
      }
    } catch (error) {
      logger.error(`Error in assignUserToCompany: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove user assignment from a company
   * @param {Number} idEmpresa - Company ID
   * @param {Number} idUsuario - User ID
   * @returns {Promise<Object>} - Result of removal
   */
  static async removeUserFromCompany(idEmpresa, idUsuario) {
    try {
      const pool = await poolPromise;
      const transaction = pool.transaction();
      
      try {
        await transaction.begin();
        
        // Check if assignment exists
        const checkRequest = new sql.Request(transaction);
        checkRequest.input('idEmpresa', sql.Int, idEmpresa);
        checkRequest.input('idUsuario', sql.Int, idUsuario);
        const checkQuery = `
          SELECT COUNT(*) as count 
          FROM EmpresaInfo 
          WHERE IdEmpresa = @idEmpresa AND IdUsuario = @idUsuario
        `;
        const checkResult = await checkRequest.query(checkQuery);
        
        if (checkResult.recordset[0].count === 0) {
          throw new Error('El usuario no está asignado a esta empresa');
        }
        
        // Remove the assignment
        const removeRequest = new sql.Request(transaction);
        removeRequest.input('idEmpresa', sql.Int, idEmpresa);
        removeRequest.input('idUsuario', sql.Int, idUsuario);
        
        const removeQuery = `
          DELETE FROM EmpresaInfo 
          WHERE IdEmpresa = @idEmpresa AND IdUsuario = @idUsuario
        `;
        
        await removeRequest.query(removeQuery);

        // Delete user's tests/chequeos for this specific company
        const deleteTestsRequest = new sql.Request(transaction);
        deleteTestsRequest.input('idEmpresa', sql.Int, idEmpresa);
        deleteTestsRequest.input('idUsuario', sql.Int, idUsuario);
        
        const deleteTestsQuery = `
          DELETE FROM TestUsuario 
          WHERE IdUsuario = @idUsuario 
          AND IdEmpresa = @idEmpresa
        `;
        
        await deleteTestsRequest.query(deleteTestsQuery);
        
        // Also delete related results for this user and company
        const deleteResultsRequest = new sql.Request(transaction);
        deleteResultsRequest.input('idEmpresa', sql.Int, idEmpresa);
        deleteResultsRequest.input('idUsuario', sql.Int, idUsuario);
        
        const deleteResultsQuery = `
          DELETE FROM ResultadoNivelDigital 
          WHERE IdUsuario = @idUsuario 
          AND IdEmpresa = @idEmpresa
        `;
        
        await deleteResultsRequest.query(deleteResultsQuery);
        
        await transaction.commit();
        
        return {
          success: true
        };
      } catch (error) {
        await transaction.rollback();
        logger.error(`Error removing user from company: ${error.message}`);
        throw error;
      }
    } catch (error) {
      logger.error(`Error in removeUserFromCompany: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get chequeos that need reassignment (preview)
   * @param {Number} idEmpresa - Company ID (optional - if provided, only show for this company)
   * @param {Boolean} dryRun - If true, only show preview without making changes
   * @returns {Promise<Array>} - List of chequeos that need reassignment
   */
  static async getReassignmentCandidates(idEmpresa = null) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      
      let whereClause = '';
      if (idEmpresa) {
        request.input('idEmpresa', sql.Int, idEmpresa);
        whereClause = 'AND c.IdEmpresa = @idEmpresa';
      }
      
      const query = `
        -- Detectar empresas con 2 filas en EmpresaInfo:
        -- Ambas con Test=1 y distinto IdUsuario (re-test con otro usuario)
        WITH base AS (
          SELECT
            ei.*,
            ROW_NUMBER() OVER (
              PARTITION BY ei.IdEmpresa
              ORDER BY COALESCE(
                (SELECT MAX(r.FechaRespuesta) 
                 FROM Respuesta r 
                 WHERE r.IdEmpresa = ei.IdEmpresa 
                   AND r.IdUsuario = ei.IdUsuario 
                   AND r.Test = ei.Test),
                (SELECT MAX(COALESCE(tu.FechaTerminoTest, tu.FechaTest))
                 FROM TestUsuario tu
                 WHERE tu.IdUsuario = ei.IdUsuario
                   AND tu.Test = ei.Test),
                '1900-01-01'
              ),
              ei.IdEmpresaInfo
            ) AS rn
          FROM EmpresaInfo ei
        ),
        agg AS (
          SELECT
            ei.IdEmpresa,
            COUNT(*) AS total_rows,
            SUM(CASE WHEN ei.Test = 1 THEN 1 ELSE 0 END) AS total_test1,
            COUNT(DISTINCT ei.IdUsuario) AS distinct_users
          FROM EmpresaInfo ei
          GROUP BY ei.IdEmpresa
        ),
        duo AS (
          SELECT b.*
          FROM base b
          JOIN agg a ON a.IdEmpresa = b.IdEmpresa
          WHERE a.total_rows = 2          -- EXACTAMENTE 2 filas
            AND a.total_test1 = 2         -- ambas Test=1
            AND a.distinct_users >= 2     -- distintos usuarios
        ),
        pairs AS (
          SELECT
            o.IdEmpresa,
            o.IdEmpresaInfo AS EI_Test1_Antigua,
            n.IdEmpresaInfo AS EI_Test1_Reciente,
            o.IdUsuario AS IdUsuario_Antigua,
            n.IdUsuario AS IdUsuario_Reciente
          FROM duo o
          JOIN duo n
            ON n.IdEmpresa = o.IdEmpresa
           AND o.rn = 1                     -- más antigua
           AND n.rn = 2                     -- más reciente
          WHERE o.IdUsuario <> n.IdUsuario
        )
        SELECT
          p.IdEmpresa,
          e.Nombre AS NombreEmpresa,
          
          -- Antigua (se mantiene Test=1; fuente del IdUsuario)
          p.EI_Test1_Antigua AS IdEmpresaInfo_Antigua,
          p.IdUsuario_Antigua,
          uo.NombreCompleto AS NombreUsuario_Antigua,
          
          -- Reciente (se actualizará: IdUsuario y Test->2)
          p.EI_Test1_Reciente AS IdEmpresaInfo_Reciente,
          p.IdUsuario_Reciente,
          un.NombreCompleto AS NombreUsuario_Reciente,
          
          -- Impacto propuesto
          p.IdUsuario_Antigua AS NuevoIdUsuario_para_Reciente,
          2 AS NuevoTest_para_Reciente
        FROM pairs p
        LEFT JOIN Empresa e ON e.IdEmpresa = p.IdEmpresa
        LEFT JOIN Usuario uo ON uo.IdUsuario = p.IdUsuario_Antigua
        LEFT JOIN Usuario un ON un.IdUsuario = p.IdUsuario_Reciente
        WHERE 1=1 ${whereClause}
        ORDER BY p.IdEmpresa
      `;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting reassignment candidates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reassign a chequeo to a different user
   * @param {Number} idEmpresa - Company ID
   * @param {Number} targetIdUsuario - New user ID to reassign to
   * @param {Boolean} dryRun - If true, only show preview without making changes
   * @returns {Promise<Object>} - Result of reassignment
   */
  static async reassignChequeo(idEmpresa, targetIdUsuario, dryRun = true) {
    try {
      const pool = await poolPromise;
      const transaction = pool.transaction();
      
      try {
        await transaction.begin();
        
        // 1) Calcular pares a corregir
        const pairsRequest = new sql.Request(transaction);
        pairsRequest.input('idEmpresa', sql.Int, idEmpresa);
        
        const pairsQuery = `
          WITH base AS (
            SELECT
              ei.*,
              FechaClave = COALESCE(
                (SELECT MAX(r.FechaRespuesta) 
                 FROM Respuesta r 
                 WHERE r.IdEmpresa = ei.IdEmpresa 
                   AND r.IdUsuario = ei.IdUsuario 
                   AND r.Test = ei.Test),
                (SELECT MAX(COALESCE(tu.FechaTerminoTest, tu.FechaTest))
                 FROM TestUsuario tu
                 WHERE tu.IdUsuario = ei.IdUsuario
                   AND tu.Test = ei.Test),
                CONVERT(datetime,'1900-01-01',112)
              ),
              ROW_NUMBER() OVER (
                PARTITION BY ei.IdEmpresa
                ORDER BY COALESCE(
                  (SELECT MAX(r.FechaRespuesta) 
                   FROM Respuesta r 
                   WHERE r.IdEmpresa = ei.IdEmpresa 
                     AND r.IdUsuario = ei.IdUsuario 
                     AND r.Test = ei.Test),
                  (SELECT MAX(COALESCE(tu.FechaTerminoTest, tu.FechaTest))
                   FROM TestUsuario tu
                   WHERE tu.IdUsuario = ei.IdUsuario
                     AND tu.Test = ei.Test),
                  CONVERT(datetime,'1900-01-01',112)
                ),
                ei.IdEmpresaInfo
              ) AS rn
            FROM EmpresaInfo ei
            WHERE ei.IdEmpresa = @idEmpresa
          ),
          agg AS (
            SELECT
              ei.IdEmpresa,
              COUNT(*) AS total_rows,
              SUM(CASE WHEN ei.Test = 1 THEN 1 ELSE 0 END) AS total_test1,
              COUNT(DISTINCT ei.IdUsuario) AS distinct_users
            FROM EmpresaInfo ei
            WHERE ei.IdEmpresa = @idEmpresa
            GROUP BY ei.IdEmpresa
          ),
          duo AS (
            SELECT b.*
            FROM base b
            JOIN agg a ON a.IdEmpresa = b.IdEmpresa
            WHERE a.total_rows = 2
              AND a.total_test1 = 2
              AND a.distinct_users >= 2
          )
          SELECT
            o.IdEmpresa,
            o.IdEmpresaInfo AS EI_Test1_Antigua,
            n.IdEmpresaInfo AS EI_Test1_Reciente,
            o.IdUsuario AS IdUsuario_Antigua,
            n.IdUsuario AS IdUsuario_Reciente
          FROM duo o
          JOIN duo n
            ON n.IdEmpresa = o.IdEmpresa
           AND o.rn = 1
           AND n.rn = 2
          WHERE o.IdUsuario <> n.IdUsuario
        `;
        
        const pairsResult = await pairsRequest.query(pairsQuery);
        const pair = pairsResult.recordset[0];
        
        if (!pair) {
          await transaction.rollback();
          return {
            success: false,
            message: 'No se encontraron chequeos para reasignar en esta empresa'
          };
        }
        
        // Si targetIdUsuario no se proporciona, usar el IdUsuario de la fila antigua
        const newIdUsuario = targetIdUsuario || pair.IdUsuario_Antigua;
        
        if (dryRun) {
          await transaction.rollback();
          return {
            success: true,
            dryRun: true,
            preview: {
              idEmpresa: pair.IdEmpresa,
              idEmpresaInfo_Reciente: pair.EI_Test1_Reciente,
              currentIdUsuario: pair.IdUsuario_Reciente,
              newIdUsuario: newIdUsuario,
              currentTest: 1,
              newTest: 2
            }
          };
        }
        
        // 2) Actualizar EmpresaInfo
        const updateEIRequest = new sql.Request(transaction);
        updateEIRequest.input('idEmpresaInfo', sql.Int, pair.EI_Test1_Reciente);
        updateEIRequest.input('newIdUsuario', sql.Int, newIdUsuario);
        
        await updateEIRequest.query(`
          UPDATE EmpresaInfo
          SET IdUsuario = @newIdUsuario, Test = 2
          WHERE IdEmpresaInfo = @idEmpresaInfo AND Test = 1
        `);
        
        // 3) Sincronizar TestUsuario y ResultadoNivelDigital
        const syncRequest = new sql.Request(transaction);
        syncRequest.input('idEmpresa', sql.Int, idEmpresa);
        syncRequest.input('canonIdUsuario', sql.Int, newIdUsuario);
        
        // Crear tabla temporal con el canónico
        await syncRequest.query(`
          CREATE TABLE #Canon (
            IdEmpresa INT NOT NULL PRIMARY KEY,
            CanonIdUsuario INT NOT NULL
          );
          
          INSERT INTO #Canon (IdEmpresa, CanonIdUsuario)
          VALUES (${idEmpresa}, ${newIdUsuario});
        `);
        
        // Actualizar TestUsuario
        await syncRequest.query(`
          CREATE TABLE #TU_fix(
            IdEmpresa INT NOT NULL,
            IdTestUsuario INT NOT NULL,
            IdUsuario_Actual INT NOT NULL,
            CanonIdUsuario INT NOT NULL,
            Accion CHAR(6) NOT NULL,
            PRIMARY KEY (IdTestUsuario)
          );
          
          INSERT INTO #TU_fix(IdEmpresa, IdTestUsuario, IdUsuario_Actual, CanonIdUsuario, Accion)
          SELECT
            u.IdEmpresa,
            tu.IdTestUsuario,
            tu.IdUsuario,
            c.CanonIdUsuario,
            CASE WHEN EXISTS (
              SELECT 1 FROM TestUsuario z
              WHERE z.IdUsuario = c.CanonIdUsuario AND z.Test = 2
            )
            THEN 'DELETE' ELSE 'UPDATE' END AS Accion
          FROM #Canon c
          JOIN Usuario u ON u.IdEmpresa = c.IdEmpresa
          JOIN TestUsuario tu ON tu.IdUsuario = u.IdUsuario
          WHERE tu.Test = 1
            AND tu.IdUsuario <> c.CanonIdUsuario;
          
          -- UPDATE
          UPDATE tu
          SET tu.IdUsuario = f.CanonIdUsuario, tu.Test = 2
          FROM TestUsuario tu
          JOIN #TU_fix f ON f.IdTestUsuario = tu.IdTestUsuario AND f.Accion = 'UPDATE'
          JOIN Usuario u ON u.IdUsuario = tu.IdUsuario;
          
          -- DELETE
          DELETE tu
          FROM TestUsuario tu
          JOIN #TU_fix f ON f.IdTestUsuario = tu.IdTestUsuario AND f.Accion = 'DELETE'
          JOIN Usuario u ON u.IdUsuario = tu.IdUsuario;
          
          DROP TABLE #TU_fix;
        `);
        
        // Actualizar ResultadoNivelDigital
        await syncRequest.query(`
          CREATE TABLE #RND_fix(
            IdEmpresa INT NOT NULL,
            IdResultadoND INT NOT NULL,
            IdUsuario_Actual INT NOT NULL,
            CanonIdUsuario INT NOT NULL,
            Accion CHAR(6) NOT NULL,
            PRIMARY KEY (IdResultadoND)
          );
          
          INSERT INTO #RND_fix(IdEmpresa, IdResultadoND, IdUsuario_Actual, CanonIdUsuario, Accion)
          SELECT
            u.IdEmpresa,
            rnd.IdResultadoNivelDigital,
            rnd.IdUsuario,
            c.CanonIdUsuario,
            CASE WHEN EXISTS (
              SELECT 1 FROM ResultadoNivelDigital r2
              WHERE r2.IdUsuario = c.CanonIdUsuario AND r2.Test = 2
            )
            THEN 'DELETE' ELSE 'UPDATE' END AS Accion
          FROM #Canon c
          JOIN Usuario u ON u.IdEmpresa = c.IdEmpresa
          JOIN ResultadoNivelDigital rnd ON rnd.IdUsuario = u.IdUsuario
          WHERE rnd.Test = 1
            AND rnd.IdUsuario <> c.CanonIdUsuario;
          
          -- UPDATE
          UPDATE rnd
          SET rnd.IdUsuario = f.CanonIdUsuario, rnd.Test = 2
          FROM ResultadoNivelDigital rnd
          JOIN #RND_fix f ON f.IdResultadoND = rnd.IdResultadoNivelDigital AND f.Accion = 'UPDATE'
          JOIN Usuario u ON u.IdUsuario = rnd.IdUsuario;
          
          -- DELETE
          DELETE rnd
          FROM ResultadoNivelDigital rnd
          JOIN #RND_fix f ON f.IdResultadoND = rnd.IdResultadoNivelDigital AND f.Accion = 'DELETE'
          JOIN Usuario u ON u.IdUsuario = rnd.IdUsuario;
          
          DROP TABLE #RND_fix;
        `);
        
        // 4) Migrar Respuestas, SubRespuestas y ResultadoProcesoCalculoPreguntas
        await syncRequest.query(`
          -- Identificar respuestas huérfanas
          CREATE TABLE #RespuestasAMigrar (
            IdEmpresa           INT NOT NULL,
            CanonIdUsuario      INT NOT NULL,
            IdUsuarioOriginal   INT NOT NULL,
            TestOriginal        INT NOT NULL
          );
          
          INSERT INTO #RespuestasAMigrar (IdEmpresa, CanonIdUsuario, IdUsuarioOriginal, TestOriginal)
          SELECT DISTINCT
            c.IdEmpresa,
            c.CanonIdUsuario,
            u.IdUsuario,
            r.Test
          FROM #Canon c
          JOIN dbo.Usuario u ON u.IdEmpresa = c.IdEmpresa
          JOIN dbo.Respuesta r ON r.IdUsuario = u.IdUsuario
          WHERE u.IdUsuario <> c.CanonIdUsuario
            AND r.Test = 1  -- Solo migrar respuestas de Test=1 (las que quedaron huérfanas)
            AND NOT EXISTS (
              SELECT 1 FROM dbo.Respuesta r2
              WHERE r2.IdUsuario = c.CanonIdUsuario 
                AND r2.Test = 2
                AND r2.IdEmpresa = c.IdEmpresa
            );
          
          -- Migrar Respuesta
          UPDATE r
          SET r.IdUsuario = ram.CanonIdUsuario,
              r.Test = 2,
              r.IdEmpresa = ram.IdEmpresa
          FROM dbo.Respuesta r
          JOIN #RespuestasAMigrar ram 
            ON ram.IdUsuarioOriginal = r.IdUsuario
           AND ram.TestOriginal = r.Test
          JOIN dbo.Usuario u 
            ON u.IdUsuario = r.IdUsuario
           AND u.IdEmpresa = ram.IdEmpresa;
          
          -- Migrar SubRespuesta
          UPDATE sr
          SET sr.IdUsuario = ram.CanonIdUsuario,
              sr.Test = 2,
              sr.IdEmpresa = ram.IdEmpresa
          FROM dbo.SubRespuesta sr
          JOIN #RespuestasAMigrar ram 
            ON ram.IdUsuarioOriginal = sr.IdUsuario
           AND ram.TestOriginal = sr.Test
          JOIN dbo.Usuario u 
            ON u.IdUsuario = sr.IdUsuario
           AND u.IdEmpresa = ram.IdEmpresa;
          
          -- Migrar ResultadoProcesoCalculoPreguntas (si existe)
          IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'ResultadoProcesoCalculoPreguntas')
          BEGIN
            UPDATE rpp
            SET rpp.IdUsuario = ram.CanonIdUsuario,
                rpp.Test = 2
            FROM dbo.ResultadoProcesoCalculoPreguntas rpp
            JOIN #RespuestasAMigrar ram 
              ON ram.IdUsuarioOriginal = rpp.IdUsuario
             AND ram.TestOriginal = rpp.Test;
          END
          
          DROP TABLE #RespuestasAMigrar;
          DROP TABLE #Canon;
        `);
        
        await transaction.commit();
        
        logger.info(`Chequeo reasignado exitosamente - IdEmpresa: ${idEmpresa}, Old IdUsuario: ${pair.IdUsuario_Reciente}, New IdUsuario: ${newIdUsuario}`);
        
        return {
          success: true,
          message: 'Chequeo reasignado exitosamente',
          result: {
            idEmpresa: pair.IdEmpresa,
            idEmpresaInfo_Reciente: pair.EI_Test1_Reciente,
            oldIdUsuario: pair.IdUsuario_Reciente,
            newIdUsuario: newIdUsuario,
            oldTest: 1,
            newTest: 2
          }
        };
      } catch (error) {
        await transaction.rollback();
        logger.error(`Error reassigning chequeo: ${error.message}`);
        throw error;
      }
    } catch (error) {
      logger.error(`Error in reassignChequeo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get available users for reassignment for a specific company
   * @param {Number} idEmpresa - Company ID
   * @returns {Promise<Array>} - List of available users
   */
  static async getAvailableUsersForReassignment(idEmpresa) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idEmpresa', sql.Int, idEmpresa);
      
      const query = `
        SELECT DISTINCT
          u.IdUsuario,
          u.NombreCompleto,
          u.Email,
          u.CargoEmpresa,
          ei.Test,
          CONVERT(varchar(19), tu.FechaTest, 120) AS FechaTest
        FROM Usuario u
        INNER JOIN EmpresaInfo ei ON u.IdUsuario = ei.IdUsuario
        LEFT JOIN TestUsuario tu ON tu.IdUsuario = u.IdUsuario AND tu.Test = ei.Test
        WHERE ei.IdEmpresa = @idEmpresa
        ORDER BY u.NombreCompleto, ei.Test
      `;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting available users for reassignment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all users associated with a company (even if not in EmpresaInfo)
   * For manual reassignment when no automatic candidates exist
   * @param {Number} idEmpresa - Company ID
   * @returns {Promise<Array>} - List of all users
   */
  static async getAllUsersForCompany(idEmpresa) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idEmpresa', sql.Int, idEmpresa);
      
      const query = `
        -- Obtener todos los usuarios que han tenido alguna relación con esta empresa
        SELECT DISTINCT
          u.IdUsuario,
          u.NombreCompleto,
          u.Email,
          u.CargoEmpresa,
          u.IdEmpresa AS EmpresaAsignada
        FROM Usuario u
        WHERE u.IdEmpresa = @idEmpresa OR u.IdUsuario IN (
          SELECT DISTINCT IdUsuario 
          FROM EmpresaInfo 
          WHERE IdEmpresa = @idEmpresa
        )
        ORDER BY u.NombreCompleto
      `;
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting all users for company: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search users dynamically by name, email, or IdUsuario
   * Used for manual reassignment to allow searching any user
   * @param {String} searchTerm - Search term (minimum 3 characters for name/email, any length for IdUsuario)
   * @param {String} searchType - Type of search: 'name' (default), 'email', or 'idUsuario'
   * @param {Number} limit - Maximum number of results (default 20)
   * @returns {Promise<Array>} - List of matching users
   */
  static async searchUsers(searchTerm, searchType = 'name', limit = 20) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('limit', sql.Int, limit);
      
      let query = '';
      
      if (searchType === 'idUsuario') {
        // Búsqueda por IdUsuario (número exacto o parcial)
        const idUsuario = parseInt(searchTerm);
        if (isNaN(idUsuario)) {
          return []; // Si no es un número, retornar vacío
        }
        request.input('idUsuario', sql.Int, idUsuario);
        
        query = `
          SELECT TOP (@limit)
            u.IdUsuario,
            u.NombreCompleto,
            u.Email,
            u.CargoEmpresa,
            u.IdEmpresa AS EmpresaAsignada,
            e.Nombre AS NombreEmpresa
          FROM Usuario u
          LEFT JOIN Empresa e ON u.IdEmpresa = e.IdEmpresa
          WHERE u.IdUsuario = @idUsuario
          ORDER BY u.NombreCompleto
        `;
      } else if (searchType === 'email') {
        // Búsqueda por email
        request.input('searchTerm', sql.NVarChar(255), `%${searchTerm}%`);
        
        query = `
          SELECT TOP (@limit)
            u.IdUsuario,
            u.NombreCompleto,
            u.Email,
            u.CargoEmpresa,
            u.IdEmpresa AS EmpresaAsignada,
            e.Nombre AS NombreEmpresa
          FROM Usuario u
          LEFT JOIN Empresa e ON u.IdEmpresa = e.IdEmpresa
          WHERE u.Email LIKE @searchTerm
          ORDER BY u.Email
        `;
      } else {
        // Búsqueda por nombre (default)
        request.input('searchTerm', sql.NVarChar(255), `%${searchTerm}%`);
        
        query = `
          SELECT TOP (@limit)
            u.IdUsuario,
            u.NombreCompleto,
            u.Email,
            u.CargoEmpresa,
            u.IdEmpresa AS EmpresaAsignada,
            e.Nombre AS NombreEmpresa
          FROM Usuario u
          LEFT JOIN Empresa e ON u.IdEmpresa = e.IdEmpresa
          WHERE u.NombreCompleto LIKE @searchTerm
          ORDER BY u.NombreCompleto
        `;
      }
      
      const result = await request.query(query);
      return result.recordset;
    } catch (error) {
      logger.error(`Error searching users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Manual reassignment - reassign any chequeo to any user
   * Used when automatic detection doesn't find candidates
   * @param {Number} idEmpresa - Company ID
   * @param {Number} fromIdUsuario - Current user ID
   * @param {Number} toIdUsuario - Target user ID
   * @param {Number} testNumber - Test number to reassign
   * @param {Boolean} dryRun - If true, only show preview
   * @returns {Promise<Object>} - Result of reassignment
   */
  static async manualReassignChequeo(idEmpresa, fromIdUsuario, toIdUsuario, testNumber, dryRun = true) {
    try {
      const pool = await poolPromise;
      const transaction = pool.transaction();
      
      try {
        await transaction.begin();
        
        // Verificar que el chequeo existe
        const checkRequest = new sql.Request(transaction);
        checkRequest.input('idEmpresa', sql.Int, idEmpresa);
        checkRequest.input('fromIdUsuario', sql.Int, fromIdUsuario);
        checkRequest.input('testNumber', sql.Int, testNumber);
        
        const checkQuery = `
          SELECT IdEmpresaInfo, IdUsuario, Test
          FROM EmpresaInfo
          WHERE IdEmpresa = @idEmpresa 
            AND IdUsuario = @fromIdUsuario 
            AND Test = @testNumber
        `;
        
        const checkResult = await checkRequest.query(checkQuery);
        
        if (checkResult.recordset.length === 0) {
          await transaction.rollback();
          return {
            success: false,
            message: 'No se encontró el chequeo especificado'
          };
        }
        
        const empresaInfo = checkResult.recordset[0];
        
        if (dryRun) {
          await transaction.rollback();
          return {
            success: true,
            dryRun: true,
            preview: {
              idEmpresa: idEmpresa,
              idEmpresaInfo: empresaInfo.IdEmpresaInfo,
              currentIdUsuario: fromIdUsuario,
              newIdUsuario: toIdUsuario,
              currentTest: testNumber,
              newTest: testNumber // En reasignación manual, mantenemos el mismo número de test
            }
          };
        }
        
        // Actualizar EmpresaInfo
        const updateEIRequest = new sql.Request(transaction);
        updateEIRequest.input('idEmpresaInfo', sql.Int, empresaInfo.IdEmpresaInfo);
        updateEIRequest.input('newIdUsuario', sql.Int, toIdUsuario);
        
        await updateEIRequest.query(`
          UPDATE EmpresaInfo
          SET IdUsuario = @newIdUsuario
          WHERE IdEmpresaInfo = @idEmpresaInfo
        `);
        
        // Actualizar o mover TestUsuario
        const tuRequest = new sql.Request(transaction);
        tuRequest.input('fromIdUsuario', sql.Int, fromIdUsuario);
        tuRequest.input('toIdUsuario', sql.Int, toIdUsuario);
        tuRequest.input('testNumber', sql.Int, testNumber);
        
        // Verificar si ya existe TestUsuario para el nuevo usuario
        const tuCheckQuery = `
          SELECT IdTestUsuario 
          FROM TestUsuario 
          WHERE IdUsuario = @toIdUsuario AND Test = @testNumber
        `;
        const tuCheckResult = await tuRequest.query(tuCheckQuery);
        
        if (tuCheckResult.recordset.length > 0) {
          // Ya existe, eliminar el viejo
          await tuRequest.query(`
            DELETE FROM TestUsuario 
            WHERE IdUsuario = @fromIdUsuario AND Test = @testNumber
          `);
        } else {
          // No existe, actualizar el existente
          await tuRequest.query(`
            UPDATE TestUsuario
            SET IdUsuario = @toIdUsuario
            WHERE IdUsuario = @fromIdUsuario AND Test = @testNumber
          `);
        }
        
        // Actualizar o mover ResultadoNivelDigital
        const rndRequest = new sql.Request(transaction);
        rndRequest.input('fromIdUsuario', sql.Int, fromIdUsuario);
        rndRequest.input('toIdUsuario', sql.Int, toIdUsuario);
        rndRequest.input('testNumber', sql.Int, testNumber);
        
        const rndCheckQuery = `
          SELECT IdResultadoNivelDigital 
          FROM ResultadoNivelDigital 
          WHERE IdUsuario = @toIdUsuario AND Test = @testNumber
        `;
        const rndCheckResult = await rndRequest.query(rndCheckQuery);
        
        if (rndCheckResult.recordset.length > 0) {
          // Ya existe, eliminar el viejo
          await rndRequest.query(`
            DELETE FROM ResultadoNivelDigital 
            WHERE IdUsuario = @fromIdUsuario AND Test = @testNumber
          `);
        } else {
          // No existe, actualizar el existente
          await rndRequest.query(`
            UPDATE ResultadoNivelDigital
            SET IdUsuario = @toIdUsuario
            WHERE IdUsuario = @fromIdUsuario AND Test = @testNumber
          `);
        }
        
        // Migrar Respuestas, SubRespuestas y ResultadoProcesoCalculoPreguntas
        const respuestasRequest = new sql.Request(transaction);
        respuestasRequest.input('fromIdUsuario', sql.Int, fromIdUsuario);
        respuestasRequest.input('toIdUsuario', sql.Int, toIdUsuario);
        respuestasRequest.input('testNumber', sql.Int, testNumber);
        respuestasRequest.input('idEmpresa', sql.Int, idEmpresa);
        
        // Determinar el Test destino: si el testNumber es 1, probablemente se está moviendo a Test=2
        // Pero en reasignación manual, mantenemos el mismo testNumber a menos que se indique lo contrario
        // Por seguridad, verificamos si hay respuestas en el destino con el mismo testNumber
        const respCheckQuery = `
          SELECT COUNT(*) AS count 
          FROM dbo.Respuesta 
          WHERE IdUsuario = @toIdUsuario AND Test = @testNumber
        `;
        const respCheckResult = await respuestasRequest.query(respCheckQuery);
        
        // Si no hay respuestas en el destino, migrar las del origen
        // Si hay respuestas en el destino, también migramos pero con cuidado (no duplicar)
        if (respCheckResult.recordset[0].count === 0) {
          // No existen respuestas para el destino, migrar las existentes
          await respuestasRequest.query(`
            UPDATE dbo.Respuesta
            SET IdUsuario = @toIdUsuario,
                IdEmpresa = @idEmpresa,
                Test = @testNumber
            WHERE IdUsuario = @fromIdUsuario AND Test = @testNumber
          `);
          
          await respuestasRequest.query(`
            UPDATE dbo.SubRespuesta
            SET IdUsuario = @toIdUsuario,
                IdEmpresa = @idEmpresa,
                Test = @testNumber
            WHERE IdUsuario = @fromIdUsuario AND Test = @testNumber
          `);
          
          // Actualizar ResultadoProcesoCalculoPreguntas si existe
          await respuestasRequest.query(`
            IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'ResultadoProcesoCalculoPreguntas')
            BEGIN
              UPDATE dbo.ResultadoProcesoCalculoPreguntas
              SET IdUsuario = @toIdUsuario,
                  Test = @testNumber
              WHERE IdUsuario = @fromIdUsuario AND Test = @testNumber
            END
          `);
        } else {
          // Ya existen respuestas en el destino, loguear advertencia pero no migrar
          // (para evitar duplicados o sobrescribir respuestas existentes)
          logger.warn(`No se migraron respuestas: ya existen respuestas para IdUsuario=${toIdUsuario}, Test=${testNumber}. Empresa: ${idEmpresa}`);
        }
        
        await transaction.commit();
        
        logger.info(`Chequeo reasignado manualmente - IdEmpresa: ${idEmpresa}, From: ${fromIdUsuario}, To: ${toIdUsuario}, Test: ${testNumber}`);
        
        return {
          success: true,
          message: 'Chequeo reasignado exitosamente',
          result: {
            idEmpresa: idEmpresa,
            idEmpresaInfo: empresaInfo.IdEmpresaInfo,
            oldIdUsuario: fromIdUsuario,
            newIdUsuario: toIdUsuario,
            testNumber: testNumber
          }
        };
      } catch (error) {
        await transaction.rollback();
        logger.error(`Error in manual reassignment: ${error.message}`);
        throw error;
      }
    } catch (error) {
      logger.error(`Error in manualReassignChequeo: ${error.message}`);
      throw error;
    }
  }
}

module.exports = EmpresaModel;