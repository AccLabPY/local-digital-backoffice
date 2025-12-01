
-- SQL Script to fix departamento issues
-- 1. Set IdDepartamento = 20 for all records with Asunción as distrito
-- 2. Fix NULL departamento records based on their region

-- Fix ASUNCIÓN records
UPDATE ei
SET IdDepartamento = 20
FROM EmpresaInfo ei
JOIN SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
WHERE sr.Nombre = 'ASUNCIÓN' AND (ei.IdDepartamento IS NULL OR ei.IdDepartamento = 0 OR ei.IdDepartamento <> 20);

-- Log correction information
PRINT 'Fixed ' + CAST(@@ROWCOUNT AS VARCHAR) + ' records with ASUNCIÓN distrito';

-- Fix NULL departamento records based on region mapping
UPDATE ei
SET IdDepartamento = sr.IdRegion
FROM EmpresaInfo ei
JOIN SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
WHERE (ei.IdDepartamento IS NULL OR ei.IdDepartamento = 0) AND sr.IdRegion IS NOT NULL;

-- Log correction information
PRINT 'Fixed ' + CAST(@@ROWCOUNT AS VARCHAR) + ' NULL departamento records using region mapping';
    