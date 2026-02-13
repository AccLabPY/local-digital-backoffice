-- =========================================================
-- CORRECCIÓN ADICIONAL: Verificar y corregir TestUsuario
-- para empresas que fueron normalizadas
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

-- 1) Verificar estado de TestUsuario para empresas corregidas
PRINT '=== ESTADO DE TestUsuario PARA EMPRESAS CORREGIDAS ===';
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.Test,
  ei.IdUsuario,
  tu.IdTestUsuario,
  tu.FechaTest,
  tu.FechaTerminoTest,
  tu.Finalizado,
  CASE 
    WHEN tu.IdTestUsuario IS NULL THEN '❌ NO EXISTE EN TestUsuario'
    WHEN tu.Finalizado = 0 THEN '⚠️ NO FINALIZADO'
    WHEN tu.Finalizado = 1 THEN '✅ FINALIZADO'
    ELSE '❓ ESTADO DESCONOCIDO'
  END AS EstadoTestUsuario
FROM dbo.EmpresaInfo ei
INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
ORDER BY ei.IdEmpresa, ei.Test;

-- 2) Identificar TestUsuario que necesitan ser marcados como finalizados
PRINT '=== TestUsuario QUE NECESITAN CORRECCIÓN ===';
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.Test,
  ei.IdUsuario,
  tu.IdTestUsuario,
  tu.FechaTest,
  tu.FechaTerminoTest,
  tu.Finalizado,
  'Marcar como Finalizado = 1' AS AccionRequerida
FROM dbo.EmpresaInfo ei
INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE tu.IdTestUsuario IS NOT NULL 
  AND tu.Finalizado = 0  -- Solo los no finalizados
ORDER BY ei.IdEmpresa, ei.Test;

-- 3) Verificar ResultadoNivelDigital
PRINT '=== ESTADO DE ResultadoNivelDigital ===';
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.Test,
  ei.IdUsuario,
  rnd.IdResultadoNivelDigital,
  rnd.ptjeTotalUsuario,
  CASE 
    WHEN rnd.IdResultadoNivelDigital IS NULL THEN '❌ NO EXISTE RESULTADO'
    ELSE '✅ RESULTADO EXISTE'
  END AS EstadoResultado
FROM dbo.EmpresaInfo ei
INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.ResultadoNivelDigital rnd ON ei.IdUsuario = rnd.IdUsuario AND ei.Test = rnd.Test
ORDER BY ei.IdEmpresa, ei.Test;

IF @DryRun = 1
BEGIN
  PRINT 'PREVIEW terminado. No se realizaron cambios.';
  PRINT 'Si encuentras TestUsuario con Finalizado = 0, ejecuta con @DryRun = 0 para corregirlos.';
  RETURN;
END

-- 4) CORRECCIÓN: Marcar TestUsuario como finalizados
PRINT '=== APLICANDO CORRECCIÓN ===';
BEGIN TRY
  BEGIN TRAN;

  -- Marcar como finalizados los TestUsuario de empresas corregidas que no estén finalizados
  UPDATE tu
  SET tu.Finalizado = 1
  FROM dbo.TestUsuario tu
  INNER JOIN dbo.EmpresaInfo ei ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
  WHERE tu.Finalizado = 0;

  DECLARE @RowsUpdated INT = @@ROWCOUNT;
  
  PRINT CONCAT('Se actualizaron ', @RowsUpdated, ' registros en TestUsuario.');

  -- Verificación post-corrección
  SELECT 
    COUNT(*) AS TotalEmpresasCorregidas,
    'Empresas que deberían aparecer en rechequeos' AS Descripcion
  FROM @EmpresasCorregidas;

  COMMIT;
  PRINT 'CORRECCIÓN APLICADA CON ÉXITO.';
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK;
  DECLARE @msg nvarchar(4000) = ERROR_MESSAGE();
  RAISERROR(@msg, 16, 1);
END CATCH;

PRINT '=== CORRECCIÓN COMPLETADA ===';
