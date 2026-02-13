-- Script para crear el usuario ChequeoApp en la base de datos BID_v2_22122025
-- Ejecutar este script como administrador de SQL Server

USE [BID_v2_22122025];
GO

-- Verificar si el usuario ya existe
IF EXISTS (SELECT * FROM sys.database_principals WHERE name = 'ChequeoApp')
BEGIN
    PRINT 'El usuario ChequeoApp ya existe en BID_v2_22122025';
    -- Eliminar el usuario existente si quieres recrearlo
    -- DROP USER [ChequeoApp];
END
GO

-- Crear el usuario ChequeoApp en la base de datos BID_v2_22122025
-- Nota: El login debe existir primero a nivel de servidor
-- Si el login no existe, ejecuta primero:
-- CREATE LOGIN [ChequeoApp] WITH PASSWORD = 'AppPassword123!', DEFAULT_DATABASE = [BID_v2_22122025];

-- Crear el usuario en la base de datos
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'ChequeoApp')
BEGIN
    CREATE USER [ChequeoApp] FOR LOGIN [ChequeoApp];
    PRINT 'Usuario ChequeoApp creado en BID_v2_22122025';
END
GO

-- Otorgar permisos necesarios
-- Permisos de lectura y escritura en todas las tablas
ALTER ROLE db_datareader ADD MEMBER [ChequeoApp];
ALTER ROLE db_datawriter ADD MEMBER [ChequeoApp];

-- Permisos adicionales para ejecutar procedimientos almacenados
GRANT EXECUTE ON SCHEMA::dbo TO [ChequeoApp];

-- Verificar que el usuario fue creado correctamente
SELECT 
    name AS Usuario,
    type_desc AS Tipo,
    default_schema_name AS SchemaDefault
FROM sys.database_principals 
WHERE name = 'ChequeoApp';
GO

PRINT 'Configuración completada. Usuario ChequeoApp creado con permisos necesarios.';
GO

