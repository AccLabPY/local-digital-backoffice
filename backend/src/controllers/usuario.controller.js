const UsuarioModel = require('../models/usuario.model');
const { catchAsync } = require('../middlewares/error.middleware');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const logger = require('../utils/logger');

// Helper para convertir strings a int sin problemas con 0
const toInt = (v, def) => (v !== undefined ? parseInt(v, 10) : def);

/**
 * Controller for user-related operations
 */
const usuarioController = {
  /**
   * Get paginated list of users with search
   */
  getUsuarios: catchAsync(async (req, res) => {
    const page = toInt(req.query.page, 1);
    const limit = toInt(req.query.limit, 10);
    const searchTerm = req.query.searchTerm || '';
    
    const result = await UsuarioModel.getUsuarios({ 
      page, 
      limit, 
      searchTerm
    });
    
    res.status(200).json(result);
  }),
  
  /**
   * Get user by ID
   */
  getUsuarioById: catchAsync(async (req, res) => {
    const idUsuario = parseInt(req.params.id);
    
    if (!idUsuario) {
      throw new BadRequestError('ID de usuario es requerido');
    }
    
    const usuario = await UsuarioModel.getUsuarioById(idUsuario);
    
    if (!usuario) {
      throw new NotFoundError(`Usuario con ID ${idUsuario} no encontrado`);
    }
    
    res.status(200).json(usuario);
  }),
  
  /**
   * Create a new user
   */
  createUsuario: catchAsync(async (req, res) => {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.nombreCompleto) {
      throw new BadRequestError('Nombre completo es requerido');
    }
    
    if (!userData.email) {
      throw new BadRequestError('Email es requerido');
    }
    
    if (!userData.contraseña) {
      throw new BadRequestError('Contraseña es requerida');
    }
    
    if (!userData.idEmpresa) {
      throw new BadRequestError('ID de empresa es requerido');
    }
    
    // Log the creation operation
    logger.info(`Creación de usuario iniciada - Nombre: ${userData.nombreCompleto}, Email: ${userData.email}, Usuario: ${req.user?.email || 'desconocido'}`);
    
    const usuario = await UsuarioModel.createUsuario(userData);
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      usuario
    });
  }),
  
  /**
   * Update a user
   */
  updateUsuario: catchAsync(async (req, res) => {
    const idUsuario = parseInt(req.params.id);
    const userData = req.body;
    
    if (!idUsuario) {
      throw new BadRequestError('ID de usuario es requerido');
    }
    
    // Validate that at least one field to update is provided
    if (!Object.keys(userData).length) {
      throw new BadRequestError('No se proporcionaron datos para actualizar');
    }
    
    // Check if user exists
    const existingUser = await UsuarioModel.getUsuarioById(idUsuario);
    if (!existingUser) {
      throw new NotFoundError(`Usuario con ID ${idUsuario} no encontrado`);
    }
    
    // Log the update operation
    logger.info(`Actualización de usuario iniciada - ID: ${idUsuario}, Usuario: ${req.user?.email || 'desconocido'}, Datos: ${JSON.stringify(userData)}`);
    
    const usuario = await UsuarioModel.updateUsuario(idUsuario, userData);
    
    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      usuario
    });
  }),
  
  /**
   * Delete a user
   */
  deleteUsuario: catchAsync(async (req, res) => {
    const idUsuario = parseInt(req.params.id);
    const { deleteType } = req.body;
    
    if (!idUsuario) {
      throw new BadRequestError('ID de usuario es requerido');
    }
    
    if (!deleteType || (deleteType !== 'partial' && deleteType !== 'complete')) {
      throw new BadRequestError('Tipo de eliminación inválido. Debe ser "partial" o "complete"');
    }
    
    // Check if user exists
    const existingUser = await UsuarioModel.getUsuarioById(idUsuario);
    if (!existingUser) {
      throw new NotFoundError(`Usuario con ID ${idUsuario} no encontrado`);
    }
    
    // Log the deletion operation
    logger.info(`Eliminación de usuario iniciada - ID: ${idUsuario}, Tipo: ${deleteType}, Usuario: ${req.user?.email || 'desconocido'}`);
    
    const result = await UsuarioModel.deleteUsuario(idUsuario, deleteType);
    
    res.status(200).json({
      success: true,
      message: `Usuario eliminado exitosamente (${deleteType === 'partial' ? 'borrado parcial' : 'borrado completo'})`,
      result
    });
  }),
  
  /**
   * Update user email only
   */
  updateEmail: catchAsync(async (req, res) => {
    const idUsuario = parseInt(req.params.id);
    const { email } = req.body;
    
    if (!idUsuario) {
      throw new BadRequestError('ID de usuario es requerido');
    }
    
    if (!email) {
      throw new BadRequestError('Email es requerido');
    }
    
    // Check if user exists
    const existingUser = await UsuarioModel.getUsuarioById(idUsuario);
    if (!existingUser) {
      throw new NotFoundError(`Usuario con ID ${idUsuario} no encontrado`);
    }
    
    // Log the email update operation
    logger.info(`Actualización de email iniciada - ID: ${idUsuario}, Nuevo email: ${email}, Usuario: ${req.user?.email || 'desconocido'}`);
    
    const updatedUser = await UsuarioModel.updateUserEmail(idUsuario, email);
    
    res.status(200).json({
      success: true,
      message: 'Email actualizado exitosamente',
      data: updatedUser
    });
  }),

  /**
   * Update user password
   */
  updatePassword: catchAsync(async (req, res) => {
    const idUsuario = parseInt(req.params.id);
    const { newPassword } = req.body;
    
    if (!idUsuario) {
      throw new BadRequestError('ID de usuario es requerido');
    }
    
    if (!newPassword) {
      throw new BadRequestError('Nueva contraseña es requerida');
    }
    
    // Check if user exists
    const existingUser = await UsuarioModel.getUsuarioById(idUsuario);
    if (!existingUser) {
      throw new NotFoundError(`Usuario con ID ${idUsuario} no encontrado`);
    }
    
    // Log the password update operation
    logger.info(`Actualización de contraseña iniciada - ID: ${idUsuario}, Usuario: ${req.user?.email || 'desconocido'}`);
    
    const result = await UsuarioModel.updatePassword(idUsuario, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  }),
  
  /**
   * Get companies for dropdown
   */
  getCompaniesForDropdown: catchAsync(async (req, res) => {
    const companies = await UsuarioModel.getCompaniesForDropdown();
    
    res.status(200).json(companies);
  })
};

module.exports = usuarioController;
