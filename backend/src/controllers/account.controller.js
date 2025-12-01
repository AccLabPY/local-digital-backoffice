const UsuariosSistemaModel = require('../models/usuariosSistema.model');
const { catchAsync } = require('../middlewares/error.middleware');
const { ValidationError } = require('../utils/errors');

/**
 * Controller for account management (usuario logueado)
 */
const accountController = {
  /**
   * Obtener datos del usuario logueado
   */
  getMe: catchAsync(async (req, res) => {
    const { userId, type } = req.user;

    if (type === 'system') {
      const user = await UsuariosSistemaModel.getById(userId);
      
      res.status(200).json({
        status: 'success',
        data: {
          id: user.IdUsuarioSistema,
          email: user.Email,
          name: user.Nombre,
          lastName: user.Apellido,
          organization: user.Organizacion,
          phone: user.Telefono,
          role: user.RolNombre,
          roleId: user.RoleId,
          active: user.Activo,
          type: 'system'
        }
      });
    } else {
      // Usuario empresa (implementar si se necesita más adelante)
      res.status(200).json({
        status: 'success',
        data: {
          id: userId,
          email: req.user.email,
          name: req.user.name,
          type: 'empresa'
        }
      });
    }
  }),

  /**
   * Actualizar datos del usuario logueado
   */
  updateMe: catchAsync(async (req, res) => {
    const { userId, type, roleId } = req.user;
    const { email, name, lastName, organization, phone } = req.body;

    if (type === 'system') {
      // Validaciones
      if (!email || !name || !lastName) {
        throw new ValidationError('Email, nombre y apellido son requeridos');
      }

      // Actualizar usuario (mantiene el mismo roleId, no puede cambiar su propio rol)
      const updatedUser = await UsuariosSistemaModel.update(userId, {
        email,
        nombre: name,
        apellido: lastName,
        organizacion: organization,
        telefono: phone,
        roleId // Mantener el rol actual
      });

      res.status(200).json({
        status: 'success',
        message: 'Datos actualizados exitosamente',
        data: {
          id: updatedUser.IdUsuarioSistema,
          email: updatedUser.Email,
          name: updatedUser.Nombre,
          lastName: updatedUser.Apellido,
          organization: updatedUser.Organizacion,
          phone: updatedUser.Telefono
        }
      });
    } else {
      // Usuario empresa (implementar según necesidad)
      res.status(400).json({
        status: 'error',
        message: 'Actualización de datos de empresa no implementada aún'
      });
    }
  }),

  /**
   * Cambiar contraseña del usuario logueado
   */
  changePassword: catchAsync(async (req, res) => {
    const { userId, type } = req.user;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new ValidationError('Todos los campos son requeridos');
    }

    if (newPassword !== confirmPassword) {
      throw new ValidationError('La nueva contraseña y su confirmación no coinciden');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('La nueva contraseña debe tener al menos 8 caracteres');
    }

    if (type === 'system') {
      await UsuariosSistemaModel.updatePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        status: 'success',
        message: 'Contraseña actualizada exitosamente'
      });
    } else {
      // Usuario empresa (implementar según necesidad)
      res.status(400).json({
        status: 'error',
        message: 'Cambio de contraseña de empresa no implementado aún'
      });
    }
  })
};

module.exports = accountController;

