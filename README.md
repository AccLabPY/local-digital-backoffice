# Backoffice Chequeo Digital 2.0 

**Sistema integral de seguimiento de encuestas de innovación empresarial** para el monitoreo y análisis de métricas de nivel digital en empresas de Paraguay.

Desarrollado por el **Laboratorio de Aceleración del PNUD Paraguay (UNDP AccLabPy)**.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Estructura de Archivos](#estructura-de-archivos)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Sistema de Autenticación y RBAC](#sistema-de-autenticación-y-rbac)
- [API REST](#api-rest)
- [Sistema de Caché (Redis)](#sistema-de-caché-redis)
- [Optimizaciones de Rendimiento](#optimizaciones-de-rendimiento)
- [Exportación de Datos](#exportación-de-datos)
- [Adaptación a Otros Chequeos Digitales](#adaptación-a-otros-chequeos-digitales)
- [Documentación Adicional](#documentación-adicional)
- [Mantenimiento](#mantenimiento)
- [Licencia](#licencia)

---

## Descripción General

Chequeo Digital 2.0 es una aplicación web full-stack diseñada para rastrear y visualizar encuestas de innovación empresarial. Permite a los usuarios:

- Listar empresas con filtrado avanzado y búsqueda
- Visualizar información detallada y puntajes de innovación por empresa
- Rastrear historial de encuestas y respuestas
- Analizar evolución del nivel digital con gráficos interactivos
- Gestionar rechequeos (encuestas de seguimiento) con KPIs, tablas, gráficos y mapas de calor
- Exportar datos en PDF, CSV y Excel
- Administrar usuarios, roles y permisos del sistema
- Integrar con dashboards de Looker Studio

---

## Arquitectura del Sistema

La aplicación sigue una **arquitectura cliente-servidor de tres capas**:

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                    │
│  Next.js 15 (App Router) + React 19 + Tailwind CSS      │
│  shadcn/ui + Recharts + D3.js                           │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST (JSON)
                       │ JWT Bearer Token
┌──────────────────────▼──────────────────────────────────┐
│                    BACKEND (API REST)                     │
│  Node.js + Express 5                                     │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌────────────┐ │
│  │ Routes  │→│Controllers│→│  Models   │→│  Database  │ │
│  └─────────┘ └──────────┘ └───────────┘ └────────────┘ │
│  ┌──────────────┐ ┌───────────┐ ┌───────────────────┐  │
│  │  Middlewares  │ │  Services │ │      Utils        │  │
│  │ (Auth/RBAC)  │ │  (Redis)  │ │ (Logger/Exporter) │  │
│  └──────────────┘ └───────────┘ └───────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼                         ▼
┌─────────────────┐      ┌─────────────────┐
│   SQL Server    │      │  Redis/Memurai  │
│   (Datos)       │      │  (Caché)        │
└─────────────────┘      └─────────────────┘
```

### Patrones de Diseño

- **MVC (Model-View-Controller):** Separación clara entre rutas, controladores y modelos en el backend.
- **Singleton:** Conexión a base de datos (`poolPromise`) y servicio Redis instanciados una única vez.
- **Strategy con Fallback:** Redis como caché primaria con fallback automático a caché en memoria (`Map`).
- **Lazy Loading Progresivo:** El frontend carga componentes de rechequeos de forma escalonada (KPIs → Gráficos → Tabla).
- **RBAC (Role-Based Access Control):** Control de acceso basado en roles con permisos granulares por recurso.

---

## Estructura de Archivos

```
chequeo/
├── app/                            # Next.js App Router (páginas/rutas)
│   ├── layout.tsx                  # Layout raíz (AuthProvider, Toaster)
│   ├── page.tsx                    # Página raíz (redirección)
│   ├── login/page.tsx              # Login de usuarios del sistema
│   ├── empresa/login/page.tsx      # Login de empresas
│   ├── empresas/                   # Listado y detalle de empresas
│   │   ├── page.tsx
│   │   └── [id]/                   # Detalle empresa + encuestas
│   ├── rechequeos/page.tsx         # Dashboard de rechequeos
│   ├── dashboard/page.tsx          # Integración Looker Studio
│   ├── usuarios-sistema/page.tsx   # Gestión de usuarios (superadmin)
│   ├── usuarios/page.tsx           # Gestión de usuarios empresa
│   ├── roles/page.tsx              # Gestión de roles y permisos
│   ├── configuracion/page.tsx      # Configuración del sistema
│   └── documentacion/page.tsx      # Documentación integrada
│
├── components/                     # Componentes React
│   ├── pages/                      # Componentes de página completa
│   │   ├── rechequeos-page.tsx     # Dashboard rechequeos (KPIs, gráficos, tabla)
│   │   ├── business-list-page.tsx  # Listado de empresas
│   │   ├── business-detail-page.tsx# Detalle de empresa
│   │   └── ...                     # Otros componentes de página
│   ├── rechequeos-heatmap/         # Mapa de calor D3.js (dimensiones vs sectores)
│   ├── ui/                         # Componentes shadcn/ui (button, dialog, table...)
│   └── app-sidebar.tsx             # Barra lateral con navegación por roles
│
├── contexts/
│   └── auth-context.tsx            # Contexto de autenticación (login, logout, RBAC)
│
├── hooks/                          # Hooks personalizados
│   ├── use-mobile.tsx
│   └── use-toast.ts
│
├── lib/                            # Utilidades del frontend
│   ├── api-client.ts               # Cliente REST con token JWT automático
│   ├── auth-service.ts             # Servicio de autenticación (localStorage + API)
│   ├── api-interceptor.ts          # Interceptor fetch para debugging
│   └── utils.ts                    # Utilidades generales (cn, etc.)
│
├── backend/                        # API REST (Node.js + Express)
│   ├── src/
│   │   ├── server.js               # Punto de entrada del servidor
│   │   ├── config/
│   │   │   ├── config.js           # Configuración centralizada (env vars)
│   │   │   ├── database.js         # Conexión SQL Server (pool + helpers)
│   │   │   └── swagger.js          # Configuración Swagger/OpenAPI
│   │   ├── routes/                 # Definición de rutas Express
│   │   │   └── index.js            # Montaje de todas las rutas
│   │   ├── controllers/            # Controladores (lógica de negocio)
│   │   ├── models/                 # Modelos (acceso a datos SQL)
│   │   ├── middlewares/            # Middlewares (auth, RBAC, errores)
│   │   ├── services/               # Servicios
│   │   │   └── redis.service.js    # Servicio de caché Redis con fallback
│   │   └── utils/                  # Logger (Winston), validación, exportador
│   ├── sql-scripts/                # Scripts SQL de migración e índices
│   ├── logs/                       # Logs de la aplicación
│   └── package.json
│
├── docs/                           # Documentación del proyecto
│   ├── documentacion_cd/           # Manuales de usuario y documentación técnica
│   └── *.md                        # Guías de instalación, optimización, etc.
│
├── tests/                          # Tests de conexión y validación
├── queries/                        # Consultas SQL ad-hoc
├── public/                         # Archivos estáticos
│
├── Start-ChequeoDigital.ps1        # Script de inicio (PowerShell)
├── Stop-ChequeoDigital.ps1         # Script de detención (PowerShell)
├── start-chequeo.bat               # Script de inicio (CMD)
├── stop-chequeo.bat                # Script de detención (CMD)
├── package.json                    # Dependencias del frontend
├── next.config.mjs                 # Configuración Next.js
├── tailwind.config.ts              # Configuración Tailwind CSS
└── tsconfig.json                   # Configuración TypeScript
```

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| **Next.js** | 15.2.4 | Framework React con App Router |
| **React** | 19 | Biblioteca de UI |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 3.4 | Framework CSS utility-first |
| **shadcn/ui** | latest | Componentes UI (Radix + Tailwind) |
| **Recharts** | latest | Gráficos interactivos |
| **D3.js** | 7.9 | Mapa de calor de rechequeos |

### Backend

| Tecnología | Versión | Propósito |
|---|---|---|
| **Node.js** | 18+ | Runtime JavaScript |
| **Express** | 5.x | Framework web |
| **mssql** | 11.x | Driver SQL Server |
| **msnodesqlv8** | 5.x | Driver nativo Windows Auth |
| **ioredis** | 4.x | Cliente Redis |
| **jsonwebtoken** | 9.x | Autenticación JWT |
| **bcrypt** | 6.x | Hash de contraseñas |
| **Winston** | 3.x | Logging estructurado |
| **PDFKit** | 0.17 | Generación de PDFs |
| **ExcelJS** | 4.4 | Exportación a Excel |
| **Swagger** | 6.x | Documentación de API |

### Infraestructura

| Componente | Propósito |
|---|---|
| **SQL Server** (2012+) | Base de datos relacional |
| **Redis / Memurai** | Caché en memoria (opcional) |

---

## Requisitos Previos

- **Node.js** v18 o superior
- **npm** v8 o superior
- **SQL Server** 2012 o superior (con la base de datos del Chequeo Digital)
- **Redis** o **Memurai** (opcional, recomendado para producción)
- **Git** (para clonar el repositorio)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/UNDP-AccLabPy/chequeo-digital.git
cd chequeo-digital
```

### 2. Instalar dependencias del frontend

```bash
npm install --legacy-peer-deps
```

> Se requiere `--legacy-peer-deps` por compatibilidad con React 19.

### 3. Instalar dependencias del backend

```bash
cd backend
npm install
cd ..
```

### 4. Configurar variables de entorno

```bash
cp backend/env.template backend/.env
```

Editar `backend/.env` con las credenciales de su entorno (ver sección [Configuración](#configuración)).

### 5. Inicializar la base de datos

Ejecutar los scripts SQL en `backend/sql-scripts/` en su instancia de SQL Server. El archivo `00-EJECUTAR-TODO.sql` contiene el orden recomendado:

1. `01-create-auth-tables.sql` — Tablas de autenticación, roles y permisos
2. `02-seed-auth-data.sql` — Datos semilla (roles, usuario admin)
3. `03-update-passwords.sql` — Actualizar contraseñas
4. `04-optimize-rechequeos-indexes.sql` — Índices de rendimiento
5. `05-create-rechequeos-view.sql` — Vista base de rechequeos
6. `06-create-rechequeos-optimized-views.sql` — Vistas optimizadas (KPIs, tabla)
7. `07` a `10` — Índices adicionales y vistas agregadas

---

## Configuración

El archivo `backend/.env` contiene toda la configuración del sistema:

```env
# Servidor
PORT=3001                          # Puerto del backend
NODE_ENV=development               # Entorno (development | production)

# JWT
JWT_SECRET=TU_CLAVE_SECRETA        # Clave secreta para tokens JWT
JWT_EXPIRATION=1d                   # Expiración del token
JWT_REFRESH_EXPIRATION=7d           # Expiración del refresh token

# Base de Datos
DB_SERVER=localhost                 # Servidor SQL Server (ej: SERVIDOR\INSTANCIA)
DB_PORT=1433                       # Puerto de SQL Server
DB_NAME=BID_v2_22122025            # <-- NOMBRE DE LA BASE DE DATOS
DB_INSTANCE=                       # Nombre de instancia (si aplica)

# Autenticación de BD
# Opción 1: Windows Authentication (recomendado en desarrollo)
DB_USE_WINDOWS_AUTH=true
DB_DOMAIN=tu_dominio
DB_USER=tu_usuario_windows

# Opción 2: SQL Server Authentication
# DB_USE_WINDOWS_AUTH=false
# DB_USER=webapp
# DB_PASSWORD=tu_contraseña_segura

# Conexión
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Logging
LOG_LEVEL=info
```

> **Importante:** El único archivo donde se configura el nombre de la base de datos es `backend/.env` en la variable `DB_NAME`. Todos los demás archivos leen esta variable.

---

## Ejecución

### Opción 1: Script automático (Windows)

```powershell
# PowerShell
.\Start-ChequeoDigital.ps1

# CMD
start-chequeo.bat
```

Para detener:

```powershell
.\Stop-ChequeoDigital.ps1
# o
stop-chequeo.bat
```

### Opción 2: Ejecución manual

Terminal 1 — Backend:

```bash
cd backend
npm run dev
```

Terminal 2 — Frontend:

```bash
npm run dev
```

### URLs de la aplicación

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Documentación API (Swagger) | http://localhost:3001/api-docs |
| Health Check | http://localhost:3001/health |

### Credenciales por defecto

| Campo | Valor |
|---|---|
| Email | `admin@chequeo.gov.py` |
| Contraseña | `password123` |

> Cambiar las credenciales inmediatamente en entornos de producción.

---

## Sistema de Autenticación y RBAC

### Tipos de Usuario

1. **Usuarios del sistema** (`type: 'system'`): Acceden al backoffice desde la tabla `UsuariosSistema`.
2. **Usuarios empresa** (`type: 'empresa'`): Acceden a datos de su empresa desde la tabla `Usuario`.

### Flujo de Autenticación

```
Login → POST /api/auth/login → Validación bcrypt → Token JWT
                                                        │
                                                        ▼
                                              { userId, email, role,
                                                roleId, type, permissions }
                                                        │
                                                        ▼
                                              Almacenado en localStorage
                                              Enviado como Bearer token
```

- Los tokens JWT expiran según configuración (`JWT_EXPIRATION`).
- Al hacer logout, el token se registra en la tabla `TokensRevocados` para invalidarlo.
- El middleware `authMiddleware` verifica el JWT y consulta tokens revocados.

### Roles y Permisos (RBAC)

| Rol | Descripción | Alcance |
|---|---|---|
| `superadmin` | Acceso total | Gestión de usuarios, roles, recursos y datos |
| `contributor` | Lectura y edición | Empresas, encuestas, rechequeos |
| `viewer` | Solo lectura | Visualización de datos |

**Permisos por recurso:** Cada rol tiene permisos específicos (`CanView`, `CanCreate`, `CanEdit`, `CanDelete`) por recurso/página, almacenados en la tabla `RoleResourcePermissions`.

**Backend:**

```javascript
// Proteger ruta por rol
router.use(authMiddleware, requireRole('superadmin'));

// Proteger ruta por permiso de recurso
router.get('/', authMiddleware, requireResource('PAGE_EMPRESAS', 'CanView'), controller.list);
```

**Frontend:**

```tsx
// Verificar permiso en componente
<ProtectedResource resourceCode="PAGE_RECHEQUEOS" action="CanView">
  <RechequeosPage />
</ProtectedResource>
```

---

## API REST

Todas las rutas están montadas bajo el prefijo `/api`:

| Ruta | Módulo | Autenticación |
|---|---|---|
| `/api/auth` | Autenticación (login, logout, me) | Pública |
| `/api/account` | Cuenta del usuario | JWT |
| `/api/empresas` | Empresas (CRUD, exportar) | JWT |
| `/api/encuestas` | Encuestas y respuestas | JWT |
| `/api/graficos` | Datos para gráficos | JWT |
| `/api/rechequeos` | Rechequeos (KPIs, tabla, series, heatmap) | JWT |
| `/api/catalogos` | Catálogos (departamentos, sectores, etc.) | JWT |
| `/api/usuarios` | Usuarios empresa | JWT |
| `/api/usuarios-sistema` | Usuarios del sistema | JWT + superadmin |
| `/api/roles` | Roles y permisos | JWT + superadmin |
| `/api/resources` | Recursos del sistema | JWT + superadmin |
| `/api/admin` | Administración (caché, BD) | JWT + superadmin |

La documentación interactiva completa está disponible en **http://localhost:3001/api-docs** (Swagger UI).

---

## Sistema de Caché (Redis)

El sistema implementa una **estrategia de caché dual** con Redis como caché primaria y un `Map` en memoria como fallback automático.

### Arquitectura

```
Solicitud → ¿Redis disponible?
              │
         Sí ──┤── No
         │         │
    Redis GET   Memory GET
         │         │
    ¿HIT? ───── ¿HIT?
     Sí   No    Sí   No
     │     │     │     │
  Retorna  │  Retorna  │
           │           │
        Base de Datos ─┘
           │
     Redis SET + Memory SET
           │
        Retorna
```

### Comportamiento

- **Redis disponible:** Los datos se guardan y leen de Redis con TTL configurable (5-15 min según endpoint).
- **Redis no disponible:** El sistema usa `Map` en memoria con limpieza automática de entradas expiradas cada 60 segundos.
- **Reconexión:** Máximo 3 intentos de conexión a Redis; si falla, se desactiva permanentemente hasta reiniciar el servidor.
- **Instalación:** Redis es **opcional**. Sin Redis, la aplicación funciona normalmente usando la caché en memoria.

### Caché en Endpoints

| Endpoint | TTL | Clave |
|---|---|---|
| Rechequeos KPIs | 15 min | `rechequeos:kpis:{filtros}` |
| Rechequeos Tabla | 10 min | `rechequeos:tabla:{filtros}` |
| Rechequeos Series | 10 min | `rechequeos:series:{filtros}` |
| Rechequeos Heatmap | 15 min | `rechequeos:heatmap:{filtros}` |
| Empresas Listado | 5 min | `empresas:list:{filtros}` |
| Filtros | 10 min | `filters:{tipo}` |

### Administración

```
GET  /api/admin/cache/stats     # Estadísticas de caché
POST /api/admin/cache/flush     # Limpiar toda la caché
POST /api/admin/cache/enable    # Reconectar Redis
```

---

## Optimizaciones de Rendimiento

### Base de Datos (SQL Server)

1. **Vistas materializadas:** Vistas pre-calculadas para KPIs, tabla y datos base de rechequeos:
   - `vw_RechequeosBase` — Base de datos de rechequeos con joins pre-resueltos
   - `vw_RechequeosKPIs` — KPIs agregados
   - `vw_RechequeosTabla` — Datos tabulares optimizados
   - `vw_RechequeosAggregated*` — Vistas agregadas para series temporales y distribuciones

2. **Índices optimizados:**
   - Índices compuestos en `TestUsuario`, `EmpresaInfo`, `ResultadoNivelDigital`
   - Índices de cobertura (covering) para evitar lookups
   - Índices en tablas de catálogo para joins rápidos

3. **Timeout extendido:** Consultas complejas con timeout de hasta 3 minutos.

4. **Connection pooling:** Pool de conexiones SQL Server (máx. 10, idle 30s).

### Frontend

1. **Carga progresiva (Lazy Loading):** Los componentes de rechequeos se cargan secuencialmente para no bloquear la UI:
   - KPIs se cargan primero
   - Gráficos después de ~300ms
   - Tabla después de ~600ms
   - Si los KPIs cargan rápido (<10s), se activa prefetch de los siguientes componentes

2. **Compresión:** Gzip habilitado en el backend para todas las respuestas.

---

## Exportación de Datos

El sistema permite exportar datos en múltiples formatos:

| Formato | Uso |
|---|---|
| **PDF** | Reportes de rechequeos, fichas de empresa |
| **Excel (.xlsx)** | Listados de empresas con filtros aplicados |
| **CSV** | Exportación de datos tabulares |

Los archivos generados se almacenan temporalmente en `backend/logs/exports/`.

---

## Adaptación a Otros Chequeos Digitales

Para acoplar este sistema a otra instancia de Chequeo Digital (otra base de datos, otro país u otra encuesta), se requieren los siguientes pasos:

### 1. Configurar la base de datos

Editar `backend/.env`:

```env
DB_SERVER=nuevo_servidor
DB_NAME=nueva_base_de_datos
DB_USER=nuevo_usuario
DB_PASSWORD=nueva_contraseña
```

### 2. Ejecutar scripts de migración

Ejecutar los scripts SQL de `backend/sql-scripts/` en la nueva base de datos para crear las tablas de autenticación, vistas e índices de optimización.

### 3. Ajustar catálogos

Los catálogos (departamentos, localidades, sectores económicos) se leen dinámicamente de la base de datos. Si la nueva instancia tiene tablas de catálogo con nombres o estructuras distintas, ajustar los modelos en `backend/src/models/`.

### 4. Personalizar la interfaz (opcional)

- Logos y branding: Reemplazar archivos en `public/`
- Textos y etiquetas: Editar componentes en `components/pages/`
- Colores del tema: Modificar `tailwind.config.ts` y variables CSS en `app/globals.css`

### 5. Configuración de Redis (opcional)

Si se despliega en producción, instalar Redis o Memurai y configurar en `.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 6. Esquema de base de datos esperado

El sistema asume las siguientes tablas principales (del esquema BID/Chequeo Digital):

- `Empresa` — Registro de empresas
- `EmpresaInfo` — Información extendida de empresas
- `Usuario` — Usuarios encuestadores
- `TestUsuario` — Instancias de encuesta por usuario/empresa
- `ResultadoNivelDigital` — Resultados de nivel digital por dimensión
- Tablas de catálogo: `Departamento`, `Localidad`, `ActividadEconomica`, etc.

---

## Documentación Adicional

Toda la documentación técnica y de usuario se encuentra en la carpeta `docs/`:

| Documento | Descripción |
|---|---|
| `docs/documentacion_cd/` | Manuales de usuario y documentación técnica narrativa |
| `docs/INSTALLATION.md` | Guía de instalación general |
| `docs/INSTALACION_WINDOWS_SERVER.md` | Guía para Windows Server |
| `docs/GUIA_INSTALACION_WINDOWS_SERVER_2012.md` | Guía específica Windows Server 2012 |
| `docs/DEPLOYMENT.md` | Guía de despliegue en producción |
| `docs/CONFIGURATION.md` | Referencia de configuración |
| `docs/AUTH_SETUP.md` | Configuración de autenticación |
| `docs/QUICKSTART_AUTH.md` | Guía rápida de autenticación |
| `docs/OPTIMIZATION_README.md` | Documentación de optimizaciones |
| `docs/ARQUITECTURA_OPTIMIZACION_RECHEQUEOS.md` | Arquitectura de optimización de rechequeos |
| `docs/sql-scripts-README.md` | Guía de scripts SQL |

---

## Mantenimiento

### Logs

Los logs se almacenan en `backend/logs/`:

- `access.log` — Peticiones HTTP (Morgan)
- `error.log` — Errores de la aplicación
- `exceptions.log` — Excepciones no capturadas

### Comandos útiles

```bash
# Frontend
npm run dev          # Desarrollo
npm run build        # Compilar para producción
npm run start        # Iniciar en producción
npm run lint         # Linter

# Backend
cd backend
npm run dev          # Desarrollo con nodemon
npm start            # Producción
npm run init-db      # Inicializar base de datos
```

---

## Licencia

Este proyecto está licenciado bajo la **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Consultar el archivo [LICENSE](LICENSE) para más detalles.

---

**Mantenedores:** [UNDP AccLabPy](https://github.com/UNDP-AccLabPy) — Laboratorio de Aceleración del PNUD Paraguay
