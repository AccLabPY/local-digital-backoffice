# Guía de Instalación: Poniendo Todo en Marcha

## Chequeo Digital 2.0 - Cómo Instalar y Configurar el Sistema Paso a Paso

---

## Antes de Empezar: ¿Qué Necesitas?

Instalar Chequeo Digital 2.0 no es complicado, pero necesitas tener algunas cosas listas antes de empezar. Piensa en esto como preparar los ingredientes antes de cocinar: es más fácil si tienes todo a mano.

Primero, necesitas un servidor o computadora con Windows (Server 2012 R2 o superior, o Windows 10/11). El sistema está diseñado para Windows porque es el entorno donde se despliega típicamente en el Ministerio.

Necesitas acceso a SQL Server. Puede ser una instancia local o remota, pero necesitas credenciales que te permitan crear tablas, vistas, e índices. Si no tienes acceso, tendrás que coordinarte con el administrador de base de datos.

También necesitas Node.js instalado. Recomendamos la versión 18.x LTS o superior. Node.js es el runtime que ejecuta tanto el backend como el frontend. Es como el motor que hace funcionar todo.

Redis es opcional pero recomendado. Si no lo instalas, el sistema funcionará con caché en memoria, que es más lento pero completamente funcional. Para producción, definitivamente querrás Redis (o Memurai en Windows) para mejor rendimiento.

---

## Paso 1: Instalar Node.js y Git

Lo primero es instalar Node.js. Puedes descargarlo desde nodejs.org. Asegúrate de instalar la versión LTS (Long Term Support), que es la 18.x o superior. Durante la instalación, acepta las opciones por defecto, que incluyen npm (el gestor de paquetes) y la opción de agregar Node.js al PATH.

Después de instalar, abre PowerShell y verifica que todo esté bien:

```powershell
node --version  # Debería mostrar v18.x.x o superior
npm --version   # Debería mostrar 9.x.x o superior
```

Si ves los números de versión, estás listo. Si no, puede que necesites reiniciar tu terminal o verificar que Node.js se agregó correctamente al PATH.

También necesitas Git para clonar el repositorio. Si no lo tienes, descárgalo desde git-scm.com e instálalo con las opciones por defecto.

---

## Paso 2: Preparar la Base de Datos

Antes de instalar el sistema, necesitas asegurarte de que tienes acceso a SQL Server y a la base de datos `BID_v2_22122025`. Abre SQL Server Management Studio y prueba conectarte. Si puedes ejecutar `SELECT COUNT(*) FROM Empresa` y obtener un resultado, estás listo.

El siguiente paso es crear un usuario de base de datos específico para la aplicación. Esto es una buena práctica de seguridad: en lugar de usar credenciales de administrador, creamos un usuario con solo los permisos necesarios.

Ejecuta estos comandos en SQL Server Management Studio:

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

Esto crea un usuario llamado `chequeo_app` con permisos para leer, escribir, y crear tablas y vistas, pero sin permisos administrativos. Guarda estas credenciales porque las necesitarás más adelante.

---

## Paso 3: Ejecutar el Script de Instalación SQL

Este es uno de los pasos más importantes. El script de instalación crea todas las tablas, vistas, e índices que el sistema necesita para funcionar.

Abre SQL Server Management Studio, conéctate a tu servidor, y abre el archivo `backend/sql-scripts/INSTALACION-COMPLETA.sql`. Este script hace varias cosas:

1. **Crea las tablas de autenticación**: `RolesSistema`, `UsuariosSistema`, `Resources`, `RoleResourcePermissions`, y `TokensRevocados`. Estas tablas manejan quién puede acceder al sistema y qué puede hacer.

2. **Crea el usuario administrador inicial**: Por defecto, crea un usuario con email `admin@chequeo.gov.py` y contraseña `password123`. **IMPORTANTE**: Cambia esta contraseña después de la primera instalación.

3. **Crea las vistas optimizadas**: `vw_RechequeosBase`, `vw_RechequeosKPIs`, y `vw_RechequeosTabla`. Estas vistas pre-calculan los datos más usados para hacer las consultas súper rápidas.

4. **Crea los índices**: Índices en las tablas existentes para acelerar las consultas más comunes.

Presiona F5 para ejecutar el script. Debería ejecutarse sin errores. Si ves algún error, léelo cuidadosamente. Los errores más comunes son:
- Ya existe una tabla/vista (puedes ignorarlo o eliminarlo primero)
- Permisos insuficientes (verifica que el usuario tenga los permisos correctos)
- SQL Server versión incompatible (algunas características requieren SQL Server 2016+)

---

## Paso 4: Configurar el Backend

Ahora viene la parte del código. Primero, clona o descarga el repositorio del proyecto. Si tienes Git instalado:

```powershell
cd C:\proyectos  # O donde quieras guardar el proyecto
git clone [URL_REPOSITORIO] chequeo
cd chequeo
```

Si no tienes Git, simplemente descarga el código y extráelo a una carpeta.

Luego, instala las dependencias del backend:

```powershell
cd backend
npm install
```

Esto puede tomar unos minutos la primera vez porque descarga todas las librerías que el proyecto necesita. Si ves errores sobre "peer dependencies", no te preocupes, son advertencias comunes en proyectos Node.js modernos.

El siguiente paso es crear el archivo de configuración `.env`. Este archivo contiene todas las configuraciones que el backend necesita: credenciales de base de datos, configuración de JWT, configuración de Redis, etc.

Crea un archivo llamado `.env` en la carpeta `backend` con este contenido:

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

Ajusta los valores según tu entorno. Especialmente importante:
- `DB_HOST`: La dirección de tu servidor SQL Server (puede ser `localhost` o una IP)
- `DB_USER` y `DB_PASSWORD`: Las credenciales que creaste en el paso anterior
- `JWT_SECRET`: Cambia esto a una cadena larga y aleatoria (puedes generar una con cualquier generador de strings aleatorios)

---

## Paso 5: Verificar la Conexión a la Base de Datos

Antes de continuar, verifica que el backend puede conectarse a la base de datos. Ejecuta:

```powershell
cd backend
node -e "require('./src/config/database').poolPromise.then(() => console.log('✅ DB OK')).catch(e => console.log('❌ Error:', e.message))"
```

Si ves "✅ DB OK", estás listo. Si ves un error, verifica:
- Que SQL Server está corriendo
- Que las credenciales en `.env` son correctas
- Que el puerto 1433 está abierto (si es una conexión remota)
- Que el firewall permite conexiones a SQL Server

---

## Paso 6: Configurar el Frontend

El frontend es más simple de configurar. Desde la raíz del proyecto:

```powershell
cd ..  # Volver a la raíz
npm install --legacy-peer-deps
```

El flag `--legacy-peer-deps` es necesario porque algunas dependencias tienen conflictos menores de versiones, pero no afectan la funcionalidad.

Luego, crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Esto le dice al frontend dónde está el backend. Si el backend está en otro servidor o puerto, ajusta esta URL.

---

## Paso 7: Iniciar el Sistema

Ahora viene la parte emocionante: poner todo en marcha. Tenemos varias opciones:

### Opción 1: Scripts PowerShell (La Más Fácil)

Desde la raíz del proyecto, ejecuta:

```powershell
.\Start-ChequeoDigital.ps1
```

Este script hace todo automáticamente:
- Verifica que Node.js está instalado
- Inicia el backend en el puerto 3001
- Inicia el frontend en el puerto 3000
- Abre el navegador automáticamente

Para detener el sistema:

```powershell
.\Stop-ChequeoDigital.ps1
```

### Opción 2: Manual (Para Más Control)

Abre dos terminales de PowerShell:

**Terminal 1 - Backend:**
```powershell
cd backend
npm start
```

Deberías ver un mensaje como "Server running on port 3001" y "✅ Redis: Ready" (o una advertencia si Redis no está disponible).

**Terminal 2 - Frontend:**
```powershell
cd [raíz del proyecto]
npm run dev
```

Deberías ver un mensaje como "ready - started server on 0.0.0.0:3000".

### Opción 3: Batch Files

Si prefieres archivos .bat:

```powershell
.\start-chequeo.bat  # Iniciar
.\stop-chequeo.bat   # Detener
```

---

## Paso 8: Verificar que Todo Funciona

Una vez que ambos servidores están corriendo, es hora de verificar que todo funciona:

1. **Health Check del Backend**: Abre tu navegador y ve a `http://localhost:3001/health`. Deberías ver un JSON con `"status": "UP"`.

2. **Documentación API**: Ve a `http://localhost:3001/api-docs`. Deberías ver la interfaz de Swagger con todos los endpoints documentados.

3. **Frontend**: Ve a `http://localhost:3000`. Deberías ver la página de login.

4. **Login de Prueba**: Usa las credenciales por defecto:
   - Email: `admin@chequeo.gov.py`
   - Password: `password123`

Si puedes iniciar sesión y ver el dashboard, ¡felicidades! El sistema está funcionando.

---

## Solución de Problemas Comunes

### Error: No puedo conectar a la base de datos

**Posibles causas:**
- SQL Server no está corriendo
- Credenciales incorrectas en `.env`
- Puerto 1433 bloqueado por firewall
- SQL Server no permite conexiones remotas

**Solución:**
1. Verifica que SQL Server está corriendo: Abre SQL Server Configuration Manager y verifica que el servicio está "Running"
2. Prueba la conexión desde SQL Server Management Studio con las mismas credenciales
3. Verifica el firewall: `Test-NetConnection -ComputerName localhost -Port 1433`
4. Si es conexión remota, verifica que SQL Server está configurado para aceptar conexiones remotas

### Error: Las vistas no existen

**Causa**: El script SQL no se ejecutó completamente o hubo errores.

**Solución**: 
1. Abre SQL Server Management Studio
2. Verifica que las vistas existen: `SELECT * FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_NAME LIKE 'vw_Rechequeos%'`
3. Si no existen, ejecuta nuevamente `INSTALACION-COMPLETA.sql`
4. Revisa los mensajes de error en la ventana de resultados

### Error: Puerto 3000 o 3001 en uso

**Causa**: Otro proceso está usando esos puertos.

**Solución**:
```powershell
# Encontrar qué proceso usa el puerto
netstat -ano | findstr :3001

# Matar el proceso (reemplaza PID con el número que encontraste)
taskkill /PID [PID] /F
```

O simplemente cambia los puertos en `.env` (backend) y `.env.local` (frontend).

### Error: Redis connection refused

**Esto no es realmente un error**. El sistema funciona perfectamente sin Redis. Solo verás una advertencia en los logs. Si quieres usar Redis para mejor rendimiento:

1. **Windows**: Instala Memurai desde memurai.com (es Redis para Windows)
2. **Linux/WSL**: `sudo apt install redis-server && sudo service redis-server start`

El sistema detectará Redis automáticamente cuando esté disponible.

---

## Próximos Pasos Después de la Instalación

Una vez que el sistema está funcionando, hay algunas cosas importantes que hacer:

1. **Cambiar la contraseña del admin**: Ve a Usuarios del Sistema y cambia la contraseña de `admin@chequeo.gov.py` a algo seguro.

2. **Configurar usuarios adicionales**: Crea usuarios para los operadores del programa con los roles apropiados (superadmin, contributor, o viewer).

3. **Revisar permisos**: Ve a Roles y Permisos y verifica que los permisos están configurados como necesitas.

4. **Probar funcionalidades**: Navega por los diferentes módulos y verifica que todo funciona como esperas.

5. **Configurar backups**: Asegúrate de que hay un plan de backup para la base de datos, especialmente para las nuevas tablas de autenticación.

---

## Instalación en Producción

Para instalar en producción, sigue los mismos pasos pero con estas consideraciones adicionales:

1. **Cambiar NODE_ENV a production**: En `.env`, cambia `NODE_ENV=development` a `NODE_ENV=production`

2. **Usar JWT_SECRET seguro**: Genera una clave aleatoria larga (256 bits) para `JWT_SECRET`. Nunca uses la clave de ejemplo.

3. **Configurar HTTPS**: El sistema debe correr sobre HTTPS en producción. Puedes usar un proxy reverso como nginx o IIS.

4. **Configurar firewall**: Solo abre los puertos necesarios (3000 para frontend, 3001 para backend, 1433 para SQL Server si es remoto).

5. **Configurar monitoreo**: Configura alertas para cuando el sistema esté caído o tenga errores.

6. **Documentar credenciales**: Guarda las credenciales de forma segura (no en texto plano, usa un gestor de contraseñas).

---

## Conclusión

Instalar Chequeo Digital 2.0 puede parecer abrumador al principio, pero si sigues estos pasos en orden, deberías tener el sistema funcionando en menos de una hora. La clave es no saltarse pasos y verificar que cada paso funciona antes de continuar al siguiente.

Si encuentras problemas, la mayoría tienen soluciones simples. Los logs del backend (en `backend/logs/`) y los mensajes de error en la consola del navegador (F12) te darán pistas sobre qué está mal.

Una vez que el sistema está funcionando, es bastante estable y fácil de mantener. Los scripts de inicio/detención hacen que sea fácil reiniciar cuando sea necesario, y el sistema de caché asegura que el rendimiento se mantenga bueno incluso con mucho uso.

---

*Guía narrativa de instalación - Diciembre 2025*  
*Versión del Sistema: Chequeo Digital 2.0*

