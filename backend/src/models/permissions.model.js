const { poolPromise, sql } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Modelo para RoleResourcePermissions (permisos por rol y recurso)
 */
class PermissionsModel {
  /**
   * Obtener todos los permisos de un rol
   */
  static async getByRoleId(roleId) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('roleId', sql.Int, roleId)
        .query(`
          SELECT 
            rrp.IdRol,
            rrp.IdRecurso,
            rrp.CanView,
            rrp.CanCreate,
            rrp.CanEdit,
            rrp.CanDelete,
            r.Codigo AS ResourceCode,
            r.Descripcion AS ResourceDescription,
            r.Categoria AS ResourceCategory
          FROM RoleResourcePermissions rrp
          INNER JOIN Resources r ON rrp.IdRecurso = r.IdRecurso
          WHERE rrp.IdRol = @roleId
          ORDER BY r.Categoria, r.Codigo
        `);
      
      return result.recordset;
    } catch (error) {
      logger.error(`Error getting permissions by role: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener permisos de un rol para un recurso específico
   */
  static async getByRoleAndResource(roleId, resourceCode) {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .input('roleId', sql.Int, roleId)
        .input('resourceCode', sql.VarChar, resourceCode)
        .query(`
          SELECT 
            rrp.IdRol,
            rrp.IdRecurso,
            rrp.CanView,
            rrp.CanCreate,
            rrp.CanEdit,
            rrp.CanDelete,
            r.Codigo AS ResourceCode
          FROM RoleResourcePermissions rrp
          INNER JOIN Resources r ON rrp.IdRecurso = r.IdRecurso
          WHERE rrp.IdRol = @roleId AND r.Codigo = @resourceCode
        `);
      
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      logger.error(`Error getting permission by role and resource: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar si un rol tiene permiso específico en un recurso
   */
  static async checkPermission(roleId, resourceCode, action) {
    try {
      const permission = await this.getByRoleAndResource(roleId, resourceCode);
      
      if (!permission) {
        return false;
      }

      // Mapear acción a campo
      const actionMap = {
        'view': 'CanView',
        'create': 'CanCreate',
        'edit': 'CanEdit',
        'delete': 'CanDelete'
      };

      const field = actionMap[action.toLowerCase()];
      if (!field) {
        return false;
      }

      return permission[field] === true || permission[field] === 1;
    } catch (error) {
      logger.error(`Error checking permission: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener permisos formateados para el frontend
   * Retorna un objeto con los recursos y sus permisos
   */
  static async getFormattedPermissions(roleId) {
    try {
      const permissions = await this.getByRoleId(roleId);
      
      // Formatear como objeto { resourceCode: { canView, canCreate, canEdit, canDelete } }
      const formatted = {};
      
      permissions.forEach(perm => {
        formatted[perm.ResourceCode] = {
          canView: perm.CanView === 1 || perm.CanView === true,
          canCreate: perm.CanCreate === 1 || perm.CanCreate === true,
          canEdit: perm.CanEdit === 1 || perm.CanEdit === true,
          canDelete: perm.CanDelete === 1 || perm.CanDelete === true,
          description: perm.ResourceDescription,
          category: perm.ResourceCategory
        };
      });
      
      return formatted;
    } catch (error) {
      logger.error(`Error getting formatted permissions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar permisos de un rol para un recurso
   * (Solo para uso de superadmin)
   */
  static async updatePermission(roleId, resourceId, permissions) {
    try {
      const { canView, canCreate, canEdit, canDelete } = permissions;
      
      const pool = await poolPromise;
      
      // Verificar si existe el permiso
      const existsResult = await pool.request()
        .input('roleId', sql.Int, roleId)
        .input('resourceId', sql.Int, resourceId)
        .query(`
          SELECT COUNT(*) as Count
          FROM RoleResourcePermissions
          WHERE IdRol = @roleId AND IdRecurso = @resourceId
        `);

      if (existsResult.recordset[0].Count > 0) {
        // Actualizar
        await pool.request()
          .input('roleId', sql.Int, roleId)
          .input('resourceId', sql.Int, resourceId)
          .input('canView', sql.Bit, canView ? 1 : 0)
          .input('canCreate', sql.Bit, canCreate ? 1 : 0)
          .input('canEdit', sql.Bit, canEdit ? 1 : 0)
          .input('canDelete', sql.Bit, canDelete ? 1 : 0)
          .query(`
            UPDATE RoleResourcePermissions
            SET 
              CanView = @canView,
              CanCreate = @canCreate,
              CanEdit = @canEdit,
              CanDelete = @canDelete,
              FechaActualizacion = SYSUTCDATETIME()
            WHERE IdRol = @roleId AND IdRecurso = @resourceId
          `);
      } else {
        // Insertar
        await pool.request()
          .input('roleId', sql.Int, roleId)
          .input('resourceId', sql.Int, resourceId)
          .input('canView', sql.Bit, canView ? 1 : 0)
          .input('canCreate', sql.Bit, canCreate ? 1 : 0)
          .input('canEdit', sql.Bit, canEdit ? 1 : 0)
          .input('canDelete', sql.Bit, canDelete ? 1 : 0)
          .query(`
            INSERT INTO RoleResourcePermissions (
              IdRol, IdRecurso, CanView, CanCreate, CanEdit, CanDelete
            )
            VALUES (
              @roleId, @resourceId, @canView, @canCreate, @canEdit, @canDelete
            )
          `);
      }

      return true;
    } catch (error) {
      logger.error(`Error updating permission: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PermissionsModel;

