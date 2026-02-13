-- ============================================================================
-- VISTAS AGREGADAS DE RECHEQUEOS (PARA REPORTES PDF)
-- ============================================================================
-- Estas vistas pre-calculan los datos agregados por categoría
-- para acelerar la generación de reportes PDF
-- ============================================================================

USE BID_v2_22122025;  -- ⚠️ CAMBIAR POR TU BASE DE DATOS SI ES DIFERENTE
GO

SET NOCOUNT ON;
GO

PRINT '============================================================================';
PRINT 'CREANDO VISTAS AGREGADAS DE RECHEQUEOS';
PRINT '============================================================================';
PRINT '';
GO

-- ============================================================================
-- VISTA: vw_RechequeosAgregadoPorDepartamento
-- ============================================================================

IF OBJECT_ID('dbo.vw_RechequeosAgregadoPorDepartamento', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.vw_RechequeosAgregadoPorDepartamento;
    PRINT 'Vista existente vw_RechequeosAgregadoPorDepartamento eliminada';
END
GO

CREATE VIEW dbo.vw_RechequeosAgregadoPorDepartamento
AS
SELECT 
    Departamento AS Categoria,
    COUNT(DISTINCT ClaveEntidad) AS Cantidad,
    AVG(CAST(DeltaGlobal AS FLOAT)) AS CrecimientoPromedio,
    SUM(CAST(SaltoBajoMedio AS INT)) AS SaltosBajoMedio,
    SUM(CAST(SaltoMedioAlto AS INT)) AS SaltosMedioAlto
FROM dbo.vw_RechequeosKPIs WITH (NOLOCK)
WHERE Departamento IS NOT NULL 
  AND Departamento <> '' 
  AND Departamento <> 'N/A'
GROUP BY Departamento;
GO

PRINT '✅ Vista vw_RechequeosAgregadoPorDepartamento creada';
GO

-- ============================================================================
-- VISTA: vw_RechequeosAgregadoPorDistrito
-- ============================================================================

IF OBJECT_ID('dbo.vw_RechequeosAgregadoPorDistrito', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.vw_RechequeosAgregadoPorDistrito;
    PRINT 'Vista existente vw_RechequeosAgregadoPorDistrito eliminada';
END
GO

CREATE VIEW dbo.vw_RechequeosAgregadoPorDistrito
AS
SELECT 
    Distrito AS Categoria,
    COUNT(DISTINCT ClaveEntidad) AS Cantidad,
    AVG(CAST(DeltaGlobal AS FLOAT)) AS CrecimientoPromedio,
    SUM(CAST(SaltoBajoMedio AS INT)) AS SaltosBajoMedio,
    SUM(CAST(SaltoMedioAlto AS INT)) AS SaltosMedioAlto
FROM dbo.vw_RechequeosKPIs WITH (NOLOCK)
WHERE Distrito IS NOT NULL 
  AND Distrito <> '' 
  AND Distrito <> 'N/A'
GROUP BY Distrito;
GO

PRINT '✅ Vista vw_RechequeosAgregadoPorDistrito creada';
GO

-- ============================================================================
-- VISTA: vw_RechequeosAgregadoPorSector
-- ============================================================================

IF OBJECT_ID('dbo.vw_RechequeosAgregadoPorSector', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.vw_RechequeosAgregadoPorSector;
    PRINT 'Vista existente vw_RechequeosAgregadoPorSector eliminada';
END
GO

CREATE VIEW dbo.vw_RechequeosAgregadoPorSector
AS
SELECT 
    SectorActividad AS Categoria,
    COUNT(DISTINCT ClaveEntidad) AS Cantidad,
    AVG(CAST(DeltaGlobal AS FLOAT)) AS CrecimientoPromedio,
    SUM(CAST(SaltoBajoMedio AS INT)) AS SaltosBajoMedio,
    SUM(CAST(SaltoMedioAlto AS INT)) AS SaltosMedioAlto
FROM dbo.vw_RechequeosKPIs WITH (NOLOCK)
WHERE SectorActividad IS NOT NULL 
  AND SectorActividad <> '' 
  AND SectorActividad <> 'N/A'
GROUP BY SectorActividad;
GO

PRINT '✅ Vista vw_RechequeosAgregadoPorSector creada';
GO

-- ============================================================================
-- VISTA: vw_RechequeosAgregadoPorSubSector
-- ============================================================================

IF OBJECT_ID('dbo.vw_RechequeosAgregadoPorSubSector', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.vw_RechequeosAgregadoPorSubSector;
    PRINT 'Vista existente vw_RechequeosAgregadoPorSubSector eliminada';
END
GO

CREATE VIEW dbo.vw_RechequeosAgregadoPorSubSector
AS
SELECT 
    SubSectorActividad AS Categoria,
    COUNT(DISTINCT ClaveEntidad) AS Cantidad,
    AVG(CAST(DeltaGlobal AS FLOAT)) AS CrecimientoPromedio,
    SUM(CAST(SaltoBajoMedio AS INT)) AS SaltosBajoMedio,
    SUM(CAST(SaltoMedioAlto AS INT)) AS SaltosMedioAlto
FROM dbo.vw_RechequeosKPIs WITH (NOLOCK)
WHERE SubSectorActividad IS NOT NULL 
  AND SubSectorActividad <> '' 
  AND SubSectorActividad <> 'N/A'
GROUP BY SubSectorActividad;
GO

PRINT '✅ Vista vw_RechequeosAgregadoPorSubSector creada';
GO

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

PRINT '';
PRINT '============================================================================';
PRINT 'VERIFICANDO VISTAS AGREGADAS CREADAS';
PRINT '============================================================================';

DECLARE @CountDept INT, @CountDist INT, @CountSector INT, @CountSubSector INT;

SELECT @CountDept = COUNT(*) FROM dbo.vw_RechequeosAgregadoPorDepartamento WITH (NOLOCK);
SELECT @CountDist = COUNT(*) FROM dbo.vw_RechequeosAgregadoPorDistrito WITH (NOLOCK);
SELECT @CountSector = COUNT(*) FROM dbo.vw_RechequeosAgregadoPorSector WITH (NOLOCK);
SELECT @CountSubSector = COUNT(*) FROM dbo.vw_RechequeosAgregadoPorSubSector WITH (NOLOCK);

PRINT '✅ vw_RechequeosAgregadoPorDepartamento: ' + CAST(@CountDept AS VARCHAR(10)) + ' categorías';
PRINT '✅ vw_RechequeosAgregadoPorDistrito: ' + CAST(@CountDist AS VARCHAR(10)) + ' categorías';
PRINT '✅ vw_RechequeosAgregadoPorSector: ' + CAST(@CountSector AS VARCHAR(10)) + ' categorías';
PRINT '✅ vw_RechequeosAgregadoPorSubSector: ' + CAST(@CountSubSector AS VARCHAR(10)) + ' categorías';

PRINT '';
PRINT '============================================================================';
PRINT 'VISTAS AGREGADAS CREADAS EXITOSAMENTE';
PRINT '';
PRINT 'IMPORTANTE: Estas vistas pre-calculan datos agregados para acelerar';
PRINT 'la generación de reportes PDF de rechequeos.';
PRINT '';
PRINT 'Próximo paso:';
PRINT '1. Reiniciar el backend para que detecte las vistas actualizadas';
PRINT '2. Exportar un PDF de rechequeos para verificar la mejora de rendimiento';
PRINT '============================================================================';
GO
