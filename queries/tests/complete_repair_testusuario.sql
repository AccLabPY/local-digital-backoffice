-- =========================================================
-- COMPLETAR REPAIR: Crear registros faltantes en TestUsuario
-- para los Tests que fueron cambiados de 1 a 2
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

-- 1) Identificar Tests=2 que NO tienen registro en TestUsuario
PRINT '=== Tests=2 SIN REGISTRO EN TestUsuario ===';
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.Test,
  ei.IdUsuario,
  tu.IdTestUsuario,
  CASE 
    WHEN tu.IdTestUsuario IS NULL THEN '❌ FALTA CREAR EN TestUsuario'
    ELSE '✅ YA EXISTE'
  END AS Estado
FROM dbo.EmpresaInfo ei
INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE ei.Test = 2  -- Solo Tests=2 (los que fueron cambiados)
ORDER BY ei.IdEmpresa;

-- 2) PREVIEW: Qué se va a crear en TestUsuario
PRINT '=== PREVIEW: REGISTROS A CREAR EN TestUsuario ===';
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.IdUsuario,
  ei.Test,
  -- Usar datos del Test=1 original como base
  tu_original.FechaTest AS FechaTest_Original,
  tu_original.FechaTerminoTest AS FechaTerminoTest_Original,
  tu_original.Finalizado AS Finalizado_Original,
  tu_original.TiempoTotal AS TiempoTotal_Original,
  tu_original.PuntajeTotal AS PuntajeTotal_Original,
  tu_original.NivelMadurez AS NivelMadurez_Original,
  'CREAR NUEVO REGISTRO' AS Accion
FROM dbo.EmpresaInfo ei
INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
-- Obtener datos del Test=1 original para usar como base
LEFT JOIN dbo.EmpresaInfo ei_original ON ei_original.IdEmpresa = ei.IdEmpresa AND ei_original.Test = 1
LEFT JOIN dbo.TestUsuario tu_original ON ei_original.IdUsuario = tu_original.IdUsuario AND ei_original.Test = tu_original.Test
WHERE ei.Test = 2  -- Solo Tests=2
  AND tu.IdTestUsuario IS NULL  -- Que no existan en TestUsuario
ORDER BY ei.IdEmpresa;

-- 3) PREVIEW: Qué se va a crear en ResultadoNivelDigital
PRINT '=== PREVIEW: REGISTROS A CREAR EN ResultadoNivelDigital ===';
SELECT 
  ei.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ei.IdUsuario,
  ei.Test,
  rnd_original.ptjeTotalUsuario AS PuntajeTotal_Original,
  rnd_original.ptjeDimensionTecnologia AS Tecnologia_Original,
  rnd_original.ptjeDimensionComunicacion AS Comunicacion_Original,
  rnd_original.ptjeDimensionOrganizacion AS Organizacion_Original,
  rnd_original.ptjeDimensionDatos AS Datos_Original,
  rnd_original.ptjeDimensionEstrategia AS Estrategia_Original,
  rnd_original.ptjeDimensionProcesos AS Procesos_Original,
  rnd_original.IdNivelMadurez AS IdNivelMadurez_Original,
  'CREAR NUEVO REGISTRO' AS Accion
FROM dbo.EmpresaInfo ei
INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.ResultadoNivelDigital rnd ON ei.IdUsuario = rnd.IdUsuario AND ei.Test = rnd.Test
-- Obtener datos del Test=1 original
LEFT JOIN dbo.EmpresaInfo ei_original ON ei_original.IdEmpresa = ei.IdEmpresa AND ei_original.Test = 1
LEFT JOIN dbo.ResultadoNivelDigital rnd_original ON ei_original.IdUsuario = rnd_original.IdUsuario AND ei_original.Test = rnd_original.Test
WHERE ei.Test = 2  -- Solo Tests=2
  AND rnd.IdResultadoNivelDigital IS NULL  -- Que no existan en ResultadoNivelDigital
ORDER BY ei.IdEmpresa;

IF @DryRun = 1
BEGIN
  PRINT 'PREVIEW terminado. No se realizaron cambios.';
  PRINT 'Si los datos se ven correctos, ejecuta con @DryRun = 0 para aplicar la corrección.';
  RETURN;
END

-- 4) APLICAR CORRECCIÓN: Crear registros faltantes
PRINT '=== APLICANDO CORRECCIÓN COMPLETA ===';
BEGIN TRY
  BEGIN TRAN;

  -- 4.1) Crear registros en TestUsuario para Tests=2
  INSERT INTO dbo.TestUsuario (
    IdUsuario,
    Test,
    FechaTest,
    FechaTerminoTest,
    Finalizado,
    TiempoTotal,
    PuntajeTotal,
    NivelMadurez
  )
  SELECT 
    ei.IdUsuario,
    ei.Test,
    tu_original.FechaTest,
    tu_original.FechaTerminoTest,
    tu_original.Finalizado,
    tu_original.TiempoTotal,
    tu_original.PuntajeTotal,
    tu_original.NivelMadurez
  FROM dbo.EmpresaInfo ei
  INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
  LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  -- Obtener datos del Test=1 original
  LEFT JOIN dbo.EmpresaInfo ei_original ON ei_original.IdEmpresa = ei.IdEmpresa AND ei_original.Test = 1
  LEFT JOIN dbo.TestUsuario tu_original ON ei_original.IdUsuario = tu_original.IdUsuario AND ei_original.Test = tu_original.Test
  WHERE ei.Test = 2  -- Solo Tests=2
    AND tu.IdTestUsuario IS NULL  -- Que no existan
    AND tu_original.IdTestUsuario IS NOT NULL;  -- Que el original exista

  DECLARE @TestUsuarioInserted INT = @@ROWCOUNT;
  PRINT CONCAT('Se crearon ', @TestUsuarioInserted, ' registros en TestUsuario.');

  -- 4.2) Crear registros en ResultadoNivelDigital para Tests=2
  INSERT INTO dbo.ResultadoNivelDigital (
    IdUsuario,
    Test,
    ptjeTotalUsuario,
    ptjeDimensionTecnologia,
    ptjeDimensionComunicacion,
    ptjeDimensionOrganizacion,
    ptjeDimensionDatos,
    ptjeDimensionEstrategia,
    ptjeDimensionProcesos,
    IdNivelMadurez
  )
  SELECT 
    ei.IdUsuario,
    ei.Test,
    rnd_original.ptjeTotalUsuario,
    rnd_original.ptjeDimensionTecnologia,
    rnd_original.ptjeDimensionComunicacion,
    rnd_original.ptjeDimensionOrganizacion,
    rnd_original.ptjeDimensionDatos,
    rnd_original.ptjeDimensionEstrategia,
    rnd_original.ptjeDimensionProcesos,
    rnd_original.IdNivelMadurez
  FROM dbo.EmpresaInfo ei
  INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
  LEFT JOIN dbo.ResultadoNivelDigital rnd ON ei.IdUsuario = rnd.IdUsuario AND ei.Test = rnd.Test
  -- Obtener datos del Test=1 original
  LEFT JOIN dbo.EmpresaInfo ei_original ON ei_original.IdEmpresa = ei.IdEmpresa AND ei_original.Test = 1
  LEFT JOIN dbo.ResultadoNivelDigital rnd_original ON ei_original.IdUsuario = rnd_original.IdUsuario AND ei_original.Test = rnd_original.Test
  WHERE ei.Test = 2  -- Solo Tests=2
    AND rnd.IdResultadoNivelDigital IS NULL  -- Que no existan
    AND rnd_original.IdResultadoNivelDigital IS NOT NULL;  -- Que el original exista

  DECLARE @ResultadoInserted INT = @@ROWCOUNT;
  PRINT CONCAT('Se crearon ', @ResultadoInserted, ' registros en ResultadoNivelDigital.');

  -- 5) Verificación final
  PRINT '=== VERIFICACIÓN FINAL ===';
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
  PRINT 'CORRECCIÓN COMPLETA APLICADA CON ÉXITO.';
  PRINT 'Ahora recarga la página de rechequeos para ver los resultados.';
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK;
  DECLARE @msg nvarchar(4000) = ERROR_MESSAGE();
  RAISERROR(@msg, 16, 1);
END CATCH;

PRINT '=== CORRECCIÓN COMPLETA FINALIZADA ===';
