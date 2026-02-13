-- =========================================================
-- CORRECCIÓN REAL: Sincronizar IdUsuario en TestUsuario y ResultadoNivelDigital
-- con los cambios realizados en EmpresaInfo
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

-- 1) Identificar desincronizaciones en TestUsuario
PRINT '=== DESINCRONIZACIONES EN TestUsuario ===';
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.Test,
  ei.IdUsuario AS IdUsuario_EmpresaInfo,
  tu.IdUsuario AS IdUsuario_TestUsuario,
  tu.IdTestUsuario,
  tu.FechaTest,
  tu.FechaTerminoTest,
  tu.Finalizado,
  CASE 
    WHEN ei.IdUsuario = tu.IdUsuario THEN '✅ SINCRONIZADO'
    ELSE '❌ DESINCRONIZADO - NECESITA CORRECCIÓN'
  END AS Estado
FROM dbo.EmpresaInfo ei
INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE ei.Test = 2  -- Solo Tests=2 (los que fueron cambiados)
ORDER BY ei.IdEmpresa;

-- 2) Identificar desincronizaciones en ResultadoNivelDigital
PRINT '=== DESINCRONIZACIONES EN ResultadoNivelDigital ===';
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.Test,
  ei.IdUsuario AS IdUsuario_EmpresaInfo,
  rnd.IdUsuario AS IdUsuario_ResultadoNivelDigital,
  rnd.IdResultadoNivelDigital,
  rnd.ptjeTotalUsuario,
  CASE 
    WHEN ei.IdUsuario = rnd.IdUsuario THEN '✅ SINCRONIZADO'
    ELSE '❌ DESINCRONIZADO - NECESITA CORRECCIÓN'
  END AS Estado
FROM dbo.EmpresaInfo ei
INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.ResultadoNivelDigital rnd ON ei.IdUsuario = rnd.IdUsuario AND ei.Test = rnd.Test
WHERE ei.Test = 2  -- Solo Tests=2
ORDER BY ei.IdEmpresa;

-- 3) PREVIEW: Qué cambios se van a hacer
PRINT '=== PREVIEW: CAMBIOS A REALIZAR ===';
WITH CambiosTestUsuario AS (
  SELECT 
    ei.IdEmpresa,
    ei.Test,
    ei.IdUsuario AS NuevoIdUsuario,
    tu.IdUsuario AS IdUsuarioActual,
    tu.IdTestUsuario,
    'Actualizar IdUsuario en TestUsuario' AS Accion
  FROM dbo.EmpresaInfo ei
  INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
  LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  WHERE ei.Test = 2
    AND tu.IdTestUsuario IS NOT NULL
    AND ei.IdUsuario != tu.IdUsuario  -- Solo los desincronizados
),
CambiosResultadoNivelDigital AS (
  SELECT 
    ei.IdEmpresa,
    ei.Test,
    ei.IdUsuario AS NuevoIdUsuario,
    rnd.IdUsuario AS IdUsuarioActual,
    rnd.IdResultadoNivelDigital,
    'Actualizar IdUsuario en ResultadoNivelDigital' AS Accion
  FROM dbo.EmpresaInfo ei
  INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
  LEFT JOIN dbo.ResultadoNivelDigital rnd ON ei.IdUsuario = rnd.IdUsuario AND ei.Test = rnd.Test
  WHERE ei.Test = 2
    AND rnd.IdResultadoNivelDigital IS NOT NULL
    AND ei.IdUsuario != rnd.IdUsuario  -- Solo los desincronizados
)
SELECT * FROM CambiosTestUsuario
UNION ALL
SELECT 
  IdEmpresa,
  Test,
  NuevoIdUsuario,
  IdUsuarioActual,
  IdResultadoNivelDigital AS IdRegistro,
  Accion
FROM CambiosResultadoNivelDigital
ORDER BY IdEmpresa, Test;

IF @DryRun = 1
BEGIN
  PRINT 'PREVIEW terminado. No se realizaron cambios.';
  PRINT 'Si los cambios se ven correctos, ejecuta con @DryRun = 0 para aplicar la corrección.';
  RETURN;
END

-- 4) APLICAR CORRECCIÓN: Sincronizar IdUsuario
PRINT '=== APLICANDO CORRECCIÓN DE SINCRONIZACIÓN ===';
BEGIN TRY
  BEGIN TRAN;

  -- 4.1) Actualizar TestUsuario para Tests=2
  UPDATE tu
  SET tu.IdUsuario = ei.IdUsuario
  FROM dbo.TestUsuario tu
  INNER JOIN dbo.EmpresaInfo ei ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
  WHERE ei.Test = 2
    AND tu.IdTestUsuario IS NOT NULL;

  DECLARE @TestUsuarioUpdated INT = @@ROWCOUNT;
  PRINT CONCAT('Se actualizaron ', @TestUsuarioUpdated, ' registros en TestUsuario.');

  -- 4.2) Actualizar ResultadoNivelDigital para Tests=2
  UPDATE rnd
  SET rnd.IdUsuario = ei.IdUsuario
  FROM dbo.ResultadoNivelDigital rnd
  INNER JOIN dbo.EmpresaInfo ei ON ei.IdUsuario = rnd.IdUsuario AND ei.Test = rnd.Test
  INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
  WHERE ei.Test = 2
    AND rnd.IdResultadoNivelDigital IS NOT NULL;

  DECLARE @ResultadoUpdated INT = @@ROWCOUNT;
  PRINT CONCAT('Se actualizaron ', @ResultadoUpdated, ' registros en ResultadoNivelDigital.');

  -- 5) Verificación final
  PRINT '=== VERIFICACIÓN FINAL ===';
  
  -- Verificar sincronización
  SELECT 
    COUNT(*) AS TotalDesincronizaciones,
    'Desincronizaciones restantes (debería ser 0)' AS Descripcion
  FROM dbo.EmpresaInfo ei
  INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
  LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  WHERE ei.Test = 2
    AND tu.IdTestUsuario IS NOT NULL
    AND ei.IdUsuario != tu.IdUsuario;

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
