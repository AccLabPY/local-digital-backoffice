# Sistema de Autenticación y Autorización RBAC - Chequeo Digital

## Documentación de Instalación y Configuración

Este documento detalla los pasos para configurar el sistema completo de autenticación y autorización basado en roles (RBAC) para el proyecto Chequeo Digital.

---

## 📋 Índice

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Configuración de Base de Datos](#configuración-de-base-de-datos)
3. [Configuración del Backend](#configuración-del-backend)
4. [Configuración del Frontend](#configuración-del-frontend)
5. [Credenciales Iniciales](#credenciales-iniciales)
6. [Estructura de Permisos](#estructura-de-permisos)
7. [Uso y Ejemplos](#uso-y-ejemplos)

---

## 🎯 Resumen del Sistema

El sistema implementa:

- **Autenticación dual**: 
  - Login de usuarios internos (backoffice) → Tabla `UsuariosSistema`
  - Login de empresas/comercios → Tabla `Usuario` (existente)

- **Autorización RBAC**:
  - 3 roles: `superadmin`, `contributor`, `viewer`
  - Control granular por recursos (páginas, botones, acciones)
  - Permisos: `CanView`, `CanCreate`, `CanEdit`, `CanDelete`

- **Tokens JWT**:
  - Duración: 5 horas
  - Se revocan al cerrar sesión
  - Incluyen: userId, email, role, type ('system' o 'empresa')

---

## 🗄️ Configuración de Base de Datos

### Paso 1: Ejecutar Scripts SQL

Los scripts están en `backend/sql-scripts/`:

```bash
# 1. Crear tablas
sqlcmd -S tu_servidor -d ChequeoDigital -i backend/sql-scripts/01-create-auth-tables.sql

# 2. Poblar datos iniciales (roles, usuarios, recursos, permisos)
sqlcmd -S tu_servidor -d ChequeoDigital -i backend/sql-scripts/02-seed-auth-data.sql
```

**Alternativa usando SQL Server Management Studio (SSMS)**:
1. Abrir SSMS
2. Conectar a tu servidor
3. Seleccionar base de datos `ChequeoDigital`
4. Abrir y ejecutar `01-create-auth-tables.sql`
5. Abrir y ejecutar `02-seed-auth-data.sql`

### Paso 2: Verificar Creación

```sql
-- Verificar tablas creadas
SELECT * FROM sys.tables WHERE name IN ('UsuariosSistema', 'RolesSistema', 'Resources', 'RoleResourcePermissions', 'TokensRevocados');

-- Verificar usuarios creados
SELECT 
    us.Email, 
    us.Nombre, 
    us.Apellido, 
    r.Nombre AS Rol,
    us.Activo
FROM UsuariosSistema us
INNER JOIN RolesSistema r ON us.RoleId = r.IdRol;

-- Verificar recursos creados
SELECT COUNT(*) AS TotalRecursos FROM Resources;

-- Verificar permisos configurados
SELECT 
    r.Nombre AS Rol,
    COUNT(*) AS TotalPermisos
FROM RoleResourcePermissions rrp
INNER JOIN RolesSistema r ON rrp.IdRol = r.IdRol
GROUP BY r.Nombre;
```

---

## 🔧 Configuración del Backend

### Paso 1: Variables de Entorno

Asegúrate de que tu archivo `.env` en `/backend` tenga:

```env
# JWT Secret (cambiar en producción)
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion

# Database
DB_SERVER=tu_servidor
DB_DATABASE=ChequeoDigital
DB_USER=tu_usuario
DB_PASSWORD=tu_password

# Node Environment
NODE_ENV=development
PORT=3001
```

### Paso 2: Instalar Dependencias

El proyecto ya tiene las dependencias necesarias (`bcrypt`, `jsonwebtoken`, etc.) en `package.json`. Si es necesario:

```bash
cd backend
npm install
```

### Paso 3: Iniciar Backend

```bash
cd backend
npm start
# o para desarrollo con auto-reload:
npm run dev
```

El backend estará corriendo en `http://localhost:3001`.

---

## 🖥️ Configuración del Frontend

### Paso 1: Variables de Entorno

Crea o actualiza el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Paso 2: Instalar Dependencias (si es necesario)

```bash
npm install
```

### Paso 3: Iniciar Frontend

```bash
npm run dev
```

El frontend estará corriendo en `http://localhost:3000`.

---

## 🔑 Credenciales Iniciales

Todos los usuarios tienen la contraseña: **`password123`**

### Superadmins (acceso total)

| Email | Nombre | Organización |
|-------|--------|--------------|
| `saquino@mic.gov.py` | Santiago Aquino | MIC |
| `cdparra@gmail.com` | Christian Parra | PNUD |
| `patricia.lima@gmail.com` | Patricia Lima | PNUD |

### Contributor (acceso operativo)

| Email | Nombre | Organización |
|-------|--------|--------------|
| `victor.cantero@gmail.com` | Victor Cantero | MIC |

### Viewer (solo visualización)

| Email | Nombre | Organización |
|-------|--------|--------------|
| `lucas.frutos@gmail.com` | Lucas Frutos | MIC |

---

## 🔐 Estructura de Permisos

### Roles

#### 1. Superadmin
- **Acceso total** a todos los recursos
- Puede administrar usuarios internos (`PAGE_USUARIOS`)
- Acceso a vista de Testing (`PAGE_TESTING`)
- Puede crear, editar y eliminar en todas las secciones

#### 2. Contributor
- Acceso operativo a:
  - `PAGE_EMPRESAS` (gestión de empresas)
  - `PAGE_EMPRESA_DETALLE` (detalles y edición)
  - `PAGE_RECHEQUEOS` (rechequeos y exportes)
  - `PAGE_CONFIGURACION` (su propio perfil)
- **NO puede acceder**:
  - `PAGE_TESTING`
  - `PAGE_USUARIOS` (administración de usuarios internos)
- Puede editar información de empresas y gestionar usuarios asignados
- **NO puede eliminar** registros

#### 3. Viewer
- **Solo visualización** del Dashboard Looker (`PAGE_DASHBOARD_LOOKER`)
- Acceso a configuración de su perfil (`PAGE_CONFIGURACION`)
- Sin permisos de edición ni creación

### Recursos del Sistema

Los recursos están organizados por categorías:

#### GLOBAL / NAVEGACIÓN
- `PAGE_DASHBOARD_LOOKER` - Dashboard principal
- `PAGE_EMPRESAS` - Listado de empresas
- `PAGE_EMPRESA_DETALLE` - Detalle de empresa
- `PAGE_USUARIOS` - Admin usuarios internos ⚠️ Solo superadmin
- `PAGE_RECHEQUEOS` - Vista de rechequeos
- `PAGE_TESTING` - Testing ⚠️ Solo superadmin
- `PAGE_CONFIGURACION` - Perfil de usuario

#### EMPRESAS (pantalla /empresas)
- `EMPRESAS_FILTERS_TIME` - Filtros de fecha
- `EMPRESAS_FILTERS_SEARCH` - Filtros de búsqueda
- `EMPRESAS_STATS_CARDS` - Cards de resumen
- `EMPRESAS_EXPORT_REPORT` - Exportar reporte
- `EMPRESAS_OBSERVATORIO_TABLE` - Tabla de chequeos
- `EMPRESAS_OBSERVATORIO_ACTION_VIEW` - Ver detalle
- `EMPRESAS_OBSERVATORIO_ACTION_REASSIGN` - Reasignar chequeo
- `EMPRESAS_OBSERVATORIO_ACTION_DELETE` - Eliminar ⚠️ Restringido

#### EMPRESA_DETALLE (pantalla /empresas/:id)
- `EMPRESA_DETAIL_EXPORT_PDF` - Exportar PDF
- `EMPRESA_DETAIL_EDIT_GENERAL_INFO` - Editar info general
- `EMPRESA_DETAIL_MANAGE_ASSIGNED_USERS` - Gestionar usuarios
- `EMPRESA_DETAIL_RESULTS_SECTION` - Resultados de evaluación
- `EMPRESA_DETAIL_HISTORY_SECTION` - Historial
- `EMPRESA_DETAIL_VIEW_RESPUESTAS` - Ver respuestas

#### USUARIOS (admin usuarios internos) ⚠️ Solo superadmin
- `USUARIOS_LIST_VIEW` - Ver tabla
- `USUARIOS_CREATE` - Crear usuario
- `USUARIOS_ACTION_EDIT` - Editar
- `USUARIOS_ACTION_UPDATE_EMAIL` - Actualizar email
- `USUARIOS_ACTION_CHANGE_PASSWORD` - Cambiar contraseña
- `USUARIOS_ACTION_DELETE` - Eliminar

#### RECHEQUEOS (pantalla /rechequeos)
- `RECHEQUEOS_LIST_VIEW` - Listado principal
- `RECHEQUEOS_FILTERS_TIME` - Filtros de tiempo
- `RECHEQUEOS_FILTERS_SEARCH` - Filtros de búsqueda
- `RECHEQUEOS_EXPORT_PDF` - Exportar PDF
- `RECHEQUEOS_EXPORT_CSV` - Exportar CSV
- `RECHEQUEOS_EXPORT_CSV_DETAIL_PER_EMPRESA` - Exportar CSV detallado

---

## 🚀 Uso y Ejemplos

### Backend: Proteger Endpoints

```javascript
const { authMiddleware, requireRole, requireResource } = require('../middlewares/auth-rbac.middleware');

// Requiere autenticación
router.get('/empresas', authMiddleware, empresaController.getAll);

// Requiere rol específico
router.get('/admin', authMiddleware, requireRole('superadmin'), adminController.dashboard);

// Requiere permiso en recurso
router.delete('/empresas/:id', 
  authMiddleware, 
  requireResource('EMPRESAS_OBSERVATORIO_ACTION_DELETE', 'delete'),
  empresaController.delete
);
```

### Frontend: Verificar Permisos en Componentes

```tsx
import { ProtectedResource, usePermission } from '@/components/protected-resource';
import { useAuth } from '@/contexts/auth-context';

function MyComponent() {
  const { hasPermission } = useAuth();
  const canDelete = usePermission('EMPRESAS_OBSERVATORIO_ACTION_DELETE', 'delete');

  return (
    <div>
      {/* Mostrar solo si tiene permiso */}
      <ProtectedResource 
        resourceCode="EMPRESAS_EXPORT_REPORT" 
        action="view"
      >
        <Button>Exportar Reporte</Button>
      </ProtectedResource>

      {/* Condicional con hook */}
      {canDelete && (
        <Button variant="destructive">Eliminar</Button>
      )}
    </div>
  );
}
```

### Frontend: Proteger Rutas Completas

```tsx
import { ProtectedRoute } from '@/components/protected-route';

export default function UsuariosPage() {
  return (
    <ProtectedRoute 
      requiredType="system"
      requiredRoles={['superadmin']}
      redirectTo="/unauthorized"
    >
      <div>
        {/* Contenido solo para superadmin */}
      </div>
    </ProtectedRoute>
  );
}
```

---

## 🧪 Pruebas

### 1. Probar Login Backoffice

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"saquino@mic.gov.py","password":"password123"}'
```

### 2. Probar Endpoint Protegido

```bash
# Usar el token recibido del login
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 3. Verificar Permisos

```bash
# Como superadmin (debería funcionar)
curl -X GET http://localhost:3001/api/usuarios \
  -H "Authorization: Bearer TOKEN_SUPERADMIN"

# Como contributor (debería dar 403)
curl -X GET http://localhost:3001/api/usuarios \
  -H "Authorization: Bearer TOKEN_CONTRIBUTOR"
```

---

## 🔧 Mantenimiento

### Agregar Nuevos Usuarios Internos

Solo superadmin puede crear usuarios desde la interfaz (`/usuarios`) o mediante:

```sql
-- Obtener RoleId
SELECT IdRol FROM RolesSistema WHERE Nombre = 'contributor';

-- Insertar usuario (el hash es de 'password123')
INSERT INTO UsuariosSistema (Email, PasswordHash, Nombre, Apellido, Organizacion, Telefono, RoleId, Activo)
VALUES (
  'nuevo.usuario@ejemplo.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Nombre',
  'Apellido',
  'Organización',
  '0000000',
  2, -- ID del rol
  1
);
```

### Agregar Nuevos Recursos

```sql
-- Insertar recurso
INSERT INTO Resources (Codigo, Descripcion, Categoria)
VALUES ('MI_NUEVO_RECURSO', 'Descripción del recurso', 'CATEGORIA');

-- Asignar permisos a roles
DECLARE @RecursoId INT = (SELECT IdRecurso FROM Resources WHERE Codigo = 'MI_NUEVO_RECURSO');
DECLARE @SuperadminId INT = (SELECT IdRol FROM RolesSistema WHERE Nombre = 'superadmin');

INSERT INTO RoleResourcePermissions (IdRol, IdRecurso, CanView, CanCreate, CanEdit, CanDelete)
VALUES (@SuperadminId, @RecursoId, 1, 1, 1, 1);
```

### Limpiar Tokens Expirados

```sql
-- Ejecutar periódicamente
DELETE FROM TokensRevocados
WHERE FechaExpiracion < SYSUTCDATETIME();
```

---

## 📝 Notas Importantes

1. **Contraseñas en Producción**: Cambiar todas las contraseñas por defecto antes de desplegar.
2. **JWT Secret**: Usar un secreto fuerte y único en producción.
3. **HTTPS**: En producción, usar siempre HTTPS.
4. **CORS**: Configurar CORS apropiadamente en el backend para permitir solo dominios autorizados.
5. **Respaldos**: Realizar respaldos regulares de las tablas de autenticación.

---

## 🐛 Solución de Problemas

### Token inválido o expirado
- Verificar que el backend esté usando el mismo `JWT_SECRET`
- Verificar que el token no haya expirado (5 horas)
- Cerrar sesión y volver a iniciar

### Error 403 (Forbidden)
- Verificar que el usuario tenga el permiso necesario en la tabla `RoleResourcePermissions`
- Verificar el recurso y acción correctos

### Usuario no puede iniciar sesión
- Verificar que `Activo = 1` en `UsuariosSistema`
- Verificar que el email sea correcto
- Verificar que el hash de password coincida

---

## 📞 Soporte

Para problemas o consultas:
- Revisar logs en `/backend/logs/app-*.log`
- Verificar configuración de base de datos
- Contactar al equipo de desarrollo

---

**Última actualización**: Noviembre 2025  
**Versión**: 1.0.0

