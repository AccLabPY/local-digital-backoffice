const authService = require('../services/auth.service');
const logger = require('../utils/logger');

/**
 * Helper para hacer requests HTTP autenticados usando el servicio singleton
 * Evita múltiples llamadas al endpoint de login
 */
class AuthenticatedRequest {
  /**
   * Hace un request GET autenticado
   * @param {string} url - URL del endpoint
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Response>} Response del fetch
   */
  static async get(url, options = {}) {
    const token = await authService.getValidToken();
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    return fetch(url, { ...defaultOptions, ...options });
  }

  /**
   * Hace un request POST autenticado
   * @param {string} url - URL del endpoint
   * @param {Object} body - Cuerpo del request
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Response>} Response del fetch
   */
  static async post(url, body = {}, options = {}) {
    const token = await authService.getValidToken();
    
    const defaultOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(body)
    };

    return fetch(url, { ...defaultOptions, ...options });
  }

  /**
   * Hace un request PUT autenticado
   * @param {string} url - URL del endpoint
   * @param {Object} body - Cuerpo del request
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Response>} Response del fetch
   */
  static async put(url, body = {}, options = {}) {
    const token = await authService.getValidToken();
    
    const defaultOptions = {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(body)
    };

    return fetch(url, { ...defaultOptions, ...options });
  }

  /**
   * Hace un request DELETE autenticado
   * @param {string} url - URL del endpoint
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Response>} Response del fetch
   */
  static async delete(url, options = {}) {
    const token = await authService.getValidToken();
    
    const defaultOptions = {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    return fetch(url, { ...defaultOptions, ...options });
  }
}

module.exports = AuthenticatedRequest;
