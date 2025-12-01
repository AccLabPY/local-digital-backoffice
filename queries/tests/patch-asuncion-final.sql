-- ====================================================================
-- PATCH FINAL PARA CORREGIR REGISTROS PERDIDOS DE ASUNCIÓN
-- ====================================================================
-- 
-- PROBLEMA IDENTIFICADO:
-- - 49 empresas tienen IdDepartamento = 20 (Capital) pero IdLocalidad = NULL
-- - Capital muestra solo 56 empresas en lugar de 105 (104 esperadas + 1 de más)
-- - Estas empresas aparecen como "OTRO" en distrito en lugar de "ASUNCIÓN"
--
-- SOLUCIÓN:
-- - Actualizar IdLocalidad de NULL a 244 (ASUNCIÓN) para estas 49 empresas
-- - Esto hará que Capital tenga 105 empresas (muy cerca del objetivo de 104)
--
-- IMPACTO:
-- - Registros que serán corregidos: 49 empresas
-- - Capital actual: 56 empresas
-- - Capital después del patch: 105 empresas
-- ====================================================================

USE [BID_stg_copy];
GO

PRINT 'Iniciando patch final para corregir registros perdidos de ASUNCIÓN...';
PRINT '';

-- ====================================================================
-- PASO 1: ANÁLISIS PRE-PATCH
-- ====================================================================

PRINT 'PASO 1: Análisis de registros que serán afectados...';

DECLARE @RegistrosAfectados INT;
DECLARE @CapitalActual INT;
DECLARE @CapitalDespues INT;

-- Contar registros que serán corregidos
SELECT @RegistrosAfectados = COUNT(DISTINCT ei.IdEmpresa)
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE tu.Finalizado = 1
  AND ei.IdLocalidad IS NULL
  AND ei.IdDepartamento = 20;

-- Contar empresas actuales en Capital
SELECT @CapitalActual = COUNT(DISTINCT ei.IdEmpresa)
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
INNER JOIN dbo.SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
WHERE tu.Finalizado = 1
  AND sr.IdRegion = 20;

SET @CapitalDespues = @CapitalActual + @RegistrosAfectados;

PRINT 'Registros que serán corregidos: ' + CAST(@RegistrosAfectados AS VARCHAR(10));
PRINT 'Capital actual: ' + CAST(@CapitalActual AS VARCHAR(10)) + ' empresas';
PRINT 'Capital después del patch: ' + CAST(@CapitalDespues AS VARCHAR(10)) + ' empresas';
PRINT 'Capital esperado: 104 empresas';
PRINT 'Diferencia: ' + CAST(@CapitalDespues - 104 AS VARCHAR(10)) + ' empresas';
PRINT '';

-- ====================================================================
-- PASO 2: MOSTRAR EJEMPLOS DE REGISTROS QUE SERÁN CORREGIDOS
-- ====================================================================

PRINT 'PASO 2: Ejemplos de registros que serán corregidos...';

SELECT TOP 5
    ei.IdEmpresa,
    e.Nombre as 'Empresa',
    u.NombreCompleto as 'Usuario',
    ei.IdDepartamento,
    ei.IdLocalidad as 'IdLocalidad_Actual',
    tu.FechaTest
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
INNER JOIN dbo.Empresa e ON ei.IdEmpresa = e.IdEmpresa
INNER JOIN dbo.Usuario u ON ei.IdUsuario = u.IdUsuario
WHERE tu.Finalizado = 1
  AND ei.IdLocalidad IS NULL
  AND ei.IdDepartamento = 20
ORDER BY ei.IdEmpresa;

PRINT '';

-- ====================================================================
-- PASO 3: APLICAR LA CORRECCIÓN
-- ====================================================================

PRINT 'PASO 3: Aplicando corrección...';

BEGIN TRANSACTION;

-- Aplicar la corrección solo para IdDepartamento = 20
UPDATE ei
SET IdLocalidad = 244  -- ASUNCIÓN
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE tu.Finalizado = 1
  AND ei.IdLocalidad IS NULL
  AND ei.IdDepartamento = 20;

DECLARE @RegistrosActualizados INT = @@ROWCOUNT;

PRINT 'Registros actualizados: ' + CAST(@RegistrosActualizados AS VARCHAR(10));
PRINT '';

-- ====================================================================
-- PASO 4: VERIFICACIÓN POST-PATCH
-- ====================================================================

PRINT 'PASO 4: Verificación post-patch...';

-- Verificar que no queden registros con IdLocalidad NULL en Capital
DECLARE @RegistrosConProblema INT;

SELECT @RegistrosConProblema = COUNT(DISTINCT ei.IdEmpresa)
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE tu.Finalizado = 1
  AND ei.IdLocalidad IS NULL
  AND ei.IdDepartamento = 20;

-- Contar empresas en Capital después del patch
DECLARE @CapitalFinal INT;

SELECT @CapitalFinal = COUNT(DISTINCT ei.IdEmpresa)
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
INNER JOIN dbo.SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
WHERE tu.Finalizado = 1
  AND sr.IdRegion = 20;

PRINT 'Registros con problema restantes: ' + CAST(@RegistrosConProblema AS VARCHAR(10));
PRINT 'Capital final: ' + CAST(@CapitalFinal AS VARCHAR(10)) + ' empresas';
PRINT '';

-- ====================================================================
-- PASO 5: CONFIRMACIÓN FINAL
-- ====================================================================

IF @RegistrosConProblema = 0
BEGIN
    PRINT '✅ PATCH COMPLETADO EXITOSAMENTE';
    PRINT '✅ Todos los registros de Capital con IdDepartamento=20 ahora tienen IdLocalidad = 244 (ASUNCIÓN)';
    PRINT '✅ Capital ahora tiene ' + CAST(@CapitalFinal AS VARCHAR(10)) + ' empresas';
    PRINT '✅ Diferencia con el objetivo (104): ' + CAST(@CapitalFinal - 104 AS VARCHAR(10)) + ' empresas';
    
    -- Confirmar la transacción
    COMMIT TRANSACTION;
    PRINT '✅ Cambios confirmados en la base de datos';
END
ELSE
BEGIN
    PRINT '❌ ERROR EN LA VERIFICACIÓN';
    PRINT '❌ Revertiendo cambios...';
    
    -- Revertir la transacción
    ROLLBACK TRANSACTION;
    PRINT '❌ Cambios revertidos';
END

PRINT '';
PRINT 'Patch finalizado.';

-- ====================================================================
-- CONSULTA DE VERIFICACIÓN FINAL
-- ====================================================================

PRINT '';
PRINT 'Consulta de verificación final:';
PRINT 'Capital (ASUNCIÓN) - Total empresas:';

SELECT COUNT(DISTINCT ei.IdEmpresa) as 'Total_Empresas_Capital'
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
INNER JOIN dbo.SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
WHERE tu.Finalizado = 1
  AND sr.IdRegion = 20;

GO
