# Guía Completa de Instalación - Chequeo Digital 2.0

## Windows Server 2012 + SQL Server 2012

---

## 🚀 Inicio Rápido (Un Click)

Una vez instalado, puede iniciar todo el sistema con **un solo click**:

### Opción 1: Archivo BAT (Recomendado)
```
📁 Carpeta del proyecto
└── 🖱️ start-chequeo.bat  ← Doble click aquí
```

### Opción 2: PowerShell (Más opciones)
```powershell
# Click derecho en Start-ChequeoDigital.ps1 → "Ejecutar con PowerShell"
# O desde terminal:
.\Start-ChequeoDigital.ps1
```

**El script automáticamente:**
1. ✅ Verifica Node.js
2. ✅ Inicia el Backend (puerto 3001)
3. ✅ Inicia el Frontend (puerto 3000)
4. ✅ Abre el navegador en http://localhost:3000

---

## 📋 Índice

1. [Requisitos Previos](#1-requisitos-previos)
2. [Instalación de Node.js](#2-instalación-de-nodejs)
3. [Instalación de Redis (Opcional)](#3-instalación-de-redis-opcional)
4. [Configuración de SQL Server](#4-configuración-de-sql-server)
5. [Scripts SQL a Ejecutar](#5-scripts-sql-a-ejecutar)
6. [Configuración del Backend](#6-configuración-del-backend)
7. [Configuración del Frontend](#7-configuración-del-frontend)
8. [Inicio de la Aplicación](#8-inicio-de-la-aplicación)
9. [Verificación de la Instalación](#9-verificación-de-la-instalación)
10. [Solución de Problemas](#10-solución-de-problemas)

---

## 1. Requisitos Previos

### Hardware Mínimo
- **CPU**: 2 cores
- **RAM**: 4 GB (8 GB recomendado)
- **Disco**: 50 GB libres

### Software Requerido
| Componente | Versión Mínima | Notas |
|------------|----------------|-------|
| Windows Server | 2012 R2 | También compatible con 2016, 2019, 2022 |
| SQL Server | 2012 SP4 | También compatible con 2014, 2016, 2017, 2019, 2022 |
| Node.js | 18.x LTS | **Obligatorio** - v18 o superior |
| npm | 9.x | Viene incluido con Node.js |
| Git | 2.x | Para clonar el repositorio |

### Puertos Requeridos
| Puerto | Servicio | Descripción |
|--------|----------|-------------|
| 3000 | Frontend (Next.js) | Aplicación web |
| 3001 | Backend (Express) | API REST |
| 1433 | SQL Server | Base de datos |
| 6379 | Redis (opcional) | Caché distribuido |

---

## 2. Instalación de Node.js

### Opción A: Instalador MSI (Recomendado)

1. Descargar Node.js 18 LTS desde: https://nodejs.org/dist/v18.20.5/node-v18.20.5-x64.msi

2. Ejecutar el instalador con privilegios de administrador

3. Marcar la opción **"Automatically install the necessary tools"**

4. Verificar instalación:
```powershell
node --version
# Debe mostrar: v18.x.x

npm --version
# Debe mostrar: 9.x.x o superior
```

### Opción B: Chocolatey

```powershell
# Instalar Chocolatey (si no está instalado)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar Node.js
choco install nodejs-lts -y
```

---

## 3. Instalación de Redis (Opcional)

> **Nota**: Redis es opcional. La aplicación funciona con caché en memoria si Redis no está disponible.

### Opción A: Redis para Windows (MSOpenTech)

1. Descargar desde: https://github.com/microsoftarchive/redis/releases

2. Extraer en `C:\Redis`

3. Instalar como servicio:
```powershell
cd C:\Redis
redis-server --service-install redis.windows.conf
redis-server --service-start
```

### Opción B: Sin Redis

La aplicación detecta automáticamente si Redis no está disponible y usa caché en memoria (`node-cache`).

---

## 4. Configuración de SQL Server

### 4.1 Verificar que SQL Server esté corriendo

```powershell
# Ver estado del servicio
Get-Service -Name "MSSQL*"

# Iniciar si está detenido
Start-Service -Name "MSSQLSERVER"  # o "MSSQL$NOMBREINSTANCIA"
```

### 4.2 Habilitar autenticación mixta (SQL + Windows)

1. Abrir **SQL Server Management Studio (SSMS)**
2. Click derecho en el servidor → **Properties**
3. Ir a **Security**
4. Seleccionar **"SQL Server and Windows Authentication mode"**
5. Click **OK** y reiniciar el servicio SQL Server

### 4.3 Habilitar TCP/IP

1. Abrir **SQL Server Configuration Manager**
2. Ir a **SQL Server Network Configuration** → **Protocols for [INSTANCIA]**
3. Habilitar **TCP/IP**
4. Click derecho en TCP/IP → **Properties** → **IP Addresses**
5. Verificar que el puerto **1433** esté configurado
6. Reiniciar el servicio SQL Server

### 4.4 Crear usuario de base de datos (opcional)

Si prefieres usar autenticación SQL en lugar de Windows:

```sql
-- Conectarse como administrador
USE master;
GO

-- Crear login
CREATE LOGIN ChequeoApp WITH PASSWORD = 'TuPasswordSeguro123!';
GO

-- Dar permisos en la base de datos
USE BID_stg_copy;  -- O el nombre de tu base de datos
GO

CREATE USER ChequeoApp FOR LOGIN ChequeoApp;
GO

-- Asignar rol db_owner para desarrollo (ajustar para producción)
ALTER ROLE db_owner ADD MEMBER ChequeoApp;
GO
```

---

## 5. Scripts SQL a Ejecutar

### ⚠️ IMPORTANTE: Orden de Ejecución

Ejecutar los scripts en el siguiente orden **exacto** usando SSMS o sqlcmd:

### 5.1 Crear Tablas de Autenticación

```sql
-- Archivo: backend/sql-scripts/01-create-auth-tables.sql
-- Crea las tablas: RolesSistema, UsuariosSistema, Resources, RoleResourcePermissions, TokensRevocados
```

**Ejecutar:**
```powershell
sqlcmd -S SERVIDOR\INSTANCIA -d BID_stg_copy -E -i "backend\sql-scripts\01-create-auth-tables.sql"
```

### 5.2 Insertar Datos Iniciales

```sql
-- Archivo: backend/sql-scripts/02-seed-auth-data.sql
-- Crea roles, usuarios iniciales, recursos y permisos
-- Password por defecto para todos: password123
```

**Ejecutar:**
```powershell
sqlcmd -S SERVIDOR\INSTANCIA -d BID_stg_copy -E -i "backend\sql-scripts\02-seed-auth-data.sql"
```

### 5.3 Crear Vistas Optimizadas de Rechequeos

```sql
-- Archivo: backend/sql-scripts/06-create-rechequeos-optimized-views.sql
-- Crea las vistas: vw_RechequeosBase, vw_RechequeosKPIs, vw_RechequeosTabla
```

**Ejecutar:**
```powershell
sqlcmd -S SERVIDOR\INSTANCIA -d BID_stg_copy -E -i "backend\sql-scripts\06-create-rechequeos-optimized-views.sql"
```

### 5.4 (Opcional) Crear Índices de Rendimiento

Solo ejecutar si experimentas lentitud:

```sql
-- Archivo: backend/sql-scripts/07-create-additional-indexes.sql
-- Archivo: backend/sql-scripts/08-create-views-indexes.sql
-- Archivo: backend/sql-scripts/09-create-columnstore-indexes.sql
```

---

## 6. Configuración del Backend

### 6.1 Clonar el Repositorio

```powershell
cd C:\Apps  # o tu directorio preferido
git clone https://github.com/tu-organizacion/chequeo-digital.git
cd chequeo-digital
```

### 6.2 Instalar Dependencias del Backend

```powershell
cd backend
npm install
```

> **Nota para Windows Server 2012**: Si `bcrypt` falla al compilar, instalar:
> ```powershell
> npm install --global windows-build-tools
> ```

### 6.3 Configurar Variables de Entorno

Copiar el archivo de plantilla y editarlo:

```powershell
copy env.template .env
notepad .env
```

**Contenido del archivo `.env`:**

```env
# ============================================
# CONFIGURACIÓN DEL SERVIDOR
# ============================================
PORT=3001
NODE_ENV=production

# ============================================
# JWT - CAMBIAR EN PRODUCCIÓN
# ============================================
JWT_SECRET=CambiarEstaPorUnaClaveSecretaMuyLargaYSegura2025!
JWT_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d

# ============================================
# BASE DE DATOS SQL SERVER
# ============================================
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=BID_stg_copy
DB_INSTANCE=MSSQL2022

# --- OPCIÓN 1: Autenticación Windows (Recomendado para desarrollo) ---
DB_USE_WINDOWS_AUTH=true
# DB_DOMAIN=TUDOMINIO
# DB_USER=tu_usuario_windows

# --- OPCIÓN 2: Autenticación SQL Server ---
# DB_USE_WINDOWS_AUTH=false
# DB_USER=ChequeoApp
# DB_PASSWORD=TuPasswordSeguro123!

# ============================================
# CONEXIÓN SSL
# ============================================
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 6.4 Verificar Conexión a Base de Datos

```powershell
# Crear script de prueba
node -e "
const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    instanceName: process.env.DB_INSTANCE
  }
};

if (process.env.DB_USE_WINDOWS_AUTH === 'true') {
  config.options.integratedSecurity = true;
} else {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
}

sql.connect(config).then(() => {
  console.log('✅ Conexión exitosa a SQL Server');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error de conexión:', err.message);
  process.exit(1);
});
"
```

---

## 7. Configuración del Frontend

### 7.1 Instalar Dependencias

```powershell
cd ..  # Volver al directorio raíz del proyecto
npm install
```

### 7.2 Configurar API URL

Crear archivo `.env.local` en la raíz del proyecto:

```powershell
echo NEXT_PUBLIC_API_URL=http://localhost:3001/api > .env.local
```

Para producción, cambiar a la URL del servidor:
```env
NEXT_PUBLIC_API_URL=http://tu-servidor.com:3001/api
```

### 7.3 Compilar para Producción

```powershell
npm run build
```

---

## 8. Inicio de la Aplicación

### 8.1 🖱️ Inicio con Un Click (Recomendado)

La forma más fácil de iniciar el sistema:

#### Opción A: Archivo BAT
1. Navegar a la carpeta del proyecto
2. **Doble click en `start-chequeo.bat`**
3. ¡Listo! El navegador se abrirá automáticamente

```
📁 C:\Apps\chequeo-digital\
├── 🖱️ start-chequeo.bat      ← Iniciar sistema
├── 🛑 stop-chequeo.bat       ← Detener sistema
├── 📜 Start-ChequeoDigital.ps1
└── 📜 Stop-ChequeoDigital.ps1
```

#### Opción B: PowerShell (Más control)
```powershell
# Inicio básico
.\Start-ChequeoDigital.ps1

# Sin abrir navegador
.\Start-ChequeoDigital.ps1 -NoBrowser

# Modo producción
.\Start-ChequeoDigital.ps1 -Production

# Puertos personalizados
.\Start-ChequeoDigital.ps1 -BackendPort 4001 -FrontendPort 4000
```

#### Detener el Sistema
```powershell
# Opción 1: Archivo BAT
stop-chequeo.bat

# Opción 2: PowerShell
.\Stop-ChequeoDigital.ps1
```

### 8.2 Inicio Manual (Desarrollo)

Si prefiere iniciar manualmente, abrir **dos terminales PowerShell**:

**Terminal 1 - Backend:**
```powershell
cd C:\Apps\chequeo-digital\backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Apps\chequeo-digital
npm run dev
```

### 8.3 Modo Producción (Servidor)

**Opción A: PM2 (Recomendado para servidores)**

```powershell
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar Backend
cd C:\Apps\chequeo-digital\backend
pm2 start src/server.js --name "chequeo-backend"

# Iniciar Frontend
cd C:\Apps\chequeo-digital
pm2 start npm --name "chequeo-frontend" -- start

# Guardar configuración para reinicio automático
pm2 save
pm2 startup
```

**Opción B: Windows Service (NSSM)**

```powershell
# Descargar NSSM desde: https://nssm.cc/download
# Extraer en C:\nssm

# Instalar Backend como servicio
C:\nssm\nssm.exe install ChequeoBackend "C:\Program Files\nodejs\node.exe" "C:\Apps\chequeo-digital\backend\src\server.js"
C:\nssm\nssm.exe set ChequeoBackend AppDirectory "C:\Apps\chequeo-digital\backend"

# Instalar Frontend como servicio
C:\nssm\nssm.exe install ChequeoFrontend "C:\Program Files\nodejs\npm.cmd" "start"
C:\nssm\nssm.exe set ChequeoFrontend AppDirectory "C:\Apps\chequeo-digital"

# Iniciar servicios
net start ChequeoBackend
net start ChequeoFrontend
```

### 8.4 Crear Acceso Directo en Escritorio

Para acceso aún más rápido:

1. Click derecho en `start-chequeo.bat`
2. Seleccionar **"Crear acceso directo"**
3. Mover el acceso directo al Escritorio
4. (Opcional) Cambiar el ícono:
   - Click derecho → Propiedades → Cambiar icono
   - Seleccionar un ícono de su preferencia

---

## 9. Verificación de la Instalación

### 9.1 Verificar Backend

```powershell
# Health check
curl http://localhost:3001/health

# Respuesta esperada:
# {"status":"ok","timestamp":"..."}
```

### 9.2 Verificar Frontend

Abrir navegador en: http://localhost:3000

### 9.3 Probar Login

1. Ir a http://localhost:3000/login
2. Usar credenciales iniciales:
   - **Email**: `saquino@mic.gov.py`
   - **Password**: `password123`

### 9.4 Verificar Vistas SQL

```sql
-- En SSMS, ejecutar:
SELECT 'vw_RechequeosBase' AS Vista, COUNT(*) AS Registros FROM dbo.vw_RechequeosBase
UNION ALL
SELECT 'vw_RechequeosKPIs', COUNT(*) FROM dbo.vw_RechequeosKPIs
UNION ALL
SELECT 'vw_RechequeosTabla', COUNT(*) FROM dbo.vw_RechequeosTabla;
```

---

## 10. Solución de Problemas

### Error: "Cannot find module 'msnodesqlv8'"

```powershell
# Instalar herramientas de compilación
npm install --global windows-build-tools

# Reinstalar dependencias
cd backend
rmdir /s /q node_modules
npm install
```

### Error: "Login failed for user"

1. Verificar que SQL Server tenga autenticación mixta habilitada
2. Verificar credenciales en `.env`
3. Verificar que el usuario tenga permisos en la base de datos

### Error: "ECONNREFUSED" al conectar a SQL Server

1. Verificar que SQL Server esté corriendo
2. Verificar que TCP/IP esté habilitado
3. Verificar que el firewall permita el puerto 1433

### Error: "bcrypt" no compila

```powershell
# Alternativa: usar bcryptjs (JavaScript puro)
cd backend
npm uninstall bcrypt
npm install bcryptjs

# Luego editar los archivos que usan bcrypt:
# Cambiar: const bcrypt = require('bcrypt');
# Por:     const bcrypt = require('bcryptjs');
```

### Frontend no carga datos

1. Verificar que el backend esté corriendo en puerto 3001
2. Verificar `NEXT_PUBLIC_API_URL` en `.env.local`
3. Revisar consola del navegador (F12) para errores CORS

### Vistas SQL no se crean

```sql
-- Verificar permisos
SELECT HAS_PERMS_BY_NAME('dbo', 'SCHEMA', 'CREATE VIEW');

-- Si retorna 0, otorgar permisos:
USE BID_stg_copy;
GRANT CREATE VIEW TO ChequeoApp;
GRANT ALTER ON SCHEMA::dbo TO ChequeoApp;
```

---

## 📁 Resumen de Archivos

### Scripts de Inicio (Raíz del proyecto)

| Archivo | Descripción | Uso |
|---------|-------------|-----|
| `start-chequeo.bat` | Iniciar sistema (BAT) | 🖱️ Doble click |
| `stop-chequeo.bat` | Detener sistema (BAT) | 🖱️ Doble click |
| `Start-ChequeoDigital.ps1` | Iniciar sistema (PowerShell) | Click derecho → Ejecutar |
| `Stop-ChequeoDigital.ps1` | Detener sistema (PowerShell) | Click derecho → Ejecutar |

### Scripts SQL (backend/sql-scripts/)

| Archivo | Descripción | ¿Obligatorio? |
|---------|-------------|---------------|
| `INSTALACION-COMPLETA.sql` | **Todo en uno** (recomendado) | ✅ Sí |
| `01-create-auth-tables.sql` | Tablas de autenticación RBAC | ✅ Sí |
| `02-seed-auth-data.sql` | Usuarios y permisos iniciales | ✅ Sí |
| `06-create-rechequeos-optimized-views.sql` | Vistas optimizadas | ✅ Sí |
| `07-create-additional-indexes.sql` | Índices de rendimiento | ⚡ Recomendado |
| `08-create-views-indexes.sql` | Índices en vistas | ⚡ Recomendado |
| `09-create-columnstore-indexes.sql` | Índices columnstore | ⚡ Solo si hay lentitud |

---

## 📞 Soporte

Para problemas de instalación, contactar al equipo de desarrollo con:
- Capturas de pantalla del error
- Logs del backend (`backend/logs/`)
- Versiones de Node.js y SQL Server instaladas

---

**Última actualización**: Diciembre 2025
**Versión de la guía**: 1.0.0

