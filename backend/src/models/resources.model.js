const { poolPromise, sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

/**
 * Modelo para Resources (recursos del sistema)
 */
class ResourcesModel {
  /**
   * Obtener todos los recursos
   */
  static async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT IdRecurso, Codigo, Descripcion, Categoria, FechaCreacion
        FROM Resources
        ORDER BY Categoria, Codigo
      `);
      
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting all resources: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener recurso por ID
   */
  static async getById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT IdRecurso, Codigo, Descripcion, Categoria, FechaCreacion
          FROM Resources
          WHERE IdRecurso = @id
        `);
      
      if (result.recordset.length === 0) {
        throw new NotFoundError('Recurso no encontrado');
      }
      
      return result.recordset[0];
    } catch (error) {
      logger.error(`Error getting resource by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener recurso por código
   */
  static async getByCode(codigo) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('codigo', sql.VarChar, codigo)
        .query(`
          SELECT IdRecurso, Codigo, Descripcion, Categoria, FechaCreacion
          FROM Resources
          WHERE Codigo = @codigo
        `);
      
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      logger.error(`Error getting resource by code: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener recursos por categoría
   */
  static async getByCategory(categoria) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('categoria', sql.VarChar, categoria)
        .query(`
          SELECT IdRecurso, Codigo, Descripcion, Categoria, FechaCreacion
          FROM Resources
          WHERE Categoria = @categoria
          ORDER BY Codigo
        `);
      
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting resources by category: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ResourcesModel;

