-- ================================================================
-- Script: Seed Data para Autenticación y Autorización RBAC
-- Proyecto: Chequeo Digital
-- Descripción: Datos iniciales de roles, usuarios, recursos y permisos
-- ================================================================

-- Cambiar ChequeoDigital por tu nombre de base de datos si es diferente
USE BID_stg_copy;
GO

-- ================================================================
-- SEED: RolesSistema
-- ================================================================

PRINT 'Insertando roles del sistema...';

IF NOT EXISTS (SELECT 1 FROM RolesSistema WHERE Nombre = 'superadmin')
BEGIN
    INSERT INTO RolesSistema (Nombre, Descripcion)
    VALUES ('superadmin', 'Control total del sistema. Acceso a todas las funciones incluyendo administración de usuarios internos.');
    PRINT '  - Rol superadmin creado';
END

IF NOT EXISTS (SELECT 1 FROM RolesSistema WHERE Nombre = 'contributor')
BEGIN
    INSERT INTO RolesSistema (Nombre, Descripcion)
    VALUES ('contributor', 'Acceso operativo a empresas y rechequeos. Sin acceso a Testing ni administración de usuarios.');
    PRINT '  - Rol contributor creado';
END

IF NOT EXISTS (SELECT 1 FROM RolesSistema WHERE Nombre = 'viewer')
BEGIN
    INSERT INTO RolesSistema (Nombre, Descripcion)
    VALUES ('viewer', 'Solo visualización del Dashboard Looker. Sin permisos de edición.');
    PRINT '  - Rol viewer creado';
END

GO

-- ================================================================
-- SEED: UsuariosSistema
-- Password para todos: password123
-- Hash bcrypt: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- ================================================================

PRINT '';
PRINT 'Insertando usuarios del sistema...';

DECLARE @superadminRoleId INT, @contributorRoleId INT, @viewerRoleId INT;
SELECT @superadminRoleId = IdRol FROM RolesSistema WHERE Nombre = 'superadmin';
SELECT @contributorRoleId = IdRol FROM RolesSistema WHERE Nombre = 'contributor';
SELECT @viewerRoleId = IdRol FROM RolesSistema WHERE Nombre = 'viewer';

-- Hash correcto para password123: $2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy

-- Superadmin: Santiago Aquino
IF NOT EXISTS (SELECT 1 FROM UsuariosSistema WHERE Email = 'saquino@mic.gov.py')
BEGIN
    INSERT INTO UsuariosSistema (Email, PasswordHash, Nombre, Apellido, Organizacion, Telefono, RoleId, Activo)
    VALUES (
        'saquino@mic.gov.py',
        '$2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy',
        'Santiago',
        'Aquino',
        'MIC',
        '091829191',
        @superadminRoleId,
        1
    );
    PRINT '  - Usuario saquino@mic.gov.py creado (superadmin)';
END
ELSE
BEGIN
    -- Actualizar password si el usuario ya existe
    UPDATE UsuariosSistema
    SET PasswordHash = '$2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy'
    WHERE Email = 'saquino@mic.gov.py';
    PRINT '  - Password actualizado para saquino@mic.gov.py';
END

-- Superadmin: Christian Parra
IF NOT EXISTS (SELECT 1 FROM UsuariosSistema WHERE Email = 'cdparra@gmail.com')
BEGIN
    INSERT INTO UsuariosSistema (Email, PasswordHash, Nombre, Apellido, Organizacion, Telefono, RoleId, Activo)
    VALUES (
        'cdparra@gmail.com',
        '$2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy',
        'Christian',
        'Parra',
        'PNUD',
        '091829191',
        @superadminRoleId,
        1
    );
    PRINT '  - Usuario cdparra@gmail.com creado (superadmin)';
END
ELSE
BEGIN
    UPDATE UsuariosSistema
    SET PasswordHash = '$2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy'
    WHERE Email = 'cdparra@gmail.com';
    PRINT '  - Password actualizado para cdparra@gmail.com';
END

-- Superadmin: Patricia Lima
IF NOT EXISTS (SELECT 1 FROM UsuariosSistema WHERE Email = 'patricia.lima@gmail.com')
BEGIN
    INSERT INTO UsuariosSistema (Email, PasswordHash, Nombre, Apellido, Organizacion, Telefono, RoleId, Activo)
    VALUES (
        'patricia.lima@gmail.com',
        '$2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy',
        'Patricia',
        'Lima',
        'PNUD',
        '091829191',
        @superadminRoleId,
        1
    );
    PRINT '  - Usuario patricia.lima@gmail.com creado (superadmin)';
END
ELSE
BEGIN
    UPDATE UsuariosSistema
    SET PasswordHash = '$2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy'
    WHERE Email = 'patricia.lima@gmail.com';
    PRINT '  - Password actualizado para patricia.lima@gmail.com';
END

-- Contributor: Victor Cantero
IF NOT EXISTS (SELECT 1 FROM UsuariosSistema WHERE Email = 'victor.cantero@gmail.com')
BEGIN
    INSERT INTO UsuariosSistema (Email, PasswordHash, Nombre, Apellido, Organizacion, Telefono, RoleId, Activo)
    VALUES (
        'victor.cantero@gmail.com',
        '$2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy',
        'Victor',
        'Cantero',
        'MIC',
        '091829191',
        @contributorRoleId,
        1
    );
    PRINT '  - Usuario victor.cantero@gmail.com creado (contributor)';
END
ELSE
BEGIN
    UPDATE UsuariosSistema
    SET PasswordHash = '$2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy'
    WHERE Email = 'victor.cantero@gmail.com';
    PRINT '  - Password actualizado para victor.cantero@gmail.com';
END

-- Viewer: Lucas Frutos
IF NOT EXISTS (SELECT 1 FROM UsuariosSistema WHERE Email = 'lucas.frutos@gmail.com')
BEGIN
    INSERT INTO UsuariosSistema (Email, PasswordHash, Nombre, Apellido, Organizacion, Telefono, RoleId, Activo)
    VALUES (
        'lucas.frutos@gmail.com',
        '$2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy',
        'Lucas',
        'Frutos',
        'MIC',
        '091829191',
        @viewerRoleId,
        1
    );
    PRINT '  - Usuario lucas.frutos@gmail.com creado (viewer)';
END
ELSE
BEGIN
    UPDATE UsuariosSistema
    SET PasswordHash = '$2b$10$8bAeGgJXdrm3G3NFMRltH.KrmxxYHz5pd6Wur9jUUdTBS2s/YdoYy'
    WHERE Email = 'lucas.frutos@gmail.com';
    PRINT '  - Password actualizado para lucas.frutos@gmail.com';
END

GO

-- ================================================================
-- SEED: Resources (Catálogo de Recursos)
-- ================================================================

PRINT '';
PRINT 'Insertando recursos del sistema...';

-- Función helper para insertar recursos sin duplicados
DECLARE @ResourcesSeed TABLE (
    Codigo NVARCHAR(150),
    Descripcion NVARCHAR(255),
    Categoria NVARCHAR(100)
);

-- ============ GLOBAL / NAVEGACIÓN ============
INSERT INTO @ResourcesSeed VALUES ('PAGE_DASHBOARD_LOOKER', 'Acceso al dashboard principal (Looker / visualizaciones)', 'GLOBAL');
INSERT INTO @ResourcesSeed VALUES ('PAGE_EMPRESAS', 'Acceso a la vista de listado de empresas', 'GLOBAL');
INSERT INTO @ResourcesSeed VALUES ('PAGE_EMPRESA_DETALLE', 'Acceso al detalle de empresa', 'GLOBAL');
INSERT INTO @ResourcesSeed VALUES ('PAGE_USUARIOS', 'Vista de administración de usuarios internos', 'GLOBAL');
INSERT INTO @ResourcesSeed VALUES ('PAGE_RECHEQUEOS', 'Vista de rechequeos', 'GLOBAL');
INSERT INTO @ResourcesSeed VALUES ('PAGE_TESTING', 'Vista/menú de Testing', 'GLOBAL');
INSERT INTO @ResourcesSeed VALUES ('PAGE_CONFIGURACION', 'Vista de configuración/perfil del usuario', 'GLOBAL');

-- ============ PANTALLA /EMPRESAS ============
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_FILTERS_TIME', 'Bloque de Filtros Rápidos de Fecha', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_FILTERS_SEARCH', 'Bloque de Filtros de Búsqueda', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_STATS_CARDS', 'Cards de resumen (Total Empresas, Nivel General, etc.)', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_EXPORT_REPORT', 'Botón "Exportar Reporte"', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_OBSERVATORIO_TABLE', 'Tabla "Observatorio de Chequeos"', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_OBSERVATORIO_ACTION_VIEW', 'Botón naranja ver detalle (ojo)', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_OBSERVATORIO_ACTION_REASSIGN', 'Botón violeta "Reasignar chequeo"', 'EMPRESAS');
INSERT INTO @ResourcesSeed VALUES ('EMPRESAS_OBSERVATORIO_ACTION_DELETE', 'Botón rojo "Eliminar registro"', 'EMPRESAS');

-- ============ PANTALLA /EMPRESAS/:ID (DETALLE) ============
INSERT INTO @ResourcesSeed VALUES ('EMPRESA_DETAIL_EXPORT_PDF', 'Botón "Exportar Ficha PDF"', 'EMPRESA_DETALLE');
INSERT INTO @ResourcesSeed VALUES ('EMPRESA_DETAIL_EDIT_GENERAL_INFO', 'Ícono lápiz "Editar información general"', 'EMPRESA_DETALLE');
INSERT INTO @ResourcesSeed VALUES ('EMPRESA_DETAIL_MANAGE_ASSIGNED_USERS', 'Ícono "Gestionar usuarios asignados"', 'EMPRESA_DETALLE');
INSERT INTO @ResourcesSeed VALUES ('EMPRESA_DETAIL_RESULTS_SECTION', 'Sección "Resultados de Evaluación Actual"', 'EMPRESA_DETALLE');
INSERT INTO @ResourcesSeed VALUES ('EMPRESA_DETAIL_HISTORY_SECTION', 'Sección "Historial de Evaluaciones"', 'EMPRESA_DETALLE');
INSERT INTO @ResourcesSeed VALUES ('EMPRESA_DETAIL_VIEW_RESPUESTAS', 'Botón "Ver Respuestas" en historial', 'EMPRESA_DETALLE');

-- ============ PANTALLA /USUARIOS (ADMIN USUARIOS INTERNOS) ============
INSERT INTO @ResourcesSeed VALUES ('USUARIOS_LIST_VIEW', 'Ver tabla de usuarios internos', 'USUARIOS');
INSERT INTO @ResourcesSeed VALUES ('USUARIOS_CREATE', 'Botón "Nuevo usuario"', 'USUARIOS');
INSERT INTO @ResourcesSeed VALUES ('USUARIOS_ACTION_EDIT', 'Acción "Editar usuario"', 'USUARIOS');
INSERT INTO @ResourcesSeed VALUES ('USUARIOS_ACTION_UPDATE_EMAIL', 'Acción "Actualizar email"', 'USUARIOS');
INSERT INTO @ResourcesSeed VALUES ('USUARIOS_ACTION_CHANGE_PASSWORD', 'Acción "Cambiar contraseña"', 'USUARIOS');
INSERT INTO @ResourcesSeed VALUES ('USUARIOS_ACTION_DELETE', 'Acción "Eliminar usuario"', 'USUARIOS');

-- ============ PANTALLA /RECHEQUEOS ============
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

-- Contar recursos insertados
DECLARE @resourceCount INT;
SELECT @resourceCount = COUNT(*) FROM Resources;
PRINT '  - Recursos insertados/verificados: ' + CAST(@resourceCount AS NVARCHAR(10));

GO

-- ================================================================
-- SEED: RoleResourcePermissions (Permisos por Rol)
-- ================================================================

PRINT '';
PRINT 'Configurando permisos por rol...';

DECLARE @superadminRoleId INT, @contributorRoleId INT, @viewerRoleId INT;
SELECT @superadminRoleId = IdRol FROM RolesSistema WHERE Nombre = 'superadmin';
SELECT @contributorRoleId = IdRol FROM RolesSistema WHERE Nombre = 'contributor';
SELECT @viewerRoleId = IdRol FROM RolesSistema WHERE Nombre = 'viewer';

-- ================================================================
-- PERMISOS SUPERADMIN: Todos los recursos, todos los permisos
-- ================================================================

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

PRINT '  - Permisos de superadmin configurados';

-- ================================================================
-- PERMISOS CONTRIBUTOR: Acceso operativo (sin Testing ni Usuarios)
-- ================================================================

-- Permisos de vista
INSERT INTO RoleResourcePermissions (IdRol, IdRecurso, CanView, CanCreate, CanEdit, CanDelete)
SELECT 
    @contributorRoleId,
    r.IdRecurso,
    CASE 
        -- Páginas permitidas
        WHEN r.Codigo IN ('PAGE_EMPRESAS', 'PAGE_EMPRESA_DETALLE', 'PAGE_RECHEQUEOS', 'PAGE_CONFIGURACION') THEN 1
        -- Recursos de Empresas (todos visibles)
        WHEN r.Categoria = 'EMPRESAS' THEN 1
        -- Recursos de Empresa Detalle (todos visibles)
        WHEN r.Categoria = 'EMPRESA_DETALLE' THEN 1
        -- Recursos de Rechequeos (todos visibles)
        WHEN r.Categoria = 'RECHEQUEOS' THEN 1
        ELSE 0
    END AS CanView,
    CASE 
        -- Permisos de creación (solo donde aplique)
        WHEN r.Codigo IN ('EMPRESAS_OBSERVATORIO_ACTION_REASSIGN') THEN 1
        ELSE 0
    END AS CanCreate,
    CASE 
        -- Permisos de edición
        WHEN r.Codigo IN ('EMPRESA_DETAIL_EDIT_GENERAL_INFO', 'EMPRESA_DETAIL_MANAGE_ASSIGNED_USERS') THEN 1
        ELSE 0
    END AS CanEdit,
    CASE 
        -- Sin permisos de eliminación
        WHEN r.Codigo IN ('EMPRESAS_OBSERVATORIO_ACTION_DELETE') THEN 0
        ELSE 0
    END AS CanDelete
FROM Resources r
WHERE NOT EXISTS (
    SELECT 1 FROM RoleResourcePermissions rrp 
    WHERE rrp.IdRol = @contributorRoleId AND rrp.IdRecurso = r.IdRecurso
)
-- Excluir explícitamente Testing y Usuarios
AND r.Codigo NOT LIKE 'PAGE_TESTING%'
AND r.Codigo NOT LIKE 'USUARIOS_%'
AND r.Codigo <> 'PAGE_USUARIOS';

PRINT '  - Permisos de contributor configurados';

-- ================================================================
-- PERMISOS VIEWER: Solo Dashboard Looker y Configuración
-- ================================================================

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

PRINT '  - Permisos de viewer configurados';

GO

-- ================================================================
-- VERIFICACIÓN
-- ================================================================

PRINT '';
PRINT '================================================================';
PRINT 'SEED DATA COMPLETADO EXITOSAMENTE';
PRINT '================================================================';
PRINT '';
PRINT 'RESUMEN:';

-- Variables para contar
DECLARE @rolesCount INT, @usuariosCount INT, @resourcesCount INT, @permisosCount INT;
SELECT @rolesCount = COUNT(*) FROM RolesSistema;
SELECT @usuariosCount = COUNT(*) FROM UsuariosSistema;
SELECT @resourcesCount = COUNT(*) FROM Resources;
SELECT @permisosCount = COUNT(*) FROM RoleResourcePermissions;

PRINT '  - Roles creados: ' + CAST(@rolesCount AS NVARCHAR(10));
PRINT '  - Usuarios creados: ' + CAST(@usuariosCount AS NVARCHAR(10));
PRINT '  - Recursos creados: ' + CAST(@resourcesCount AS NVARCHAR(10));
PRINT '  - Permisos configurados: ' + CAST(@permisosCount AS NVARCHAR(10));
PRINT '';
PRINT 'CREDENCIALES DE ACCESO:';
PRINT '  Todos los usuarios tienen el password: password123';
PRINT '';
PRINT '  Superadmins:';
PRINT '    - saquino@mic.gov.py';
PRINT '    - cdparra@gmail.com';
PRINT '    - patricia.lima@gmail.com';
PRINT '';
PRINT '  Contributor:';
PRINT '    - victor.cantero@gmail.com';
PRINT '';
PRINT '  Viewer:';
PRINT '    - lucas.frutos@gmail.com';
PRINT '';
PRINT '================================================================';

GO

