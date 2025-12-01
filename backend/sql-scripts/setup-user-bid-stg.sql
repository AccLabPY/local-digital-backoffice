-- =============================================
-- Script: Configurar Usuario ChequeoApp para BID_stg_copy
-- Descripción: Crea login y usuario para la aplicación Chequeo Digital 2.0
-- Base de datos: BID_stg_copy
-- =============================================

-- IMPORTANTE: Ejecutar este script como administrador de SQL Server

-- 1. Verificar si el login existe a nivel de servidor
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'ChequeoApp')
BEGIN
    PRINT 'Creando login ChequeoApp a nivel de servidor...';
    CREATE LOGIN [ChequeoApp] WITH PASSWORD = 'AppPassword123!', 
        DEFAULT_DATABASE = [BID_stg_copy],
        CHECK_EXPIRATION = OFF,
        CHECK_POLICY = OFF;
    PRINT 'Login ChequeoApp creado exitosamente.';
END
ELSE
BEGIN
    PRINT 'El login ChequeoApp ya existe a nivel de servidor.';
END
GO

-- 2. Usar la base de datos BID_stg_copy
USE [BID_stg_copy];
GO

-- 3. Verificar si el usuario existe en la base de datos
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'ChequeoApp')
BEGIN
    PRINT 'El usuario ChequeoApp ya existe en BID_stg_copy. Eliminándolo para recrearlo...';
    DROP USER [ChequeoApp];
END
GO

-- 4. Crear usuario en la base de datos BID_stg_copy
PRINT 'Creando usuario ChequeoApp en BID_stg_copy...';
CREATE USER [ChequeoApp] FOR LOGIN [ChequeoApp];
PRINT 'Usuario ChequeoApp creado en BID_stg_copy.';
GO

-- 5. Otorgar permisos necesarios
PRINT 'Otorgando permisos al usuario ChequeoApp...';

-- Permisos de lectura y escritura
ALTER ROLE db_datareader ADD MEMBER [ChequeoApp];
ALTER ROLE db_datawriter ADD MEMBER [ChequeoApp];

-- Permisos para ejecutar procedimientos almacenados
GRANT EXECUTE ON SCHEMA::dbo TO [ChequeoApp];

-- Permisos adicionales si es necesario (descomentar si necesitas más permisos)
-- ALTER ROLE db_owner ADD MEMBER [ChequeoApp];  -- Solo si necesitas permisos completos

PRINT 'Permisos otorgados correctamente.';
GO

-- 6. Verificar configuración
PRINT '';
PRINT '=== VERIFICACIÓN DE CONFIGURACIÓN ===';

SELECT 
    'Login a nivel de servidor' as Tipo,
    name as Nombre,
    CASE WHEN is_disabled = 1 THEN 'Deshabilitado' ELSE 'Habilitado' END as Estado,
    create_date as FechaCreacion
FROM sys.server_principals 
WHERE name = 'ChequeoApp';

SELECT 
    'Usuario en BID_stg_copy' as Tipo,
    name as Nombre,
    type_desc as TipoUsuario,
    default_schema_name as SchemaDefault,
    create_date as FechaCreacion
FROM sys.database_principals 
WHERE name = 'ChequeoApp';

-- Verificar roles asignados
SELECT 
    'Roles asignados' as Tipo,
    r.name as Rol,
    m.name as Usuario
FROM sys.database_role_members rm
INNER JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
INNER JOIN sys.database_principals m ON rm.member_principal_id = m.principal_id
WHERE m.name = 'ChequeoApp';

PRINT '';
PRINT '=== CONFIGURACIÓN COMPLETADA ===';
PRINT 'Usuario: ChequeoApp';
PRINT 'Contraseña: AppPassword123!';
PRINT 'Base de datos: BID_stg_copy';
PRINT '';
PRINT 'NOTA: Si cambiaste la contraseña, actualiza el archivo .env con la nueva contraseña.';
GO

