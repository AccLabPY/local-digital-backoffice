const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middlewares/auth-rbac.middleware');
const { catchAsync } = require('../middlewares/error.middleware');
const redisService = require('../services/redis.service');
const { poolPromise, sql } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Admin routes - Solo para superadmin
 * Operaciones de mantenimiento y gestión del sistema
 */

// Todas las rutas requieren superadmin
router.use(authMiddleware);
router.use(requireRole('superadmin'));

/**
 * POST /api/admin/cache/invalidate
 * Invalidar cache completo
 */
router.post('/cache/invalidate', catchAsync(async (req, res) => {
  logger.info(`[ADMIN] Cache invalidation requested by ${req.user.email}`);
  
  await redisService.invalidateRechequeosCache();
  await redisService.invalidateEmpresaCache();
  
  res.json({
    success: true,
    message: 'Cache invalidado exitosamente',
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/admin/cache/flush
 * Purgar cache completo (eliminar todas las entradas)
 */
router.post('/cache/flush', catchAsync(async (req, res) => {
  logger.warn(`[ADMIN] Cache flush requested by ${req.user.email}`);
  
  await redisService.flushAll();
  
  res.json({
    success: true,
    message: 'Cache purgado completamente',
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/admin/cache/stats
 * Obtener estadísticas del cache
 */
router.get('/cache/stats', catchAsync(async (req, res) => {
  const stats = redisService.getStats();
  
  res.json({
    success: true,
    stats
  });
}));

/**
 * POST /api/admin/views/refresh
 * Actualizar estadísticas de vistas SQL
 */
router.post('/views/refresh', catchAsync(async (req, res) => {
  logger.info(`[ADMIN] View stats refresh requested by ${req.user.email}`);
  
  const pool = await poolPromise;
  
  // Listado de tablas críticas para las vistas
  const tables = [
    'TestUsuario',
    'EmpresaInfo',
    'ResultadoNivelDigital',
    'Empresa',
    'Usuario',
    'SectorActividad',
    'SubSectorActividad',
    'VentasAnuales',
    'Departamentos',
    'SubRegion',
    'NivelMadurez'
  ];

  // Construir script dinámico que solo actualiza tablas existentes
  for (const table of tables) {
    const script = `
      DECLARE @schemaName NVARCHAR(128);
      DECLARE @sql NVARCHAR(512);

      SELECT TOP 1 @schemaName = s.name
      FROM sys.tables t
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE t.name = '${table}';

      IF @schemaName IS NOT NULL
      BEGIN
        SET @sql = N'UPDATE STATISTICS ' + QUOTENAME(@schemaName) + '.' + QUOTENAME('${table}') + ' WITH FULLSCAN;';
        EXEC sp_executesql @sql;
      END
    `;

    await pool.request().query(script);
  }
  
  // Invalidar cache después de actualizar stats
  await redisService.invalidateRechequeosCache();
  await redisService.invalidateEmpresaCache();
  
  res.json({
    success: true,
    message: 'Estadísticas de vistas actualizadas',
    tablesUpdated: tables.length,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/admin/views/status
 * Verificar estado de vistas optimizadas
 */
router.get('/views/status', catchAsync(async (req, res) => {
  const pool = await poolPromise;
  
  const result = await pool.request().query(`
    SELECT 
      name,
      create_date,
      modify_date
    FROM sys.views
    WHERE name IN ('vw_RechequeosBase', 'vw_RechequeosKPIs', 'vw_RechequeosTabla')
    ORDER BY name
  `);
  
  const indexes = await pool.request().query(`
    SELECT 
      OBJECT_NAME(i.object_id) AS tabla,
      i.name AS indice,
      i.type_desc AS tipo,
      COUNT(*) OVER() AS total_indices
    FROM sys.indexes i
    WHERE i.name LIKE 'IX_%'
      AND OBJECT_NAME(i.object_id) IN (
        'TestUsuario', 'EmpresaInfo', 'ResultadoNivelDigital',
        'Empresa', 'Usuario', 'SectorActividad', 'VentasAnuales',
        'Departamentos', 'SubRegion', 'NivelMadurez'
      )
    ORDER BY tabla, indice
  `);
  
  res.json({
    success: true,
    views: {
      total: result.recordset.length,
      expected: 3,
      list: result.recordset
    },
    indexes: {
      total: indexes.recordset.length > 0 ? indexes.recordset[0].total_indices : 0,
      expected: 24,
      list: indexes.recordset.slice(0, 10) // Solo primeros 10 para no saturar
    },
    status: result.recordset.length === 3 ? 'optimized' : 'standard'
  });
}));

/**
 * GET /api/admin/system/info
 * Información del sistema
 */
router.get('/system/info', catchAsync(async (req, res) => {
  const pool = await poolPromise;
  
  // Info de la BD
  const dbInfo = await pool.request().query(`
    SELECT 
      @@VERSION AS version,
      DB_NAME() AS database_name,
      @@SERVERNAME AS server_name
  `);
  
  // Conteo de registros principales
  const counts = await pool.request().query(`
    SELECT 
      (SELECT COUNT(*) FROM dbo.Empresa) AS total_empresas,
      (SELECT COUNT(*) FROM dbo.Usuario) AS total_usuarios,
      (SELECT COUNT(*) FROM dbo.TestUsuario WHERE Finalizado = 1) AS total_chequeos,
      (SELECT COUNT(*) FROM dbo.UsuariosSistema) AS total_usuarios_sistema,
      (SELECT COUNT(*) FROM dbo.RolesSistema) AS total_roles
  `);
  
  res.json({
    success: true,
    system: {
      database: dbInfo.recordset[0],
      counts: counts.recordset[0],
      cache: redisService.getStats(),
      nodejs: {
        version: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    }
  });
}));

module.exports = router;

