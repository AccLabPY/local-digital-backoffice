-- ================================================================
-- Script: Actualizar Passwords de Usuarios Existentes
-- Proyecto: Chequeo Digital
-- Descripción: Actualiza las contraseñas de todos los usuarios a password123 (hash correcto)
-- ================================================================

-- Cambiar ChequeoDigital por tu nombre de base de datos si es diferente
USE BID_stg_copy;
GO

PRINT '================================================================';
PRINT 'ACTUALIZANDO PASSWORDS DE USUARIOS';
PRINT '================================================================';
PRINT '';

-- Hash correcto para password123
-- Generado con: bcrypt.hash('password123', 10)
DECLARE @passwordHash NVARCHAR(255) = '$2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy';

-- Actualizar todos los usuarios
UPDATE UsuariosSistema
SET 
    PasswordHash = @passwordHash,
    FechaActualizacion = SYSUTCDATETIME()
WHERE Email IN (
    'saquino@mic.gov.py',
    'cdparra@gmail.com',
    'patricia.lima@gmail.com',
    'victor.cantero@gmail.com',
    'lucas.frutos@gmail.com'
);

DECLARE @updatedCount INT;
SELECT @updatedCount = @@ROWCOUNT;

PRINT 'Passwords actualizados: ' + CAST(@updatedCount AS NVARCHAR(10));
PRINT '';
PRINT 'Usuarios actualizados:';
PRINT '  - saquino@mic.gov.py';
PRINT '  - cdparra@gmail.com';
PRINT '  - patricia.lima@gmail.com';
PRINT '  - victor.cantero@gmail.com';
PRINT '  - lucas.frutos@gmail.com';
PRINT '';
PRINT 'Password para todos: password123';
PRINT '';
PRINT '================================================================';
PRINT 'ACTUALIZACIÓN COMPLETADA';
PRINT '================================================================';

GO

