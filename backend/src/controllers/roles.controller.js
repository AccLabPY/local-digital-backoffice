const RolesModel = require('../models/roles.model');
const ResourcesModel = require('../models/resources.model');
const PermissionsModel = require('../models/permissions.model');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Controlador para Roles y Permisos
 */

/**
 * GET /api/roles
 * Obtener todos los roles del sistema
 */
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await RolesModel.getAll();
    
    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    logger.error('Error getting all roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener roles',
      error: error.message
    });
  }
};

/**
 * GET /api/roles/:id
 * Obtener rol por ID
 */
exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await RolesModel.getById(parseInt(id));
    
    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    logger.error('Error getting role by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rol',
      error: error.message
    });
  }
};

/**
 * GET /api/roles/:id/permissions
 * Obtener permisos de un rol
 */
exports.getRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el rol existe
    await RolesModel.getById(parseInt(id));
    
    const permissions = await PermissionsModel.getByRoleId(parseInt(id));
    
    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    logger.error('Error getting role permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos del rol',
      error: error.message
    });
  }
};

/**
 * GET /api/resources
 * Obtener todos los recursos del sistema
 */
exports.getAllResources = async (req, res) => {
  try {
    const resources = await ResourcesModel.getAll();
    
    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    logger.error('Error getting all resources:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recursos',
      error: error.message
    });
  }
};

/**
 * GET /api/resources/:id
 * Obtener recurso por ID
 */
exports.getResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await ResourcesModel.getById(parseInt(id));
    
    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    logger.error('Error getting resource by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recurso',
      error: error.message
    });
  }
};

/**
 * PUT /api/roles/:roleId/resources/:resourceId/permissions
 * Actualizar permisos de un rol para un recurso
 */
exports.updatePermission = async (req, res) => {
  try {
    const { roleId, resourceId } = req.params;
    const { canView, canCreate, canEdit, canDelete } = req.body;
    
    // Verificar que el rol y recurso existen
    await RolesModel.getById(parseInt(roleId));
    await ResourcesModel.getById(parseInt(resourceId));
    
    await PermissionsModel.updatePermission(
      parseInt(roleId),
      parseInt(resourceId),
      { canView, canCreate, canEdit, canDelete }
    );
    
    logger.info(`[ROLES] Permisos actualizados - Role: ${roleId}, Resource: ${resourceId} by ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Permisos actualizados exitosamente'
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    logger.error('Error updating permission:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar permisos',
      error: error.message
    });
  }
};

/**
 * GET /api/roles/overview
 * Obtener resumen completo de roles, recursos y permisos
 */
exports.getOverview = async (req, res) => {
  try {
    const roles = await RolesModel.getAll();
    const resources = await ResourcesModel.getAll();
    
    // Para cada rol, obtener sus permisos
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await PermissionsModel.getByRoleId(role.IdRol);
        return {
          ...role,
          permissions
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        roles: rolesWithPermissions,
        resources
      }
    });
  } catch (error) {
    logger.error('Error getting roles overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de roles',
      error: error.message
    });
  }
};

