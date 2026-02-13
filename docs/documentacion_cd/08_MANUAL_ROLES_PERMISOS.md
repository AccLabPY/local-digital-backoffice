# Manual de Usuario: Roles y Permisos

## Sistema Chequeo Digital - Panel de Control de Innovación Empresarial

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Acceso al Módulo](#acceso-al-módulo)
3. [Vista de Roles](#vista-de-roles)
4. [Recursos del Sistema](#recursos-del-sistema)
5. [Edición de Permisos](#edición-de-permisos)
6. [Matriz de Permisos](#matriz-de-permisos)
7. [Mejores Prácticas](#mejores-prácticas)

---

## Descripción General

El módulo de **Roles y Permisos** permite gestionar el sistema de control de acceso basado en roles (RBAC - Role-Based Access Control). Define qué acciones puede realizar cada tipo de usuario en cada recurso del sistema.

### Conceptos Clave

| Concepto | Definición |
|----------|------------|
| **Rol** | Conjunto de permisos asignados a un tipo de usuario |
| **Recurso** | Elemento del sistema (página, botón, acción) |
| **Permiso** | Capacidad de realizar una acción sobre un recurso |
| **RBAC** | Control de acceso basado en roles |

### Funcionalidades Principales

- ✅ **Visualizar** los roles existentes
- ✅ **Ver** los recursos del sistema
- ✅ **Editar** permisos de cada rol
- ✅ **Configurar** acceso granular por recurso

---

## Acceso al Módulo

### Requisitos

- Rol: **Superadmin** únicamente
- Conocimiento del modelo de permisos

### Desde el Menú Lateral

1. En la sección **"Administración"**
2. Haga clic en **"Roles y Permisos"** (ícono 🛡️)
3. La página mostrará los roles y recursos

### URL Directa

```
http://[SERVIDOR]:3000/roles
```

---

## Vista de Roles

### Tarjetas de Roles

Cada rol se muestra en una tarjeta con:

| Elemento | Descripción |
|----------|-------------|
| **Ícono** | Escudo que identifica la sección |
| **Badge** | Nombre del rol con color distintivo |
| **Nombre** | Título del rol |
| **Descripción** | Propósito del rol |
| **Botón** | "Editar Permisos" |

### Roles Disponibles

#### 🟣 Superadmin

**Descripción**: Control total del sistema. Acceso a todas las funciones incluyendo administración de usuarios internos.

**Características**:
- Todos los permisos habilitados
- No se puede restringir
- Acceso a administración

#### 🔵 Contributor

**Descripción**: Acceso operativo a empresas y rechequeos. Sin acceso a Testing ni administración de usuarios.

**Características**:
- Acceso a módulos operativos
- Sin funciones administrativas
- Puede editar empresas

#### ⚪ Viewer

**Descripción**: Solo visualización del Dashboard Looker. Sin permisos de edición.

**Características**:
- Solo lectura
- Acceso limitado al dashboard
- Sin capacidad de modificación

---

## Recursos del Sistema

### Categorías de Recursos

Los recursos están organizados en categorías:

#### GLOBAL (Navegación)

| Código | Descripción |
|--------|-------------|
| `PAGE_DASHBOARD_LOOKER` | Acceso al dashboard principal |
| `PAGE_EMPRESAS` | Vista de listado de empresas |
| `PAGE_EMPRESA_DETALLE` | Detalle individual de empresa |
| `PAGE_USUARIOS` | Administración de usuarios |
| `PAGE_RECHEQUEOS` | Vista de rechequeos |
| `PAGE_TESTING` | Menú de testing |
| `PAGE_CONFIGURACION` | Configuración y perfil |

#### EMPRESAS (Módulo de Empresas)

| Código | Descripción |
|--------|-------------|
| `EMPRESAS_FILTERS_TIME` | Filtros rápidos de fecha |
| `EMPRESAS_FILTERS_SEARCH` | Filtros de búsqueda |
| `EMPRESAS_STATS_CARDS` | Cards de resumen |
| `EMPRESAS_EXPORT_REPORT` | Botón exportar reporte |
| `EMPRESAS_OBSERVATORIO_TABLE` | Tabla observatorio |
| `EMPRESAS_OBSERVATORIO_ACTION_VIEW` | Botón ver detalle |
| `EMPRESAS_OBSERVATORIO_ACTION_REASSIGN` | Botón reasignar chequeo |
| `EMPRESAS_OBSERVATORIO_ACTION_DELETE` | Botón eliminar registro |

#### EMPRESA_DETALLE (Detalle de Empresa)

| Código | Descripción |
|--------|-------------|
| `EMPRESA_DETAIL_EXPORT_PDF` | Exportar ficha PDF |
| `EMPRESA_DETAIL_EDIT_GENERAL_INFO` | Editar información general |
| `EMPRESA_DETAIL_MANAGE_ASSIGNED_USERS` | Gestionar usuarios |
| `EMPRESA_DETAIL_RESULTS_SECTION` | Sección de resultados |
| `EMPRESA_DETAIL_HISTORY_SECTION` | Sección de historial |
| `EMPRESA_DETAIL_VIEW_RESPUESTAS` | Ver respuestas |

#### USUARIOS (Gestión de Usuarios)

| Código | Descripción |
|--------|-------------|
| `USUARIOS_LIST_VIEW` | Ver tabla de usuarios |
| `USUARIOS_CREATE` | Crear usuario |
| `USUARIOS_ACTION_EDIT` | Editar usuario |
| `USUARIOS_ACTION_UPDATE_EMAIL` | Actualizar email |
| `USUARIOS_ACTION_CHANGE_PASSWORD` | Cambiar contraseña |
| `USUARIOS_ACTION_DELETE` | Eliminar usuario |

#### RECHEQUEOS (Módulo de Rechequeos)

| Código | Descripción |
|--------|-------------|
| `RECHEQUEOS_LIST_VIEW` | Ver listado de rechequeos |
| `RECHEQUEOS_FILTERS_TIME` | Filtros de tiempo |
| `RECHEQUEOS_FILTERS_SEARCH` | Filtros de búsqueda |
| `RECHEQUEOS_EXPORT_PDF` | Exportar PDF |
| `RECHEQUEOS_EXPORT_CSV` | Exportar CSV |
| `RECHEQUEOS_EXPORT_CSV_DETAIL_PER_EMPRESA` | Exportar detalle por empresa |

---

## Edición de Permisos

### Abrir Editor de Permisos

1. En la tarjeta del rol, haga clic en **"Editar Permisos"**
2. Se abrirá un diálogo con todos los recursos
3. Cada recurso tiene 4 switches de permiso

### Tipos de Permisos

| Permiso | Significado |
|---------|-------------|
| **Ver** | Puede visualizar el recurso |
| **Crear** | Puede crear nuevos elementos |
| **Editar** | Puede modificar elementos existentes |
| **Eliminar** | Puede eliminar elementos |

### Interfaz de Edición

Para cada recurso se muestran:

```
┌─────────────────────────────────────────────┐
│ EMPRESAS_EXPORT_REPORT                      │
│ Botón "Exportar Reporte"                    │
├─────────────────────────────────────────────┤
│ [○] Ver  [○] Crear  [○] Editar  [○] Eliminar│
└─────────────────────────────────────────────┘
```

- Los switches activos (●) indican permiso habilitado
- Los switches inactivos (○) indican permiso denegado

### Guardar Cambios

1. Modifique los switches según necesidad
2. Haga clic en **"Guardar Cambios"**
3. Los cambios se aplican inmediatamente
4. El botón se deshabilitará si no hay cambios

### Cancelar Cambios

- Haga clic en **"Cancelar"** para cerrar sin guardar
- Los cambios no guardados se perderán

---

## Matriz de Permisos

### Permisos por Defecto

| Recurso | Superadmin | Contributor | Viewer |
|---------|:----------:|:-----------:|:------:|
| **GLOBAL** |
| Dashboard Looker | ✅ VCEU | ✅ V--- | ✅ V--- |
| Empresas | ✅ VCEU | ✅ V--- | ❌ ---- |
| Rechequeos | ✅ VCEU | ✅ V--- | ❌ ---- |
| Usuarios | ✅ VCEU | ❌ ---- | ❌ ---- |
| Testing | ✅ VCEU | ❌ ---- | ❌ ---- |
| **EMPRESAS** |
| Filtros | ✅ VCEU | ✅ V--- | ❌ ---- |
| Cards | ✅ VCEU | ✅ V--- | ❌ ---- |
| Exportar | ✅ VCEU | ✅ V-E- | ❌ ---- |
| Tabla | ✅ VCEU | ✅ V--- | ❌ ---- |
| Ver Detalle | ✅ VCEU | ✅ V--- | ❌ ---- |
| Reasignar | ✅ VCEU | ✅ -C-- | ❌ ---- |
| Eliminar | ✅ VCEU | ❌ ---- | ❌ ---- |
| **EMPRESA_DETALLE** |
| Exportar PDF | ✅ VCEU | ✅ V--- | ❌ ---- |
| Editar Info | ✅ VCEU | ✅ --E- | ❌ ---- |
| Gestionar Usuarios | ✅ VCEU | ✅ --E- | ❌ ---- |
| Resultados | ✅ VCEU | ✅ V--- | ❌ ---- |
| Historial | ✅ VCEU | ✅ V--- | ❌ ---- |

**Leyenda**: V=Ver, C=Crear, E=Editar, U=Eliminar (Delete)

---

## Mejores Prácticas

### Principio de Menor Privilegio

> Asigne solo los permisos estrictamente necesarios para las funciones del rol.

**Ejemplo**: Un analista que solo revisa datos debería ser Viewer, no Contributor.

### No Modificar Superadmin

- El rol Superadmin debe mantener todos los permisos
- No se recomienda restringir permisos de este rol
- Siempre debe haber al menos un superadmin activo

### Documentar Cambios

Cuando modifique permisos:
1. Documente el cambio realizado
2. Registre la fecha y razón
3. Notifique a los usuarios afectados

### Revisión Periódica

- Revise los permisos mensualmente
- Verifique que los roles siguen siendo apropiados
- Ajuste según cambios en la organización

### Pruebas de Cambios

Antes de aplicar cambios en producción:
1. Pruebe con un usuario de prueba
2. Verifique que los permisos funcionan
3. Confirme que no hay efectos secundarios

---

## Preguntas Frecuentes

### ¿Puedo crear nuevos roles?

Actualmente el sistema tiene tres roles predefinidos. La creación de nuevos roles requiere modificación de la base de datos.

### ¿Los cambios son inmediatos?

Sí, los cambios de permisos se aplican inmediatamente. Los usuarios activos verán los cambios en su próxima acción.

### ¿Qué pasa si quito todos los permisos de un rol?

El rol seguirá existiendo pero los usuarios con ese rol no podrán acceder a ninguna funcionalidad (excepto logout).

### ¿Puedo ver quién cambió los permisos?

Actualmente no hay log de auditoría visible en el frontend. Los logs están en el servidor.

### ¿Qué recursos no se pueden editar?

Algunos recursos son de solo lectura por diseño (ej: configuración del sistema). Estos no aparecen en el editor.

---

*Documento actualizado: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
