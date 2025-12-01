const { poolPromise, sql } = require('../config/database');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class UsuarioModel {
  /**
   * Get all users with pagination and filtering
   * @param {Object} options - Query options
   * @param {Number} options.page - Page number
   * @param {Number} options.limit - Number of items per page
   * @param {String} options.searchTerm - Search term
   * @returns {Promise<Object>} - Paginated result with users and count
   */
  static async getUsuarios({ page = 1, limit = 10, searchTerm = '' }) {
    try {
      const offset = (page - 1) * limit;
      const pool = await poolPromise;
      
      // Query for users with pagination
      const query = `
        SELECT 
          u.IdUsuario,
          u.NombreCompleto,
          u.Email,
          u.RutEmpresa,
          u.NombreEmpresa,
          u.FechaRegistro,
          u.FechaIngreso,
          u.CargoEmpresa,
          u.IsConnected,
          u.UltimaActividad,
          e.IdEmpresa,
          e.Nombre AS EmpresaNombre,
          COUNT(*) OVER() AS TotalCount
        FROM Usuario u
        LEFT JOIN Empresa e ON u.IdEmpresa = e.IdEmpresa
        WHERE (@searchTerm IS NULL OR 
              u.NombreCompleto LIKE '%' + @searchTerm + '%' OR 
              u.Email LIKE '%' + @searchTerm + '%' OR
              u.NombreEmpresa LIKE '%' + @searchTerm + '%')
        ORDER BY u.FechaRegistro DESC, u.NombreCompleto
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY
      `;
      
      const request = pool.request();
      request.input('offset', sql.Int, offset);
      request.input('limit', sql.Int, limit);
      request.input('searchTerm', sql.NVarChar(100), searchTerm || null);
      
      const result = await request.query(query);
      
      const totalCount = result.recordset.length > 0 ? result.recordset[0].TotalCount : 0;
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        data: result.recordset,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      logger.error(`Error getting users: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get user by ID
   * @param {Number} idUsuario - User ID
   * @returns {Promise<Object|null>} - User data or null if not found
   */
  static async getUsuarioById(idUsuario) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idUsuario', sql.Int, idUsuario);
      
      const query = `
        SELECT 
          u.IdUsuario,
          u.IdEmpresa,
          u.NombreCompleto,
          u.Email,
          u.RutEmpresa,
          u.NombreEmpresa,
          u.FechaRegistro,
          u.FechaIngreso,
          u.CargoEmpresa,
          u.IsConnected,
          u.UltimaActividad,
          e.Nombre AS EmpresaNombre
        FROM Usuario u
        LEFT JOIN Empresa e ON u.IdEmpresa = e.IdEmpresa
        WHERE u.IdUsuario = @idUsuario
      `;
      
      const result = await request.query(query);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return result.recordset[0];
    } catch (error) {
      logger.error(`Error getting user by ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  static async createUsuario(userData) {
    try {
      const { 
        idEmpresa, 
        nombreCompleto, 
        email, 
        contraseña, 
        rutEmpresa, 
        nombreEmpresa, 
        cargoEmpresa 
      } = userData;
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(contraseña, saltRounds);
      
      const pool = await poolPromise;
      const request = pool.request();
      
      // Set parameters
      request.input('idEmpresa', sql.Int, idEmpresa);
      request.input('nombreCompleto', sql.VarChar(100), nombreCompleto);
      request.input('email', sql.VarChar(150), email);
      request.input('contraseña', sql.VarChar(100), hashedPassword);
      request.input('codigoActivacion', sql.UniqueIdentifier, uuidv4());
      request.input('rutEmpresa', sql.VarChar(100), rutEmpresa);
      request.input('nombreEmpresa', sql.VarChar(100), nombreEmpresa);
      request.input('fechaRegistro', sql.DateTime, new Date());
      request.input('cargoEmpresa', sql.VarChar(50), cargoEmpresa);
      request.input('isConnected', sql.VarChar(50), 'No');
      
      // Insert query
      const query = `
        INSERT INTO Usuario (
          IdEmpresa,
          NombreCompleto,
          Email,
          Contraseña,
          CodigoActivacion,
          RutEmpresa,
          NombreEmpresa,
          FechaRegistro,
          CargoEmpresa,
          IsConnected
        )
        OUTPUT INSERTED.IdUsuario
        VALUES (
          @idEmpresa,
          @nombreCompleto,
          @email,
          @contraseña,
          @codigoActivacion,
          @rutEmpresa,
          @nombreEmpresa,
          @fechaRegistro,
          @cargoEmpresa,
          @isConnected
        )
      `;
      
      const result = await request.query(query);
      const idUsuario = result.recordset[0].IdUsuario;
      
      // Get the created user
      return await this.getUsuarioById(idUsuario);
    } catch (error) {
      logger.error(`Error creating user: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update a user
   * @param {Number} idUsuario - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} - Updated user
   */
  static async updateUsuario(idUsuario, userData) {
    try {
      const pool = await poolPromise;
      const transaction = pool.transaction();
      
      try {
        await transaction.begin();
        
        const request = new sql.Request(transaction);
        request.input('idUsuario', sql.Int, idUsuario);
        
        // Build dynamic update query
        let updateFields = [];
        
        if (userData.nombreCompleto !== undefined) {
          request.input('nombreCompleto', sql.VarChar(100), userData.nombreCompleto);
          updateFields.push('NombreCompleto = @nombreCompleto');
        }
        
        if (userData.email !== undefined) {
          request.input('email', sql.VarChar(150), userData.email);
          updateFields.push('Email = @email');
        }
        
        if (userData.idEmpresa !== undefined) {
          request.input('idEmpresa', sql.Int, userData.idEmpresa);
          updateFields.push('IdEmpresa = @idEmpresa');
          
          // Get empresa name for updating NombreEmpresa
          const empresaRequest = new sql.Request(transaction);
          empresaRequest.input('idEmpresa', sql.Int, userData.idEmpresa);
          const empresaResult = await empresaRequest.query('SELECT Nombre, Rut FROM Empresa WHERE IdEmpresa = @idEmpresa');
          
          if (empresaResult.recordset.length > 0) {
            const empresa = empresaResult.recordset[0];
            request.input('nombreEmpresa', sql.VarChar(100), empresa.Nombre);
            updateFields.push('NombreEmpresa = @nombreEmpresa');
            
            request.input('rutEmpresa', sql.VarChar(100), empresa.Rut);
            updateFields.push('RutEmpresa = @rutEmpresa');
          }
        }
        
        if (userData.cargoEmpresa !== undefined) {
          request.input('cargoEmpresa', sql.VarChar(50), userData.cargoEmpresa);
          updateFields.push('CargoEmpresa = @cargoEmpresa');
        }
        
        if (userData.isConnected !== undefined) {
          request.input('isConnected', sql.VarChar(50), userData.isConnected);
          updateFields.push('IsConnected = @isConnected');
        }
        
        if (userData.contraseña !== undefined) {
          // Hash new password
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(userData.contraseña, saltRounds);
          request.input('contraseña', sql.VarChar(100), hashedPassword);
          updateFields.push('Contraseña = @contraseña');
        }
        
        // Update last activity timestamp
        request.input('ultimaActividad', sql.DateTime, new Date());
        updateFields.push('UltimaActividad = @ultimaActividad');
        
        // Execute update if there are fields to update
        if (updateFields.length > 0) {
          const updateQuery = `
            UPDATE Usuario
            SET ${updateFields.join(', ')}
            WHERE IdUsuario = @idUsuario
          `;
          
          await request.query(updateQuery);
        }
        
        await transaction.commit();
        
        // Get the updated user
        return await this.getUsuarioById(idUsuario);
      } catch (error) {
        await transaction.rollback();
        logger.error(`Error in transaction updating user: ${error.message}`);
        throw error;
      }
    } catch (error) {
      logger.error(`Error updating user: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a user with options for partial or complete deletion
   * @param {Number} idUsuario - User ID
   * @param {String} deleteType - Type of deletion ('partial' or 'complete')
   * @returns {Promise<Object>} - Result of deletion
   */
  static async deleteUsuario(idUsuario, deleteType = 'partial') {
    try {
      const pool = await poolPromise;
      const transaction = pool.transaction();
      
      try {
        await transaction.begin();
        
        // Get user details first for logging
        const userRequest = new sql.Request(transaction);
        userRequest.input('idUsuario', sql.Int, idUsuario);
        const userQuery = `
          SELECT 
            u.IdUsuario, 
            u.NombreCompleto,
            u.Email,
            u.IdEmpresa,
            u.RutEmpresa,
            (SELECT COUNT(*) FROM TestUsuario WHERE IdUsuario = u.IdUsuario) AS TestCount
          FROM Usuario u
          WHERE u.IdUsuario = @idUsuario
        `;
        const userResult = await userRequest.query(userQuery);
        
        if (userResult.recordset.length === 0) {
          throw new Error('Usuario no encontrado');
        }
        
        const userDetails = userResult.recordset[0];
        
        // Delete related records based on deletion type
        if (deleteType === 'partial' || deleteType === 'complete') {
          // Delete test-related records
          await new sql.Request(transaction).input('idUsuario', sql.Int, idUsuario)
            .query('DELETE FROM ResultadoNivelDigitalOriginal WHERE IdUsuario = @idUsuario');
          
          await new sql.Request(transaction).input('idUsuario', sql.Int, idUsuario)
            .query('DELETE FROM DimensionUsuario WHERE IdUsuario = @idUsuario');
          
          await new sql.Request(transaction).input('idUsuario', sql.Int, idUsuario)
            .query('DELETE FROM RecomendacionUsuario WHERE IdUsuario = @idUsuario');
          
          await new sql.Request(transaction).input('idUsuario', sql.Int, idUsuario)
            .query('DELETE FROM Respuesta WHERE IdUsuario = @idUsuario');
          
          await new sql.Request(transaction).input('idUsuario', sql.Int, idUsuario)
            .query('DELETE FROM ResultadoNivelDigital WHERE IdUsuario = @idUsuario');
          
          await new sql.Request(transaction).input('idUsuario', sql.Int, idUsuario)
            .query('DELETE FROM ResultadoProcesoCalculoPreguntas WHERE IdUsuario = @idUsuario');
          
          await new sql.Request(transaction).input('idUsuario', sql.Int, idUsuario)
            .query('DELETE FROM SubRespuesta WHERE IdUsuario = @idUsuario');
          
          await new sql.Request(transaction).input('idUsuario', sql.Int, idUsuario)
            .query('DELETE FROM TestUsuario WHERE IdUsuario = @idUsuario');
          
          // Delete user-company relationship
          await new sql.Request(transaction).input('idUsuario', sql.Int, idUsuario)
            .query('DELETE FROM EmpresaInfo WHERE IdUsuario = @idUsuario');
        }
        
        // For complete deletion, also delete associated companies
        if (deleteType === 'complete' && userDetails.IdEmpresa) {
          // Delete company-related records
          await new sql.Request(transaction).input('idEmpresa', sql.Int, userDetails.IdEmpresa)
            .query('DELETE FROM EmpresaPregunta WHERE IdEmpresa = @idEmpresa');
          
          await new sql.Request(transaction).input('idEmpresa', sql.Int, userDetails.IdEmpresa)
            .query('DELETE FROM EmpresaTest WHERE IdEmpresa = @idEmpresa');
          
          // Delete the company itself
          await new sql.Request(transaction).input('idEmpresa', sql.Int, userDetails.IdEmpresa)
            .query('DELETE FROM Empresa WHERE IdEmpresa = @idEmpresa');
        }
        
        // Finally delete the user
        await new sql.Request(transaction).input('idUsuario', sql.Int, idUsuario)
          .query('DELETE FROM Usuario WHERE IdUsuario = @idUsuario');
        
        await transaction.commit();
        
        return {
          success: true,
          deletedUser: {
            idUsuario: userDetails.IdUsuario,
            nombreCompleto: userDetails.NombreCompleto,
            email: userDetails.Email,
            testCount: userDetails.TestCount,
            deleteType
          }
        };
      } catch (error) {
        await transaction.rollback();
        logger.error(`Error in transaction deleting user: ${error.message}`);
        throw error;
      }
    } catch (error) {
      logger.error(`Error deleting user: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update user email only
   * @param {Number} idUsuario - User ID
   * @param {String} newEmail - New email
   * @returns {Promise<Object>} - Updated user data
   */
  static async updateUserEmail(idUsuario, newEmail) {
    try {
      const pool = await poolPromise;
      const transaction = pool.transaction();
      
      try {
        await transaction.begin();
        
        const request = new sql.Request(transaction);
        request.input('idUsuario', sql.Int, idUsuario);
        request.input('email', sql.VarChar(150), newEmail);
        request.input('ultimaActividad', sql.DateTime, new Date());
        
        const updateQuery = `
          UPDATE Usuario
          SET Email = @email, UltimaActividad = @ultimaActividad
          WHERE IdUsuario = @idUsuario
        `;
        
        await request.query(updateQuery);
        
        await transaction.commit();
        
        // Get the updated user
        return await this.getUsuarioById(idUsuario);
      } catch (error) {
        await transaction.rollback();
        logger.error(`Error in transaction updating user email: ${error.message}`);
        throw error;
      }
    } catch (error) {
      logger.error(`Error updating user email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update user password
   * @param {Number} idUsuario - User ID
   * @param {String} newPassword - New password
   * @returns {Promise<Object>} - Result of password update
   */
  static async updatePassword(idUsuario, newPassword) {
    try {
      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idUsuario', sql.Int, idUsuario);
      request.input('contraseña', sql.VarChar(100), hashedPassword);
      request.input('ultimaActividad', sql.DateTime, new Date());
      
      const query = `
        UPDATE Usuario
        SET Contraseña = @contraseña,
            UltimaActividad = @ultimaActividad
        WHERE IdUsuario = @idUsuario
      `;
      
      await request.query(query);
      
      return {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };
    } catch (error) {
      logger.error(`Error updating password: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get all companies for dropdown selection
   * @returns {Promise<Array>} - List of companies
   */
  static async getCompaniesForDropdown() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT 
          IdEmpresa as id,
          Nombre as nombre,
          Rut as rut
        FROM Empresa
        ORDER BY Nombre
      `);
      
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting companies for dropdown: ${error.message}`);
      throw error;
    }
  }
}

module.exports = UsuarioModel;
