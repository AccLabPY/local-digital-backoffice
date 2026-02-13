# 🚀 Inicio Rápido - Chequeo Digital 2.0

## ⚡ Inicio con Un Click

Una vez instalado, solo necesita:

```
🖱️ Doble click en start-chequeo.bat
```

**¡Listo!** El sistema se inicia y abre el navegador automáticamente.

---

## 📦 Instalación Inicial (Una sola vez)

### 1️⃣ Ejecutar Script SQL

```powershell
sqlcmd -S localhost\INSTANCIA -d BID_v2_22122025 -E -i "backend\sql-scripts\INSTALACION-COMPLETA.sql"
```

### 2️⃣ Configurar Backend

```powershell
cd backend
copy env.template .env
# Editar .env con tus credenciales de BD
```

### 3️⃣ Instalar Dependencias

```powershell
# Backend
cd backend
npm install

# Frontend (desde raíz)
cd ..
npm install --legacy-peer-deps
# O usar: npm run install:legacy
```

> **Nota:** Si obtiene error ERESOLVE con `vaul`, use `--legacy-peer-deps`. Es seguro y necesario para React 19.

### 4️⃣ Iniciar Sistema

```
🖱️ Doble click en start-chequeo.bat
```

O manualmente:
```powershell
.\Start-ChequeoDigital.ps1
```

### 5️⃣ Acceder

- **URL**: http://localhost:3000 (se abre automáticamente)
- **Email**: `admin@chequeo.gov.py`
- **Password**: `password123`

---

## 🛑 Detener Sistema

```
🖱️ Doble click en stop-chequeo.bat
```

O cerrar las ventanas de terminal minimizadas.

---

## 📁 Archivos de Inicio

| Archivo | Descripción |
|---------|-------------|
| `start-chequeo.bat` | 🖱️ **Iniciar** (doble click) |
| `stop-chequeo.bat` | 🛑 **Detener** (doble click) |
| `Start-ChequeoDigital.ps1` | Inicio con opciones avanzadas |
| `Stop-ChequeoDigital.ps1` | Detención con PowerShell |

---

## 📁 Scripts SQL

| Archivo | Descripción |
|---------|-------------|
| `INSTALACION-COMPLETA.sql` | **Todo en uno** (recomendado) |
| `01-create-auth-tables.sql` | Tablas de autenticación |
| `02-seed-auth-data.sql` | Datos iniciales |
| `06-create-rechequeos-optimized-views.sql` | Vistas optimizadas |

---

## ❓ Problemas Comunes

| Error | Solución |
|-------|----------|
| `Cannot find module 'msnodesqlv8'` | `npm install --global windows-build-tools` |
| `Login failed` | Verificar credenciales en `.env` |
| `ECONNREFUSED` | Verificar que SQL Server esté corriendo |

---

📖 **Guía completa**: [GUIA_INSTALACION_WINDOWS_SERVER_2012.md](./GUIA_INSTALACION_WINDOWS_SERVER_2012.md)

