-- =========================================================
-- VERIFICACIÓN REAL: Buscar los registros originales del Test=2
-- que están asociados al usuario original
-- =========================================================

USE [BID_v2_22122025];  -- << Cambiar si corresponde
GO
SET NOCOUNT ON;

-- Empresas que fueron corregidas por el script anterior
DECLARE @EmpresasCorregidas TABLE (
  IdEmpresa INT PRIMARY KEY
);

INSERT INTO @EmpresasCorregidas (IdEmpresa)
VALUES 
  (144), (1149), (1166), (1168), (1183), (1184), (1186), (1221), (1376), (1385),
  (1389), (1392), (1395), (1399), (1409), (1418), (1422), (1423), (1429), (1432),
  (1435), (1439), (1440), (1441), (1445), (1508), (1535), (1594), (1617), (1640),
  (2756), (2788), (2790), (2841), (4988), (5013), (5133), (5399), (5412);

-- 1) Verificar TODOS los registros de EmpresaInfo para estas empresas
PRINT '=== TODOS LOS REGISTROS DE EmpresaInfo PARA EMPRESAS CORREGIDAS ===';
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.IdEmpresaInfo,
  ei.Test,
  ei.IdUsuario,
  u.NombreCompleto AS NombreUsuario,
  ei.IdDepartamento,
  ei.IdLocalidad,
  ei.IdSectorActividad,
  ei.IdVentas,
  ei.IdSubSectorActividad
FROM dbo.EmpresaInfo ei
INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.Usuario u ON u.IdUsuario = ei.IdUsuario
ORDER BY ei.IdEmpresa, ei.Test, ei.IdEmpresaInfo;

-- 2) Buscar TestUsuario que podrían corresponder a estos Tests=2
PRINT '=== TestUsuario QUE PODRÍAN CORRESPONDER A Tests=2 ===';
-- Buscar por IdEmpresaInfo que fueron cambiados
WITH IdEmpresaInfoCambiados AS (
  -- Estos son los IdEmpresaInfo que fueron cambiados de Test=1 a Test=2
  SELECT DISTINCT IdEmpresaInfo FROM (
    VALUES 
    (41), (1057), (5494), (5742), (5774), (5589), (2582), (1113), (5765), (5716),
    (5766), (5750), (5740), (5394), (5761), (5678), (5747), (5776), (5395), (5760),
    (5650), (5557), (5755), (5675), (5735), (5574), (1409), (5029), (1495), (4887),
    (5613), (5292), (5301), (5337), (5414), (5209), (5752), (5423), (5583)
  ) AS t(IdEmpresaInfo)
)
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.IdEmpresaInfo,
  ei.Test,
  ei.IdUsuario AS IdUsuario_EmpresaInfo,
  tu.IdUsuario AS IdUsuario_TestUsuario,
  tu.IdTestUsuario,
  tu.FechaTest,
  tu.FechaTerminoTest,
  tu.Finalizado,
  CASE 
    WHEN tu.IdTestUsuario IS NOT NULL THEN '✅ EXISTE TestUsuario'
    ELSE '❌ NO EXISTE TestUsuario'
  END AS EstadoTestUsuario
FROM dbo.EmpresaInfo ei
INNER JOIN IdEmpresaInfoCambiados ic ON ic.IdEmpresaInfo = ei.IdEmpresaInfo
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
ORDER BY ei.IdEmpresa;

-- 3) Buscar TestUsuario por IdEmpresaInfo original (antes del cambio)
PRINT '=== TestUsuario POR IdEmpresaInfo ORIGINAL ===';
-- Buscar TestUsuario que correspondían a estos IdEmpresaInfo antes del cambio
WITH IdEmpresaInfoCambiados AS (
  SELECT DISTINCT IdEmpresaInfo FROM (
    VALUES 
    (41), (1057), (5494), (5742), (5774), (5589), (2582), (1113), (5765), (5716),
    (5766), (5750), (5740), (5394), (5761), (5678), (5747), (5776), (5395), (5760),
    (5650), (5557), (5755), (5675), (5735), (5574), (1409), (5029), (1495), (4887),
    (5613), (5292), (5301), (5337), (5414), (5209), (5752), (5423), (5583)
  ) AS t(IdEmpresaInfo)
)
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.IdEmpresaInfo,
  ei.Test,
  ei.IdUsuario,
  tu.IdTestUsuario,
  tu.FechaTest,
  tu.FechaTerminoTest,
  tu.Finalizado,
  tu.TiempoTotal,
  tu.PuntajeTotal,
  tu.NivelMadurez,
  'ESTE ES EL TestUsuario ORIGINAL' AS Descripcion
FROM dbo.EmpresaInfo ei
INNER JOIN IdEmpresaInfoCambiados ic ON ic.IdEmpresaInfo = ei.IdEmpresaInfo
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
ORDER BY ei.IdEmpresa;

-- 4) Buscar ResultadoNivelDigital por IdEmpresaInfo original
PRINT '=== ResultadoNivelDigital POR IdEmpresaInfo ORIGINAL ===';
WITH IdEmpresaInfoCambiados AS (
  SELECT DISTINCT IdEmpresaInfo FROM (
    VALUES 
    (41), (1057), (5494), (5742), (5774), (5589), (2582), (1113), (5765), (5716),
    (5766), (5750), (5740), (5394), (5761), (5678), (5747), (5776), (5395), (5760),
    (5650), (5557), (5755), (5675), (5735), (5574), (1409), (5029), (1495), (4887),
    (5613), (5292), (5301), (5337), (5414), (5209), (5752), (5423), (5583)
  ) AS t(IdEmpresaInfo)
)
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.IdEmpresaInfo,
  ei.Test,
  ei.IdUsuario,
  rnd.IdResultadoNivelDigital,
  rnd.ptjeTotalUsuario,
  rnd.ptjeDimensionTecnologia,
  rnd.ptjeDimensionComunicacion,
  rnd.ptjeDimensionOrganizacion,
  rnd.ptjeDimensionDatos,
  rnd.ptjeDimensionEstrategia,
  rnd.ptjeDimensionProcesos,
  rnd.IdNivelMadurez,
  'ESTE ES EL ResultadoNivelDigital ORIGINAL' AS Descripcion
FROM dbo.EmpresaInfo ei
INNER JOIN IdEmpresaInfoCambiados ic ON ic.IdEmpresaInfo = ei.IdEmpresaInfo
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.ResultadoNivelDigital rnd ON ei.IdUsuario = rnd.IdUsuario AND ei.Test = rnd.Test
ORDER BY ei.IdEmpresa;

-- 5) Verificar si hay Tests=1 duplicados que no fueron corregidos
PRINT '=== VERIFICAR Tests=1 DUPLICADOS NO CORREGIDOS ===';
WITH TestsPorEmpresa AS (
  SELECT 
    ei.IdEmpresa,
    ei.Test,
    COUNT(*) AS CantidadRegistros,
    STRING_AGG(CAST(ei.IdEmpresaInfo AS VARCHAR), ', ') AS IdEmpresaInfoList
  FROM dbo.EmpresaInfo ei
  INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
  GROUP BY ei.IdEmpresa, ei.Test
)
SELECT 
  tpe.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  tpe.Test,
  tpe.CantidadRegistros,
  tpe.IdEmpresaInfoList,
  CASE 
    WHEN tpe.Test = 1 AND tpe.CantidadRegistros > 1 THEN '❌ HAY Tests=1 DUPLICADOS'
    WHEN tpe.Test = 2 AND tpe.CantidadRegistros = 1 THEN '✅ Test=2 ÚNICO'
    ELSE 'ℹ️ ESTADO NORMAL'
  END AS Estado
FROM TestsPorEmpresa tpe
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = tpe.IdEmpresa
ORDER BY tpe.IdEmpresa, tpe.Test;

PRINT '=== VERIFICACIÓN COMPLETADA ===';
