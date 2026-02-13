# Manual de Usuario: Gestión de Usuarios de Empresas

## Sistema Chequeo Digital - Panel de Control de Innovación Empresarial

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Acceso al Módulo](#acceso-al-módulo)
3. [Búsqueda de Usuarios](#búsqueda-de-usuarios)
4. [Listado de Usuarios](#listado-de-usuarios)
5. [Crear Nuevo Usuario](#crear-nuevo-usuario)
6. [Editar Usuario](#editar-usuario)
7. [Actualizar Email](#actualizar-email)
8. [Cambiar Contraseña](#cambiar-contraseña)
9. [Eliminar Usuario](#eliminar-usuario)

---

## Descripción General

El módulo de **Usuarios de Empresas** permite gestionar las cuentas de los **encuestados** - las personas que representan a las empresas y completan las encuestas de chequeo de innovación.

### Diferencia con Usuarios del Sistema

| Usuarios de Empresas | Usuarios del Sistema |
|---------------------|---------------------|
| Encuestados que completan chequeos | Operadores del backoffice |
| Vinculados a una empresa | Gestionan el panel |
| Acceden a la encuesta externa | Acceden al sistema interno |
| Sin roles de backoffice | Con roles (superadmin, etc.) |

### Funcionalidades Principales

- ✅ **Buscar** usuarios por nombre, email o empresa
- ✅ **Ver** listado paginado de usuarios
- ✅ **Crear** nuevos usuarios de empresa
- ✅ **Editar** información de usuarios
- ✅ **Actualizar** emails de contacto
- ✅ **Cambiar** contraseñas
- ✅ **Eliminar** usuarios (con precaución)

---

## Acceso al Módulo

### Requisitos

- Rol: **Superadmin** únicamente
- Disponible en la sección de Administración

### Desde el Menú Lateral

1. En la sección **"Administración"** del menú
2. Haga clic en **"Usuarios Empresas"** (ícono 👥)
3. La página mostrará el buscador y listado

### URL Directa

```
http://[SERVIDOR]:3000/usuarios
```

---

## Búsqueda de Usuarios

### Campo de Búsqueda

En la parte superior de la página encontrará la tarjeta **"Buscar Usuarios"**.

### Funcionalidad

- Escriba al menos 2 caracteres para buscar
- La búsqueda es **automática** (con debounce de 300ms)
- Busca en: **nombre**, **email** y **empresa**

### Pasos

1. Haga clic en el campo de búsqueda
2. Escriba el término (nombre, email o empresa)
3. Espere mientras se actualiza la lista
4. Los resultados aparecerán automáticamente

### Tips de Búsqueda

| Término | Busca en |
|---------|----------|
| "juan" | Nombres que contienen "juan" |
| "@gmail" | Emails con dominio gmail |
| "constructora" | Empresas con ese nombre |

---

## Listado de Usuarios

### Columnas de la Tabla

| Columna | Descripción |
|---------|-------------|
| **Nombre** | Nombre completo del usuario |
| **Email** | Correo electrónico registrado |
| **Empresa** | Empresa asociada |
| **Fecha Registro** | Cuándo se creó la cuenta |
| **Conectado** | Si está actualmente en sesión |
| **Última vez** | Fecha/hora de última actividad |
| **Acciones** | Botones de gestión |

### Estados de Conexión

| Badge | Significado |
|-------|-------------|
| 🟢 **Sí** | Usuario actualmente conectado |
| ⚪ **No** | Usuario sin sesión activa |

### Paginación

En la parte inferior de la tabla:
- **"Mostrando X de Y usuarios"**: Total de registros
- **Botones de página**: Navegar entre páginas
- **Límite**: 10 usuarios por página

### Botones de Acción

Para cada usuario hay cuatro botones:

| Botón | Color | Acción |
|-------|-------|--------|
| ✏️ | Gris | Editar información |
| ✉️ | Verde | Actualizar email |
| 🔑 | Azul | Cambiar contraseña |
| 🗑️ | Rojo | Eliminar usuario |

---

## Crear Nuevo Usuario

### Pasos

1. Haga clic en **"Nuevo Usuario"** (botón azul)
2. Complete el formulario
3. Haga clic en **"Crear Usuario"**

### Campos del Formulario

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| **Nombre Completo** | ✅ Sí | Nombre y apellido |
| **Email** | ✅ Sí | Debe ser único |
| **Contraseña** | ✅ Sí | Mínimo 8 caracteres |
| **Empresa** | ✅ Sí | Seleccionar empresa existente |
| **Cargo** | ❌ No | Posición en la empresa |

### Consideraciones

- El email debe ser único en todo el sistema
- La empresa debe existir previamente
- El usuario podrá completar encuestas inmediatamente

---

## Editar Usuario

### Pasos

1. Localice el usuario en la tabla
2. Haga clic en el botón **✏️** (lápiz gris)
3. Modifique los campos en el diálogo
4. Haga clic en **"Guardar Cambios"**

### Campos Editables

| Campo | Editable | Notas |
|-------|----------|-------|
| **Nombre Completo** | ✅ Sí | |
| **Cargo** | ✅ Sí | |
| **Empresa** | ✅ Sí | Con precaución |
| **Email** | ❌ No | Usar botón específico |
| **Contraseña** | ❌ No | Usar botón específico |

### Cambiar Empresa

Al cambiar la empresa de un usuario:
- El usuario se desvincula de la empresa anterior
- Se vincula a la nueva empresa
- Los chequeos anteriores permanecen en la empresa original

---

## Actualizar Email

### Cuándo Usar

- El usuario cambió de correo
- Email incorrecto al registrar
- Cambio de dominio corporativo

### Pasos

1. Localice el usuario
2. Haga clic en el botón **✉️** (verde)
3. Ingrese el nuevo email
4. Confirme el cambio

### Validaciones

- El nuevo email debe ser único
- Formato de email válido
- El usuario deberá usar el nuevo email para login

### Notificación

Después de cambiar el email:
- Notifique al usuario del cambio
- El acceso con el email anterior se invalida
- Debe usar el nuevo email para ingresar

---

## Cambiar Contraseña

### Cuándo Usar

- Usuario olvidó su contraseña
- Sospecha de cuenta comprometida
- Solicitud del usuario

### Pasos

1. Localice el usuario
2. Haga clic en el botón **🔑** (azul)
3. Ingrese la nueva contraseña
4. Haga clic en **"Cambiar Contraseña"**

### Requisitos

- Mínimo **8 caracteres**
- Se recomienda mezcla de letras y números

### Comunicación Segura

- NO envíe la contraseña por email sin cifrar
- Comunique la contraseña de forma segura
- Recomiende al usuario cambiarla después

---

## Eliminar Usuario

### ⚠️ Advertencia Importante

**La eliminación de un usuario es irreversible** y elimina:
- La cuenta del usuario
- Todos los chequeos realizados por el usuario
- Las respuestas de encuestas asociadas

### Cuándo Usar

- Usuario duplicado
- Cuenta creada por error
- Solicitud formal de eliminación (GDPR/Ley de protección de datos)

### Pasos

1. Localice el usuario
2. Haga clic en el botón **🗑️** (rojo)
3. Lea la advertencia cuidadosamente
4. Confirme la eliminación

### Alternativa: Desasignar

Si solo quiere remover al usuario de una empresa sin eliminar datos:
1. Vaya al detalle de la empresa
2. En gestión de usuarios, desasigne al usuario
3. El usuario y sus datos permanecen

---

## Flujos de Trabajo Típicos

### Escenario: Usuario solicita cambio de email

1. Verifique la identidad del solicitante
2. Busque al usuario por el email actual
3. Haga clic en actualizar email (✉️)
4. Ingrese el nuevo email
5. Confirme y notifique al usuario

### Escenario: Empresa reporta que empleado se fue

1. Busque al usuario por empresa
2. Verifique que es el usuario correcto
3. **Opción A**: Desasignar de la empresa (mantiene datos)
4. **Opción B**: Eliminar completamente (si los datos no son necesarios)

### Escenario: Nuevo representante de empresa

1. Cree el nuevo usuario
2. Asígnelo a la empresa correspondiente
3. Proporcione credenciales de forma segura
4. El usuario podrá completar nuevos chequeos

---

## Preguntas Frecuentes

### ¿Un usuario puede estar en múltiples empresas?

Sí, un usuario puede estar vinculado a varias empresas. Esto es útil para consultores que representan múltiples organizaciones.

### ¿Qué pasa con los chequeos si elimino un usuario?

Se eliminan todos los chequeos realizados por ese usuario. Esta acción es irreversible.

### ¿Puedo ver las encuestas completadas por un usuario?

Sí, puede ver las encuestas desde el detalle de la empresa asociada, en la sección de historial.

### ¿Por qué no puedo editar el email directamente?

Por seguridad, el cambio de email tiene su propio flujo con validaciones específicas para evitar errores.

### ¿Los usuarios pueden acceder a este panel?

No. Los usuarios de empresas solo acceden a la encuesta de chequeo. No tienen acceso al backoffice.

---

*Documento actualizado: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
