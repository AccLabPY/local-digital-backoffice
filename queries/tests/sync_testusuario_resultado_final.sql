-- =========================================================
-- CORRECCIÓN REAL: Actualizar TestUsuario y ResultadoNivelDigital
-- para que coincidan con los cambios realizados en EmpresaInfo
-- =========================================================

USE [BID_v2_22122025];  -- << Cambiar si corresponde
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @DryRun BIT = 1;  -- 1 = SOLO PREVIEW, 0 = APLICAR CORRECCIÓN

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

-- 1) Identificar registros en TestUsuario que necesitan actualización
PRINT '=== TestUsuario QUE NECESITAN ACTUALIZACIÓN ===';
-- Buscar TestUsuario que correspondían a los IdEmpresaInfo que fueron cambiados
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
  ei.Test AS Test_EmpresaInfo,
  ei.IdUsuario AS IdUsuario_EmpresaInfo,
  tu.IdUsuario AS IdUsuario_TestUsuario,
  tu.Test AS Test_TestUsuario,
  tu.IdTestUsuario,
  tu.FechaTest,
  tu.FechaTerminoTest,
  tu.Finalizado,
  CASE 
    WHEN ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test THEN '✅ SINCRONIZADO'
    ELSE '❌ DESINCRONIZADO - NECESITA ACTUALIZACIÓN'
  END AS Estado
FROM dbo.EmpresaInfo ei
INNER JOIN IdEmpresaInfoCambiados ic ON ic.IdEmpresaInfo = ei.IdEmpresaInfo
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
ORDER BY ei.IdEmpresa;

-- 2) Identificar registros en ResultadoNivelDigital que necesitan actualización
PRINT '=== ResultadoNivelDigital QUE NECESITAN ACTUALIZACIÓN ===';
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
  ei.Test AS Test_EmpresaInfo,
  ei.IdUsuario AS IdUsuario_EmpresaInfo,
  rnd.IdUsuario AS IdUsuario_ResultadoNivelDigital,
  rnd.Test AS Test_ResultadoNivelDigital,
  rnd.IdResultadoNivelDigital,
  rnd.ptjeTotalUsuario,
  CASE 
    WHEN ei.IdUsuario = rnd.IdUsuario AND ei.Test = rnd.Test THEN '✅ SINCRONIZADO'
    ELSE '❌ DESINCRONIZADO - NECESITA ACTUALIZACIÓN'
  END AS Estado
FROM dbo.EmpresaInfo ei
INNER JOIN IdEmpresaInfoCambiados ic ON ic.IdEmpresaInfo = ei.IdEmpresaInfo
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.ResultadoNivelDigital rnd ON ei.IdUsuario = rnd.IdUsuario AND ei.Test = rnd.Test
ORDER BY ei.IdEmpresa;

-- 3) PREVIEW: Qué cambios se van a hacer
PRINT '=== PREVIEW: CAMBIOS A REALIZAR ===';
WITH IdEmpresaInfoCambiados AS (
  SELECT DISTINCT IdEmpresaInfo FROM (
    VALUES 
    (41), (1057), (5494), (5742), (5774), (5589), (2582), (1113), (5765), (5716),
    (5766), (5750), (5740), (5394), (5761), (5678), (5747), (5776), (5395), (5760),
    (5650), (5557), (5755), (5675), (5735), (5574), (1409), (5029), (1495), (4887),
    (5613), (5292), (5301), (5337), (5414), (5209), (5752), (5423), (5583)
  ) AS t(IdEmpresaInfo)
),
CambiosTestUsuario AS (
  SELECT 
    ei.IdEmpresa,
    ei.IdEmpresaInfo,
    ei.IdUsuario AS NuevoIdUsuario,
    ei.Test AS NuevoTest,
    tu.IdUsuario AS IdUsuarioActual,
    tu.Test AS TestActual,
    tu.IdTestUsuario,
    'Actualizar TestUsuario: IdUsuario=' + CAST(ei.IdUsuario AS VARCHAR) + ', Test=' + CAST(ei.Test AS VARCHAR) AS Accion
  FROM dbo.EmpresaInfo ei
  INNER JOIN IdEmpresaInfoCambiados ic ON ic.IdEmpresaInfo = ei.IdEmpresaInfo
  LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  WHERE tu.IdTestUsuario IS NOT NULL
    AND (ei.IdUsuario != tu.IdUsuario OR ei.Test != tu.Test)
),
CambiosResultadoNivelDigital AS (
  SELECT 
    ei.IdEmpresa,
    ei.IdEmpresaInfo,
    ei.IdUsuario AS NuevoIdUsuario,
    ei.Test AS NuevoTest,
    rnd.IdUsuario AS IdUsuarioActual,
    rnd.Test AS TestActual,
    rnd.IdResultadoNivelDigital,
    'Actualizar ResultadoNivelDigital: IdUsuario=' + CAST(ei.IdUsuario AS VARCHAR) + ', Test=' + CAST(ei.Test AS VARCHAR) AS Accion
  FROM dbo.EmpresaInfo ei
  INNER JOIN IdEmpresaInfoCambiados ic ON ic.IdEmpresaInfo = ei.IdEmpresaInfo
  LEFT JOIN dbo.ResultadoNivelDigital rnd ON ei.IdUsuario = rnd.IdUsuario AND ei.Test = rnd.Test
  WHERE rnd.IdResultadoNivelDigital IS NOT NULL
    AND (ei.IdUsuario != rnd.IdUsuario OR ei.Test != rnd.Test)
)
SELECT * FROM CambiosTestUsuario
UNION ALL
SELECT 
  IdEmpresa,
  IdEmpresaInfo,
  NuevoIdUsuario,
  NuevoTest,
  IdUsuarioActual,
  TestActual,
  IdResultadoNivelDigital AS IdRegistro,
  Accion
FROM CambiosResultadoNivelDigital
ORDER BY IdEmpresa;

IF @DryRun = 1
BEGIN
  PRINT 'PREVIEW terminado. No se realizaron cambios.';
  PRINT 'Si los cambios se ven correctos, ejecuta con @DryRun = 0 para aplicar la corrección.';
  RETURN;
END

-- 4) APLICAR CORRECCIÓN: Actualizar TestUsuario y ResultadoNivelDigital
PRINT '=== APLICANDO CORRECCIÓN DE SINCRONIZACIÓN ===';
BEGIN TRY
  BEGIN TRAN;

  -- 4.1) Actualizar TestUsuario para que coincida con EmpresaInfo
  WITH IdEmpresaInfoCambiados AS (
    SELECT DISTINCT IdEmpresaInfo FROM (
      VALUES 
      (41), (1057), (5494), (5742), (5774), (5589), (2582), (1113), (5765), (5716),
      (5766), (5750), (5740), (5394), (5761), (5678), (5747), (5776), (5395), (5760),
      (5650), (5557), (5755), (5675), (5735), (5574), (1409), (5029), (1495), (4887),
      (5613), (5292), (5301), (5337), (5414), (5209), (5752), (5423), (5583)
    ) AS t(IdEmpresaInfo)
  )
  UPDATE tu
  SET tu.IdUsuario = ei.IdUsuario,
      tu.Test = ei.Test
  FROM dbo.TestUsuario tu
  INNER JOIN dbo.EmpresaInfo ei ON ei.IdEmpresaInfo IN (SELECT IdEmpresaInfo FROM IdEmpresaInfoCambiados)
  WHERE tu.IdTestUsuario IS NOT NULL;

  DECLARE @TestUsuarioUpdated INT = @@ROWCOUNT;
  PRINT CONCAT('Se actualizaron ', @TestUsuarioUpdated, ' registros en TestUsuario.');

  -- 4.2) Actualizar ResultadoNivelDigital para que coincida con EmpresaInfo
  WITH IdEmpresaInfoCambiados AS (
    SELECT DISTINCT IdEmpresaInfo FROM (
      VALUES 
      (41), (1057), (5494), (5742), (5774), (5589), (2582), (1113), (5765), (5716),
      (5766), (5750), (5740), (5394), (5761), (5678), (5747), (5776), (5395), (5760),
      (5650), (5557), (5755), (5675), (5735), (5574), (1409), (5029), (1495), (4887),
      (5613), (5292), (5301), (5337), (5414), (5209), (5752), (5423), (5583)
    ) AS t(IdEmpresaInfo)
  )
  UPDATE rnd
  SET rnd.IdUsuario = ei.IdUsuario,
      rnd.Test = ei.Test
  FROM dbo.ResultadoNivelDigital rnd
  INNER JOIN dbo.EmpresaInfo ei ON ei.IdEmpresaInfo IN (SELECT IdEmpresaInfo FROM IdEmpresaInfoCambiados)
  WHERE rnd.IdResultadoNivelDigital IS NOT NULL;

  DECLARE @ResultadoUpdated INT = @@ROWCOUNT;
  PRINT CONCAT('Se actualizaron ', @ResultadoUpdated, ' registros en ResultadoNivelDigital.');

  -- 5) Verificación final
  PRINT '=== VERIFICACIÓN FINAL ===';
  
  -- Contar empresas con múltiples Tests
  WITH TestsPorEmpresa AS (
    SELECT 
      ei.IdEmpresa,
      COUNT(DISTINCT ei.Test) AS TotalTests,
      STRING_AGG(CAST(ei.Test AS VARCHAR), ', ') AS TestsDisponibles
    FROM dbo.EmpresaInfo ei
    INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
    WHERE ei.IdEmpresa IN (SELECT IdEmpresa FROM @EmpresasCorregidas)
      AND tu.Finalizado = 1
    GROUP BY ei.IdEmpresa
  )
  SELECT 
    COUNT(*) AS EmpresasConMultiplesTests,
    'Empresas que ahora deberían aparecer en rechequeos' AS Descripcion
  FROM TestsPorEmpresa
  WHERE TotalTests >= 2;

  COMMIT;
  PRINT 'CORRECCIÓN DE SINCRONIZACIÓN APLICADA CON ÉXITO.';
  PRINT 'Ahora recarga la página de rechequeos para ver los resultados.';
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK;
  DECLARE @msg nvarchar(4000) = ERROR_MESSAGE();
  RAISERROR(@msg, 16, 1);
END CATCH;

PRINT '=== CORRECCIÓN DE SINCRONIZACIÓN FINALIZADA ===';
