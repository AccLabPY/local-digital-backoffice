-- =========================================================
-- SOLUCIÓN REAL: Encontrar los registros originales de TestUsuario
-- que correspondían a los IdEmpresaInfo antes del cambio
-- =========================================================

USE [BID_stg_copy];  -- << Cambiar si corresponde
GO
SET NOCOUNT ON;

-- IdEmpresaInfo que fueron cambiados de Test=1 a Test=2
DECLARE @IdEmpresaInfoCambiados TABLE (
  IdEmpresaInfo INT PRIMARY KEY
);

INSERT INTO @IdEmpresaInfoCambiados (IdEmpresaInfo)
VALUES 
  (41), (1057), (5494), (5742), (5774), (5589), (2582), (1113), (5765), (5716),
  (5766), (5750), (5740), (5394), (5761), (5678), (5747), (5776), (5395), (5760),
  (5650), (5557), (5755), (5675), (5735), (5574), (1409), (5029), (1495), (4887),
  (5613), (5292), (5301), (5337), (5414), (5209), (5752), (5423), (5583);

-- 1) Buscar TestUsuario que correspondían a estos IdEmpresaInfo ANTES del cambio
PRINT '=== TestUsuario ORIGINALES (ANTES DEL CAMBIO) ===';
-- Necesitamos encontrar TestUsuario que tienen estos IdEmpresaInfo asociados
-- pero con Test=1 (antes del cambio)
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.IdEmpresaInfo,
  ei.Test AS Test_EmpresaInfo,
  ei.IdUsuario AS IdUsuario_EmpresaInfo,
  tu.IdUsuario AS IdUsuario_TestUsuario,
  tu.Test AS Test_TestUsuario,
  tu.IdTestUsuario,
  tu.FechaTest,
  tu.FechaTerminoTest,
  tu.Finalizado,
  'ESTE ES EL TestUsuario ORIGINAL' AS Descripcion
FROM dbo.EmpresaInfo ei
INNER JOIN @IdEmpresaInfoCambiados ic ON ic.IdEmpresaInfo = ei.IdEmpresaInfo
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
-- Buscar TestUsuario que correspondían a estos IdEmpresaInfo ANTES del cambio
-- (cuando eran Test=1 con el usuario original)
LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
ORDER BY ei.IdEmpresa;

-- 2) Buscar TestUsuario por IdEmpresaInfo directamente
PRINT '=== TestUsuario POR IdEmpresaInfo ===';
-- Buscar si hay TestUsuario que correspondían a estos IdEmpresaInfo
-- independientemente del IdUsuario actual
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.IdEmpresaInfo,
  ei.Test AS Test_EmpresaInfo,
  ei.IdUsuario AS IdUsuario_EmpresaInfo,
  tu.IdUsuario AS IdUsuario_TestUsuario,
  tu.Test AS Test_TestUsuario,
  tu.IdTestUsuario,
  tu.FechaTest,
  tu.FechaTerminoTest,
  tu.Finalizado,
  'BUSCANDO POR IdEmpresaInfo' AS Descripcion
FROM dbo.EmpresaInfo ei
INNER JOIN @IdEmpresaInfoCambiados ic ON ic.IdEmpresaInfo = ei.IdEmpresaInfo
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
-- Buscar TestUsuario que podrían corresponder a estos IdEmpresaInfo
-- por fecha o por algún otro criterio
LEFT JOIN dbo.TestUsuario tu ON tu.IdTestUsuario = ei.IdEmpresaInfo  -- ¿Es esto posible?
ORDER BY ei.IdEmpresa;

-- 3) Buscar TestUsuario por fecha y empresa
PRINT '=== TestUsuario POR FECHA Y EMPRESA ===';
-- Buscar TestUsuario que podrían corresponder por fecha
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.IdEmpresaInfo,
  ei.Test AS Test_EmpresaInfo,
  ei.IdUsuario AS IdUsuario_EmpresaInfo,
  tu.IdUsuario AS IdUsuario_TestUsuario,
  tu.Test AS Test_TestUsuario,
  tu.IdTestUsuario,
  tu.FechaTest,
  tu.FechaTerminoTest,
  tu.Finalizado,
  'BUSCANDO POR FECHA' AS Descripcion
FROM dbo.EmpresaInfo ei
INNER JOIN @IdEmpresaInfoCambiados ic ON ic.IdEmpresaInfo = ei.IdEmpresaInfo
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
-- Buscar TestUsuario que podrían corresponder por fecha
LEFT JOIN dbo.TestUsuario tu ON tu.FechaTest BETWEEN DATEADD(DAY, -1, ei.FechaTest) AND DATEADD(DAY, 1, ei.FechaTest)
WHERE ei.IdEmpresa IN (SELECT DISTINCT IdEmpresa FROM dbo.EmpresaInfo WHERE IdEmpresaInfo IN (SELECT IdEmpresaInfo FROM @IdEmpresaInfoCambiados))
ORDER BY ei.IdEmpresa, tu.FechaTest;

-- 4) Verificar si hay TestUsuario con Test=1 para estas empresas
PRINT '=== TestUsuario CON Test=1 PARA ESTAS EMPRESAS ===';
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.IdEmpresaInfo,
  ei.Test AS Test_EmpresaInfo,
  ei.IdUsuario AS IdUsuario_EmpresaInfo,
  tu.IdUsuario AS IdUsuario_TestUsuario,
  tu.Test AS Test_TestUsuario,
  tu.IdTestUsuario,
  tu.FechaTest,
  tu.FechaTerminoTest,
  tu.Finalizado,
  'TestUsuario CON Test=1' AS Descripcion
FROM dbo.EmpresaInfo ei
INNER JOIN @IdEmpresaInfoCambiados ic ON ic.IdEmpresaInfo = ei.IdEmpresaInfo
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
-- Buscar TestUsuario con Test=1 para estas empresas
LEFT JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = 1
ORDER BY ei.IdEmpresa;

-- 5) Buscar TODOS los TestUsuario para estas empresas
PRINT '=== TODOS LOS TestUsuario PARA ESTAS EMPRESAS ===';
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.IdEmpresaInfo,
  ei.Test AS Test_EmpresaInfo,
  ei.IdUsuario AS IdUsuario_EmpresaInfo,
  tu.IdUsuario AS IdUsuario_TestUsuario,
  tu.Test AS Test_TestUsuario,
  tu.IdTestUsuario,
  tu.FechaTest,
  tu.FechaTerminoTest,
  tu.Finalizado,
  'TODOS LOS TestUsuario' AS Descripcion
FROM dbo.EmpresaInfo ei
INNER JOIN @IdEmpresaInfoCambiados ic ON ic.IdEmpresaInfo = ei.IdEmpresaInfo
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
-- Buscar TODOS los TestUsuario para estas empresas
LEFT JOIN dbo.TestUsuario tu ON tu.IdUsuario IN (
  SELECT DISTINCT IdUsuario FROM dbo.EmpresaInfo 
  WHERE IdEmpresa IN (SELECT DISTINCT IdEmpresa FROM dbo.EmpresaInfo WHERE IdEmpresaInfo IN (SELECT IdEmpresaInfo FROM @IdEmpresaInfoCambiados))
)
ORDER BY ei.IdEmpresa, tu.IdUsuario, tu.Test;

PRINT '=== VERIFICACIÓN COMPLETADA ===';
