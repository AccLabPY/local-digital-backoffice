const UsuariosSistemaModel = require('../models/usuariosSistema.model');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Controlador para Usuarios del Sistema (UsuariosSistema)
 */

/**
 * GET /api/usuarios-sistema
 * Obtener todos los usuarios del sistema
 */
exports.getAll = async (req, res) => {
  try {
    const usuarios = await UsuariosSistemaModel.getAll();
    
    res.json({
      success: true,
      data: usuarios,
      total: usuarios.length
    });
  } catch (error) {
    logger.error('Error getting all system users:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios del sistema',
      error: error.message
    });
  }
};

/**
 * GET /api/usuarios-sistema/:id
 * Obtener usuario del sistema por ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await UsuariosSistemaModel.getById(parseInt(id));
    
    res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    logger.error('Error getting system user by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario del sistema',
      error: error.message
    });
  }
};

/**
 * POST /api/usuarios-sistema
 * Crear nuevo usuario del sistema
 */
exports.create = async (req, res) => {
  try {
    const { email, password, nombre, apellido, organizacion, telefono, roleId } = req.body;
    
    // Validaciones básicas
    if (!email || !password || !nombre || !apellido || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña, nombre, apellido y rol son obligatorios'
      });
    }
    
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }
    
    const newUser = await UsuariosSistemaModel.create({
      email,
      password,
      nombre,
      apellido,
      organizacion,
      telefono,
      roleId: parseInt(roleId)
    });
    
    logger.info(`[USUARIOS SISTEMA] Usuario creado: ${newUser.Email} by ${req.user.email}`);
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: newUser
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    logger.error('Error creating system user:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario del sistema',
      error: error.message
    });
  }
};

/**
 * PUT /api/usuarios-sistema/:id
 * Actualizar usuario del sistema
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, nombre, apellido, organizacion, telefono, roleId } = req.body;
    
    // Validaciones básicas
    if (!email || !nombre || !apellido || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'Email, nombre, apellido y rol son obligatorios'
      });
    }
    
    const updatedUser = await UsuariosSistemaModel.update(parseInt(id), {
      email,
      nombre,
      apellido,
      organizacion,
      telefono,
      roleId: parseInt(roleId)
    });
    
    logger.info(`[USUARIOS SISTEMA] Usuario actualizado: ${updatedUser.Email} by ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    logger.error('Error updating system user:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario del sistema',
      error: error.message
    });
  }
};

/**
 * PUT /api/usuarios-sistema/:id/password
 * Cambiar contraseña de usuario del sistema (solo superadmin)
 */
exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }
    
    // Superadmin puede resetear password sin verificar el anterior
    const bcrypt = require('bcrypt');
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    const { poolPromise, sql } = require('../config/database');
    const pool = await poolPromise;
    
    await pool.request()
      .input('id', sql.Int, parseInt(id))
      .input('passwordHash', sql.VarChar, newPasswordHash)
      .query(`
        UPDATE UsuariosSistema
        SET 
          PasswordHash = @passwordHash,
          FechaActualizacion = SYSUTCDATETIME()
        WHERE IdUsuarioSistema = @id
      `);
    
    logger.info(`[USUARIOS SISTEMA] Password reseteado para usuario ID ${id} by ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    logger.error('Error updating system user password:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar contraseña',
      error: error.message
    });
  }
};

/**
 * PUT /api/usuarios-sistema/:id/toggle-active
 * Activar/desactivar usuario del sistema
 */
exports.toggleActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    
    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El campo activo debe ser booleano'
      });
    }
    
    const updatedUser = await UsuariosSistemaModel.toggleActive(parseInt(id), activo);
    
    logger.info(`[USUARIOS SISTEMA] Usuario ${activo ? 'activado' : 'desactivado'}: ID ${id} by ${req.user.email}`);
    
    res.json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
      data: updatedUser
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    logger.error('Error toggling system user active status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario',
      error: error.message
    });
  }
};

/**
 * DELETE /api/usuarios-sistema/:id
 * Eliminar (desactivar) usuario del sistema
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    // No permitir eliminar al propio usuario
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario'
      });
    }
    
    await UsuariosSistemaModel.delete(parseInt(id));
    
    logger.info(`[USUARIOS SISTEMA] Usuario eliminado: ID ${id} by ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    logger.error('Error deleting system user:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario del sistema',
      error: error.message
    });
  }
};

