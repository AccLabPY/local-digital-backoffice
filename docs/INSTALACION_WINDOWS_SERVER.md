# Guía de Instalación - Chequeo Digital 2.0 en Windows Server 2012

## 📋 Prerrequisitos

### Software Requerido
- **Windows Server 2012** (o superior)
- **SQL Server 2019/2022** con instancia nombrada
- **Node.js** (versión 18 o superior)
- **npm** o **pnpm**

### Permisos Requeridos
- **Administrador del servidor** para configurar SQL Server
- **Permisos de base de datos** para crear usuarios

---

## 🗄️ Configuración de SQL Server

### Paso 1: Verificar Instalación de SQL Server

1. **Verificar servicios ejecutándose:**
   ```powershell
   Get-Service -Name "*SQL*" | Format-Table -AutoSize
   ```

2. **Verificar instancia específica:**
   ```powershell
   Get-Service -Name "*MSSQL2022*" | Format-Table -AutoSize
   ```

### Paso 2: Habilitar TCP/IP Protocol

1. **Abrir SQL Server Configuration Manager:**
   - Presiona `Windows + R`
   - Escribe: `SQLServerManager15.msc` (para SQL Server 2022)
   - **IMPORTANTE:** Ejecuta como administrador

2. **Habilitar TCP/IP:**
   - Expandir **"SQL Server Network Configuration"**
   - Clic en **"Protocols for MSSQL2022"**
   - Buscar **"TCP/IP"** en la lista
   - Clic derecho → **"Enable"**

3. **Configurar TCP/IP Properties:**
   - Clic derecho en **"TCP/IP"** → **"Properties"**
   - Pestaña **"IP Addresses"**
   - Sección **"IPAll"** → **"TCP Port"** = **"1433"**
   - Clic en **"OK"**

### Paso 3: Habilitar SQL Server Browser

1. **En SQL Server Configuration Manager:**
   - Clic en **"SQL Server Services"**
   - Buscar **"SQL Server Browser"**
   - Clic derecho → **"Properties"**
   - Pestaña **"Service"**
   - **"Start Mode"** = **"Automatic"**
   - Clic en **"Start"** para iniciar el servicio
   - Clic en **"OK"**

### Paso 4: Reiniciar SQL Server

1. **Reiniciar servicio principal:**
   - En **"SQL Server Services"**
   - Buscar **"SQL Server (MSSQL2022)"**
   - Clic derecho → **"Restart"**
   - Esperar reinicio completo

### Paso 5: Verificar Configuración TCP

```sql
-- Ejecutar en SQL Server Management Studio o sqlcmd
SELECT local_tcp_port FROM sys.dm_exec_connections WHERE session_id = @@SPID;
```

**Resultado esperado:** Debe mostrar un número de puerto (ej: 1433) en lugar de NULL.

---

## 👤 Configuración de Usuario de Base de Datos

### Crear Usuario Específico para la Aplicación

**Script SQL completo para crear el usuario del aplicativo:**

```sql
-- =============================================
-- Script: Crear Usuario ChequeoApp
-- Descripción: Crea usuario específico para la aplicación Chequeo Digital 2.0
-- Base de datos: BID_stg_copy
-- =============================================

-- 1. Crear login para la aplicación
CREATE LOGIN [ChequeoApp] WITH PASSWORD = 'AppPassword123!';

-- 2. Usar la base de datos específica
USE [BID_stg_copy];

-- 3. Crear usuario en la base de datos
CREATE USER [ChequeoApp] FOR LOGIN [ChequeoApp];

-- 4. Asignar permisos de propietario de la base de datos
ALTER ROLE db_owner ADD MEMBER [ChequeoApp];

-- 5. Verificar que el usuario fue creado correctamente
SELECT 
    'Login creado' as Tipo,
    name as Nombre,
    is_disabled as Deshabilitado,
    create_date as FechaCreacion
FROM sys.server_principals 
WHERE name = 'ChequeoApp'

UNION ALL

SELECT 
    'Usuario en BD' as Tipo,
    name as Nombre,
    CASE WHEN is_disabled = 1 THEN 'Sí' ELSE 'No' END as Deshabilitado,
    create_date as FechaCreacion
FROM sys.database_principals 
WHERE name = 'ChequeoApp';
```

**Ejecutar este script en SQL Server Management Studio:**
1. Conectar al servidor SQL Server
2. Abrir nueva consulta
3. Copiar y pegar el script completo
4. Ejecutar (F5)
5. Verificar que aparezcan los mensajes de confirmación

### Verificar Usuario Creado

```sql
-- Verificar login creado
SELECT name, is_disabled FROM sys.server_principals WHERE name = 'ChequeoApp';

-- Verificar usuario en base de datos
SELECT name FROM sys.database_principals WHERE name = 'ChequeoApp';
```

---

## 🚀 Instalación de la Aplicación

### Paso 1: Clonar/Descargar el Proyecto

```bash
# Si usas Git
git clone <repository-url>
cd chequeo/backend

# O navegar al directorio del proyecto
cd C:\ruta\al\proyecto\backend
```

### Paso 2: Instalar Dependencias

```bash
# Instalar dependencias de Node.js
npm install

# O si prefieres pnpm
pnpm install
```

### Paso 3: Configurar Variables de Entorno

1. **Copiar archivo de plantilla:**
   ```bash
   copy env.template .env
   ```

2. **Configurar archivo .env:**
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=production

   # JWT Secret for Authentication
   JWT_SECRET=ChequeoDigital2SecretKey2025
   JWT_EXPIRATION=1d
   JWT_REFRESH_EXPIRATION=7d

   # Database Configuration
   DB_SERVER=TU_SERVIDOR\MSSQL2022
   DB_PORT=1433
   DB_NAME=BID_stg_copy
   DB_INSTANCE=MSSQL2022

   # SQL Server Authentication
   DB_USE_WINDOWS_AUTH=false
   DB_USER=ChequeoApp
   DB_PASSWORD=AppPassword123!

   # Connection Options
   DB_ENCRYPT=false
   DB_TRUST_SERVER_CERTIFICATE=true

   # Logging
   LOG_LEVEL=info

   # API Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

3. **Reemplazar valores específicos:**
   - `TU_SERVIDOR`: Nombre de tu servidor Windows
   - `MSSQL2022`: Nombre de tu instancia SQL Server
   - `AppPassword123!`: Contraseña que configuraste para el usuario ChequeoApp

---

## 🧪 Verificación de la Instalación

### Paso 1: Probar Conexión a Base de Datos

```bash
# Ejecutar script de prueba
node test-db-connection.js
```

**Resultado esperado:**
```
🔍 Testing database connection...
Server: TU_SERVIDOR\MSSQL2022
Database: BID_stg_copy
Instance: MSSQL2022
Authentication: SQL Server Authentication
User: ChequeoApp

📡 Connecting to SQL Server...
✅ Database connection successful!

🔍 Testing basic query...
✅ Found X companies in database

🔍 Checking required tables...
✅ All required tables found:
   - Empresa
   - EmpresaInfo
   - Pregunta
   - Respuesta
   - ResultadoNivelDigital
   - TestUsuario

🎉 Database test completed successfully!
```

### Paso 2: Iniciar Servidor de Aplicación

```bash
# Modo desarrollo
npm run dev

# Modo producción
npm start
```

### Paso 3: Verificar Servidor Funcionando

```bash
# Verificar que el puerto esté abierto
netstat -an | findstr :3001

# O usando PowerShell
Get-NetTCPConnection | Where-Object {$_.LocalPort -eq 3001}
```

---

## 🔧 Solución de Problemas Comunes

### Error: "Failed to connect in 30000ms"

**Causa:** SQL Server no está escuchando por TCP
**Solución:**
1. Verificar que TCP/IP esté habilitado en SQL Server Configuration Manager
2. Verificar que SQL Server Browser esté ejecutándose
3. Reiniciar servicios SQL Server

```powershell
# Verificar servicios
Get-Service -Name "SQLBrowser", "MSSQL$MSSQL2022"

# Iniciar SQL Server Browser si está detenido
Start-Service -Name "SQLBrowser"
```

### Error: "Login failed for user 'ChequeoApp'"

**Causa:** Usuario no existe o contraseña incorrecta
**Solución:**
1. Verificar que el usuario existe en SQL Server
2. Verificar contraseña en archivo .env
3. Recrear usuario si es necesario

```sql
-- Verificar usuario
SELECT name, is_disabled FROM sys.server_principals WHERE name = 'ChequeoApp';

-- Recrear usuario si es necesario
DROP LOGIN [ChequeoApp];
CREATE LOGIN [ChequeoApp] WITH PASSWORD = 'AppPassword123!';
```

### Error: "The login is from an untrusted domain"

**Causa:** Problema con Windows Authentication
**Solución:** Usar SQL Server Authentication en lugar de Windows Authentication

```env
# En archivo .env
DB_USE_WINDOWS_AUTH=false
DB_USER=ChequeoApp
DB_PASSWORD=AppPassword123!
```

### Error: "Cannot open SQLBrowser service"

**Causa:** Permisos insuficientes
**Solución:** Ejecutar PowerShell como administrador

```powershell
# Como administrador
Start-Service -Name "SQLBrowser"
```

---

## 📊 Verificación Final del Sistema

### Checklist de Verificación

- [ ] SQL Server (MSSQL2022) ejecutándose
- [ ] SQL Server Browser ejecutándose
- [ ] TCP/IP habilitado en SQL Server Configuration Manager
- [ ] Usuario ChequeoApp creado con permisos db_owner
- [ ] Archivo .env configurado correctamente
- [ ] Dependencias de Node.js instaladas
- [ ] Script de prueba de conexión ejecutándose exitosamente
- [ ] Servidor de aplicación iniciando correctamente
- [ ] Puerto 3001 abierto y escuchando

### Comandos de Verificación Rápida

```powershell
# Verificar servicios SQL Server
Get-Service -Name "*SQL*" | Where-Object {$_.Status -eq "Running"}

# Verificar conexión TCP
sqlcmd -S "TU_SERVIDOR\MSSQL2022" -U "ChequeoApp" -P "AppPassword123!" -Q "SELECT @@VERSION"

# Verificar aplicación
curl http://localhost:3001/health
# O
Invoke-WebRequest -Uri "http://localhost:3001/health"
```

---

## 🔒 Consideraciones de Seguridad

### Recomendaciones de Seguridad

1. **Cambiar contraseña por defecto:**
   ```sql
   ALTER LOGIN [ChequeoApp] WITH PASSWORD = 'TuContraseñaSegura123!';
   ```

2. **Configurar firewall:**
   - Abrir puerto 3001 para la aplicación
   - Abrir puerto 1433 para SQL Server (si es necesario acceso remoto)

3. **Configurar SSL/TLS:**
   ```env
   # En archivo .env para producción
   DB_ENCRYPT=true
   DB_TRUST_SERVER_CERTIFICATE=false
   ```

4. **Usar variables de entorno seguras:**
   - No commitear archivo .env al repositorio
   - Usar secretos del sistema para contraseñas

---

## 📞 Soporte y Mantenimiento

### Logs del Sistema

```bash
# Ver logs de la aplicación
tail -f logs/app.log

# Ver logs de SQL Server
# Ubicación: C:\Program Files\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQL\Log\
```

### Monitoreo

```powershell
# Verificar estado de servicios
Get-Service -Name "*SQL*" | Format-Table -AutoSize

# Verificar conexiones activas
sqlcmd -S "TU_SERVIDOR\MSSQL2022" -U "ChequeoApp" -P "AppPassword123!" -Q "SELECT COUNT(*) FROM sys.dm_exec_connections"
```

### Backup y Recuperación

```sql
-- Backup de base de datos
BACKUP DATABASE [BID_stg_copy] TO DISK = 'C:\Backup\BID_stg_copy.bak';

-- Restaurar base de datos
RESTORE DATABASE [BID_stg_copy] FROM DISK = 'C:\Backup\BID_stg_copy.bak';
```

---

## ✅ Conclusión

Siguiendo esta guía paso a paso, deberías tener el sistema Chequeo Digital 2.0 funcionando correctamente en Windows Server 2012. 

**Puntos clave recordar:**
1. **TCP/IP debe estar habilitado** en SQL Server Configuration Manager
2. **SQL Server Browser debe estar ejecutándose**
3. **Usuario específico** para la aplicación con permisos adecuados
4. **Archivo .env configurado** con las credenciales correctas
5. **Verificar conexión** antes de iniciar la aplicación

Si encuentras algún problema, revisa la sección de "Solución de Problemas Comunes" o verifica el checklist de verificación.
