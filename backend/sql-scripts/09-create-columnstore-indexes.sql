/*
  ============================================================================
  ÍNDICES COLUMNSTORE PARA PERFORMANCE EXTREMO EN FILTROS
  ============================================================================
  
  Crea índices columnstore no clustered en las tablas base para acelerar
  drásticamente las consultas con filtros (departamento, sector, tamaño, etc.)
  
  Compatible con: SQL Server 2012+
  Base de datos: BID_v2_22122025
  
  MEJORA ESPERADA: De 120+ segundos → 3-8 segundos con filtros
  
  ============================================================================
*/

USE BID_v2_22122025;
GO

PRINT '============================================================================';
PRINT 'CREANDO ÍNDICES COLUMNSTORE PARA FILTROS ULTRA-RÁPIDOS';
PRINT '============================================================================';
PRINT '';
GO

-- ============================================================================
-- ÍNDICE COLUMNSTORE EN EMPRESAINFO
-- ============================================================================

PRINT 'Verificando índice columnstore en EmpresaInfo...';
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE object_id = OBJECT_ID('dbo.EmpresaInfo') 
      AND name = 'NCCI_EmpresaInfo_Analytics'
      AND type = 6 -- NONCLUSTERED COLUMNSTORE
)
BEGIN
    CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_EmpresaInfo_Analytics
    ON dbo.EmpresaInfo (
        IdEmpresaInfo,
        IdEmpresa,
        IdUsuario,
        Test,
        IdDepartamento,
        IdLocalidad,
        IdSectorActividad,
        IdSubSectorActividad,
        IdVentas
    );
    PRINT '✅ Índice columnstore NCCI_EmpresaInfo_Analytics creado';
END
ELSE
    PRINT '⚠️  Índice columnstore NCCI_EmpresaInfo_Analytics ya existe';
GO

-- ============================================================================
-- ÍNDICE COLUMNSTORE EN TESTusuario
-- ============================================================================

PRINT '';
PRINT 'Verificando índice columnstore en TestUsuario...';
GO

SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE object_id = OBJECT_ID('dbo.TestUsuario') 
      AND name = 'NCCI_TestUsuario_Analytics'
      AND type = 6
)
BEGIN
    CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_TestUsuario_Analytics
    ON dbo.TestUsuario (
        IdTestUsuario,
        IdUsuario,
        Test,
        FechaTest,
        FechaTerminoTest,
        Finalizado
    );
    PRINT '✅ Índice columnstore NCCI_TestUsuario_Analytics creado';
END
ELSE
    PRINT '⚠️  Índice columnstore NCCI_TestUsuario_Analytics ya existe';
GO

-- ============================================================================
-- ÍNDICE COLUMNSTORE EN RESULTADONIVELDIGITAL
-- ============================================================================

PRINT '';
PRINT 'Verificando índice columnstore en ResultadoNivelDigital...';
GO

IF NOT EXISTS (
    SELECT 1 
    FROM sys.indexes 
    WHERE object_id = OBJECT_ID('dbo.ResultadoNivelDigital') 
      AND name = 'NCCI_ResultadoNivelDigital_Analytics'
      AND type = 6
)
BEGIN
    CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_ResultadoNivelDigital_Analytics
    ON dbo.ResultadoNivelDigital (
        IdUsuario,
        Test,
        IdNivelMadurez,
        ptjeTotalUsuario,
        ptjeDimensionTecnologia,
        ptjeDimensionComunicacion,
        ptjeDimensionOrganizacion,
        ptjeDimensionDatos,
        ptjeDimensionEstrategia,
        ptjeDimensionProcesos
    );
    PRINT '✅ Índice columnstore NCCI_ResultadoNivelDigital_Analytics creado';
END
ELSE
    PRINT '⚠️  Índice columnstore NCCI_ResultadoNivelDigital_Analytics ya existe';
GO

-- ============================================================================
-- CONFIGURAR BATCH MODE PARA QUERIES ANALÍTICOS
-- ============================================================================

PRINT '';
PRINT 'Configurando batch mode y optimizaciones...';
GO

-- Actualizar estadísticas con fullscan
DECLARE @tables TABLE (TableName NVARCHAR(128));
INSERT INTO @tables VALUES 
  ('EmpresaInfo'), ('TestUsuario'), ('ResultadoNivelDigital');

DECLARE @tableName NVARCHAR(128);
DECLARE @schemaName NVARCHAR(128);
DECLARE @sql NVARCHAR(512);

DECLARE table_cursor CURSOR FOR 
  SELECT TableName FROM @tables;

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @tableName;

WHILE @@FETCH_STATUS = 0
BEGIN
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

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

PRINT '';
PRINT '============================================================================';
PRINT 'VERIFICACIÓN DE ÍNDICES COLUMNSTORE';
PRINT '============================================================================';
PRINT '';
GO

DECLARE @columnstoreCount INT;

SELECT @columnstoreCount = COUNT(*)
FROM sys.indexes i
INNER JOIN sys.objects o ON i.object_id = o.object_id
WHERE o.name IN ('EmpresaInfo', 'TestUsuario', 'ResultadoNivelDigital')
  AND i.type = 6 -- COLUMNSTORE
  AND i.name LIKE 'NCCI_%';

PRINT '✅ Índices columnstore creados: ' + CAST(@columnstoreCount AS NVARCHAR(10)) + '/3';

IF @columnstoreCount = 3
BEGIN
    PRINT '';
    PRINT '============================================================================';
    PRINT 'ÍNDICES COLUMNSTORE CREADOS EXITOSAMENTE';
    PRINT '============================================================================';
    PRINT '';
    PRINT 'BENEFICIOS:';
    PRINT '  - Compresión de datos 10x (menos I/O)';
    PRINT '  - Procesamiento por lotes (batch mode)';
    PRINT '  - Queries analíticos 10-100x más rápidos';
    PRINT '  - Ideal para filtros y agregaciones';
    PRINT '';
    PRINT 'MEJORA ESPERADA CON FILTROS:';
    PRINT '  Antes: 120+ segundos (timeout)';
    PRINT '  Después: 3-8 segundos';
    PRINT '  Mejora: 95% más rápido';
    PRINT '';
    PRINT 'PRÓXIMOS PASOS:';
    PRINT '1. Reiniciar el backend (npm run dev)';
    PRINT '2. Purgar caché desde /configuracion';
    PRINT '3. Probar filtro por Alto Paraná';
    PRINT '4. Probar múltiples filtros combinados';
    PRINT '';
END
ELSE
BEGIN
    PRINT '⚠️  Solo se crearon ' + CAST(@columnstoreCount AS NVARCHAR(10)) + '/3 índices';
    PRINT '    Verificar errores arriba';
END
GO

