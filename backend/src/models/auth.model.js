const { poolPromise, sql } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');
const { UnauthorizedError } = require('../utils/errors');
const UsuariosSistemaModel = require('./usuariosSistema.model');
const PermissionsModel = require('./permissions.model');

class AuthModel {
  /**
   * Authenticate a system user (backoffice)
   * @param {String} email - Email
   * @param {String} password - Password
   * @returns {Promise<Object>} - User data, token and permissions
   */
  static async login(email, password) {
    try {
      // Buscar usuario en UsuariosSistema
      const user = await UsuariosSistemaModel.getByEmail(email);
      
      if (!user) {
        throw new UnauthorizedError('Credenciales inválidas');
      }

      // Verificar que el usuario esté activo
      if (!user.Activo) {
        throw new UnauthorizedError('Usuario inactivo');
      }
      
      // Validar password
      const passwordMatch = await bcrypt.compare(password, user.PasswordHash);
      
      if (!passwordMatch) {
        throw new UnauthorizedError('Credenciales inválidas');
      }
      
      // Obtener permisos del usuario
      const permissions = await PermissionsModel.getFormattedPermissions(user.RoleId);

      // Generate JWT with 5 hours expiration (según requerimiento)
      const token = jwt.sign(
        { 
          userId: user.IdUsuarioSistema,
          email: user.Email,
          name: user.Nombre,
          lastName: user.Apellido,
          role: user.RolNombre,
          roleId: user.RoleId,
          type: 'system'
        },
        config.jwt.secret,
        { expiresIn: '5h' } // 5 horas según requerimiento
      );
      
      return {
        user: {
          id: user.IdUsuarioSistema,
          email: user.Email,
          name: user.Nombre,
          lastName: user.Apellido,
          fullName: `${user.Nombre} ${user.Apellido}`,
          organization: user.Organizacion,
          phone: user.Telefono,
          role: user.RolNombre,
          roleId: user.RoleId,
          type: 'system'
        },
        token,
        permissions
      };
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Authenticate an empresa/comercio user
   * @param {String} email - Email
   * @param {String} password - Password
   * @returns {Promise<Object>} - User data and token
   */
  static async loginEmpresa(email, password) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('email', sql.VarChar, email);
      
      const query = `
        SELECT IdUsuario, NombreCompleto, Email, Contraseña
        FROM Usuario
        WHERE Email = @email
      `;
      
      const result = await request.query(query);
      
      if (result.recordset.length === 0) {
        throw new UnauthorizedError('Credenciales inválidas');
      }
      
      const user = result.recordset[0];
      
      // Check password (texto plano por ahora, según tabla actual)
      const passwordMatch = password === user.Contraseña;
      
      if (!passwordMatch) {
        throw new UnauthorizedError('Credenciales inválidas');
      }
      
      // Generate JWT with 5 hours expiration
      const token = jwt.sign(
        { 
          userId: user.IdUsuario,
          email: user.Email,
          name: user.NombreCompleto,
          type: 'empresa'
        },
        config.jwt.secret,
        { expiresIn: '5h' }
      );
      
      return {
        user: {
          id: user.IdUsuario,
          name: user.NombreCompleto,
          email: user.Email,
          type: 'empresa'
        },
        token
      };
    } catch (error) {
      logger.error(`Login empresa error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Logout user (revoke token)
   * @param {String} token - JWT token to revoke
   * @param {Number} expirationHours - Hours until token expires
   */
  static async logout(token, expirationHours = 5) {
    try {
      const pool = await poolPromise;
      
      // Calcular fecha de expiración
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + expirationHours);

      await pool.request()
        .input('token', sql.VarChar(sql.MAX), token)
        .input('expiration', sql.DateTime2, expirationDate)
        .query(`
          INSERT INTO TokensRevocados (Token, FechaExpiracion)
          VALUES (@token, @expiration)
        `);

      logger.info('Token revoked successfully');
      return true;
    } catch (error) {
      logger.error(`Logout error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current user info with permissions
   * @param {Number} userId - User ID
   * @param {String} type - User type ('system' or 'empresa')
   */
  static async getCurrentUser(userId, type = 'system') {
    try {
      if (type === 'system') {
        const user = await UsuariosSistemaModel.getById(userId);
        const permissions = await PermissionsModel.getFormattedPermissions(user.RoleId);

        return {
          id: user.IdUsuarioSistema,
          email: user.Email,
          name: user.Nombre,
          lastName: user.Apellido,
          fullName: `${user.Nombre} ${user.Apellido}`,
          organization: user.Organizacion,
          phone: user.Telefono,
          role: user.RolNombre,
          roleId: user.RoleId,
          type: 'system',
          permissions
        };
      } else {
        // Usuario de empresa
        const pool = await poolPromise;
        const result = await pool.request()
          .input('userId', sql.Int, userId)
          .query(`
            SELECT IdUsuario, NombreCompleto, Email
            FROM Usuario
            WHERE IdUsuario = @userId
          `);

        if (result.recordset.length === 0) {
          throw new UnauthorizedError('Usuario no encontrado');
        }

        const user = result.recordset[0];
        return {
          id: user.IdUsuario,
          name: user.NombreCompleto,
          email: user.Email,
          type: 'empresa'
        };
      }
    } catch (error) {
      logger.error(`Get current user error: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Register a new user (for development/testing purposes)
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  static async register(userData) {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('Registration is only available in development environment');
      }
      
      const { username, password, email, name, role = 'user' } = userData;
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      const pool = await poolPromise;
      const request = pool.request();
      request.input('username', sql.VarChar, username);
      request.input('passwordHash', sql.VarChar, passwordHash);
      request.input('email', sql.VarChar, email);
      request.input('name', sql.VarChar, name);
      request.input('role', sql.VarChar, role);
      
      const query = `
        INSERT INTO Usuarios (Username, PasswordHash, Email, Nombre, Role)
        OUTPUT inserted.IdUsuario, inserted.Nombre, inserted.Email, inserted.Role
        VALUES (@username, @passwordHash, @email, @name, @role)
      `;
      
      const result = await request.query(query);
      
      if (result.recordset.length === 0) {
        throw new Error('Failed to register user');
      }
      
      return {
        id: result.recordset[0].IdUsuario,
        name: result.recordset[0].Nombre,
        email: result.recordset[0].Email,
        role: result.recordset[0].Role
      };
    } catch (error) {
      logger.error(`Registration error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AuthModel;
