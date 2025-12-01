-- =========================================================
-- SOLUCIÓN REAL: Crear registros faltantes en TestUsuario y ResultadoNivelDigital
-- para los Tests=2 que fueron cambiados en EmpresaInfo
-- =========================================================

USE [BID_stg_copy];  -- << Cambiar si corresponde
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
  ei.IdUsuario AS IdUsuario_EmpresaInfo,
  tu.IdTestUsuario,
  CASE 
    WHEN tu.IdTestUsuario IS NULL THEN '❌ NO EXISTE - NECESITA CREAR'
    ELSE '✅ YA EXISTE'
  END AS Estado
FROM dbo.EmpresaInfo ei
INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE ei.Test = 2  -- Solo Tests=2
ORDER BY ei.IdEmpresa;

-- 2) Buscar los datos originales del Test=2 (antes del cambio)
PRINT '=== DATOS ORIGINALES DEL Test=2 (ANTES DEL CAMBIO) ===';
-- Necesitamos encontrar los TestUsuario originales que correspondían a estos Tests=2
-- antes de que fueran cambiados a Test=1

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
  ei.IdUsuario,
  tu.IdTestUsuario,
  tu.FechaTest,
  tu.FechaTerminoTest,
  tu.Finalizado,
  tu.TiempoTotal,
  tu.PuntajeTotal,
  tu.NivelMadurez,
  CASE 
    WHEN tu.IdTestUsuario IS NOT NULL THEN '✅ DATOS ORIGINALES ENCONTRADOS'
    ELSE '❌ NO SE ENCONTRARON DATOS ORIGINALES'
  END AS Estado
FROM dbo.EmpresaInfo ei
INNER JOIN IdEmpresaInfoCambiados ic ON ic.IdEmpresaInfo = ei.IdEmpresaInfo
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
ORDER BY ei.IdEmpresa;

-- 3) PREVIEW: Qué registros se van a crear
PRINT '=== PREVIEW: REGISTROS A CREAR ===';
WITH DatosOriginales AS (
  -- Obtener los datos originales del TestUsuario que correspondía a estos IdEmpresaInfo
  SELECT 
    ei_original.IdEmpresa,
    ei_original.IdUsuario AS IdUsuarioOriginal,
    tu_original.IdTestUsuario,
    tu_original.FechaTest,
    tu_original.FechaTerminoTest,
    tu_original.Finalizado,
    tu_original.TiempoTotal,
    tu_original.PuntajeTotal,
    tu_original.NivelMadurez
  FROM dbo.EmpresaInfo ei_original
  INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei_original.IdEmpresa
  LEFT JOIN dbo.TestUsuario tu_original ON ei_original.IdUsuario = tu_original.IdUsuario AND ei_original.Test = tu_original.Test
  WHERE ei_original.Test = 2
    AND tu_original.IdTestUsuario IS NOT NULL
),
DatosNuevos AS (
  -- Obtener el IdUsuario correcto (del Test=1) para crear el nuevo registro
  SELECT 
    ei.IdEmpresa,
    ei.IdUsuario AS IdUsuarioCorrecto,
    ei.Test
  FROM dbo.EmpresaInfo ei
  INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei.IdEmpresa
  WHERE ei.Test = 2
)
SELECT 
  dn.IdEmpresa,
  dn.IdUsuarioCorrecto,
  dn.Test,
  do.IdUsuarioOriginal,
  do.IdTestUsuario AS IdTestUsuarioOriginal,
  do.FechaTest,
  do.FechaTerminoTest,
  do.Finalizado,
  'CREAR TestUsuario con IdUsuario=' + CAST(dn.IdUsuarioCorrecto AS VARCHAR) + ' basado en datos originales' AS Accion
FROM DatosNuevos dn
LEFT JOIN DatosOriginales do ON dn.IdEmpresa = do.IdEmpresa
WHERE do.IdTestUsuario IS NOT NULL
ORDER BY dn.IdEmpresa;

IF @DryRun = 1
BEGIN
  PRINT 'PREVIEW terminado. No se realizaron cambios.';
  PRINT 'Si los datos se ven correctos, ejecuta con @DryRun = 0 para crear los registros faltantes.';
  RETURN;
END

-- 4) APLICAR CORRECCIÓN: Crear registros faltantes
PRINT '=== APLICANDO CORRECCIÓN: CREAR REGISTROS FALTANTES ===';
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
    ei_correcto.IdUsuario,  -- IdUsuario correcto (del Test=1)
    ei_correcto.Test,      -- Test=2
    tu_original.FechaTest,
    tu_original.FechaTerminoTest,
    tu_original.Finalizado,
    tu_original.TiempoTotal,
    tu_original.PuntajeTotal,
    tu_original.NivelMadurez
  FROM dbo.EmpresaInfo ei_correcto
  INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei_correcto.IdEmpresa
  -- Obtener datos originales del TestUsuario
  LEFT JOIN dbo.EmpresaInfo ei_original ON ei_original.IdEmpresa = ei_correcto.IdEmpresa AND ei_original.Test = 2
  LEFT JOIN dbo.TestUsuario tu_original ON ei_original.IdUsuario = tu_original.IdUsuario AND ei_original.Test = tu_original.Test
  -- Verificar que no existe ya
  LEFT JOIN dbo.TestUsuario tu_existe ON ei_correcto.IdUsuario = tu_existe.IdUsuario AND ei_correcto.Test = tu_existe.Test
  WHERE ei_correcto.Test = 2
    AND tu_original.IdTestUsuario IS NOT NULL  -- Que existan datos originales
    AND tu_existe.IdTestUsuario IS NULL;       -- Que no exista ya

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
    ei_correcto.IdUsuario,  -- IdUsuario correcto
    ei_correcto.Test,       -- Test=2
    rnd_original.ptjeTotalUsuario,
    rnd_original.ptjeDimensionTecnologia,
    rnd_original.ptjeDimensionComunicacion,
    rnd_original.ptjeDimensionOrganizacion,
    rnd_original.ptjeDimensionDatos,
    rnd_original.ptjeDimensionEstrategia,
    rnd_original.ptjeDimensionProcesos,
    rnd_original.IdNivelMadurez
  FROM dbo.EmpresaInfo ei_correcto
  INNER JOIN @EmpresasCorregidas ec ON ec.IdEmpresa = ei_correcto.IdEmpresa
  -- Obtener datos originales del ResultadoNivelDigital
  LEFT JOIN dbo.EmpresaInfo ei_original ON ei_original.IdEmpresa = ei_correcto.IdEmpresa AND ei_original.Test = 2
  LEFT JOIN dbo.ResultadoNivelDigital rnd_original ON ei_original.IdUsuario = rnd_original.IdUsuario AND ei_original.Test = rnd_original.Test
  -- Verificar que no existe ya
  LEFT JOIN dbo.ResultadoNivelDigital rnd_existe ON ei_correcto.IdUsuario = rnd_existe.IdUsuario AND ei_correcto.Test = rnd_existe.Test
  WHERE ei_correcto.Test = 2
    AND rnd_original.IdResultadoNivelDigital IS NOT NULL  -- Que existan datos originales
    AND rnd_existe.IdResultadoNivelDigital IS NULL;       -- Que no exista ya

  DECLARE @ResultadoInserted INT = @@ROWCOUNT;
  PRINT CONCAT('Se crearon ', @ResultadoInserted, ' registros en ResultadoNivelDigital.');

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
  PRINT 'CORRECCIÓN COMPLETA APLICADA CON ÉXITO.';
  PRINT 'Ahora recarga la página de rechequeos para ver los resultados.';
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK;
  DECLARE @msg nvarchar(4000) = ERROR_MESSAGE();
  RAISERROR(@msg, 16, 1);
END CATCH;

PRINT '=== CORRECCIÓN COMPLETA FINALIZADA ===';
