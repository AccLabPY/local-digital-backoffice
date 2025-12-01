const { poolPromise, sql } = require('../config/database');
const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errors');

/**
 * Modelo para RolesSistema
 */
class RolesModel {
  /**
   * Obtener todos los roles
   */
  static async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT IdRol, Nombre, Descripcion, FechaCreacion
        FROM RolesSistema
        ORDER BY 
          CASE Nombre
            WHEN 'superadmin' THEN 1
            WHEN 'contributor' THEN 2
            WHEN 'viewer' THEN 3
            ELSE 4
          END
      `);
      
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting all roles: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener rol por ID
   */
  static async getById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT IdRol, Nombre, Descripcion, FechaCreacion
          FROM RolesSistema
          WHERE IdRol = @id
        `);
      
      if (result.recordset.length === 0) {
        throw new NotFoundError('Rol no encontrado');
      }
      
      return result.recordset[0];
    } catch (error) {
      logger.error(`Error getting role by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener rol por nombre
   */
  static async getByName(nombre) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('nombre', sql.VarChar, nombre)
        .query(`
          SELECT IdRol, Nombre, Descripcion, FechaCreacion
          FROM RolesSistema
          WHERE Nombre = @nombre
        `);
      
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      logger.error(`Error getting role by name: ${error.message}`);
      throw error;
    }
  }
}

module.exports = RolesModel;

