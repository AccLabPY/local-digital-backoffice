-- =========================================================
-- DIAGNÓSTICO: Verificar detección de empresas con rechequeos
-- después del fix de normalización
-- =========================================================

USE [BID_stg_copy];  -- << Cambiar si corresponde
GO

-- 1) Verificar empresas que deberían tener múltiples Tests después del fix
PRINT '=== EMPRESAS CORREGIDAS CON MÚLTIPLES TESTS ===';
WITH EmpresasCorregidas AS (
  -- Empresas que fueron afectadas por el fix
  SELECT DISTINCT IdEmpresa FROM (
    VALUES 
    (144), (1149), (1166), (1168), (1183), (1184), (1186), (1221), (1376), (1385),
    (1389), (1392), (1395), (1399), (1409), (1418), (1422), (1423), (1429), (1432),
    (1435), (1439), (1440), (1441), (1445), (1508), (1535), (1594), (1617), (1640),
    (2756), (2788), (2790), (2841), (4988), (5013), (5133), (5399), (5412)
  ) AS t(IdEmpresa)
),
TestsPorEmpresa AS (
  SELECT 
    ei.IdEmpresa,
    COUNT(DISTINCT ei.Test) AS TotalTests,
    STRING_AGG(CAST(ei.Test AS VARCHAR), ', ') AS TestsDisponibles,
    COUNT(*) AS TotalFilasEmpresaInfo
  FROM dbo.EmpresaInfo ei
  INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  WHERE ei.IdEmpresa IN (SELECT IdEmpresa FROM EmpresasCorregidas)
    AND tu.Finalizado = 1
  GROUP BY ei.IdEmpresa
)
SELECT 
  ec.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  tpe.TotalTests,
  tpe.TestsDisponibles,
  tpe.TotalFilasEmpresaInfo,
  CASE 
    WHEN tpe.TotalTests >= 2 THEN '✅ DEBERÍA APARECER EN RECHEQUEOS'
    ELSE '❌ NO DEBERÍA APARECER'
  END AS EstadoDeteccion
FROM EmpresasCorregidas ec
LEFT JOIN TestsPorEmpresa tpe ON ec.IdEmpresa = tpe.IdEmpresa
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = ec.IdEmpresa
ORDER BY ec.IdEmpresa;

-- 2) Simular la lógica exacta del sistema de rechequeos
PRINT '=== SIMULACIÓN DE LÓGICA DE RECHEQUEOS ===';
WITH seq AS (
  SELECT 
    ei.IdEmpresa,
    ei.IdUsuario,
    ei.Test,
    tu.IdTestUsuario,
    tu.FechaTest AS FechaChequeo,
    rnd.ptjeTotalUsuario AS PuntajeGlobal,
    nm.Descripcion AS NivelMadurez,
    -- Tomar el más reciente por (IdEmpresa, Test)
    ROW_NUMBER() OVER (PARTITION BY ei.IdEmpresa, ei.Test ORDER BY tu.FechaTerminoTest DESC, ei.IdEmpresaInfo DESC) AS rn
  FROM dbo.EmpresaInfo ei WITH (NOLOCK)
  INNER JOIN dbo.TestUsuario tu WITH (NOLOCK) ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
  LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
  WHERE tu.Finalizado = 1
),
base AS (
  SELECT * FROM seq WHERE rn = 1
),
seq_with_numbers AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY IdEmpresa ORDER BY FechaChequeo, IdTestUsuario) AS rn_asc,
    ROW_NUMBER() OVER (PARTITION BY IdEmpresa ORDER BY FechaChequeo DESC, IdTestUsuario DESC) AS rn_desc,
    COUNT(*) OVER (PARTITION BY IdEmpresa) AS n_cheq
  FROM base
),
two_plus AS (
  SELECT IdEmpresa FROM seq_with_numbers GROUP BY IdEmpresa HAVING COUNT(*) >= 2
)
SELECT 
  COUNT(*) AS TotalEmpresasConRechequeos,
  'Empresas detectadas por el sistema de rechequeos' AS Descripcion
FROM two_plus;

-- 3) Verificar casos específicos de empresas corregidas
PRINT '=== CASOS ESPECÍFICOS DE EMPRESAS CORREGIDAS ===';
WITH seq AS (
  SELECT 
    ei.IdEmpresa,
    ei.IdUsuario,
    ei.Test,
    tu.IdTestUsuario,
    tu.FechaTest AS FechaChequeo,
    tu.FechaTerminoTest,
    rnd.ptjeTotalUsuario AS PuntajeGlobal,
    nm.Descripcion AS NivelMadurez,
    ROW_NUMBER() OVER (PARTITION BY ei.IdEmpresa, ei.Test ORDER BY tu.FechaTerminoTest DESC, ei.IdEmpresaInfo DESC) AS rn
  FROM dbo.EmpresaInfo ei WITH (NOLOCK)
  INNER JOIN dbo.TestUsuario tu WITH (NOLOCK) ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
  LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
  WHERE tu.Finalizado = 1
    AND ei.IdEmpresa IN (144, 1149, 1166, 1168, 1183) -- Primeras 5 empresas corregidas
),
base AS (
  SELECT * FROM seq WHERE rn = 1
),
empresa_stats AS (
  SELECT 
    IdEmpresa,
    COUNT(*) AS TestsEnBase,
    STRING_AGG(CAST(Test AS VARCHAR), ', ') AS TestsDisponibles,
    MIN(FechaChequeo) AS PrimeraFecha,
    MAX(FechaChequeo) AS UltimaFecha
  FROM base
  GROUP BY IdEmpresa
)
SELECT 
  es.IdEmpresa,
  e.Nombre AS NombreEmpresa,
  es.TestsEnBase,
  es.TestsDisponibles,
  es.PrimeraFecha,
  es.UltimaFecha,
  CASE 
    WHEN es.TestsEnBase >= 2 THEN '✅ DETECTADA'
    ELSE '❌ NO DETECTADA'
  END AS Estado
FROM empresa_stats es
LEFT JOIN dbo.Empresa e ON e.IdEmpresa = es.IdEmpresa
ORDER BY es.IdEmpresa;

-- 4) Verificar si hay problemas con TestUsuario
PRINT '=== VERIFICACIÓN DE TestUsuario ===';
SELECT 
  ei.IdEmpresa,
  ei.Test,
  ei.IdUsuario,
  tu.IdTestUsuario,
  tu.FechaTest,
  tu.FechaTerminoTest,
  tu.Finalizado,
  CASE 
    WHEN tu.IdUsuario IS NULL THEN '❌ NO EXISTE EN TestUsuario'
    WHEN tu.Finalizado = 0 THEN '⚠️ NO FINALIZADO'
    ELSE '✅ OK'
  END AS EstadoTestUsuario
FROM dbo.EmpresaInfo ei
LEFT JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE ei.IdEmpresa IN (144, 1149, 1166, 1168, 1183)
ORDER BY ei.IdEmpresa, ei.Test;

PRINT '=== DIAGNÓSTICO COMPLETADO ===';
