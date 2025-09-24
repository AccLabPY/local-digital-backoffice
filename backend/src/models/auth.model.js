const { poolPromise, sql } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');
const { UnauthorizedError } = require('../utils/errors');

class AuthModel {
  /**
   * Authenticate a user
   * @param {String} username - Username
   * @param {String} password - Password
   * @returns {Promise<Object>} - User data and token
   */
  static async login(username, password) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('username', sql.VarChar, username);
      
      const query = `
        SELECT IdUsuario, NombreCompleto, Email, Contraseña
        FROM Usuario
        WHERE Email = @username
      `;
      
      const result = await request.query(query);
      
      if (result.recordset.length === 0) {
        throw new UnauthorizedError('Invalid credentials');
      }
      
      const user = result.recordset[0];
      
      // Check password (assuming plain text for now, we'll need to hash it)
      const passwordMatch = password === user.Contraseña;
      
      if (!passwordMatch) {
        throw new UnauthorizedError('Invalid credentials');
      }
      
      // Generate JWT with 2 hours expiration
      const token = jwt.sign(
        { 
          id: user.IdUsuario, 
          name: user.NombreCompleto, 
          email: user.Email,
          role: 'user'
        },
        config.jwt.secret,
        { expiresIn: '2h' } // 2 horas de vida del token
      );
      
      return {
        user: {
          id: user.IdUsuario,
          name: user.NombreCompleto,
          email: user.Email,
          role: 'user'
        },
        token
      };
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
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
