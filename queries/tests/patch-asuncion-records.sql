-- ====================================================================
-- PATCH PARA CORREGIR REGISTROS PERDIDOS DE ASUNCIÓN
-- ====================================================================
-- 
-- PROBLEMA IDENTIFICADO:
-- - 51 registros tienen IdDepartamento = 20 (Capital) pero IdLocalidad = NULL
-- - Estos registros aparecen como "OTRO" en distrito en lugar de "ASUNCIÓN"
-- - Esto causa que Capital muestre solo 464 empresas en lugar de 515
--
-- SOLUCIÓN:
-- - Actualizar IdLocalidad de NULL a 244 (ASUNCIÓN) para estos registros
-- - Esto hará que aparezcan correctamente como Capital-ASUNCIÓN
--
-- IMPACTO:
-- - Registros que serán corregidos: 51
-- - Capital actual: 464 empresas
-- - Capital después del patch: 515 empresas
-- ====================================================================

USE [BID_stg_copy];
GO

PRINT 'Iniciando patch para corregir registros perdidos de ASUNCIÓN...';
PRINT '';

-- ====================================================================
-- PASO 1: ANÁLISIS PRE-PATCH
-- ====================================================================

PRINT 'PASO 1: Análisis de registros que serán afectados...';

DECLARE @RegistrosAfectados INT;
DECLARE @CapitalActual INT;
DECLARE @CapitalDespues INT;

-- Contar registros que serán corregidos
SELECT @RegistrosAfectados = COUNT(*)
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE tu.Finalizado = 1
  AND ei.IdLocalidad IS NULL
  AND (ei.IdDepartamento = 20 OR ei.IdDepartamento = 0 OR ei.IdDepartamento IS NULL);

-- Contar empresas actuales en Capital
SELECT @CapitalActual = COUNT(*)
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
INNER JOIN dbo.SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
WHERE tu.Finalizado = 1
  AND sr.IdRegion = 20;

SET @CapitalDespues = @CapitalActual + @RegistrosAfectados;

PRINT 'Registros que serán corregidos: ' + CAST(@RegistrosAfectados AS VARCHAR(10));
PRINT 'Capital actual: ' + CAST(@CapitalActual AS VARCHAR(10)) + ' empresas';
PRINT 'Capital después del patch: ' + CAST(@CapitalDespues AS VARCHAR(10)) + ' empresas';
PRINT '';

-- ====================================================================
-- PASO 2: MOSTRAR EJEMPLOS DE REGISTROS QUE SERÁN CORREGIDOS
-- ====================================================================

PRINT 'PASO 2: Ejemplos de registros que serán corregidos...';

SELECT TOP 5
    ei.IdEmpresaInfo,
    ei.IdUsuario,
    ei.IdEmpresa,
    ei.IdDepartamento,
    ei.IdLocalidad as 'IdLocalidad_Actual',
    e.Nombre as 'Empresa',
    u.NombreCompleto as 'Usuario',
    tu.FechaTest
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
INNER JOIN dbo.Empresa e ON ei.IdEmpresa = e.IdEmpresa
INNER JOIN dbo.Usuario u ON ei.IdUsuario = u.IdUsuario
WHERE tu.Finalizado = 1
  AND ei.IdLocalidad IS NULL
  AND (ei.IdDepartamento = 20 OR ei.IdDepartamento = 0 OR ei.IdDepartamento IS NULL)
ORDER BY tu.FechaTest DESC;

PRINT '';

-- ====================================================================
-- PASO 3: APLICAR LA CORRECCIÓN
-- ====================================================================

PRINT 'PASO 3: Aplicando corrección...';

BEGIN TRANSACTION;

-- Aplicar la corrección
UPDATE ei
SET IdLocalidad = 244  -- ASUNCIÓN
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE tu.Finalizado = 1
  AND ei.IdLocalidad IS NULL
  AND (ei.IdDepartamento = 20 OR ei.IdDepartamento = 0 OR ei.IdDepartamento IS NULL);

DECLARE @RegistrosActualizados INT = @@ROWCOUNT;

PRINT 'Registros actualizados: ' + CAST(@RegistrosActualizados AS VARCHAR(10));
PRINT '';

-- ====================================================================
-- PASO 4: VERIFICACIÓN POST-PATCH
-- ====================================================================

PRINT 'PASO 4: Verificación post-patch...';

-- Verificar que no queden registros con IdLocalidad NULL en Capital
DECLARE @RegistrosConProblema INT;

SELECT @RegistrosConProblema = COUNT(*)
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE tu.Finalizado = 1
  AND ei.IdLocalidad IS NULL
  AND (ei.IdDepartamento = 20 OR ei.IdDepartamento = 0 OR ei.IdDepartamento IS NULL);

-- Contar empresas en Capital después del patch
DECLARE @CapitalFinal INT;

SELECT @CapitalFinal = COUNT(*)
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

IF @RegistrosConProblema = 0 AND @CapitalFinal = @CapitalDespues
BEGIN
    PRINT '✅ PATCH COMPLETADO EXITOSAMENTE';
    PRINT '✅ Todos los registros de Capital ahora tienen IdLocalidad = 244 (ASUNCIÓN)';
    PRINT '✅ Capital ahora tiene ' + CAST(@CapitalFinal AS VARCHAR(10)) + ' empresas';
    
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
-- CONSULTA DE VERIFICACIÓN FINAL (OPCIONAL)
-- ====================================================================

PRINT '';
PRINT 'Consulta de verificación final:';
PRINT 'Capital (ASUNCIÓN) - Total empresas:';

SELECT COUNT(*) as 'Total_Empresas_Capital'
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
INNER JOIN dbo.SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
WHERE tu.Finalizado = 1
  AND sr.IdRegion = 20;

GO
