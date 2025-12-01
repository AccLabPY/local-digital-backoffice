/*
================================================================================
SCRIPT DE INSTALACIÓN COMPLETA - CHEQUEO DIGITAL 2.0
================================================================================

Este script ejecuta todos los pasos necesarios para configurar la base de datos
desde cero. Ejecutar en SQL Server Management Studio (SSMS) o sqlcmd.

Compatible con: SQL Server 2012+
Base de datos: BID_stg_copy (cambiar si es diferente)

ORDEN DE EJECUCIÓN:
1. Tablas de autenticación (RolesSistema, UsuariosSistema, Resources, etc.)
2. Datos iniciales (roles, usuarios, recursos, permisos)
3. Vistas optimizadas de rechequeos

================================================================================
*/

-- ============================================================================
-- CONFIGURACIÓN INICIAL
-- ============================================================================

USE BID_stg_copy;  -- ⚠️ CAMBIAR POR TU BASE DE DATOS SI ES DIFERENTE
GO

SET NOCOUNT ON;
GO

PRINT '================================================================================';
PRINT 'INICIANDO INSTALACIÓN DE CHEQUEO DIGITAL 2.0';
PRINT 'Fecha: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '================================================================================';
PRINT '';
GO

-- ============================================================================
-- PARTE 1: CREAR TABLAS DE AUTENTICACIÓN
-- ============================================================================

PRINT '============================================================================';
PRINT 'PARTE 1: CREANDO TABLAS DE AUTENTICACIÓN';
PRINT '============================================================================';
GO

-- TABLA: RolesSistema
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
    
    PRINT '  ✅ Tabla RolesSistema creada';
END
ELSE
    PRINT '  ⚠️  Tabla RolesSistema ya existe';
GO

-- TABLA: UsuariosSistema
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
    
    PRINT '  ✅ Tabla UsuariosSistema creada';
END
ELSE
    PRINT '  ⚠️  Tabla UsuariosSistema ya existe';
GO

-- TABLA: Resources
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
    
    PRINT '  ✅ Tabla Resources creada';
END
ELSE
    PRINT '  ⚠️  Tabla Resources ya existe';
GO

-- TABLA: RoleResourcePermissions
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
    
    PRINT '  ✅ Tabla RoleResourcePermissions creada';
END
ELSE
    PRINT '  ⚠️  Tabla RoleResourcePermissions ya existe';
GO

-- TABLA: TokensRevocados
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TokensRevocados')
BEGIN
    CREATE TABLE TokensRevocados (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Token NVARCHAR(MAX) NOT NULL,
        FechaRevocacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        FechaExpiracion DATETIME2 NOT NULL
    );
    
    CREATE INDEX IX_TokensRevocados_FechaExpiracion ON TokensRevocados(FechaExpiracion);
    
    PRINT '  ✅ Tabla TokensRevocados creada';
END
ELSE
    PRINT '  ⚠️  Tabla TokensRevocados ya existe';
GO

PRINT '';
PRINT '============================================================================';
PRINT 'PARTE 2: INSERTANDO DATOS INICIALES';
PRINT '============================================================================';
GO

-- INSERTAR ROLES
IF NOT EXISTS (SELECT 1 FROM RolesSistema WHERE Nombre = 'superadmin')
BEGIN
    INSERT INTO RolesSistema (Nombre, Descripcion)
    VALUES ('superadmin', 'Control total del sistema. Acceso a todas las funciones incluyendo administración de usuarios internos.');
    PRINT '  ✅ Rol superadmin creado';
END

IF NOT EXISTS (SELECT 1 FROM RolesSistema WHERE Nombre = 'contributor')
BEGIN
    INSERT INTO RolesSistema (Nombre, Descripcion)
    VALUES ('contributor', 'Acceso operativo a empresas y rechequeos. Sin acceso a Testing ni administración de usuarios.');
    PRINT '  ✅ Rol contributor creado';
END

IF NOT EXISTS (SELECT 1 FROM RolesSistema WHERE Nombre = 'viewer')
BEGIN
    INSERT INTO RolesSistema (Nombre, Descripcion)
    VALUES ('viewer', 'Solo visualización del Dashboard Looker. Sin permisos de edición.');
    PRINT '  ✅ Rol viewer creado';
END
GO

-- INSERTAR USUARIO ADMIN INICIAL
-- Password: password123 (hash bcrypt)
DECLARE @superadminRoleId INT;
SELECT @superadminRoleId = IdRol FROM RolesSistema WHERE Nombre = 'superadmin';

IF NOT EXISTS (SELECT 1 FROM UsuariosSistema WHERE Email = 'admin@chequeo.gov.py')
BEGIN
    INSERT INTO UsuariosSistema (Email, PasswordHash, Nombre, Apellido, Organizacion, Telefono, RoleId, Activo)
    VALUES (
        'admin@chequeo.gov.py',
        '$2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy',
        'Administrador',
        'Sistema',
        'Chequeo Digital',
        '',
        @superadminRoleId,
        1
    );
    PRINT '  ✅ Usuario admin@chequeo.gov.py creado (password: password123)';
END
ELSE
    PRINT '  ⚠️  Usuario admin@chequeo.gov.py ya existe';
GO

-- INSERTAR RECURSOS DEL SISTEMA
DECLARE @ResourcesSeed TABLE (
    Codigo NVARCHAR(150),
    Descripcion NVARCHAR(255),
    Categoria NVARCHAR(100)
);

-- GLOBAL / NAVEGACIÓN
INSERT INTO @ResourcesSeed VALUES ('PAGE_DASHBOARD_LOOKER', 'Acceso al dashboard principal (Looker / visualizaciones)', 'GLOBAL');
INSERT INTO @ResourcesSeed VALUES ('PAGE_EMPRESAS', 'Acceso a la vista de listado de empresas', 'GLOBAL');
INSERT INTO @ResourcesSeed VALUES ('PAGE_EMPRESA_DETALLE', 'Acceso al detalle de empresa', 'GLOBAL');
INSERT INTO @ResourcesSeed VALUES ('PAGE_USUARIOS', 'Vista de administración de usuarios internos', 'GLOBAL');
INSERT INTO @ResourcesSeed VALUES ('PAGE_RECHEQUEOS', 'Vista de rechequeos', 'GLOBAL');
INSERT INTO @ResourcesSeed VALUES ('PAGE_TESTING', 'Vista/menú de Testing', 'GLOBAL');
INSERT INTO @ResourcesSeed VALUES ('PAGE_CONFIGURACION', 'Vista de configuración/perfil del usuario', 'GLOBAL');

-- PANTALLA /EMPRESAS
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_FILTERS_TIME', 'Bloque de Filtros Rápidos de Fecha', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_FILTERS_SEARCH', 'Bloque de Filtros de Búsqueda', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_STATS_CARDS', 'Cards de resumen (Total Empresas, Nivel General, etc.)', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_EXPORT_REPORT', 'Botón "Exportar Reporte"', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_OBSERVATORIO_TABLE', 'Tabla "Observatorio de Chequeos"', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_OBSERVATORIO_ACTION_VIEW', 'Botón naranja ver detalle (ojo)', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_OBSERVATORIO_ACTION_REASSIGN', 'Botón violeta "Reasignar chequeo"', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_OBSERVATORIO_ACTION_DELETE', 'Botón rojo "Eliminar registro"', 'EMPRESAS');

-- PANTALLA /EMPRESAS/:ID (DETALLE)
INSERT INTO @ResourcesSeed VALUES ('EMPRESA_DETAIL_EXPORT_PDF', 'Botón "Exportar Ficha PDF"', 'EMPRESA_DETALLE');
INSERT INTO @ResourcesSeed VALUES ('EMPRESA_DETAIL_EDIT_GENERAL_INFO', 'Ícono lápiz "Editar información general"', 'EMPRESA_DETALLE');
INSERT INTO @ResourcesSeed VALUES ('EMPRESA_DETAIL_MANAGE_ASSIGNED_USERS', 'Ícono "Gestionar usuarios asignados"', 'EMPRESA_DETALLE');
INSERT INTO @ResourcesSeed VALUES ('EMPRESA_DETAIL_RESULTS_SECTION', 'Sección "Resultados de Evaluación Actual"', 'EMPRESA_DETALLE');
INSERT INTO @ResourcesSeed VALUES ('EMPRESA_DETAIL_HISTORY_SECTION', 'Sección "Historial de Evaluaciones"', 'EMPRESA_DETALLE');
INSERT INTO @ResourcesSeed VALUES ('EMPRESA_DETAIL_VIEW_RESPUESTAS', 'Botón "Ver Respuestas" en historial', 'EMPRESA_DETALLE');

-- PANTALLA /USUARIOS (ADMIN USUARIOS INTERNOS)
INSERT INTO @ResourcesSeed VALUES ('USUARIOS_LIST_VIEW', 'Ver tabla de usuarios internos', 'USUARIOS');
INSERT INTO @ResourcesSeed VALUES ('USUARIOS_CREATE', 'Botón "Nuevo usuario"', 'USUARIOS');
INSERT INTO @ResourcesSeed VALUES ('USUARIOS_ACTION_EDIT', 'Acción "Editar usuario"', 'USUARIOS');
INSERT INTO @ResourcesSeed VALUES ('USUARIOS_ACTION_UPDATE_EMAIL', 'Acción "Actualizar email"', 'USUARIOS');
INSERT INTO @ResourcesSeed VALUES ('USUARIOS_ACTION_CHANGE_PASSWORD', 'Acción "Cambiar contraseña"', 'USUARIOS');
INSERT INTO @ResourcesSeed VALUES ('USUARIOS_ACTION_DELETE', 'Acción "Eliminar usuario"', 'USUARIOS');

-- PANTALLA /RECHEQUEOS
INSERT INTO @ResourcesSeed VALUES ('RECHEQUEOS_LIST_VIEW', 'Ver listado principal de rechequeos', 'RECHEQUEOS');
INSERT INTO @ResourcesSeed VALUES ('RECHEQUEOS_FILTERS_TIME', 'Filtros de tiempo/fecha', 'RECHEQUEOS');
INSERT INTO @ResourcesSeed VALUES ('RECHEQUEOS_FILTERS_SEARCH', 'Filtros de búsqueda', 'RECHEQUEOS');
INSERT INTO @ResourcesSeed VALUES ('RECHEQUEOS_EXPORT_PDF', 'Botón "Exportar PDF"', 'RECHEQUEOS');
INSERT INTO @ResourcesSeed VALUES ('RECHEQUEOS_EXPORT_CSV', 'Botón "Exportar CSV"', 'RECHEQUEOS');
INSERT INTO @ResourcesSeed VALUES ('RECHEQUEOS_EXPORT_CSV_DETAIL_PER_EMPRESA', 'Botón "Exportar CSV detalle por empresa"', 'RECHEQUEOS');

-- Insertar recursos que no existen
INSERT INTO Resources (Codigo, Descripcion, Categoria)
SELECT rs.Codigo, rs.Descripcion, rs.Categoria
FROM @ResourcesSeed rs
WHERE NOT EXISTS (
    SELECT 1 FROM Resources r WHERE r.Codigo = rs.Codigo
);

DECLARE @resourceCount INT;
SELECT @resourceCount = COUNT(*) FROM Resources;
PRINT '  ✅ Recursos insertados/verificados: ' + CAST(@resourceCount AS NVARCHAR(10));
GO

-- CONFIGURAR PERMISOS POR ROL
DECLARE @superadminRoleId INT, @contributorRoleId INT, @viewerRoleId INT;
SELECT @superadminRoleId = IdRol FROM RolesSistema WHERE Nombre = 'superadmin';
SELECT @contributorRoleId = IdRol FROM RolesSistema WHERE Nombre = 'contributor';
SELECT @viewerRoleId = IdRol FROM RolesSistema WHERE Nombre = 'viewer';

-- PERMISOS SUPERADMIN: Todos los recursos, todos los permisos
INSERT INTO RoleResourcePermissions (IdRol, IdRecurso, CanView, CanCreate, CanEdit, CanDelete)
SELECT 
    @superadminRoleId,
    IdRecurso,
    1, 1, 1, 1
FROM Resources r
WHERE NOT EXISTS (
    SELECT 1 FROM RoleResourcePermissions rrp 
    WHERE rrp.IdRol = @superadminRoleId AND rrp.IdRecurso = r.IdRecurso
);

PRINT '  ✅ Permisos de superadmin configurados';

-- PERMISOS CONTRIBUTOR
INSERT INTO RoleResourcePermissions (IdRol, IdRecurso, CanView, CanCreate, CanEdit, CanDelete)
SELECT 
    @contributorRoleId,
    r.IdRecurso,
    CASE 
        WHEN r.Codigo IN ('PAGE_EMPRESAS', 'PAGE_EMPRESA_DETALLE', 'PAGE_RECHEQUEOS', 'PAGE_CONFIGURACION') THEN 1
        WHEN r.Categoria = 'EMPRESAS' THEN 1
        WHEN r.Categoria = 'EMPRESA_DETALLE' THEN 1
        WHEN r.Categoria = 'RECHEQUEOS' THEN 1
        ELSE 0
    END AS CanView,
    CASE 
        WHEN r.Codigo IN ('EMPRESAS_OBSERVATORIO_ACTION_REASSIGN') THEN 1
        ELSE 0
    END AS CanCreate,
    CASE 
        WHEN r.Codigo IN ('EMPRESA_DETAIL_EDIT_GENERAL_INFO', 'EMPRESA_DETAIL_MANAGE_ASSIGNED_USERS') THEN 1
        ELSE 0
    END AS CanEdit,
    0 AS CanDelete
FROM Resources r
WHERE NOT EXISTS (
    SELECT 1 FROM RoleResourcePermissions rrp 
    WHERE rrp.IdRol = @contributorRoleId AND rrp.IdRecurso = r.IdRecurso
)
AND r.Codigo NOT LIKE 'PAGE_TESTING%'
AND r.Codigo NOT LIKE 'USUARIOS_%'
AND r.Codigo <> 'PAGE_USUARIOS';

PRINT '  ✅ Permisos de contributor configurados';

-- PERMISOS VIEWER
INSERT INTO RoleResourcePermissions (IdRol, IdRecurso, CanView, CanCreate, CanEdit, CanDelete)
SELECT 
    @viewerRoleId,
    r.IdRecurso,
    CASE 
        WHEN r.Codigo IN ('PAGE_DASHBOARD_LOOKER', 'PAGE_CONFIGURACION') THEN 1
        ELSE 0
    END AS CanView,
    0, 0, 0
FROM Resources r
WHERE NOT EXISTS (
    SELECT 1 FROM RoleResourcePermissions rrp 
    WHERE rrp.IdRol = @viewerRoleId AND rrp.IdRecurso = r.IdRecurso
);

PRINT '  ✅ Permisos de viewer configurados';
GO

PRINT '';
PRINT '============================================================================';
PRINT 'PARTE 3: CREANDO VISTAS OPTIMIZADAS DE RECHEQUEOS';
PRINT '============================================================================';
GO

-- VISTA 1: vw_RechequeosBase
IF OBJECT_ID('dbo.vw_RechequeosBase', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.vw_RechequeosBase;
    PRINT '  Vista existente vw_RechequeosBase eliminada';
END
GO

CREATE VIEW dbo.vw_RechequeosBase
AS
WITH 
EmpresasGenericas AS (
    SELECT IdEmpresa
    FROM dbo.Empresa WITH (NOLOCK)
    WHERE Nombre LIKE '%NO TENGO%' 
       OR Nombre LIKE '%Sin empresa%' 
       OR Nombre LIKE '%NO TIENE%'
       OR IdEmpresa <= 0
),
ChequeosOrdenados AS (
    SELECT 
        ei.IdEmpresa,
        ei.IdUsuario,
        ei.Test,
        ei.IdEmpresaInfo,
        tu.IdTestUsuario,
        tu.FechaTest,
        tu.FechaTerminoTest,
        ce.ClaveEntidad,
        ROW_NUMBER() OVER (
            PARTITION BY ce.ClaveEntidad, ei.Test 
            ORDER BY tu.FechaTerminoTest DESC, ei.IdEmpresaInfo DESC
        ) AS rn_dedup
    FROM dbo.EmpresaInfo ei WITH (NOLOCK)
    LEFT JOIN EmpresasGenericas eg ON ei.IdEmpresa = eg.IdEmpresa
    OUTER APPLY (
        SELECT CASE 
            WHEN eg.IdEmpresa IS NOT NULL OR ei.IdEmpresa <= 0
            THEN 'U_' + CAST(ei.IdUsuario AS VARCHAR(20))
            ELSE 'E_' + CAST(ei.IdEmpresa AS VARCHAR(20))
        END AS ClaveEntidad
    ) ce
    INNER JOIN dbo.TestUsuario tu WITH (NOLOCK) 
        ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
    WHERE tu.Finalizado = 1
),
ChequeosUnicos AS (
    SELECT 
        IdEmpresa,
        IdUsuario,
        Test,
        IdEmpresaInfo,
        IdTestUsuario,
        FechaTest,
        FechaTerminoTest,
        ClaveEntidad,
        ROW_NUMBER() OVER (
            PARTITION BY ClaveEntidad 
            ORDER BY FechaTerminoTest, IdTestUsuario
        ) AS rn_seq,
        LAG(FechaTerminoTest) OVER (
            PARTITION BY ClaveEntidad 
            ORDER BY FechaTerminoTest, IdTestUsuario
        ) AS FechaAnterior
    FROM ChequeosOrdenados
    WHERE rn_dedup = 1
),
ChequeosValidos AS (
    SELECT 
        IdEmpresa,
        IdUsuario,
        Test,
        IdEmpresaInfo,
        IdTestUsuario,
        FechaTest,
        FechaTerminoTest,
        ClaveEntidad,
        rn_seq,
        CASE 
            WHEN FechaAnterior IS NULL THEN 1
            WHEN DATEDIFF(DAY, FechaAnterior, FechaTerminoTest) >= 180 THEN 1
            ELSE 0
        END AS EsValido
    FROM ChequeosUnicos
),
ChequeosValidosRenumerados AS (
    SELECT 
        IdEmpresa,
        IdUsuario,
        Test,
        IdEmpresaInfo,
        IdTestUsuario,
        FechaTest,
        FechaTerminoTest,
        ClaveEntidad,
        ROW_NUMBER() OVER (
            PARTITION BY ClaveEntidad 
            ORDER BY FechaTerminoTest, IdTestUsuario
        ) AS SeqNum,
        COUNT(*) OVER (PARTITION BY ClaveEntidad) AS TotalChequeosValidos
    FROM ChequeosValidos
    WHERE EsValido = 1
),
ChequeosEnriquecidos AS (
    SELECT 
        cv.IdEmpresa,
        cv.IdUsuario,
        cv.IdEmpresaInfo,
        cv.Test,
        cv.IdTestUsuario,
        cv.FechaTest,
        cv.FechaTerminoTest,
        cv.ClaveEntidad,
        cv.SeqNum,
        cv.TotalChequeosValidos,
        rnd.ptjeTotalUsuario AS PuntajeGlobal,
        nm.Descripcion AS NivelMadurez,
        rnd.ptjeDimensionTecnologia AS D_Tecnologia,
        rnd.ptjeDimensionComunicacion AS D_Comunicacion,
        rnd.ptjeDimensionOrganizacion AS D_Organizacion,
        rnd.ptjeDimensionDatos AS D_Datos,
        rnd.ptjeDimensionEstrategia AS D_Estrategia,
        rnd.ptjeDimensionProcesos AS D_Procesos,
        sa.Descripcion AS SectorActividad,
        ssa.Descripcion AS SubSectorActividad,
        va.Nombre AS TamanoEmpresa,
        e.Nombre AS EmpresaNombre,
        u.NombreCompleto AS NombreUsuario,
        CASE 
            WHEN ub.IdLocalidadLatest IS NOT NULL THEN 
                CASE WHEN ub.IdRegionLatest = 20 THEN 'Capital' ELSE ub.DepartamentoNombreLatest END
            ELSE CASE WHEN sr.IdRegion = 20 THEN 'Capital' ELSE dep.Nombre END
        END AS Departamento,
        CASE 
            WHEN ub.IdLocalidadLatest IS NOT NULL THEN ub.DistritoNombreLatest
            ELSE CASE WHEN sr.Nombre IS NOT NULL THEN sr.Nombre ELSE 'OTRO' END
        END AS Distrito
    FROM ChequeosValidosRenumerados cv
    LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) 
        ON cv.IdUsuario = rnd.IdUsuario AND cv.Test = rnd.Test
    LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) 
        ON rnd.IdNivelMadurez = nm.IdNivelMadurez
    LEFT JOIN dbo.EmpresaInfo ei WITH (NOLOCK) 
        ON ei.IdEmpresaInfo = cv.IdEmpresaInfo
    LEFT JOIN dbo.SectorActividad sa WITH (NOLOCK) 
        ON ei.IdSectorActividad = sa.IdSectorActividad
    LEFT JOIN dbo.SubSectorActividad ssa WITH (NOLOCK) 
        ON ei.IdSubSectorActividad = ssa.IdSubSectorActividad
    LEFT JOIN dbo.VentasAnuales va WITH (NOLOCK) 
        ON ei.IdVentas = va.IdVentasAnuales
    LEFT JOIN dbo.Empresa e WITH (NOLOCK) 
        ON cv.IdEmpresa = e.IdEmpresa
    LEFT JOIN dbo.Usuario u WITH (NOLOCK) 
        ON cv.IdUsuario = u.IdUsuario
    LEFT JOIN dbo.Departamentos dep WITH (NOLOCK) 
        ON ei.IdDepartamento = dep.IdDepartamento
    LEFT JOIN dbo.SubRegion sr WITH (NOLOCK) 
        ON ei.IdLocalidad = sr.IdSubRegion
    OUTER APPLY (
        SELECT TOP 1 
            ei2.IdDepartamento AS IdDepartamentoLatest,
            ei2.IdLocalidad AS IdLocalidadLatest,
            dep2.Nombre AS DepartamentoNombreLatest,
            sr2.IdRegion AS IdRegionLatest,
            sr2.Nombre AS DistritoNombreLatest
        FROM dbo.EmpresaInfo ei2 WITH (NOLOCK)
        INNER JOIN dbo.TestUsuario tu2 WITH (NOLOCK) 
            ON ei2.IdUsuario = tu2.IdUsuario AND ei2.Test = tu2.Test
        LEFT JOIN dbo.Departamentos dep2 WITH (NOLOCK) ON ei2.IdDepartamento = dep2.IdDepartamento
        LEFT JOIN dbo.SubRegion sr2 WITH (NOLOCK) ON ei2.IdLocalidad = sr2.IdSubRegion
        WHERE tu2.Finalizado = 1
          AND ei2.IdEmpresa = cv.IdEmpresa
          AND ei2.IdLocalidad IS NOT NULL
        ORDER BY tu2.FechaTerminoTest DESC, ei2.IdEmpresaInfo DESC
    ) ub
)
SELECT *
FROM ChequeosEnriquecidos;
GO

PRINT '  ✅ Vista vw_RechequeosBase creada';
GO

-- VISTA 2: vw_RechequeosKPIs
IF OBJECT_ID('dbo.vw_RechequeosKPIs', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.vw_RechequeosKPIs;
    PRINT '  Vista existente vw_RechequeosKPIs eliminada';
END
GO

CREATE VIEW dbo.vw_RechequeosKPIs
AS
WITH 
EntidadesElegibles AS (
    SELECT DISTINCT ClaveEntidad
    FROM dbo.vw_RechequeosBase
    WHERE TotalChequeosValidos >= 2
),
PrimerChequeo AS (
    SELECT b.*
    FROM dbo.vw_RechequeosBase b
    INNER JOIN EntidadesElegibles ee ON b.ClaveEntidad = ee.ClaveEntidad
    WHERE b.SeqNum = 1
),
UltimoChequeo AS (
    SELECT ce.*
    FROM dbo.vw_RechequeosBase ce
    INNER JOIN EntidadesElegibles ee ON ce.ClaveEntidad = ee.ClaveEntidad
    INNER JOIN (
        SELECT ClaveEntidad, MAX(SeqNum) AS MaxSeq
        FROM dbo.vw_RechequeosBase
        GROUP BY ClaveEntidad
    ) m ON ce.ClaveEntidad = m.ClaveEntidad AND ce.SeqNum = m.MaxSeq
),
AnalisisComparativo AS (
    SELECT
        p.IdEmpresa,
        p.IdUsuario,
        p.ClaveEntidad,
        p.EmpresaNombre,
        p.NombreUsuario,
        p.SectorActividad,
        p.SubSectorActividad,
        p.TamanoEmpresa,
        p.Departamento,
        p.Distrito,
        p.TotalChequeosValidos AS TotalChequeos,
        p.PuntajeGlobal AS Puntaje_Primero,
        p.NivelMadurez AS Nivel_Primero,
        p.FechaTerminoTest AS Fecha_Primero,
        p.D_Tecnologia AS D1_Tecnologia,
        p.D_Comunicacion AS D1_Comunicacion,
        p.D_Organizacion AS D1_Organizacion,
        p.D_Datos AS D1_Datos,
        p.D_Estrategia AS D1_Estrategia,
        p.D_Procesos AS D1_Procesos,
        u.PuntajeGlobal AS Puntaje_Ultimo,
        u.NivelMadurez AS Nivel_Ultimo,
        u.FechaTerminoTest AS Fecha_Ultimo,
        u.D_Tecnologia AS DN_Tecnologia,
        u.D_Comunicacion AS DN_Comunicacion,
        u.D_Organizacion AS DN_Organizacion,
        u.D_Datos AS DN_Datos,
        u.D_Estrategia AS DN_Estrategia,
        u.D_Procesos AS DN_Procesos,
        u.PuntajeGlobal - p.PuntajeGlobal AS DeltaGlobal,
        u.D_Tecnologia - p.D_Tecnologia AS DeltaTecnologia,
        u.D_Comunicacion - p.D_Comunicacion AS DeltaComunicacion,
        u.D_Organizacion - p.D_Organizacion AS DeltaOrganizacion,
        u.D_Datos - p.D_Datos AS DeltaDatos,
        u.D_Estrategia - p.D_Estrategia AS DeltaEstrategia,
        u.D_Procesos - p.D_Procesos AS DeltaProcesos,
        DATEDIFF(DAY, p.FechaTerminoTest, u.FechaTerminoTest) AS DiasEntreChequeos,
        CASE 
            WHEN p.NivelMadurez IN ('Inicial', 'Novato') AND u.NivelMadurez IN ('Competente', 'Avanzado') THEN 1
            ELSE 0
        END AS SaltoBajoMedio,
        CASE 
            WHEN p.NivelMadurez IN ('Competente') AND u.NivelMadurez IN ('Avanzado') THEN 1
            ELSE 0
        END AS SaltoMedioAlto
    FROM PrimerChequeo p
    INNER JOIN UltimoChequeo u ON p.ClaveEntidad = u.ClaveEntidad
)
SELECT 
    *,
    CASE 
        WHEN DiasEntreChequeos > 0 THEN DeltaGlobal / (DiasEntreChequeos / 30.0)
        ELSE 0
    END AS TasaMejoraMensual,
    CASE WHEN DeltaGlobal > 0 THEN 1 ELSE 0 END AS TieneMejoraPositiva,
    CASE WHEN DeltaGlobal < 0 THEN 1 ELSE 0 END AS TieneRegresion,
    CASE WHEN DeltaGlobal >= 0 THEN 1 ELSE 0 END AS EsConsistente
FROM AnalisisComparativo;
GO

PRINT '  ✅ Vista vw_RechequeosKPIs creada';
GO

-- VISTA 3: vw_RechequeosTabla
IF OBJECT_ID('dbo.vw_RechequeosTabla', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.vw_RechequeosTabla;
    PRINT '  Vista existente vw_RechequeosTabla eliminada';
END
GO

CREATE VIEW dbo.vw_RechequeosTabla
AS
SELECT
    IdEmpresa,
    IdUsuario,
    ClaveEntidad,
    EmpresaNombre,
    NombreUsuario,
    SectorActividad,
    SubSectorActividad,
    TamanoEmpresa,
    Departamento,
    Distrito,
    CONCAT(ISNULL(Distrito,''), CASE WHEN Distrito IS NOT NULL AND Departamento IS NOT NULL THEN ', ' ELSE '' END, ISNULL(Departamento,'')) AS Ubicacion,
    TotalChequeos,
    Puntaje_Primero AS PrimerPuntaje,
    Nivel_Primero AS PrimerNivel,
    Puntaje_Ultimo AS UltimoPuntaje,
    Nivel_Ultimo AS UltimoNivel,
    Fecha_Primero AS PrimeraFecha,
    Fecha_Ultimo AS UltimaFecha,
    DiasEntreChequeos,
    DeltaGlobal,
    DeltaTecnologia,
    DeltaComunicacion,
    DeltaOrganizacion,
    DeltaDatos,
    DeltaEstrategia,
    DeltaProcesos,
    TasaMejoraMensual,
    SaltoBajoMedio,
    SaltoMedioAlto,
    TieneMejoraPositiva,
    TieneRegresion
FROM dbo.vw_RechequeosKPIs;
GO

PRINT '  ✅ Vista vw_RechequeosTabla creada';
GO

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

PRINT '';
PRINT '============================================================================';
PRINT 'VERIFICACIÓN FINAL';
PRINT '============================================================================';

DECLARE @rolesCount INT, @usuariosCount INT, @resourcesCount INT, @permisosCount INT;
DECLARE @CountBase INT, @CountKPIs INT, @CountTabla INT;

SELECT @rolesCount = COUNT(*) FROM RolesSistema;
SELECT @usuariosCount = COUNT(*) FROM UsuariosSistema;
SELECT @resourcesCount = COUNT(*) FROM Resources;
SELECT @permisosCount = COUNT(*) FROM RoleResourcePermissions;

SELECT @CountBase = COUNT(*) FROM dbo.vw_RechequeosBase WITH (NOLOCK);
SELECT @CountKPIs = COUNT(*) FROM dbo.vw_RechequeosKPIs WITH (NOLOCK);
SELECT @CountTabla = COUNT(*) FROM dbo.vw_RechequeosTabla WITH (NOLOCK);

PRINT '';
PRINT 'TABLAS DE AUTENTICACIÓN:';
PRINT '  - Roles: ' + CAST(@rolesCount AS NVARCHAR(10));
PRINT '  - Usuarios: ' + CAST(@usuariosCount AS NVARCHAR(10));
PRINT '  - Recursos: ' + CAST(@resourcesCount AS NVARCHAR(10));
PRINT '  - Permisos: ' + CAST(@permisosCount AS NVARCHAR(10));
PRINT '';
PRINT 'VISTAS OPTIMIZADAS:';
PRINT '  - vw_RechequeosBase: ' + CAST(@CountBase AS NVARCHAR(10)) + ' registros';
PRINT '  - vw_RechequeosKPIs: ' + CAST(@CountKPIs AS NVARCHAR(10)) + ' registros';
PRINT '  - vw_RechequeosTabla: ' + CAST(@CountTabla AS NVARCHAR(10)) + ' registros';
PRINT '';
PRINT '================================================================================';
PRINT 'INSTALACIÓN COMPLETADA EXITOSAMENTE';
PRINT '================================================================================';
PRINT '';
PRINT 'CREDENCIALES DE ACCESO:';
PRINT '  Email: admin@chequeo.gov.py';
PRINT '  Password: password123';
PRINT '';
PRINT 'PRÓXIMOS PASOS:';
PRINT '  1. Configurar el archivo .env del backend';
PRINT '  2. Ejecutar: npm install (en /backend y en raíz)';
PRINT '  3. Ejecutar: npm run dev (backend y frontend)';
PRINT '  4. Acceder a http://localhost:3000';
PRINT '================================================================================';
GO

