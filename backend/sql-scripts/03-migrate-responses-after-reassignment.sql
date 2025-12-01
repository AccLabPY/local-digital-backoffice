/* =========================================================
   SCRIPT 3: MIGRAR RESPUESTAS DESPUÉS DE REASIGNACIÓN
   
   - Migra Respuesta, SubRespuesta y ResultadoProcesoCalculoPreguntas
   - Sigue la lógica de los scripts 1 y 2
   - Se basa en los cambios ya realizados en EmpresaInfo
   - Solo procesa empresas YA normalizadas (Test=1 y Test=2 con mismo IdUsuario)
   
   Proceso:
   1. Identifica empresas normalizadas en EmpresaInfo
   2. Encuentra respuestas huérfanas (con IdUsuario diferente al canónico)
   3. Migra las respuestas al IdUsuario canónico con Test=2
   
   Compatible SQL Server 2014+
   ========================================================= */

USE [BID_stg_copy_copy];  -- << Cambiar según corresponda
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @DryRun BIT = 1;  -- 1 = SOLO PREVIEW, 0 = APLICAR MIGRACIÓN

PRINT '================================================================================'
PRINT 'SCRIPT 3: MIGRACIÓN DE RESPUESTAS POST-REASIGNACIÓN'
PRINT '================================================================================'
PRINT ''
PRINT CONCAT('Modo: ', CASE WHEN @DryRun = 1 THEN 'PREVIEW (DryRun)' ELSE 'APLICAR CAMBIOS' END)
PRINT ''

/* ---------------------------------------------------------
   1) Identificar usuarios canónicos por empresa
      (empresas ya normalizadas con Test=1 y Test=2)
   --------------------------------------------------------- */
IF OBJECT_ID('tempdb..#Canon') IS NOT NULL DROP TABLE #Canon;
CREATE TABLE #Canon (
  IdEmpresa       INT NOT NULL,
  CanonIdUsuario  INT NOT NULL,
  PRIMARY KEY (IdEmpresa, CanonIdUsuario)
);

INSERT INTO #Canon (IdEmpresa, CanonIdUsuario)
SELECT DISTINCT
  e1.IdEmpresa,
  e1.IdUsuario AS CanonIdUsuario
FROM dbo.EmpresaInfo e1
JOIN dbo.EmpresaInfo e2
  ON e2.IdEmpresa = e1.IdEmpresa
 AND e2.IdUsuario = e1.IdUsuario
 AND e2.Test      = 2
WHERE e1.Test = 1
  AND EXISTS (
    SELECT 1
    FROM dbo.TestUsuario tu
    WHERE tu.IdUsuario = e1.IdUsuario
      AND tu.Test = 1
      AND tu.Finalizado = 1
  );

PRINT '1. EMPRESAS NORMALIZADAS IDENTIFICADAS:'
PRINT '--------------------------------------------------------------------------------'
DECLARE @TotalEmpresasNormalizadas INT;
SELECT @TotalEmpresasNormalizadas = COUNT(*) FROM #Canon;
PRINT CONCAT('Total empresas con Test=1 y Test=2 (mismo usuario): ', @TotalEmpresasNormalizadas)
PRINT '(Estas empresas ya fueron normalizadas, ahora se verificarán sus respuestas)'
PRINT ''

/* ---------------------------------------------------------
   2) Identificar respuestas huérfanas que necesitan migración
   --------------------------------------------------------- */
IF OBJECT_ID('tempdb..#RespuestasAMigrar') IS NOT NULL DROP TABLE #RespuestasAMigrar;
CREATE TABLE #RespuestasAMigrar (
  IdEmpresa           INT NOT NULL,
  CanonIdUsuario      INT NOT NULL,
  IdUsuarioOriginal   INT NOT NULL,
  TestOriginal        INT NOT NULL,
  TotalRespuestas     INT NOT NULL,
  TotalSubRespuestas  INT NOT NULL,
  PRIMARY KEY (IdEmpresa, IdUsuarioOriginal, TestOriginal)
);

-- Identificar respuestas huérfanas
INSERT INTO #RespuestasAMigrar (IdEmpresa, CanonIdUsuario, IdUsuarioOriginal, TestOriginal, TotalRespuestas, TotalSubRespuestas)
SELECT 
  c.IdEmpresa,
  c.CanonIdUsuario,
  u.IdUsuario AS IdUsuarioOriginal,
  r.Test AS TestOriginal,
  COUNT(DISTINCT r.IdRespuesta) AS TotalRespuestas,
  ISNULL((
    SELECT COUNT(*)
    FROM dbo.SubRespuesta sr
    WHERE sr.IdUsuario = u.IdUsuario
      AND sr.Test = r.Test
  ), 0) AS TotalSubRespuestas
FROM #Canon c
JOIN dbo.Usuario u ON u.IdEmpresa = c.IdEmpresa
JOIN dbo.Respuesta r ON r.IdUsuario = u.IdUsuario
WHERE u.IdUsuario <> c.CanonIdUsuario  -- Respuestas de usuario NO canónico
  AND NOT EXISTS (  -- No existe ya una respuesta para el canónico en Test=2
    SELECT 1
    FROM dbo.Respuesta r2
    WHERE r2.IdUsuario = c.CanonIdUsuario
      AND r2.Test = 2
  )
GROUP BY c.IdEmpresa, c.CanonIdUsuario, u.IdUsuario, r.Test
HAVING COUNT(DISTINCT r.IdRespuesta) > 0;

PRINT '2. RESPUESTAS HUÉRFANAS IDENTIFICADAS:'
PRINT '--------------------------------------------------------------------------------'
SELECT 
  ram.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  ram.IdUsuarioOriginal,
  uo.NombreCompleto AS NombreUsuarioOriginal,
  ram.TestOriginal,
  ram.TotalRespuestas,
  ram.TotalSubRespuestas,
  ram.CanonIdUsuario AS MigrarA_IdUsuario,
  uc.NombreCompleto AS MigrarA_NombreUsuario,
  2 AS MigrarA_Test
FROM #RespuestasAMigrar ram
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ram.IdEmpresa
LEFT JOIN dbo.Usuario uo ON uo.IdUsuario = ram.IdUsuarioOriginal
LEFT JOIN dbo.Usuario uc ON uc.IdUsuario = ram.CanonIdUsuario
ORDER BY ram.IdEmpresa;

DECLARE @TotalRespuestasMigrar INT;
DECLARE @TotalSubRespuestasMigrar INT;
DECLARE @TotalEmpresasAfectadas INT;

SELECT 
  @TotalRespuestasMigrar = SUM(TotalRespuestas),
  @TotalSubRespuestasMigrar = SUM(TotalSubRespuestas),
  @TotalEmpresasAfectadas = COUNT(DISTINCT IdEmpresa)
FROM #RespuestasAMigrar;

PRINT ''
PRINT 'RESUMEN:'
PRINT CONCAT('  - Total empresas normalizadas (Test=1 + Test=2): ', @TotalEmpresasNormalizadas)
PRINT CONCAT('  - Empresas con respuestas huérfanas: ', ISNULL(@TotalEmpresasAfectadas, 0))
PRINT CONCAT('  - Respuestas a migrar: ', ISNULL(@TotalRespuestasMigrar, 0))
PRINT CONCAT('  - SubRespuestas a migrar: ', ISNULL(@TotalSubRespuestasMigrar, 0))
PRINT ''
PRINT 'NOTA: Es normal que haya menos empresas con respuestas huérfanas que empresas'
PRINT '      normalizadas. Esto significa que muchas empresas ya tenían sus respuestas'
PRINT '      correctamente asociadas.'
PRINT ''

IF @TotalEmpresasAfectadas = 0 OR @TotalRespuestasMigrar = 0
BEGIN
  PRINT '✓ No hay respuestas huérfanas para migrar.'
  PRINT 'Todas las respuestas están correctamente asociadas.'
  RETURN;
END

IF @DryRun = 1
BEGIN
  PRINT '================================================================================'
  PRINT 'PREVIEW TERMINADO - NO SE REALIZARON CAMBIOS'
  PRINT '================================================================================'
  PRINT ''
  PRINT 'Para aplicar los cambios:'
  PRINT '1. Cambia @DryRun = 0 en la línea 19'
  PRINT '2. Ejecuta el script nuevamente'
  PRINT ''
  PRINT 'Cambios que se aplicarán:'
  PRINT '- Actualizar tabla Respuesta'
  PRINT '- Actualizar tabla SubRespuesta'
  PRINT '- Actualizar tabla ResultadoProcesoCalculoPreguntas (si existe)'
  RETURN;
END

/* ---------------------------------------------------------
   3) APLICAR MIGRACIÓN TRANSACCIONAL
   --------------------------------------------------------- */
PRINT '================================================================================'
PRINT 'APLICANDO MIGRACIÓN DE RESPUESTAS...'
PRINT '================================================================================'
PRINT ''

BEGIN TRY
  BEGIN TRAN;

  -- Tablas para capturar cambios
  DECLARE @RespuestasMigradas TABLE (
    IdRespuesta        INT,
    IdEmpresa          INT,
    IdUsuario_Anterior INT,
    Test_Anterior      INT,
    IdUsuario_Nuevo    INT,
    Test_Nuevo         INT
  );

  DECLARE @SubRespuestasMigradas TABLE (
    IdSubRespuesta     INT,
    IdEmpresa          INT,
    IdUsuario_Anterior INT,
    Test_Anterior      INT,
    IdUsuario_Nuevo    INT,
    Test_Nuevo         INT
  );

  -- 3.1 Migrar Respuesta
  PRINT '1. Migrando tabla Respuesta...'
  
  UPDATE r
  SET r.IdUsuario = ram.CanonIdUsuario,
      r.Test = 2,
      r.IdEmpresa = ram.IdEmpresa  -- Asegurar IdEmpresa correcto
  OUTPUT 
    inserted.IdRespuesta,
    inserted.IdEmpresa,
    deleted.IdUsuario,
    deleted.Test,
    inserted.IdUsuario,
    inserted.Test
  INTO @RespuestasMigradas (IdRespuesta, IdEmpresa, IdUsuario_Anterior, Test_Anterior, IdUsuario_Nuevo, Test_Nuevo)
  FROM dbo.Respuesta r
  JOIN #RespuestasAMigrar ram 
    ON ram.IdUsuarioOriginal = r.IdUsuario
   AND ram.TestOriginal = r.Test
  JOIN dbo.Usuario u 
    ON u.IdUsuario = r.IdUsuario
   AND u.IdEmpresa = ram.IdEmpresa;

  DECLARE @RespuestasMigradasCount INT = @@ROWCOUNT;
  PRINT CONCAT('   ✓ ', @RespuestasMigradasCount, ' respuestas migradas')
  PRINT ''

  -- 3.2 Migrar SubRespuesta
  PRINT '2. Migrando tabla SubRespuesta...'
  
  UPDATE sr
  SET sr.IdUsuario = ram.CanonIdUsuario,
      sr.Test = 2,
      sr.IdEmpresa = ram.IdEmpresa  -- Asegurar IdEmpresa correcto
  OUTPUT 
    inserted.IdSubRespuesta,
    inserted.IdEmpresa,
    deleted.IdUsuario,
    deleted.Test,
    inserted.IdUsuario,
    inserted.Test
  INTO @SubRespuestasMigradas (IdSubRespuesta, IdEmpresa, IdUsuario_Anterior, Test_Anterior, IdUsuario_Nuevo, Test_Nuevo)
  FROM dbo.SubRespuesta sr
  JOIN #RespuestasAMigrar ram 
    ON ram.IdUsuarioOriginal = sr.IdUsuario
   AND ram.TestOriginal = sr.Test
  JOIN dbo.Usuario u 
    ON u.IdUsuario = sr.IdUsuario
   AND u.IdEmpresa = ram.IdEmpresa;

  DECLARE @SubRespuestasMigradasCount INT = @@ROWCOUNT;
  PRINT CONCAT('   ✓ ', @SubRespuestasMigradasCount, ' subrespuestas migradas')
  PRINT ''

  -- 3.3 Migrar ResultadoProcesoCalculoPreguntas (si existe)
  PRINT '3. Migrando tabla ResultadoProcesoCalculoPreguntas...'
  
  DECLARE @ResultadosMigradosCount INT = 0;
  
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'ResultadoProcesoCalculoPreguntas')
  BEGIN
    UPDATE rpp
    SET rpp.IdUsuario = ram.CanonIdUsuario,
        rpp.Test = 2
    FROM dbo.ResultadoProcesoCalculoPreguntas rpp
    JOIN #RespuestasAMigrar ram 
      ON ram.IdUsuarioOriginal = rpp.IdUsuario
     AND ram.TestOriginal = rpp.Test;

    SET @ResultadosMigradosCount = @@ROWCOUNT;
    PRINT CONCAT('   ✓ ', @ResultadosMigradosCount, ' resultados de proceso migrados')
  END
  ELSE
  BEGIN
    PRINT '   ⚠ Tabla ResultadoProcesoCalculoPreguntas no existe, se omite'
  END
  PRINT ''

  -- 3.4 Verificación final
  PRINT '================================================================================'
  PRINT 'VERIFICACIÓN FINAL'
  PRINT '================================================================================'
  PRINT ''
  
  PRINT 'Respuestas migradas por empresa:'
  SELECT 
    rm.IdEmpresa,
    e.Nombre AS NombreEmpresa,
    COUNT(DISTINCT rm.IdRespuesta) AS TotalRespuestas,
    rm.IdUsuario_Nuevo,
    u.NombreCompleto AS NombreUsuario,
    rm.Test_Nuevo
  FROM @RespuestasMigradas rm
  LEFT JOIN dbo.Empresa e ON e.IdEmpresa = rm.IdEmpresa
  LEFT JOIN dbo.Usuario u ON u.IdUsuario = rm.IdUsuario_Nuevo
  GROUP BY rm.IdEmpresa, e.Nombre, rm.IdUsuario_Nuevo, u.NombreCompleto, rm.Test_Nuevo
  ORDER BY rm.IdEmpresa;

  PRINT ''
  PRINT 'Validando integridad...'
  
  -- Verificar que no quedaron respuestas huérfanas
  DECLARE @RespuestasHuerfanas INT;
  SELECT @RespuestasHuerfanas = COUNT(*)
  FROM dbo.Respuesta r
  JOIN dbo.Usuario u ON u.IdUsuario = r.IdUsuario
  JOIN #Canon c ON c.IdEmpresa = u.IdEmpresa
  WHERE r.IdUsuario <> c.CanonIdUsuario
    AND r.Test = 1;

  IF @RespuestasHuerfanas > 0
  BEGIN
    PRINT CONCAT('⚠ ADVERTENCIA: Aún quedan ', @RespuestasHuerfanas, ' respuestas huérfanas')
    PRINT '  Revisa manualmente estos casos'
  END
  ELSE
  BEGIN
    PRINT '✓ No quedan respuestas huérfanas'
  END

  COMMIT;
  
  PRINT ''
  PRINT '================================================================================'
  PRINT 'MIGRACIÓN COMPLETADA CON ÉXITO'
  PRINT '================================================================================'
  PRINT ''
  PRINT 'Resumen:'
  PRINT CONCAT('  - Total empresas normalizadas: ', @TotalEmpresasNormalizadas)
  PRINT CONCAT('  - Empresas con respuestas migradas: ', @TotalEmpresasAfectadas)
  PRINT CONCAT('  - Respuestas migradas: ', @RespuestasMigradasCount)
  PRINT CONCAT('  - SubRespuestas migradas: ', @SubRespuestasMigradasCount)
  PRINT CONCAT('  - ResultadosProcesoCalculo migrados: ', @ResultadosMigradosCount)
  
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK;
  
  DECLARE @ErrorMsg NVARCHAR(4000) = ERROR_MESSAGE();
  DECLARE @ErrorLine INT = ERROR_LINE();
  
  PRINT ''
  PRINT '================================================================================'
  PRINT 'ERROR AL APLICAR MIGRACIÓN'
  PRINT '================================================================================'
  PRINT CONCAT('Error en línea ', @ErrorLine, ': ', @ErrorMsg)
  PRINT ''
  PRINT 'No se realizaron cambios (ROLLBACK aplicado)'
  
  RAISERROR(@ErrorMsg, 16, 1);
END CATCH;

-- Cleanup
IF OBJECT_ID('tempdb..#Canon') IS NOT NULL DROP TABLE #Canon;
IF OBJECT_ID('tempdb..#RespuestasAMigrar') IS NOT NULL DROP TABLE #RespuestasAMigrar;

