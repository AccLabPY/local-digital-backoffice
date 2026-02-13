# 🚀 Inicio Rápido - Sistema de Autenticación RBAC

Guía rápida para configurar y probar el nuevo sistema de autenticación.

---

## ⚡ Setup Rápido (5 minutos)

### 1️⃣ Base de Datos

```bash
# Ejecutar scripts SQL en orden
sqlcmd -S tu_servidor -d ChequeoDigital -i backend/sql-scripts/01-create-auth-tables.sql
sqlcmd -S tu_servidor -d ChequeoDigital -i backend/sql-scripts/02-seed-auth-data.sql
```

**Alternativa SSMS**:
1. Abrir SQL Server Management Studio
2. Conectar a tu servidor
3. Seleccionar base de datos `ChequeoDigital`
4. Ejecutar `01-create-auth-tables.sql`
5. Ejecutar `02-seed-auth-data.sql`

### 2️⃣ Backend

```bash
cd backend

# Crear archivo .env con:
cat > .env << EOL
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
DB_SERVER=localhost
DB_DATABASE=ChequeoDigital
DB_USER=tu_usuario
DB_PASSWORD=tu_password
NODE_ENV=development
PORT=3001
EOL

# Instalar dependencias (si es necesario)
npm install

# Iniciar backend
npm start
```

### 3️⃣ Frontend

```bash
# En la raíz del proyecto

# Crear archivo .env.local con:
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local

# Instalar dependencias (si es necesario)
npm install

# Iniciar frontend
npm run dev
```

---

## 🔑 Credenciales de Prueba

Todos los usuarios usan el password: **`password123`**

| Email | Rol | Acceso |
|-------|-----|--------|
| `saquino@mic.gov.py` | Superadmin | Total |
| `victor.cantero@gmail.com` | Contributor | Empresas + Rechequeos |
| `lucas.frutos@gmail.com` | Viewer | Solo Dashboard |

---

## ✅ Verificación Rápida

### Test 1: Acceder al Login
1. Abrir `http://localhost:3000/login`
2. Debería ver pantalla de login moderna con logos MIC y BID

### Test 2: Login como Superadmin
1. Email: `saquino@mic.gov.py`
2. Password: `password123`
3. Debería redirigir a `/dashboard` con header mostrando usuario

### Test 3: Verificar Permisos
1. Como Superadmin, acceder a `/usuarios` ✅ (debería funcionar)
2. Cerrar sesión
3. Login como Contributor: `victor.cantero@gmail.com`
4. Intentar acceder a `/usuarios` ❌ (debería redirigir)
5. Acceder a `/empresas` ✅ (debería funcionar)

### Test 4: Configuración de Perfil
1. Click en avatar en header (esquina superior derecha)
2. Click en "Mi Perfil / Configuración"
3. Cambiar nombre o teléfono
4. Click en "Guardar Cambios"
5. Verificar que se actualizó en el header

---

## 📊 Arquitectura Rápida

```
Login (email + password)
    ↓
JWT Token (5 horas)
    ↓
AuthContext (React)
    ↓
hasPermission(resource, action)
    ↓
Renderizar UI según permisos
```

### Roles:
- **Superadmin**: Acceso total
- **Contributor**: Empresas + Rechequeos (sin Testing ni Usuarios)
- **Viewer**: Solo Dashboard Looker

### Recursos (ejemplos):
- `PAGE_EMPRESAS` - Vista de empresas
- `PAGE_USUARIOS` - Admin usuarios internos (solo superadmin)
- `EMPRESAS_OBSERVATORIO_ACTION_DELETE` - Botón eliminar (solo superadmin)

---

## 🛠️ Uso en Código

### Backend: Proteger Endpoint

```javascript
const { authMiddleware, requireResource } = require('../middlewares/auth-rbac.middleware');

router.delete('/empresas/:id', 
  authMiddleware,
  requireResource('EMPRESAS_OBSERVATORIO_ACTION_DELETE', 'delete'),
  empresaController.delete
);
```

### Frontend: Proteger Componente

```tsx
import { ProtectedResource } from '@/components/protected-resource';

<ProtectedResource resourceCode="EMPRESAS_EXPORT_REPORT" action="view">
  <Button>Exportar Reporte</Button>
</ProtectedResource>
```

### Frontend: Proteger Ruta

```tsx
import { ProtectedRoute } from '@/components/protected-route';

export default function UsuariosPage() {
  return (
    <ProtectedRoute requiredType="system" requiredRoles={['superadmin']}>
      {/* Contenido */}
    </ProtectedRoute>
  );
}
```

---

## 🐛 Problemas Comunes

### Backend no inicia
- ✅ Verificar que SQL Server esté corriendo
- ✅ Verificar credenciales en `.env`
- ✅ Verificar puerto 3001 disponible

### Frontend no conecta
- ✅ Verificar `NEXT_PUBLIC_API_URL` en `.env.local`
- ✅ Verificar que backend esté corriendo en 3001

### Login falla
- ✅ Verificar que scripts SQL se ejecutaron correctamente
- ✅ Verificar que UsuariosSistema tiene usuarios
- ✅ Verificar password: `password123`

### 403 (Forbidden)
- ✅ Usuario no tiene el permiso necesario
- ✅ Verificar permisos en tabla `RoleResourcePermissions`
- ✅ Cerrar sesión y volver a iniciar

---

## 📚 Documentación Completa

- **Instalación Detallada**: `docs/AUTH_SETUP.md`
- **Ejemplos de Uso**: `docs/PERMISSION_EXAMPLES.md`
- **Resumen Completo**: `docs/AUTH_SYSTEM_COMPLETE.md`

---

## 🎉 ¡Listo!

El sistema ya está funcionando. Algunas acciones útiles:

1. **Cambiar password de un usuario**:
   - Login → Header → Mi Perfil → Cambiar Contraseña

2. **Ver todos los recursos**:
   ```sql
   SELECT * FROM Resources ORDER BY Categoria, Codigo;
   ```

3. **Ver permisos de contributor**:
   ```sql
   SELECT r.Codigo, rrp.* 
   FROM RoleResourcePermissions rrp
   JOIN Resources r ON rrp.IdRecurso = r.IdRecurso
   WHERE IdRol = (SELECT IdRol FROM RolesSistema WHERE Nombre = 'contributor');
   ```

4. **Agregar nuevo usuario (como superadmin)**:
   - Login como superadmin
   - Ir a `/usuarios`
   - Click en "Nuevo usuario"

---

**¿Dudas?** Revisa la documentación completa en `/docs/`

**¡Importante!** Antes de producción:
- 🔐 Cambiar todos los passwords
- 🔒 Cambiar JWT_SECRET
- 🌐 Usar HTTPS
- 🚫 Deshabilitar modo desarrollo

---

**Versión**: 1.0.0 | **Fecha**: Noviembre 2025

