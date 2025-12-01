const { poolPromise, sql } = require('../config/database');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * Modelo para UsuariosSistema (usuarios internos del backoffice)
 */
class UsuariosSistemaModel {
  /**
   * Obtener usuario por email
   */
  static async getByEmail(email) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('email', sql.VarChar, email)
        .query(`
          SELECT 
            us.IdUsuarioSistema,
            us.Email,
            us.PasswordHash,
            us.Nombre,
            us.Apellido,
            us.Organizacion,
            us.Telefono,
            us.RoleId,
            us.Activo,
            us.FechaCreacion,
            us.FechaActualizacion,
            r.Nombre AS RolNombre,
            r.Descripcion AS RolDescripcion
          FROM UsuariosSistema us
          INNER JOIN RolesSistema r ON us.RoleId = r.IdRol
          WHERE us.Email = @email
        `);
      
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      logger.error(`Error getting user by email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   */
  static async getById(id) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            us.IdUsuarioSistema,
            us.Email,
            us.Nombre,
            us.Apellido,
            us.Organizacion,
            us.Telefono,
            us.RoleId,
            us.Activo,
            us.FechaCreacion,
            us.FechaActualizacion,
            r.Nombre AS RolNombre,
            r.Descripcion AS RolDescripcion
          FROM UsuariosSistema us
          INNER JOIN RolesSistema r ON us.RoleId = r.IdRol
          WHERE us.IdUsuarioSistema = @id
        `);
      
      if (result.recordset.length === 0) {
        throw new NotFoundError('Usuario no encontrado');
      }
      
      return result.recordset[0];
    } catch (error) {
      logger.error(`Error getting user by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Listar todos los usuarios del sistema
   */
  static async getAll() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT 
          us.IdUsuarioSistema,
          us.Email,
          us.Nombre,
          us.Apellido,
          us.Organizacion,
          us.Telefono,
          us.RoleId,
          us.Activo,
          us.FechaCreacion,
          us.FechaActualizacion,
          r.Nombre AS RolNombre,
          r.Descripcion AS RolDescripcion
        FROM UsuariosSistema us
        INNER JOIN RolesSistema r ON us.RoleId = r.IdRol
        ORDER BY us.FechaCreacion DESC
      `);
      
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting all users: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear nuevo usuario del sistema
   */
  static async create(userData) {
    try {
      const { email, password, nombre, apellido, organizacion, telefono, roleId } = userData;
      
      // Validar que el email no exista
      const existingUser = await this.getByEmail(email);
      if (existingUser) {
        throw new ValidationError('El email ya está registrado');
      }

      // Hash del password
      const passwordHash = await bcrypt.hash(password, 10);

      const pool = await poolPromise;
      const result = await pool.request()
        .input('email', sql.VarChar, email)
        .input('passwordHash', sql.VarChar, passwordHash)
        .input('nombre', sql.VarChar, nombre)
        .input('apellido', sql.VarChar, apellido)
        .input('organizacion', sql.VarChar, organizacion || null)
        .input('telefono', sql.VarChar, telefono || null)
        .input('roleId', sql.Int, roleId)
        .query(`
          INSERT INTO UsuariosSistema (
            Email, PasswordHash, Nombre, Apellido, 
            Organizacion, Telefono, RoleId, Activo
          )
          OUTPUT 
            inserted.IdUsuarioSistema,
            inserted.Email,
            inserted.Nombre,
            inserted.Apellido,
            inserted.Organizacion,
            inserted.Telefono,
            inserted.RoleId,
            inserted.Activo
          VALUES (
            @email, @passwordHash, @nombre, @apellido,
            @organizacion, @telefono, @roleId, 1
          )
        `);

      return result.recordset[0];
    } catch (error) {
      logger.error(`Error creating user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar datos del usuario (sin password)
   */
  static async update(id, userData) {
    try {
      const { email, nombre, apellido, organizacion, telefono, roleId } = userData;

      // Si se está actualizando el email, verificar que no exista
      if (email) {
        const existingUser = await this.getByEmail(email);
        if (existingUser && existingUser.IdUsuarioSistema !== id) {
          throw new ValidationError('El email ya está en uso por otro usuario');
        }
      }

      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('email', sql.VarChar, email)
        .input('nombre', sql.VarChar, nombre)
        .input('apellido', sql.VarChar, apellido)
        .input('organizacion', sql.VarChar, organizacion || null)
        .input('telefono', sql.VarChar, telefono || null)
        .input('roleId', sql.Int, roleId)
        .query(`
          UPDATE UsuariosSistema
          SET 
            Email = @email,
            Nombre = @nombre,
            Apellido = @apellido,
            Organizacion = @organizacion,
            Telefono = @telefono,
            RoleId = @roleId,
            FechaActualizacion = SYSUTCDATETIME()
          OUTPUT 
            inserted.IdUsuarioSistema,
            inserted.Email,
            inserted.Nombre,
            inserted.Apellido,
            inserted.Organizacion,
            inserted.Telefono,
            inserted.RoleId,
            inserted.Activo
          WHERE IdUsuarioSistema = @id
        `);

      if (result.recordset.length === 0) {
        throw new NotFoundError('Usuario no encontrado');
      }

      return result.recordset[0];
    } catch (error) {
      logger.error(`Error updating user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cambiar contraseña de usuario
   */
  static async updatePassword(id, oldPassword, newPassword) {
    try {
      // Obtener usuario con password hash
      const pool = await poolPromise;
      const userResult = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT PasswordHash FROM UsuariosSistema WHERE IdUsuarioSistema = @id');

      if (userResult.recordset.length === 0) {
        throw new NotFoundError('Usuario no encontrado');
      }

      const user = userResult.recordset[0];

      // Verificar password actual
      const isValid = await bcrypt.compare(oldPassword, user.PasswordHash);
      if (!isValid) {
        throw new ValidationError('La contraseña actual es incorrecta');
      }

      // Hash del nuevo password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Actualizar
      await pool.request()
        .input('id', sql.Int, id)
        .input('passwordHash', sql.VarChar, newPasswordHash)
        .query(`
          UPDATE UsuariosSistema
          SET 
            PasswordHash = @passwordHash,
            FechaActualizacion = SYSUTCDATETIME()
          WHERE IdUsuarioSistema = @id
        `);

      return true;
    } catch (error) {
      logger.error(`Error updating password: ${error.message}`);
      throw error;
    }
  }

  /**
   * Activar/Desactivar usuario
   */
  static async toggleActive(id, activo) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('activo', sql.Bit, activo)
        .query(`
          UPDATE UsuariosSistema
          SET 
            Activo = @activo,
            FechaActualizacion = SYSUTCDATETIME()
          OUTPUT inserted.IdUsuarioSistema, inserted.Activo
          WHERE IdUsuarioSistema = @id
        `);

      if (result.recordset.length === 0) {
        throw new NotFoundError('Usuario no encontrado');
      }

      return result.recordset[0];
    } catch (error) {
      logger.error(`Error toggling user active status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar usuario (soft delete - marca como inactivo)
   */
  static async delete(id) {
    try {
      return await this.toggleActive(id, false);
    } catch (error) {
      logger.error(`Error deleting user: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validar password
   */
  static async validatePassword(passwordHash, password) {
    return await bcrypt.compare(password, passwordHash);
  }
}

module.exports = UsuariosSistemaModel;

