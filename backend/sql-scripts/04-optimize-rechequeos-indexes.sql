/*
  Script de Optimización para Rechequeos
  Crea índices estratégicos para mejorar el rendimiento de consultas
  Tiempo estimado de ejecución: 2-5 minutos dependiendo del tamaño de los datos
*/

USE BID_v2;
GO

PRINT '========================================';
PRINT 'CREANDO ÍNDICES PARA OPTIMIZACIÓN';
PRINT 'Fecha: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
GO

-- ===================================================
-- 1. ÍNDICES EN TestUsuario (tabla crítica)
-- ===================================================
PRINT '';
PRINT '1. Creando índices en TestUsuario...';

-- Índice compuesto para filtrado por Finalizado y ordenamiento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TestUsuario_Finalizado_FechaTermino')
BEGIN
    CREATE NONCLUSTERED INDEX IX_TestUsuario_Finalizado_FechaTermino
    ON dbo.TestUsuario (Finalizado, FechaTerminoTest DESC)
    INCLUDE (IdUsuario, Test, FechaTest, IdTestUsuario)
    WITH (ONLINE = OFF, FILLFACTOR = 90);
    PRINT '  ✓ Creado: IX_TestUsuario_Finalizado_FechaTermino';
END
ELSE
    PRINT '  - Ya existe: IX_TestUsuario_Finalizado_FechaTermino';

-- Índice para joins frecuentes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TestUsuario_Usuario_Test')
BEGIN
    CREATE NONCLUSTERED INDEX IX_TestUsuario_Usuario_Test
    ON dbo.TestUsuario (IdUsuario, Test)
    INCLUDE (Finalizado, FechaTerminoTest, FechaTest)
    WITH (ONLINE = OFF, FILLFACTOR = 90);
    PRINT '  ✓ Creado: IX_TestUsuario_Usuario_Test';
END
ELSE
    PRINT '  - Ya existe: IX_TestUsuario_Usuario_Test';

-- ===================================================
-- 2. ÍNDICES EN EmpresaInfo (tabla crítica)
-- ===================================================
PRINT '';
PRINT '2. Creando índices en EmpresaInfo...';

-- Índice compuesto para filtrado de empresa
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_EmpresaInfo_Empresa_Usuario_Test')
BEGIN
    CREATE NONCLUSTERED INDEX IX_EmpresaInfo_Empresa_Usuario_Test
    ON dbo.EmpresaInfo (IdEmpresa, IdUsuario, Test)
    INCLUDE (IdDepartamento, IdLocalidad, IdSectorActividad, IdSubSectorActividad, IdVentas)
    WITH (ONLINE = OFF, FILLFACTOR = 90);
    PRINT '  ✓ Creado: IX_EmpresaInfo_Empresa_Usuario_Test';
END
ELSE
    PRINT '  - Ya existe: IX_EmpresaInfo_Empresa_Usuario_Test';

-- Índice para lookups de IdEmpresa
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_EmpresaInfo_IdEmpresa')
BEGIN
    CREATE NONCLUSTERED INDEX IX_EmpresaInfo_IdEmpresa
    ON dbo.EmpresaInfo (IdEmpresa)
    INCLUDE (IdUsuario, Test, IdSectorActividad, IdVentas, IdDepartamento, IdLocalidad)
    WITH (ONLINE = OFF, FILLFACTOR = 90);
    PRINT '  ✓ Creado: IX_EmpresaInfo_IdEmpresa';
END
ELSE
    PRINT '  - Ya existe: IX_EmpresaInfo_IdEmpresa';

-- ===================================================
-- 3. ÍNDICES EN ResultadoNivelDigital
-- ===================================================
PRINT '';
PRINT '3. Creando índices en ResultadoNivelDigital...';

-- Índice para joins de usuario y test
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ResultadoNivelDigital_Usuario_Test')
BEGIN
    CREATE NONCLUSTERED INDEX IX_ResultadoNivelDigital_Usuario_Test
    ON dbo.ResultadoNivelDigital (IdUsuario, Test)
    INCLUDE (ptjeTotalUsuario, ptjeDimensionTecnologia, ptjeDimensionComunicacion, 
             ptjeDimensionOrganizacion, ptjeDimensionDatos, ptjeDimensionEstrategia, 
             ptjeDimensionProcesos, IdNivelMadurez)
    WITH (ONLINE = OFF, FILLFACTOR = 90);
    PRINT '  ✓ Creado: IX_ResultadoNivelDigital_Usuario_Test';
END
ELSE
    PRINT '  - Ya existe: IX_ResultadoNivelDigital_Usuario_Test';

-- ===================================================
-- 4. ÍNDICES EN Empresa
-- ===================================================
PRINT '';
PRINT '4. Creando índices en Empresa...';

-- Índice para búsquedas por nombre
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Empresa_Nombre')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Empresa_Nombre
    ON dbo.Empresa (Nombre)
    INCLUDE (IdEmpresa)
    WITH (ONLINE = OFF, FILLFACTOR = 90);
    PRINT '  ✓ Creado: IX_Empresa_Nombre';
END
ELSE
    PRINT '  - Ya existe: IX_Empresa_Nombre';

-- ===================================================
-- 5. ÍNDICES EN tablas de catálogo (para JOINs)
-- ===================================================
PRINT '';
PRINT '5. Creando índices en tablas de catálogo...';

-- SectorActividad
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SectorActividad_IdSector')
BEGIN
    CREATE NONCLUSTERED INDEX IX_SectorActividad_IdSector
    ON dbo.SectorActividad (IdSectorActividad)
    INCLUDE (Descripcion)
    WITH (ONLINE = OFF, FILLFACTOR = 95);
    PRINT '  ✓ Creado: IX_SectorActividad_IdSector';
END
ELSE
    PRINT '  - Ya existe: IX_SectorActividad_IdSector';

-- VentasAnuales
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_VentasAnuales_IdVentas')
BEGIN
    CREATE NONCLUSTERED INDEX IX_VentasAnuales_IdVentas
    ON dbo.VentasAnuales (IdVentasAnuales)
    INCLUDE (Nombre)
    WITH (ONLINE = OFF, FILLFACTOR = 95);
    PRINT '  ✓ Creado: IX_VentasAnuales_IdVentas';
END
ELSE
    PRINT '  - Ya existe: IX_VentasAnuales_IdVentas';

-- Departamentos
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Departamentos_IdDepartamento')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Departamentos_IdDepartamento
    ON dbo.Departamentos (IdDepartamento)
    INCLUDE (Nombre)
    WITH (ONLINE = OFF, FILLFACTOR = 95);
    PRINT '  ✓ Creado: IX_Departamentos_IdDepartamento';
END
ELSE
    PRINT '  - Ya existe: IX_Departamentos_IdDepartamento';

-- SubRegion
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SubRegion_IdSubRegion')
BEGIN
    CREATE NONCLUSTERED INDEX IX_SubRegion_IdSubRegion
    ON dbo.SubRegion (IdSubRegion)
    INCLUDE (Nombre, IdRegion)
    WITH (ONLINE = OFF, FILLFACTOR = 95);
    PRINT '  ✓ Creado: IX_SubRegion_IdSubRegion';
END
ELSE
    PRINT '  - Ya existe: IX_SubRegion_IdSubRegion';

-- NivelMadurez
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_NivelMadurez_IdNivel')
BEGIN
    CREATE NONCLUSTERED INDEX IX_NivelMadurez_IdNivel
    ON dbo.NivelMadurez (IdNivelMadurez)
    INCLUDE (Descripcion)
    WITH (ONLINE = OFF, FILLFACTOR = 95);
    PRINT '  ✓ Creado: IX_NivelMadurez_IdNivel';
END
ELSE
    PRINT '  - Ya existe: IX_NivelMadurez_IdNivel';

-- Usuario
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Usuario_IdUsuario')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Usuario_IdUsuario
    ON dbo.Usuario (IdUsuario)
    INCLUDE (NombreCompleto)
    WITH (ONLINE = OFF, FILLFACTOR = 90);
    PRINT '  ✓ Creado: IX_Usuario_IdUsuario';
END
ELSE
    PRINT '  - Ya existe: IX_Usuario_IdUsuario';

-- ===================================================
-- 6. ACTUALIZAR ESTADÍSTICAS
-- ===================================================
PRINT '';
PRINT '6. Actualizando estadísticas de tablas críticas...';

UPDATE STATISTICS dbo.TestUsuario WITH FULLSCAN;
PRINT '  ✓ TestUsuario';

UPDATE STATISTICS dbo.EmpresaInfo WITH FULLSCAN;
PRINT '  ✓ EmpresaInfo';

UPDATE STATISTICS dbo.ResultadoNivelDigital WITH FULLSCAN;
PRINT '  ✓ ResultadoNivelDigital';

UPDATE STATISTICS dbo.Empresa WITH FULLSCAN;
PRINT '  ✓ Empresa';

-- ===================================================
-- 7. REPORTE FINAL
-- ===================================================
PRINT '';
PRINT '========================================';
PRINT 'OPTIMIZACIÓN COMPLETADA';
PRINT '========================================';
PRINT '';

-- Contar índices creados
DECLARE @totalIndexes INT;
SELECT @totalIndexes = COUNT(*)
FROM sys.indexes i
INNER JOIN sys.objects o ON i.object_id = o.object_id
WHERE o.name IN ('TestUsuario', 'EmpresaInfo', 'ResultadoNivelDigital', 'Empresa', 
                 'SectorActividad', 'VentasAnuales', 'Departamentos', 'SubRegion', 
                 'NivelMadurez', 'Usuario')
  AND i.name LIKE 'IX_%';

PRINT 'Total de índices en tablas críticas: ' + CAST(@totalIndexes AS NVARCHAR(10));
PRINT '';
PRINT 'IMPORTANTE:';
PRINT '- Los índices mejorarán significativamente el rendimiento de consultas';
PRINT '- La primera consulta después de crear índices puede ser lenta';
PRINT '- Las consultas subsiguientes deberían ser mucho más rápidas';
PRINT '- Reinicia el servidor backend para limpiar caché si es necesario';
PRINT '';
GO

