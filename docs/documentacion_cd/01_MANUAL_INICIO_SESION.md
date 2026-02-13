# Manual de Usuario: Inicio de Sesión

## Sistema Chequeo Digital - Panel de Control de Innovación Empresarial

---

## 📋 Índice

1. [Acceso al Sistema](#acceso-al-sistema)
2. [Pantalla de Login](#pantalla-de-login)
3. [Proceso de Autenticación](#proceso-de-autenticación)
4. [Roles de Usuario](#roles-de-usuario)
5. [Cierre de Sesión](#cierre-de-sesión)
6. [Solución de Problemas](#solución-de-problemas)

---

## Acceso al Sistema

### Requisitos Previos

Para acceder al sistema necesitará:

- **Navegador Web**: Chrome, Firefox, Edge o Safari (versiones recientes)
- **Conexión a Internet**: Estable para operaciones en tiempo real
- **Credenciales**: Usuario y contraseña proporcionados por el administrador

### URL de Acceso

```
http://[SERVIDOR]:3000
```

Donde `[SERVIDOR]` es la dirección IP o nombre de dominio del servidor donde está instalado el sistema.

---

## Pantalla de Login

### Elementos de la Pantalla

Al acceder a la URL del sistema, verá la pantalla de inicio de sesión con los siguientes elementos:

| Elemento | Descripción |
|----------|-------------|
| **Logo institucional** | Logos del MIC y BID en la cabecera |
| **Campo Email** | Ingrese su correo electrónico registrado |
| **Campo Contraseña** | Ingrese su contraseña (los caracteres se ocultan) |
| **Botón Iniciar Sesión** | Haga clic para autenticarse |

### Pasos para Iniciar Sesión

1. **Abra su navegador** y diríjase a la URL del sistema
2. **Ingrese su email** en el campo correspondiente
3. **Ingrese su contraseña** en el campo de contraseña
4. **Haga clic** en el botón "Iniciar Sesión"
5. **Espere** mientras el sistema verifica sus credenciales
6. Si las credenciales son correctas, será **redirigido** al panel principal

---

## Proceso de Autenticación

### ¿Qué sucede al iniciar sesión?

1. El sistema **valida** su email y contraseña contra la base de datos
2. Se genera un **token de acceso** (JWT) que identifica su sesión
3. El sistema **verifica sus permisos** según el rol asignado
4. Se **carga el menú lateral** con las opciones habilitadas para su rol
5. Es **redirigido** a la página de inicio

### Seguridad de la Sesión

- La sesión tiene una **duración máxima de 24 horas**
- El sistema utiliza **tokens JWT** cifrados
- Las contraseñas se almacenan con **encriptación bcrypt**
- Los tokens pueden ser **revocados** por el administrador

---

## Roles de Usuario

El sistema cuenta con tres niveles de acceso:

### 🟣 Superadmin

**Acceso completo** a todas las funcionalidades:
- Dashboard Looker
- Gestión de Empresas
- Módulo de Rechequeos
- Testing y Configuración
- **Administración de Usuarios del Sistema**
- **Gestión de Usuarios de Empresas**
- **Roles y Permisos**

### 🔵 Contributor

**Acceso operativo** a funcionalidades principales:
- Dashboard Looker
- Gestión de Empresas (ver, editar)
- Módulo de Rechequeos
- Exportación de datos

### 🟢 Viewer

**Acceso de solo lectura**:
- Dashboard Looker (visualización)
- Configuración del perfil personal

---

## Cierre de Sesión

### Cómo cerrar sesión correctamente

1. Haga clic en el **ícono de usuario** en la esquina superior derecha
2. Seleccione la opción **"Cerrar Sesión"**
3. Será redirigido a la pantalla de login
4. El token de sesión será **invalidado**

### Cierre de sesión automático

El sistema cerrará su sesión automáticamente si:
- Han pasado **24 horas** desde el inicio de sesión
- El administrador ha **revocado su token**
- Su cuenta ha sido **desactivada**

---

## Solución de Problemas

### Credenciales incorrectas

**Mensaje**: "Credenciales inválidas"

**Solución**:
1. Verifique que el email esté escrito correctamente
2. Asegúrese de que la contraseña no tenga espacios
3. Compruebe que las mayúsculas/minúsculas sean correctas
4. Contacte al administrador si el problema persiste

### Cuenta desactivada

**Mensaje**: "Cuenta desactivada. Contacte al administrador."

**Solución**:
- Su cuenta ha sido desactivada por el administrador
- Contacte al administrador del sistema para reactivarla

### Sesión expirada

**Mensaje**: "Sesión expirada. Por favor inicie sesión nuevamente."

**Solución**:
1. Inicie sesión nuevamente con sus credenciales
2. Este es un comportamiento normal de seguridad

### No puedo acceder al sistema

**Posibles causas y soluciones**:

| Causa | Solución |
|-------|----------|
| Servidor no disponible | Verifique la conexión a la red |
| URL incorrecta | Confirme la URL con el administrador |
| Navegador incompatible | Use Chrome, Firefox, Edge o Safari |
| Cache del navegador | Limpie la cache y cookies |

---

## Contacto de Soporte

Si tiene problemas de acceso, contacte al administrador del sistema:

- **Email del Administrador**: admin@chequeo.gov.py
- **Área**: Departamento de Sistemas - MIC

---

*Documento actualizado: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
