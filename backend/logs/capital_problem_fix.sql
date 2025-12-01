
-- SQL Script to fix missing Capital (Asunción) records
-- This corrects records where the distrito is ASUNCIÓN but departamento is wrong or NULL

-- Update records where distrito is ASUNCIÓN but IdDepartamento is not 20
UPDATE EmpresaInfo
SET IdDepartamento = 20
WHERE IdLocalidad IN (
    SELECT IdSubRegion FROM SubRegion WHERE Nombre = 'ASUNCIÓN'
)
AND (IdDepartamento IS NULL OR IdDepartamento = 0 OR IdDepartamento <> 20);

-- Log correction information
PRINT 'Fixed ' + CAST(@@ROWCOUNT AS VARCHAR) + ' records with ASUNCIÓN distrito but incorrect departamento';
    