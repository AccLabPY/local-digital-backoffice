# Documentación Técnica: Guía de Instalación

## Chequeo Digital 2.0 - Instalación y Despliegue

---

## 📋 Índice

1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [Instalación de Dependencias](#instalación-de-dependencias)
3. [Configuración de Base de Datos](#configuración-de-base-de-datos)
4. [Configuración del Backend](#configuración-del-backend)
5. [Configuración del Frontend](#configuración-del-frontend)
6. [Ejecución del Sistema](#ejecución-del-sistema)
7. [Verificación de Instalación](#verificación-de-instalación)
8. [Troubleshooting](#troubleshooting)

---

## Requisitos del Sistema

### Hardware Mínimo

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disco | 20 GB SSD | 50 GB SSD |
| Red | 100 Mbps | 1 Gbps |

### Software Requerido

| Software | Versión Mínima | Notas |
|----------|----------------|-------|
| **Windows Server** | 2012 R2 | O Windows 10/11 |
| **Node.js** | 18.x LTS | Recomendado: 20.x LTS |
| **SQL Server** | 2012 | Configurado y accesible |
| **Redis** | 7.x | Opcional (hay fallback a memoria) |
| **Git** | 2.x | Para clonar repositorio |

### Puertos Requeridos

| Puerto | Servicio |
|--------|----------|
| 3000 | Frontend (Next.js) |
| 3001 | Backend (Express) |
| 1433 | SQL Server |
| 6379 | Redis (opcional) |

---

## Instalación de Dependencias

### 1. Node.js

**Windows:**
```powershell
# Descargar desde https://nodejs.org/
# Instalar versión LTS (18.x o superior)

# Verificar instalación
node --version  # v18.x.x o superior
npm --version   # 9.x.x o superior
```

### 2. Git

```powershell
# Descargar desde https://git-scm.com/
# Instalar con opciones por defecto

# Verificar instalación
git --version
```

### 3. Redis (Opcional)

**Opción A: Memurai (Recomendado para Windows)**
```powershell
# Descargar desde https://www.memurai.com/
# Ejecutar instalador
# El servicio inicia automáticamente
```

**Opción B: Sin Redis**
- El sistema funciona sin Redis
- Usará caché en memoria automáticamente
- Menor rendimiento pero funcional

---

## Configuración de Base de Datos

### 1. Acceso a SQL Server

Verificar que tiene acceso a la base de datos `BID_v2_22122025`:

```sql
-- En SQL Server Management Studio
USE BID_v2_22122025;
SELECT COUNT(*) FROM Empresa;
```

### 2. Crear Usuario de Base de Datos

```sql
-- Crear login
CREATE LOGIN chequeo_app WITH PASSWORD = 'SecurePassword123!';

-- Crear usuario en la base de datos
USE BID_v2_22122025;
CREATE USER chequeo_app FOR LOGIN chequeo_app;

-- Asignar permisos
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO chequeo_app;
GRANT CREATE TABLE TO chequeo_app;
GRANT CREATE VIEW TO chequeo_app;
```

### 3. Ejecutar Script de Instalación

```powershell
# Abrir SQL Server Management Studio
# Conectar a la base de datos
# Abrir archivo: backend/sql-scripts/INSTALACION-COMPLETA.sql
# Ejecutar (F5)
```

El script creará:
- Tablas de autenticación (RolesSistema, UsuariosSistema, etc.)
- Usuario admin inicial (admin@chequeo.gov.py / password123)
- Vistas optimizadas (vw_RechequeosBase, vw_RechequeosKPIs, etc.)
- Índices de rendimiento

---

## Configuración del Backend

### 1. Clonar Repositorio

```powershell
cd C:\proyectos
git clone [URL_REPOSITORIO] chequeo
cd chequeo
```

### 2. Instalar Dependencias

```powershell
# Instalar dependencias del backend
cd backend
npm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env` en la carpeta `backend`:

```env
# Servidor
PORT=3001
NODE_ENV=development

# Base de Datos SQL Server
DB_HOST=localhost
DB_PORT=1433
DB_USER=chequeo_app
DB_PASSWORD=SecurePassword123!
DB_NAME=BID_v2_22122025
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true

# JWT
JWT_SECRET=una-clave-secreta-muy-larga-y-segura-para-jwt-tokens
JWT_EXPIRES_IN=24h

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Logging
LOG_LEVEL=info
```

### 4. Verificar Conexión

```powershell
cd backend
node -e "require('./src/config/database').poolPromise.then(() => console.log('DB OK')).catch(e => console.log('Error:', e.message))"
```

---

## Configuración del Frontend

### 1. Instalar Dependencias

```powershell
# Desde la raíz del proyecto
cd ..
npm install --legacy-peer-deps
```

### 2. Configurar Variables de Entorno

Crear archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 3. Verificar Instalación

```powershell
npm run build
```

---

## Ejecución del Sistema

### Opción 1: Scripts PowerShell (Recomendado)

```powershell
# Desde la raíz del proyecto
.\Start-ChequeoDigital.ps1
```

Este script:
- Verifica Node.js
- Inicia el backend en puerto 3001
- Inicia el frontend en puerto 3000
- Abre el navegador automáticamente

Para detener:
```powershell
.\Stop-ChequeoDigital.ps1
```

### Opción 2: Manual

**Terminal 1 - Backend:**
```powershell
cd backend
npm start
# Mensaje: Server running on port 3001
```

**Terminal 2 - Frontend:**
```powershell
cd [raíz del proyecto]
npm run dev
# Mensaje: ready - started server on 0.0.0.0:3000
```

### Opción 3: Batch Files

```powershell
.\start-chequeo.bat  # Iniciar
.\stop-chequeo.bat   # Detener
```

---

## Verificación de Instalación

### 1. Health Check del Backend

```powershell
curl http://localhost:3001/health
```

Respuesta esperada:
```json
{
  "status": "UP",
  "timestamp": "2024-12-02T..."
}
```

### 2. Documentación API

Abrir en navegador:
```
http://localhost:3001/api-docs
```

Debería mostrar Swagger UI con todos los endpoints.

### 3. Frontend

Abrir en navegador:
```
http://localhost:3000
```

### 4. Login de Prueba

Credenciales por defecto:
- **Email**: admin@chequeo.gov.py
- **Password**: password123

### 5. Verificar Vistas SQL

```sql
-- En SQL Server Management Studio
USE BID_v2_22122025;

SELECT COUNT(*) AS BaseCount FROM vw_RechequeosBase;
SELECT COUNT(*) AS KPIsCount FROM vw_RechequeosKPIs;
SELECT COUNT(*) AS TablaCount FROM vw_RechequeosTabla;
```

---

## Troubleshooting

### Error: ECONNREFUSED al conectar a BD

**Causa**: SQL Server no está accesible

**Solución**:
1. Verificar que SQL Server está corriendo
2. Verificar puerto 1433 está abierto
3. Verificar credenciales en `.env`
4. Verificar firewall permite conexiones

```powershell
# Probar conexión
Test-NetConnection -ComputerName localhost -Port 1433
```

### Error: Las vistas no existen

**Causa**: Script SQL no se ejecutó

**Solución**:
1. Abrir SQL Server Management Studio
2. Ejecutar `backend/sql-scripts/INSTALACION-COMPLETA.sql`
3. Verificar que no hubo errores

### Error: npm install falla

**Causa**: Versión de Node incompatible o dependencias con conflictos

**Solución**:
```powershell
# Usar flag de legacy peer deps
npm install --legacy-peer-deps

# O limpiar caché
npm cache clean --force
rm -rf node_modules
rm package-lock.json
npm install --legacy-peer-deps
```

### Error: Puerto 3000/3001 en uso

**Solución**:
```powershell
# Encontrar proceso usando el puerto
netstat -ano | findstr :3000

# Matar proceso (reemplazar PID)
taskkill /PID [PID] /F
```

### Error: Redis connection refused

**Solución**: 
- Instalar Memurai/Redis, o
- Ignorar (el sistema usa caché en memoria como fallback)

El mensaje es solo una advertencia:
```
⚠️ Redis: Using memory cache only
```

### Frontend muestra pantalla en blanco

**Posibles causas**:
1. Backend no está corriendo
2. URL de API incorrecta

**Solución**:
1. Verificar backend está en http://localhost:3001
2. Verificar `.env.local` tiene `NEXT_PUBLIC_API_URL` correcto
3. Abrir DevTools (F12) y revisar errores en Console

### Consultas lentas después de instalación

**Causa**: Estadísticas de SQL Server desactualizadas

**Solución**:
```sql
USE BID_v2_22122025;
EXEC sp_updatestats;
```

---

## Comandos Útiles

### Reiniciar Todo

```powershell
.\Stop-ChequeoDigital.ps1
.\Start-ChequeoDigital.ps1
```

### Limpiar Caché

```powershell
# Backend
curl -X POST http://localhost:3001/api/admin/cache/flush -H "Authorization: Bearer [TOKEN]"
```

### Ver Logs

```powershell
# Backend logs
Get-Content backend\logs\access.log -Tail 50

# Ver errores
Get-Content backend\logs\error.log -Tail 50
```

### Rebuild Frontend

```powershell
npm run build
npm run start  # Modo producción
```

---

## Despliegue en Producción

### Checklist

- [ ] Cambiar `NODE_ENV` a `production`
- [ ] Cambiar `JWT_SECRET` a valor seguro
- [ ] Configurar HTTPS/SSL
- [ ] Cambiar contraseña del usuario admin
- [ ] Configurar firewall
- [ ] Configurar backups de BD
- [ ] Configurar monitoreo

### Variables de Producción

```env
NODE_ENV=production
JWT_SECRET=[clave-de-256-bits-generada-aleatoriamente]
DB_ENCRYPT=true
```

---

*Documento actualizado: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
