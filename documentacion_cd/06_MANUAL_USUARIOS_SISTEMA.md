# Manual de Usuario: Gestión de Usuarios del Sistema

## Sistema Chequeo Digital - Panel de Control de Innovación Empresarial

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Acceso al Módulo](#acceso-al-módulo)
3. [Listado de Usuarios](#listado-de-usuarios)
4. [Crear Nuevo Usuario](#crear-nuevo-usuario)
5. [Editar Usuario](#editar-usuario)
6. [Resetear Contraseña](#resetear-contraseña)
7. [Desactivar Usuario](#desactivar-usuario)
8. [Roles del Sistema](#roles-del-sistema)

---

## Descripción General

El módulo de **Usuarios del Sistema** permite administrar las cuentas de los operadores que tienen acceso al backoffice de Chequeo Digital. Este módulo está disponible **únicamente para Superadmins**.

### Diferencia con Usuarios de Empresas

| Usuarios del Sistema | Usuarios de Empresas |
|---------------------|---------------------|
| Operadores del backoffice | Encuestados de las empresas |
| Acceden al panel de control | Completan encuestas |
| Tienen roles (superadmin, contributor, viewer) | Solo completan chequeos |
| Gestionados en este módulo | Gestionados en módulo de Usuarios |

### Funcionalidades Principales

- ✅ **Ver** lista de usuarios del sistema
- ✅ **Crear** nuevos usuarios operadores
- ✅ **Editar** información de usuarios existentes
- ✅ **Resetear** contraseñas de usuarios
- ✅ **Desactivar/Activar** cuentas de usuarios
- ✅ **Asignar** roles y permisos

---

## Acceso al Módulo

### Requisitos

- Rol: **Superadmin** únicamente
- Este módulo no está visible para otros roles

### Desde el Menú Lateral

1. En la sección **"Administración"** del menú lateral
2. Haga clic en **"Usuarios Sistema"** (ícono 👤⚙️)
3. La página mostrará el listado de usuarios

### URL Directa

```
http://[SERVIDOR]:3000/usuarios-sistema
```

---

## Listado de Usuarios

### Información de la Tabla

| Columna | Descripción |
|---------|-------------|
| **Nombre** | Nombre completo del usuario |
| **Email** | Correo electrónico (usado para login) |
| **Organización** | Entidad/empresa del usuario |
| **Rol** | Rol asignado (superadmin, contributor, viewer) |
| **Estado** | Activo o Inactivo |
| **Fecha Creación** | Cuándo se creó la cuenta |
| **Acciones** | Botones de gestión |

### Badges de Rol

| Rol | Color |
|-----|-------|
| **Superadmin** | Púrpura |
| **Contributor** | Azul |
| **Viewer** | Gris |

### Badges de Estado

| Estado | Color |
|--------|-------|
| **Activo** | Verde |
| **Inactivo** | Rojo |

### Botones de Acción

Para cada usuario se muestran tres botones:

| Botón | Acción |
|-------|--------|
| ✏️ (Lápiz) | Editar información |
| 🔑 (Llave) | Resetear contraseña |
| 🗑️ (Basura) | Desactivar usuario |

---

## Crear Nuevo Usuario

### Pasos

1. Haga clic en el botón **"Nuevo Usuario"** (azul, esquina superior derecha)
2. Complete el formulario de creación
3. Haga clic en **"Crear Usuario"**

### Campos del Formulario

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| **Nombre** | ✅ Sí | Nombre de pila |
| **Apellido** | ✅ Sí | Apellido(s) |
| **Email** | ✅ Sí | Debe ser único, usado para login |
| **Contraseña** | ✅ Sí | Mínimo 8 caracteres |
| **Rol** | ✅ Sí | Seleccionar del dropdown |
| **Organización** | ❌ No | Entidad del usuario |
| **Teléfono** | ❌ No | Contacto telefónico |

### Validaciones

- **Email**: Debe ser único en el sistema
- **Contraseña**: Mínimo 8 caracteres
- **Campos requeridos**: Marcados con asterisco (*)

### Después de Crear

- El usuario recibirá acceso inmediato
- Puede iniciar sesión con email y contraseña
- Tendrá permisos según el rol asignado

---

## Editar Usuario

### Pasos

1. En la tabla, localice el usuario
2. Haga clic en el botón **✏️** (lápiz)
3. Se abrirá el diálogo de edición
4. Modifique los campos necesarios
5. Haga clic en **"Guardar Cambios"**

### Campos Editables

| Campo | Editable |
|-------|----------|
| **Nombre** | ✅ Sí |
| **Apellido** | ✅ Sí |
| **Email** | ✅ Sí |
| **Rol** | ✅ Sí |
| **Organización** | ✅ Sí |
| **Teléfono** | ✅ Sí |
| **Contraseña** | ❌ No (usar reseteo) |

### Consideraciones

- Al cambiar el **rol**, los permisos se actualizan inmediatamente
- El cambio de **email** afectará el login del usuario
- Los cambios son efectivos al guardar

---

## Resetear Contraseña

### Cuándo Usar

- Usuario olvidó su contraseña
- Sospecha de cuenta comprometida
- Política de cambio periódico

### Pasos

1. Localice el usuario en la tabla
2. Haga clic en el botón **🔑** (llave azul)
3. Ingrese la nueva contraseña en el diálogo
4. Haga clic en **"Resetear Contraseña"**

### Requisitos de Contraseña

- **Mínimo 8 caracteres**
- Se recomienda combinar letras, números y símbolos
- No debe ser igual a las anteriores

### Comunicación

Después de resetear:
- Comunique la nueva contraseña al usuario de forma segura
- Recomiende cambiarla en el primer ingreso
- No envíe contraseñas por canales inseguros

---

## Desactivar Usuario

### Cuándo Usar

- Usuario dejó la organización
- Cuenta temporal que expiró
- Sospecha de mal uso

### Pasos

1. Localice el usuario en la tabla
2. Haga clic en el botón **🗑️** (basura roja)
3. Confirme la acción en el diálogo
4. El usuario será desactivado

### ¿Qué Sucede al Desactivar?

- ❌ El usuario no puede iniciar sesión
- ❌ Las sesiones activas son invalidadas
- ✅ Los datos del usuario se conservan
- ✅ Se puede reactivar posteriormente

### Reactivación

Para reactivar un usuario desactivado:
1. Edite el usuario
2. Cambie el estado a "Activo"
3. Guarde los cambios

> **Nota**: La tabla por defecto muestra usuarios activos e inactivos.

---

## Roles del Sistema

### Superadmin

**Descripción**: Control total del sistema

**Permisos**:
- ✅ Todas las pantallas
- ✅ Todas las acciones CRUD
- ✅ Administración de usuarios
- ✅ Gestión de roles y permisos
- ✅ Testing y configuración

**Casos de uso**:
- Administradores del MIC
- Personal técnico del proyecto
- Consultores principales

### Contributor

**Descripción**: Acceso operativo

**Permisos**:
- ✅ Dashboard Looker
- ✅ Módulo de Empresas (ver, editar)
- ✅ Módulo de Rechequeos
- ✅ Exportación de datos
- ❌ Administración de usuarios
- ❌ Testing

**Casos de uso**:
- Analistas de programa
- Personal operativo
- Consultores de campo

### Viewer

**Descripción**: Solo visualización

**Permisos**:
- ✅ Dashboard Looker (solo ver)
- ✅ Configuración de perfil
- ❌ Acceso a otros módulos
- ❌ Exportación de datos
- ❌ Modificación de datos

**Casos de uso**:
- Directivos que monitorean
- Personal del BID
- Auditores externos

---

## Mejores Prácticas

### Seguridad

1. **Principio de menor privilegio**: Asigne el rol mínimo necesario
2. **Revisión periódica**: Revise usuarios inactivos
3. **Contraseñas fuertes**: Exija mínimo 8 caracteres
4. **Desactivación inmediata**: Al salir personal, desactive cuentas

### Gestión

1. **Documentar**: Registre por qué se crean usuarios
2. **Comunicar**: Notifique a usuarios sobre sus credenciales
3. **Auditar**: Revise logs de acceso periódicamente
4. **Backup**: Mantenga registro de usuarios y roles

---

## Preguntas Frecuentes

### ¿Puedo eliminar un usuario permanentemente?

No, el sistema solo permite **desactivar** usuarios para mantener trazabilidad. Los datos se conservan por auditoría.

### ¿Cuántos usuarios puedo crear?

No hay límite técnico. El límite es operativo según las necesidades del programa.

### ¿Qué pasa si desactivo mi propia cuenta?

No puede desactivar su propia cuenta mientras está en sesión. Otro superadmin debe hacerlo.

### ¿Cómo veo el historial de acciones de un usuario?

Actualmente no hay log de auditoría visible en el frontend. Los logs están en el servidor para consulta técnica.

---

*Documento actualizado: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
