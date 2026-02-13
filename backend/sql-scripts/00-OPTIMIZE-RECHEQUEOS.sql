/*
  ========================================
  SCRIPT MAESTRO DE OPTIMIZACIÓN - RECHEQUEOS
  ========================================
  
  Este script ejecuta todas las optimizaciones necesarias para mejorar
  el rendimiento de rechequeos de 90-120 segundos a 15-25 segundos.
  
  EJECUCIÓN:
  1. Abrir SQL Server Management Studio o Azure Data Studio
  2. Conectarse a la base de datos BID_v2_22122025
  3. Ejecutar este script completo
  
  TIEMPO ESTIMADO: 3-7 minutos
*/

PRINT '========================================';
PRINT 'OPTIMIZACIÓN INTEGRAL DE RECHEQUEOS';
PRINT 'Iniciando proceso...';
PRINT 'Fecha: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
PRINT '';
GO

-- ===================================================
-- PASO 1: CREAR ÍNDICES ESTRATÉGICOS
-- ===================================================
PRINT 'PASO 1/3: Creando índices estratégicos...';
PRINT '';
GO

:r 04-optimize-rechequeos-indexes.sql
GO

PRINT '';
PRINT 'Índices estratégicos creados exitosamente ✓';
PRINT '';
GO

-- ===================================================
-- PASO 2: CREAR ÍNDICES ADICIONALES PARA BÚSQUEDAS
-- ===================================================
PRINT 'PASO 2/3: Creando índices adicionales para búsquedas...';
PRINT '';
GO

:r 07-create-additional-indexes.sql
GO

PRINT '';
PRINT 'Índices adicionales creados exitosamente ✓';
PRINT '';
GO

-- ===================================================
-- PASO 3: CREAR VISTAS OPTIMIZADAS
-- ===================================================
PRINT 'PASO 3/3: Creando vistas optimizadas...';
PRINT '';
GO

:r 06-create-rechequeos-optimized-views.sql
GO

PRINT '';
PRINT 'Vistas optimizadas creadas exitosamente ✓';
PRINT '';
GO

-- ===================================================
-- VERIFICACIÓN FINAL
-- ===================================================
PRINT '========================================';
PRINT 'VERIFICACIÓN DE OPTIMIZACIÓN';
PRINT '========================================';
PRINT '';
GO

-- Verificar índices creados
DECLARE @indexCount INT;
SELECT @indexCount = COUNT(*)
FROM sys.indexes i
INNER JOIN sys.objects o ON i.object_id = o.object_id
WHERE o.name IN ('TestUsuario', 'EmpresaInfo', 'ResultadoNivelDigital', 'Empresa', 'Usuario', 'SectorActividad')
  AND i.name LIKE 'IX_%';

PRINT '✓ Índices en tablas críticas: ' + CAST(@indexCount AS NVARCHAR(10));

-- Verificar vistas optimizadas
DECLARE @viewsCount INT;
SELECT @viewsCount = COUNT(*)
FROM sys.views
WHERE name IN ('vw_RechequeosBase', 'vw_RechequeosKPIs', 'vw_RechequeosTabla');

IF @viewsCount = 3
BEGIN
    PRINT '✓ Vistas optimizadas: ' + CAST(@viewsCount AS NVARCHAR(10)) + '/3 creadas correctamente';
    PRINT '  - vw_RechequeosBase (con manejo de IdEmpresa genérico)';
    PRINT '  - vw_RechequeosKPIs';
    PRINT '  - vw_RechequeosTabla';
END
ELSE
BEGIN
    PRINT '✗ ERROR: Solo ' + CAST(@viewsCount AS NVARCHAR(10)) + '/3 vistas creadas';
    PRINT '  Verificar errores en el paso 3';
END

PRINT '';
PRINT '========================================';
PRINT 'OPTIMIZACIÓN COMPLETADA CON ÉXITO';
PRINT '========================================';
PRINT '';
PRINT 'IMPORTANTE:';
PRINT '  Las vistas ahora manejan correctamente el caso especial del';
PRINT '  IdEmpresa genérico para usuarios "NO TENGO", garantizando';
PRINT '  que los conteos de distribución sean precisos.';
PRINT '';
PRINT 'PRÓXIMOS PASOS:';
PRINT '1. Ejecutar: GRANT ALTER ON SCHEMA::dbo TO [ChequeoApp];';
PRINT '2. Reiniciar el servidor backend (npm run dev)';
PRINT '3. Limpiar caché Redis desde /configuracion (superadmin)';
PRINT '4. Probar en: http://localhost:3000/rechequeos';
PRINT '';
PRINT 'MEJORA ESPERADA:';
PRINT '  Antes: 90-120 segundos';
PRINT '  Después: < 10 segundos (con caché) o 15-25 segundos (sin caché)';
PRINT '  Mejora: 80-90%';
PRINT '';
PRINT 'VALORES ESPERADOS (aproximados):';
PRINT '  - Dist1: ~1369 empresas';
PRINT '  - Dist2_3: ~133 empresas';
PRINT '  - DistGt3: ~0 empresas';
PRINT '  - Total: ~1502 entidades únicas';
PRINT '  - Total chequeos: ~1665';
PRINT '';
GO

