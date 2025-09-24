const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Singleton Auth Service
 * Maneja la autenticación de forma centralizada y evita múltiples llamadas al login
 */
class AuthService {
  constructor() {
    if (AuthService.instance) {
      return AuthService.instance;
    }

    this.token = null;
    this.tokenExpiry = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
    
    // Credenciales por defecto
    this.defaultCredentials = {
      username: "saquino@mic.gov.py",
      password: "AXbHxVXNsKK3KYOfmAfezWjwRu7q/ghVofbYUdEk2ak="
    };

    AuthService.instance = this;
  }

  /**
   * Obtiene un token válido, renovándolo si es necesario
   * @returns {Promise<string>} Token JWT válido
   */
  async getValidToken() {
    // Si tenemos un token válido, lo devolvemos
    if (this.isTokenValid()) {
      logger.debug('Using cached valid token');
      return this.token;
    }

    // Si ya estamos refrescando, esperamos a que termine
    if (this.isRefreshing) {
      logger.debug('Token refresh in progress, waiting...');
      return this.refreshPromise;
    }

    // Iniciamos el proceso de renovación
    return this.refreshToken();
  }

  /**
   * Verifica si el token actual es válido
   * @returns {boolean} True si el token es válido
   */
  isTokenValid() {
    if (!this.token || !this.tokenExpiry) {
      return false;
    }

    // Verificamos si el token expira en los próximos 5 minutos
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return this.tokenExpiry > fiveMinutesFromNow;
  }

  /**
   * Renueva el token haciendo login
   * @returns {Promise<string>} Nuevo token JWT
   */
  async refreshToken() {
    this.isRefreshing = true;
    
    try {
      logger.info('Refreshing authentication token...');
      
      // Hacemos login para obtener un nuevo token
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.defaultCredentials),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Actualizamos el token y su expiración
      this.token = data.token;
      this.tokenExpiry = this.calculateTokenExpiry(data.token);
      
      logger.info(`Token refreshed successfully, expires at: ${this.tokenExpiry.toLocaleString()}`);
      
      return this.token;
      
    } catch (error) {
      logger.error(`Error refreshing token: ${error.message}`);
      this.token = null;
      this.tokenExpiry = null;
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Calcula la fecha de expiración del token
   * @param {string} token - Token JWT
   * @returns {Date} Fecha de expiración
   */
  calculateTokenExpiry(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
    } catch (error) {
      logger.warn('Could not decode token for expiry calculation');
    }
    
    // Fallback: asumimos 2 horas de vida
    return new Date(Date.now() + 2 * 60 * 60 * 1000);
  }

  /**
   * Invalida el token actual (útil para logout)
   */
  invalidateToken() {
    logger.info('Invalidating current token');
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Obtiene información del token actual
   * @returns {Object} Información del token
   */
  getTokenInfo() {
    return {
      hasToken: !!this.token,
      isValid: this.isTokenValid(),
      expiresAt: this.tokenExpiry,
      isRefreshing: this.isRefreshing
    };
  }
}

// Exportamos una instancia singleton
module.exports = new AuthService();
