/*
  Vista Materializada (Indexed View) para Rechequeos
  Precalcula los datos más pesados para mejorar el rendimiento inicial
*/

USE BID_stg_copy;
GO

PRINT '========================================';
PRINT 'CREANDO VISTA INDEXADA PARA RECHEQUEOS';
PRINT '========================================';
GO

-- Eliminar vista si existe
IF OBJECT_ID('dbo.vw_RechequeosSummary', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.vw_RechequeosSummary;
    PRINT 'Vista existente eliminada';
END
GO

-- Crear vista con SCHEMABINDING para permitir índice
-- NOTA: Usa INNER JOIN porque SQL Server no permite LEFT JOIN en vistas indexadas
-- Si un TestUsuario finalizado no tiene ResultadoNivelDigital, no aparecerá en la vista
CREATE VIEW dbo.vw_RechequeosSummary
WITH SCHEMABINDING
AS
SELECT 
    ei.IdEmpresa,
    ei.IdUsuario,
    tu.Test,
    tu.IdTestUsuario,
    tu.FechaTest,
    tu.FechaTerminoTest,
    tu.Finalizado,
    rnd.ptjeTotalUsuario,
    rnd.ptjeDimensionTecnologia,
    rnd.ptjeDimensionComunicacion,
    rnd.ptjeDimensionOrganizacion,
    rnd.ptjeDimensionDatos,
    rnd.ptjeDimensionEstrategia,
    rnd.ptjeDimensionProcesos,
    rnd.IdNivelMadurez,
    ei.IdSectorActividad,
    ei.IdVentas,
    ei.IdDepartamento,
    ei.IdLocalidad
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
INNER JOIN dbo.ResultadoNivelDigital rnd ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
WHERE tu.Finalizado = 1;
GO

PRINT 'Vista creada: dbo.vw_RechequeosSummary';
GO

-- Crear índice clustered en la vista (lo convierte en vista materializada)
-- Usar IdTestUsuario como parte de la clave única ya que puede haber múltiples registros por empresa/usuario/test
CREATE UNIQUE CLUSTERED INDEX IX_vw_RechequeosSummary_TestUsuario
ON dbo.vw_RechequeosSummary (IdTestUsuario, IdEmpresa, IdUsuario, Test);
GO

PRINT 'Índice clustered creado en la vista';
GO

-- Crear índice no clustered para fecha
CREATE NONCLUSTERED INDEX IX_vw_RechequeosSummary_FechaTermino
ON dbo.vw_RechequeosSummary (FechaTerminoTest DESC)
INCLUDE (IdEmpresa, ptjeTotalUsuario, IdNivelMadurez);
GO

PRINT 'Índice no-clustered creado para fechas';
GO

PRINT '';
PRINT '========================================';
PRINT 'VISTA INDEXADA COMPLETADA';
PRINT 'La vista precalcula datos comunes y se actualiza automáticamente';
PRINT '========================================';
GO

