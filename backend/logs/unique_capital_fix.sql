
-- SQL Script to fix missing Capital (Asunción) records
-- This ensures all records with ASUNCIÓN as distrito have IdDepartamento = 20 (Capital)
-- Using a WITH clause to only update the latest records for each company

WITH LatestTests AS (
  SELECT 
    ei.IdEmpresa,
    MAX(tu.IdTestUsuario) AS MaxTestUsuarioId
  FROM EmpresaInfo ei
  JOIN TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  GROUP BY ei.IdEmpresa
),
RecordsToFix AS (
  SELECT 
    ei.IdEmpresaInfo
  FROM LatestTests lt
  JOIN TestUsuario tu ON lt.MaxTestUsuarioId = tu.IdTestUsuario
  JOIN EmpresaInfo ei ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
  JOIN SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
  WHERE sr.Nombre = 'ASUNCIÓN' AND (ei.IdDepartamento IS NULL OR ei.IdDepartamento = 0 OR ei.IdDepartamento <> 20)
)
UPDATE EmpresaInfo
SET IdDepartamento = 20
WHERE IdEmpresaInfo IN (SELECT IdEmpresaInfo FROM RecordsToFix);

-- Log correction information
PRINT 'Fixed Capital records for ' + CAST(@@ROWCOUNT AS VARCHAR) + ' unique companies';
    