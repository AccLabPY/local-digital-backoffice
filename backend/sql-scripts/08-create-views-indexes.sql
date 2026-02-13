/*
  ============================================================================
  ÍNDICES ADICIONALES PARA VISTAS OPTIMIZADAS DE RECHEQUEOS
  ============================================================================
  
  Este script crea índices específicos para acelerar las consultas
  sobre las vistas optimizadas, especialmente cuando se combinan
  múltiples filtros (Departamento + Tamaño, Sector + Distrito, etc.)
  
  Compatible con: SQL Server 2012+
  Base de datos: BID_v2_22122025
  
  IMPORTANTE: Ejecutar DESPUÉS de crear las vistas optimizadas
  
  ============================================================================
*/

USE BID_v2_22122025;
GO

PRINT '============================================================================';
PRINT 'CREANDO ÍNDICES ADICIONALES PARA FILTROS EN VISTAS';
PRINT '============================================================================';
PRINT '';
GO

-- ============================================================================
-- ÍNDICES ADICIONALES EN EMPRESAINFO PARA MEJORAR JOINS
-- ============================================================================

PRINT 'Verificando índices en EmpresaInfo...';
GO

-- Índice por IdEmpresaInfo (PK si no existe)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.EmpresaInfo') AND name = 'PK_EmpresaInfo')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.EmpresaInfo') AND name = 'IX_EmpresaInfo_IdEmpresaInfo')
    BEGIN
        CREATE NONCLUSTERED INDEX IX_EmpresaInfo_IdEmpresaInfo
        ON dbo.EmpresaInfo (IdEmpresaInfo)
        INCLUDE (IdEmpresa, IdUsuario, Test, IdDepartamento, IdLocalidad, IdSectorActividad, IdSubSectorActividad, IdVentas);
        PRINT '✅ Índice IX_EmpresaInfo_IdEmpresaInfo creado';
    END
    ELSE
        PRINT '⚠️  Índice IX_EmpresaInfo_IdEmpresaInfo ya existe';
END
ELSE
    PRINT '✅ PK_EmpresaInfo existe (cubre IdEmpresaInfo)';
GO

-- Índice compuesto para joins por (IdUsuario, Test)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.EmpresaInfo') AND name = 'IX_EmpresaInfo_Usuario_Test_Complete')
BEGIN
    CREATE NONCLUSTERED INDEX IX_EmpresaInfo_Usuario_Test_Complete
    ON dbo.EmpresaInfo (IdUsuario, Test)
    INCLUDE (IdEmpresaInfo, IdEmpresa, IdDepartamento, IdLocalidad, IdSectorActividad, IdSubSectorActividad, IdVentas);
    PRINT '✅ Índice IX_EmpresaInfo_Usuario_Test_Complete creado';
END
ELSE
    PRINT '⚠️  Índice IX_EmpresaInfo_Usuario_Test_Complete ya existe';
GO

-- Índice por (IdEmpresa, IdUsuario, Test) para joins completos
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.EmpresaInfo') AND name = 'IX_EmpresaInfo_Empresa_Usuario_Test')
BEGIN
    CREATE NONCLUSTERED INDEX IX_EmpresaInfo_Empresa_Usuario_Test
    ON dbo.EmpresaInfo (IdEmpresa, IdUsuario, Test)
    INCLUDE (IdEmpresaInfo, IdDepartamento, IdLocalidad, IdSectorActividad, IdSubSectorActividad, IdVentas);
    PRINT '✅ Índice IX_EmpresaInfo_Empresa_Usuario_Test creado';
END
ELSE
    PRINT '⚠️  Índice IX_EmpresaInfo_Empresa_Usuario_Test ya existe';
GO

-- ============================================================================
-- ACTUALIZAR ESTADÍSTICAS DE TABLAS CRÍTICAS
-- ============================================================================

PRINT '';
PRINT 'Actualizando estadísticas de tablas críticas...';
GO

-- Helper para actualizar con schema dinámico
DECLARE @tables TABLE (TableName NVARCHAR(128));
INSERT INTO @tables VALUES 
  ('TestUsuario'), ('EmpresaInfo'), ('ResultadoNivelDigital'),
  ('Empresa'), ('Usuario'), ('SectorActividad'), ('SubSectorActividad'),
  ('VentasAnuales'), ('Departamentos'), ('SubRegion'), ('NivelMadurez');

DECLARE @tableName NVARCHAR(128);
DECLARE @schemaName NVARCHAR(128);
DECLARE @sql NVARCHAR(512);

DECLARE table_cursor CURSOR FOR 
  SELECT TableName FROM @tables;

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @tableName;

WHILE @@FETCH_STATUS = 0
BEGIN
  -- Find schema
  SELECT TOP 1 @schemaName = s.name
  FROM sys.tables t
  INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
  WHERE t.name = @tableName;
  
  IF @schemaName IS NOT NULL
  BEGIN
    SET @sql = N'UPDATE STATISTICS ' + QUOTENAME(@schemaName) + '.' + QUOTENAME(@tableName) + ' WITH FULLSCAN;';
    EXEC sp_executesql @sql;
    PRINT '  ✅ Estadísticas actualizadas: ' + @schemaName + '.' + @tableName;
  END
  
  FETCH NEXT FROM table_cursor INTO @tableName;
END

CLOSE table_cursor;
DEALLOCATE table_cursor;
GO

PRINT '';
PRINT '============================================================================';
PRINT 'VERIFICACIÓN DE ÍNDICES';
PRINT '============================================================================';
PRINT '';
GO

-- Contar índices en EmpresaInfo
DECLARE @empresaInfoIndexes INT;
SELECT @empresaInfoIndexes = COUNT(*)
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('dbo.EmpresaInfo')
  AND i.name IS NOT NULL
  AND i.name LIKE 'IX_%';

PRINT '✅ Índices en EmpresaInfo: ' + CAST(@empresaInfoIndexes AS NVARCHAR(10));

-- Contar índices en TestUsuario
DECLARE @testUsuarioIndexes INT;
SELECT @testUsuarioIndexes = COUNT(*)
FROM sys.indexes i
WHERE i.object_id = OBJECT_ID('dbo.TestUsuario')
  AND i.name IS NOT NULL
  AND i.name LIKE 'IX_%';

PRINT '✅ Índices en TestUsuario: ' + CAST(@testUsuarioIndexes AS NVARCHAR(10));

-- Verificar vistas
DECLARE @viewsCount INT;
SELECT @viewsCount = COUNT(*)
FROM sys.views
WHERE name IN ('vw_RechequeosBase', 'vw_RechequeosKPIs', 'vw_RechequeosTabla');

IF @viewsCount = 3
    PRINT '✅ Vistas optimizadas: 3/3 disponibles';
ELSE
    PRINT '⚠️  Solo ' + CAST(@viewsCount AS NVARCHAR(10)) + '/3 vistas encontradas';

PRINT '';
PRINT '============================================================================';
PRINT 'ÍNDICES ADICIONALES CREADOS EXITOSAMENTE';
PRINT '============================================================================';
PRINT '';
PRINT 'BENEFICIOS:';
PRINT '  - Joins por IdEmpresaInfo más rápidos';
PRINT '  - Consultas filtradas con múltiples criterios más eficientes';
PRINT '  - Estadísticas actualizadas para mejor plan de ejecución';
PRINT '';
PRINT 'PRÓXIMOS PASOS:';
PRINT '1. Reiniciar el backend para limpiar el plan cache';
PRINT '2. Purgar caché Redis/memoria desde /configuracion';
PRINT '3. Probar filtros combinados (Depto + Tamaño, Sector + Distrito)';
PRINT '';
PRINT 'MEJORA ESPERADA EN FILTROS COMBINADOS:';
PRINT '  Antes: 60-90 segundos';
PRINT '  Después: 5-15 segundos';
PRINT '';
GO

