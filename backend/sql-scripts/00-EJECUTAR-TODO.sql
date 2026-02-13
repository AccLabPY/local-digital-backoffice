-- ================================================================
-- SCRIPT COMPLETO - Ejecutar TODO de una vez
-- Base de datos: BID_v2_22122025
-- ================================================================

USE BID_v2_22122025;
GO

PRINT '';
PRINT '================================================================';
PRINT 'INICIO DE INSTALACIÓN COMPLETA';
PRINT 'Sistema de Autenticación y Autorización RBAC';
PRINT '================================================================';
PRINT '';

-- ================================================================
-- PASO 1: CREAR TABLAS
-- ================================================================

PRINT '>>> PASO 1: Creando tablas...';
PRINT '';

-- RolesSistema
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RolesSistema')
BEGIN
    CREATE TABLE RolesSistema (
        IdRol INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(50) NOT NULL UNIQUE,
        Descripcion NVARCHAR(255) NULL,
        FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_RolesSistema_Nombre CHECK (Nombre IN ('superadmin', 'contributor', 'viewer'))
    );
    CREATE INDEX IX_RolesSistema_Nombre ON RolesSistema(Nombre);
    PRINT '  ✓ Tabla RolesSistema creada';
END
ELSE
BEGIN
    PRINT '  - RolesSistema ya existe';
END

-- UsuariosSistema
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UsuariosSistema')
BEGIN
    CREATE TABLE UsuariosSistema (
        IdUsuarioSistema INT IDENTITY(1,1) PRIMARY KEY,
        Email NVARCHAR(255) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        Nombre NVARCHAR(100) NOT NULL,
        Apellido NVARCHAR(100) NOT NULL,
        Organizacion NVARCHAR(200) NULL,
        Telefono NVARCHAR(50) NULL,
        RoleId INT NOT NULL,
        Activo BIT NOT NULL DEFAULT 1,
        FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        FechaActualizacion DATETIME2 NULL,
        CONSTRAINT FK_UsuariosSistema_RoleId FOREIGN KEY (RoleId) REFERENCES RolesSistema(IdRol)
    );
    CREATE INDEX IX_UsuariosSistema_Email ON UsuariosSistema(Email);
    CREATE INDEX IX_UsuariosSistema_RoleId ON UsuariosSistema(RoleId);
    CREATE INDEX IX_UsuariosSistema_Activo ON UsuariosSistema(Activo);
    PRINT '  ✓ Tabla UsuariosSistema creada';
END
ELSE
BEGIN
    PRINT '  - UsuariosSistema ya existe';
END

-- Resources
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Resources')
BEGIN
    CREATE TABLE Resources (
        IdRecurso INT IDENTITY(1,1) PRIMARY KEY,
        Codigo NVARCHAR(150) NOT NULL UNIQUE,
        Descripcion NVARCHAR(255) NOT NULL,
        Categoria NVARCHAR(100) NULL,
        FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_Resources_Codigo CHECK (Codigo <> '')
    );
    CREATE UNIQUE INDEX IX_Resources_Codigo ON Resources(Codigo);
    CREATE INDEX IX_Resources_Categoria ON Resources(Categoria);
    PRINT '  ✓ Tabla Resources creada';
END
ELSE
BEGIN
    PRINT '  - Resources ya existe';
END

-- RoleResourcePermissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RoleResourcePermissions')
BEGIN
    CREATE TABLE RoleResourcePermissions (
        IdRol INT NOT NULL,
        IdRecurso INT NOT NULL,
        CanView BIT NOT NULL DEFAULT 0,
        CanCreate BIT NOT NULL DEFAULT 0,
        CanEdit BIT NOT NULL DEFAULT 0,
        CanDelete BIT NOT NULL DEFAULT 0,
        FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        FechaActualizacion DATETIME2 NULL,
        CONSTRAINT PK_RoleResourcePermissions PRIMARY KEY (IdRol, IdRecurso),
        CONSTRAINT FK_RoleResourcePermissions_RoleId FOREIGN KEY (IdRol) REFERENCES RolesSistema(IdRol) ON DELETE CASCADE,
        CONSTRAINT FK_RoleResourcePermissions_RecursoId FOREIGN KEY (IdRecurso) REFERENCES Resources(IdRecurso) ON DELETE CASCADE
    );
    CREATE INDEX IX_RoleResourcePermissions_IdRol ON RoleResourcePermissions(IdRol);
    CREATE INDEX IX_RoleResourcePermissions_IdRecurso ON RoleResourcePermissions(IdRecurso);
    PRINT '  ✓ Tabla RoleResourcePermissions creada';
END
ELSE
BEGIN
    PRINT '  - RoleResourcePermissions ya existe';
END

-- TokensRevocados
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TokensRevocados')
BEGIN
    CREATE TABLE TokensRevocados (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Token NVARCHAR(MAX) NOT NULL,
        FechaRevocacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        FechaExpiracion DATETIME2 NOT NULL
    );
    CREATE INDEX IX_TokensRevocados_FechaExpiracion ON TokensRevocados(FechaExpiracion);
    PRINT '  ✓ Tabla TokensRevocados creada';
END
ELSE
BEGIN
    PRINT '  - TokensRevocados ya existe';
END

GO

-- ================================================================
-- PASO 2: SEED DATOS
-- ================================================================

PRINT '';
PRINT '>>> PASO 2: Insertando datos iniciales...';
PRINT '';

-- Roles
IF NOT EXISTS (SELECT 1 FROM RolesSistema WHERE Nombre = 'superadmin')
    INSERT INTO RolesSistema (Nombre, Descripcion) VALUES ('superadmin', 'Control total del sistema');

IF NOT EXISTS (SELECT 1 FROM RolesSistema WHERE Nombre = 'contributor')
    INSERT INTO RolesSistema (Nombre, Descripcion) VALUES ('contributor', 'Acceso operativo a empresas y rechequeos');

IF NOT EXISTS (SELECT 1 FROM RolesSistema WHERE Nombre = 'viewer')
    INSERT INTO RolesSistema (Nombre, Descripcion) VALUES ('viewer', 'Solo visualización del Dashboard Looker');

PRINT '  ✓ Roles configurados';

-- Usuarios con password: password123
DECLARE @superadminRoleId INT, @contributorRoleId INT, @viewerRoleId INT;
DECLARE @passwordHash NVARCHAR(255) = '$2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy';

SELECT @superadminRoleId = IdRol FROM RolesSistema WHERE Nombre = 'superadmin';
SELECT @contributorRoleId = IdRol FROM RolesSistema WHERE Nombre = 'contributor';
SELECT @viewerRoleId = IdRol FROM RolesSistema WHERE Nombre = 'viewer';

-- Insertar o actualizar usuarios
MERGE UsuariosSistema AS target
USING (VALUES 
    ('saquino@mic.gov.py', @passwordHash, 'Santiago', 'Aquino', 'MIC', '091829191', @superadminRoleId),
    ('cdparra@gmail.com', @passwordHash, 'Christian', 'Parra', 'PNUD', '091829191', @superadminRoleId),
    ('patricia.lima@gmail.com', @passwordHash, 'Patricia', 'Lima', 'PNUD', '091829191', @superadminRoleId),
    ('victor.cantero@gmail.com', @passwordHash, 'Victor', 'Cantero', 'MIC', '091829191', @contributorRoleId),
    ('lucas.frutos@gmail.com', @passwordHash, 'Lucas', 'Frutos', 'MIC', '091829191', @viewerRoleId)
) AS source (Email, PasswordHash, Nombre, Apellido, Organizacion, Telefono, RoleId)
ON target.Email = source.Email
WHEN MATCHED THEN
    UPDATE SET PasswordHash = source.PasswordHash, FechaActualizacion = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT (Email, PasswordHash, Nombre, Apellido, Organizacion, Telefono, RoleId, Activo)
    VALUES (source.Email, source.PasswordHash, source.Nombre, source.Apellido, source.Organizacion, source.Telefono, source.RoleId, 1);

PRINT '  ✓ 5 usuarios configurados (password: password123)';

GO

PRINT '';
PRINT '================================================================';
PRINT 'INSTALACIÓN COMPLETADA EXITOSAMENTE';
PRINT '================================================================';
PRINT '';
PRINT 'CREDENCIALES DE ACCESO:';
PRINT '  Email: saquino@mic.gov.py';
PRINT '  Password: password123';
PRINT '';
PRINT 'Otros usuarios: cdparra@gmail.com, patricia.lima@gmail.com,';
PRINT '  victor.cantero@gmail.com, lucas.frutos@gmail.com';
PRINT '  (Todos con password: password123)';
PRINT '';
PRINT 'Próximos pasos:';
PRINT '  1. Reiniciar el backend (npm run dev)';
PRINT '  2. Abrir http://localhost:3000/login';
PRINT '  3. Iniciar sesión';
PRINT '';
PRINT '================================================================';

GO

