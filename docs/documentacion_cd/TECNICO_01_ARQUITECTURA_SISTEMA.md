# Documentación Técnica: Arquitectura del Sistema

## Chequeo Digital 2.0 - Panel de Control de Innovación Empresarial

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura de Capas](#arquitectura-de-capas)
4. [Frontend - Next.js](#frontend---nextjs)
5. [Backend - Express.js](#backend---expressjs)
6. [Base de Datos - SQL Server](#base-de-datos---sql-server)
7. [Sistema de Caché](#sistema-de-caché)
8. [Autenticación y Autorización](#autenticación-y-autorización)
9. [Flujo de Datos](#flujo-de-datos)
10. [Patrones de Diseño](#patrones-de-diseño)

---

## Visión General

Chequeo Digital 2.0 es un sistema web diseñado para gestionar y analizar evaluaciones de madurez digital de empresas participantes en un programa de innovación empresarial del Ministerio de Industria y Comercio de Paraguay, en colaboración con el Banco Interamericano de Desarrollo (BID).

### Propósito del Sistema

- **Centralizar** la gestión de empresas evaluadas
- **Visualizar** métricas e indicadores de innovación
- **Analizar** la evolución temporal (rechequeos)
- **Administrar** usuarios y permisos del sistema
- **Exportar** reportes en múltiples formatos

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Next.js 15 (React 19)                    │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐              │    │
│  │  │ shadcn/ui │ │  Recharts │ │ Tailwind  │              │    │
│  │  └───────────┘ └───────────┘ └───────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST (JWT)
┌─────────────────────────────────────────────────────────────────┐
│                         SERVIDOR                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 Express.js (Node.js)                     │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐              │    │
│  │  │Controllers│ │  Models   │ │Middlewares│              │    │
│  │  └───────────┘ └───────────┘ └───────────┘              │    │
│  │  ┌───────────────────────────────────────┐              │    │
│  │  │         Redis Service (Cache)         │              │    │
│  │  └───────────────────────────────────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ TDS/mssql
┌─────────────────────────────────────────────────────────────────┐
│                      BASE DE DATOS                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               SQL Server 2012+                           │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐              │    │
│  │  │  Tablas   │ │  Vistas   │ │  Índices  │              │    │
│  │  │ Originales│ │Optimizadas│ │Columnstore│              │    │
│  │  └───────────┘ └───────────┘ └───────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 15.2.4 | Framework React con SSR/SSG |
| **React** | 19 | Biblioteca de UI |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 3.4.17 | Framework de estilos |
| **shadcn/ui** | Latest | Componentes de UI |
| **Recharts** | Latest | Gráficos y visualizaciones |
| **Lucide React** | 0.454.0 | Íconos |
| **D3.js** | 7.9.0 | Visualizaciones avanzadas |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 18+ | Runtime de JavaScript |
| **Express.js** | 4.x | Framework web |
| **mssql** | 10.x | Driver SQL Server |
| **ioredis** | 5.x | Cliente Redis |
| **bcrypt** | 5.x | Hash de contraseñas |
| **jsonwebtoken** | 9.x | Tokens JWT |
| **helmet** | 7.x | Seguridad HTTP |
| **morgan** | 1.x | Logging HTTP |
| **pdfkit** | 0.14.x | Generación de PDFs |
| **exceljs** | 4.x | Generación de Excel |

### Base de Datos

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **SQL Server** | 2012+ | RDBMS principal |
| **Redis** | 7.x | Cache (opcional) |

---

## Arquitectura de Capas

### Capa de Presentación (Frontend)

```
frontend/
├── app/                    # App Router de Next.js 15
│   ├── page.tsx           # Página de inicio
│   ├── layout.tsx         # Layout principal
│   ├── empresas/          # Rutas de empresas
│   ├── rechequeos/        # Rutas de rechequeos
│   ├── dashboard/         # Dashboard Looker
│   ├── usuarios/          # Gestión usuarios empresas
│   ├── usuarios-sistema/  # Gestión usuarios sistema
│   └── roles/             # Gestión de roles
├── components/            # Componentes React
│   ├── pages/            # Componentes de página
│   ├── ui/               # Componentes shadcn/ui
│   └── ...               # Componentes específicos
├── contexts/             # Contextos React
│   └── auth-context.tsx  # Contexto de autenticación
├── lib/                  # Utilidades
│   ├── api-client.ts    # Cliente HTTP
│   ├── auth-service.ts  # Servicios de auth
│   └── utils.ts         # Funciones helper
└── hooks/               # Custom hooks
```

### Capa de Negocio (Backend)

```
backend/src/
├── server.js             # Punto de entrada
├── config/
│   ├── config.js        # Configuración general
│   ├── database.js      # Conexión SQL Server
│   └── swagger.js       # Documentación API
├── controllers/          # Controladores
│   ├── empresa.controller.js
│   ├── rechequeos.controller.js
│   ├── auth.controller.js
│   └── ...
├── models/               # Modelos de datos
│   ├── empresa.model.js
│   ├── rechequeos.model.optimized-views.js
│   ├── auth.model.js
│   └── ...
├── routes/               # Definición de rutas
│   ├── index.js
│   ├── empresa.routes.js
│   ├── rechequeos.routes.js
│   └── ...
├── middlewares/          # Middlewares
│   ├── auth.middleware.js
│   ├── auth-rbac.middleware.js
│   └── error.middleware.js
├── services/             # Servicios
│   ├── redis.service.js
│   └── auth.service.js
└── utils/                # Utilidades
    ├── logger.js
    ├── exporter.js
    └── errors.js
```

### Capa de Datos (SQL Server)

```
database/
├── Tablas Originales (existentes)
│   ├── Empresa
│   ├── EmpresaInfo
│   ├── Usuario
│   ├── TestUsuario
│   ├── ResultadoNivelDigital
│   └── ...
├── Tablas de Autenticación (nuevas)
│   ├── RolesSistema
│   ├── UsuariosSistema
│   ├── Resources
│   ├── RoleResourcePermissions
│   └── TokensRevocados
└── Vistas Optimizadas (nuevas)
    ├── vw_RechequeosBase
    ├── vw_RechequeosKPIs
    └── vw_RechequeosTabla
```

---

## Frontend - Next.js

### Estructura de Rutas (App Router)

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | HomePage | Página de bienvenida |
| `/login` | LoginPage | Inicio de sesión |
| `/empresas` | BusinessListPage | Listado de empresas |
| `/empresas/[id]` | BusinessDetailPage | Detalle de empresa |
| `/rechequeos` | RechequeosPage | Módulo de rechequeos |
| `/dashboard` | LookerDashboardPage | Dashboard Looker |
| `/usuarios` | UserManagementPage | Gestión usuarios empresas |
| `/usuarios-sistema` | SystemUsersManagementPage | Usuarios del sistema |
| `/roles` | RolesPermissionsPage | Roles y permisos |

### Componentes Principales

#### AppSidebar
- Menú de navegación lateral colapsable
- Secciones diferenciadas por rol
- Resaltado de ruta activa

#### FilterPanel
- Panel de filtros reutilizable
- Soporte multi-selección
- Filtros dependientes (departamento→distrito)

#### RechequeosKPIs
- Tarjetas de indicadores
- Carga lazy con priorización
- Caché en cliente (Service Worker)

### Estado Global

```typescript
// AuthContext - Contexto de autenticación
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
```

### API Client

```typescript
// lib/api-client.ts
export const api = {
  get: (url: string) => authenticatedRequest('GET', url),
  post: (url: string, data: any) => authenticatedRequest('POST', url, data),
  put: (url: string, data: any) => authenticatedRequest('PUT', url, data),
  delete: (url: string) => authenticatedRequest('DELETE', url),
};
```

---

## Backend - Express.js

### Configuración del Servidor

```javascript
// server.js - Configuración principal
const app = express();

// Middlewares globales
app.use(helmet());           // Seguridad HTTP
app.use(compression());      // Compresión gzip
app.use(cors());            // CORS habilitado
app.use(express.json());    // Parse JSON
app.use(cookieParser());    // Parse cookies
app.use(morgan('combined')); // Logging

// Rutas
app.use('/api', routes);

// Documentación
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Manejo de errores
app.use(notFound);
app.use(errorHandler);
```

### Estructura de Rutas

```javascript
// routes/index.js
router.use('/auth', authRoutes);
router.use('/account', accountRoutes);
router.use('/admin', adminRoutes);
router.use('/usuarios-sistema', usuariosSistemaRoutes);
router.use('/roles', rolesRoutes);
router.use('/resources', resourcesRoutes);
router.use('/empresas', empresaRoutes);
router.use('/encuestas', encuestaRoutes);
router.use('/rechequeos', rechequeosRoutes);
router.use('/catalogos', catalogosRoutes);
router.use('/usuarios', usuarioRoutes);
```

### Modelo de Controlador

```javascript
// controllers/rechequeos.controller.js
const getKPIs = async (req, res) => {
  try {
    const filters = RechequeosModel.parseFilters(req.query);
    const cacheKey = redisService.generateKey('rechequeos:kpis', filters);
    
    // Verificar caché
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Consultar base de datos
    const kpis = await RechequeosModel.getKPIs(filters);
    
    // Guardar en caché
    await redisService.set(cacheKey, kpis, 300); // 5 minutos
    
    res.json(kpis);
  } catch (error) {
    logger.error(`Error getting KPIs: ${error.message}`);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
```

---

## Base de Datos - SQL Server

### Tablas Originales (Legado)

El sistema se integra con una base de datos existente de chequeos:

| Tabla | Propósito |
|-------|-----------|
| `Empresa` | Datos de empresas |
| `EmpresaInfo` | Información demográfica por chequeo |
| `Usuario` | Usuarios encuestados |
| `TestUsuario` | Registro de tests/chequeos |
| `ResultadoNivelDigital` | Puntajes y resultados |
| `NivelMadurez` | Catálogo de niveles |
| `SectorActividad` | Catálogo de sectores |
| `Departamentos` | Catálogo geográfico |
| `SubRegion` | Distritos/localidades |

### Tablas de Autenticación (Nuevas)

```sql
-- RolesSistema: Roles del backoffice
CREATE TABLE RolesSistema (
    IdRol INT IDENTITY PRIMARY KEY,
    Nombre NVARCHAR(50) NOT NULL UNIQUE,
    Descripcion NVARCHAR(255),
    FechaCreacion DATETIME2 DEFAULT SYSUTCDATETIME()
);

-- UsuariosSistema: Usuarios del backoffice
CREATE TABLE UsuariosSistema (
    IdUsuarioSistema INT IDENTITY PRIMARY KEY,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Apellido NVARCHAR(100) NOT NULL,
    RoleId INT NOT NULL REFERENCES RolesSistema(IdRol),
    Activo BIT DEFAULT 1
);

-- Resources: Recursos protegidos
CREATE TABLE Resources (
    IdRecurso INT IDENTITY PRIMARY KEY,
    Codigo NVARCHAR(150) NOT NULL UNIQUE,
    Descripcion NVARCHAR(255),
    Categoria NVARCHAR(100)
);

-- RoleResourcePermissions: Matriz de permisos
CREATE TABLE RoleResourcePermissions (
    IdRol INT NOT NULL,
    IdRecurso INT NOT NULL,
    CanView BIT DEFAULT 0,
    CanCreate BIT DEFAULT 0,
    CanEdit BIT DEFAULT 0,
    CanDelete BIT DEFAULT 0,
    PRIMARY KEY (IdRol, IdRecurso)
);
```

---

## Sistema de Caché

### Redis Service con Fallback a Memoria

```javascript
// services/redis.service.js
class RedisService {
  constructor() {
    this.redis = null;
    this.isRedisAvailable = false;
    this.memoryCache = new Map();
    this.memoryTTLs = new Map();
  }

  async get(key) {
    // Intenta Redis primero
    if (this.isRedisAvailable) {
      const value = await this.redis.get(key);
      if (value) return JSON.parse(value);
    }
    
    // Fallback a memoria
    if (this.memoryCache.has(key)) {
      const expiry = this.memoryTTLs.get(key);
      if (!expiry || expiry > Date.now()) {
        return this.memoryCache.get(key);
      }
    }
    
    return null;
  }

  async set(key, value, ttlSeconds = 300) {
    // Redis si disponible
    if (this.isRedisAvailable) {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    }
    
    // Siempre guarda en memoria como fallback
    this.memoryCache.set(key, value);
    this.memoryTTLs.set(key, Date.now() + (ttlSeconds * 1000));
  }
}
```

### Estrategia de Caché

| Recurso | TTL | Invalidación |
|---------|-----|--------------|
| KPIs de Rechequeos | 5 min | Al modificar empresa |
| Listado de Empresas | 2 min | Al crear/editar empresa |
| Opciones de Filtros | 10 min | Manual |
| Detalle de Empresa | 5 min | Al editar |

---

## Autenticación y Autorización

### Flujo de Autenticación

```
1. Cliente envía credenciales (POST /api/auth/login)
2. Backend valida contra UsuariosSistema
3. Si válido, genera JWT con:
   - IdUsuarioSistema
   - Email
   - Rol
   - Permisos
4. Cliente almacena JWT en localStorage
5. Requests posteriores incluyen JWT en header Authorization
6. Middleware verifica JWT y extrae usuario
7. Middleware RBAC verifica permisos
```

### JWT Payload

```javascript
{
  userId: 1,
  email: "admin@chequeo.gov.py",
  role: "superadmin",
  permissions: [
    { resource: "PAGE_EMPRESAS", canView: true, canEdit: true, ... },
    // ...
  ],
  iat: 1701432000,
  exp: 1701518400
}
```

### Middleware RBAC

```javascript
// middlewares/auth-rbac.middleware.js
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    const user = req.user;
    
    // Superadmin bypass
    if (user.role === 'superadmin') return next();
    
    // Buscar permiso
    const permission = user.permissions.find(p => p.resource === resource);
    
    if (!permission || !permission[action]) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    
    next();
  };
};
```

---

## Flujo de Datos

### Consulta de Rechequeos

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Cliente │───▶│ Backend │───▶│  Cache  │───▶│   BD    │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │
     │  GET /api/   │              │              │
     │  rechequeos/ │              │              │
     │  kpis        │              │              │
     │─────────────▶│              │              │
     │              │  Buscar en   │              │
     │              │  cache       │              │
     │              │─────────────▶│              │
     │              │              │              │
     │              │  Cache MISS  │              │
     │              │◀─────────────│              │
     │              │              │              │
     │              │  Query vw_   │              │
     │              │  RechequeosKPIs              │
     │              │─────────────────────────────▶│
     │              │              │              │
     │              │  Resultados  │              │
     │              │◀─────────────────────────────│
     │              │              │              │
     │              │  Guardar en  │              │
     │              │  cache (5min)│              │
     │              │─────────────▶│              │
     │              │              │              │
     │  JSON Response              │              │
     │◀─────────────│              │              │
```

---

## Patrones de Diseño

### 1. Model-View-Controller (MVC)

- **Model**: Lógica de acceso a datos (`models/`)
- **View**: Componentes React (`components/`)
- **Controller**: Lógica de negocio (`controllers/`)

### 2. Repository Pattern

Los modelos encapsulan la lógica de base de datos:

```javascript
class EmpresaModel {
  static async getById(id) { ... }
  static async getAll(filters) { ... }
  static async update(id, data) { ... }
}
```

### 3. Middleware Pattern

Cadena de middlewares para procesar requests:

```javascript
router.get('/empresas',
  authMiddleware,           // Verificar JWT
  rbacMiddleware('view'),   // Verificar permisos
  cacheMiddleware,          // Verificar caché
  empresaController.getAll  // Ejecutar lógica
);
```

### 4. Singleton Pattern

Servicios como instancia única:

```javascript
// redis.service.js
const redisService = new RedisService();
module.exports = redisService;
```

### 5. Factory Pattern

Generación de claves de caché:

```javascript
redisService.generateKey('rechequeos:kpis', {
  departamento: 'Capital',
  sector: 'Comercio'
});
// Retorna: "rechequeos:kpis:{"departamento":"Capital","sector":"Comercio"}"
```

### 6. Observer Pattern

Contexto de React para estado global:

```javascript
// AuthContext observa cambios de autenticación
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Componentes hijos se re-renderizan al cambiar user
};
```

---

## Requisitos del Sistema

### Hardware Mínimo

| Componente | Especificación |
|------------|----------------|
| CPU | 2 cores |
| RAM | 4 GB |
| Disco | 20 GB SSD |
| Red | 100 Mbps |

### Software Requerido

| Software | Versión |
|----------|---------|
| Node.js | 18+ |
| SQL Server | 2012+ |
| Redis (opcional) | 7+ |
| Navegadores | Chrome, Firefox, Edge, Safari (recientes) |

---

*Documento técnico actualizado: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
