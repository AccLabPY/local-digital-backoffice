-- ================================================================
-- Script: Crear Tablas de Autenticación y Autorización RBAC
-- Proyecto: Chequeo Digital
-- Descripción: Sistema completo de usuarios internos, roles y permisos por recursos
-- ================================================================

-- Cambiar ChequeoDigital por tu nombre de base de datos si es diferente
USE BID_v2;
GO

-- ================================================================
-- TABLA: RolesSistema
-- Descripción: Roles del sistema interno (superadmin, contributor, viewer)
-- ================================================================

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
    
    PRINT 'Tabla RolesSistema creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla RolesSistema ya existe';
END
GO

-- ================================================================
-- TABLA: UsuariosSistema
-- Descripción: Usuarios internos del backoffice
-- ================================================================

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
    
    PRINT 'Tabla UsuariosSistema creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla UsuariosSistema ya existe';
END
GO

-- ================================================================
-- TABLA: Resources
-- Descripción: Recursos (páginas, bloques UI, acciones) del sistema
-- ================================================================

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
    
    PRINT 'Tabla Resources creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla Resources ya existe';
END
GO

-- ================================================================
-- TABLA: RoleResourcePermissions
-- Descripción: Permisos por rol y recurso (RBAC)
-- ================================================================

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
    
    PRINT 'Tabla RoleResourcePermissions creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla RoleResourcePermissions ya existe';
END
GO

-- ================================================================
-- TABLA: TokensRevocados (opcional - para logout)
-- Descripción: Almacena tokens revocados antes de su expiración natural
-- ================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TokensRevocados')
BEGIN
    CREATE TABLE TokensRevocados (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Token NVARCHAR(MAX) NOT NULL,
        FechaRevocacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        FechaExpiracion DATETIME2 NOT NULL
    );
    
    CREATE INDEX IX_TokensRevocados_FechaExpiracion ON TokensRevocados(FechaExpiracion);
    
    PRINT 'Tabla TokensRevocados creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla TokensRevocados ya existe';
END
GO

PRINT '';
PRINT '================================================================';
PRINT 'TABLAS DE AUTENTICACIÓN Y AUTORIZACIÓN CREADAS EXITOSAMENTE';
PRINT '================================================================';
GO

