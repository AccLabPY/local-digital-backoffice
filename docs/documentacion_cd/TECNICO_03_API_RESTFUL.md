# Documentación Técnica: API RESTful

## Chequeo Digital 2.0 - Especificación de Endpoints

---

## 📋 Índice

1. [Información General](#información-general)
2. [Autenticación](#autenticación)
3. [Endpoints de Empresas](#endpoints-de-empresas)
4. [Endpoints de Rechequeos](#endpoints-de-rechequeos)
5. [Endpoints de Usuarios](#endpoints-de-usuarios)
6. [Endpoints de Administración](#endpoints-de-administración)
7. [Códigos de Respuesta](#códigos-de-respuesta)
8. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Información General

### Base URL

```
http://localhost:3001/api
```

### Formato de Respuesta

Todas las respuestas son JSON con la siguiente estructura:

**Respuesta exitosa**:
```json
{
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "totalPages": 25
  }
}
```

**Respuesta de error**:
```json
{
  "message": "Descripción del error",
  "error": "Código de error (solo en desarrollo)"
}
```

### Documentación Interactiva

Swagger UI disponible en:
```
http://localhost:3001/api-docs
```

---

## Autenticación

### POST /auth/login

Iniciar sesión y obtener token JWT.

**Request**:
```json
{
  "email": "admin@chequeo.gov.py",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@chequeo.gov.py",
    "nombre": "Administrador",
    "apellido": "Sistema",
    "role": "superadmin"
  }
}
```

**Errores**:
- `401`: Credenciales inválidas
- `403`: Cuenta desactivada

### POST /auth/logout

Cerrar sesión e invalidar token.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

### GET /auth/me

Obtener información del usuario autenticado.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "id": 1,
  "email": "admin@chequeo.gov.py",
  "nombre": "Administrador",
  "apellido": "Sistema",
  "role": "superadmin",
  "permissions": [
    {
      "resource": "PAGE_EMPRESAS",
      "canView": true,
      "canCreate": true,
      "canEdit": true,
      "canDelete": true
    }
  ]
}
```

---

## Endpoints de Empresas

### GET /empresas

Listar empresas con filtros y paginación.

**Query Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | number | Número de página (default: 1) |
| `limit` | number | Registros por página (default: 50) |
| `searchTerm` | string | Búsqueda por nombre/email |
| `departamento` | string[] | Filtro de departamento |
| `distrito` | string[] | Filtro de distrito |
| `nivelInnovacion` | string[] | Filtro de nivel |
| `sectorActividad` | string[] | Filtro de sector |
| `subSectorActividad` | string[] | Filtro de subsector |
| `tamanoEmpresa` | string[] | Filtro de tamaño |
| `fechaIni` | date | Fecha inicio (YYYY-MM-DD) |
| `fechaFin` | date | Fecha fin (YYYY-MM-DD) |
| `finalizado` | number | 1=solo finalizados |

**Response** (200):
```json
{
  "data": [
    {
      "IdEmpresa": 123,
      "EmpresaNombre": "Empresa ABC",
      "Usuario": "Juan Pérez",
      "Departamento": "Capital",
      "Sector": "Comercio",
      "NivelMadurez": "Competente",
      "Puntaje": 65.5,
      "FechaTermino": "2024-11-15T00:00:00.000Z",
      "IdTestUsuario": 456
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "totalPages": 25
  }
}
```

### GET /empresas/:id

Obtener detalle de una empresa.

**Path Parameters**:
- `id`: ID de la empresa

**Query Parameters**:
- `idTestUsuario`: (opcional) ID del test específico

**Response** (200):
```json
{
  "empresa": "Empresa ABC",
  "ruc": "80012345-6",
  "distrito": "Asunción",
  "departamento": "Capital",
  "ubicacion": "Asunción, Capital",
  "sectorActividadDescripcion": "Comercio",
  "subSectorActividadDescripcion": "Retail",
  "anioCreacion": 2010,
  "TotalEmpleados": 50,
  "ventasAnuales": "500M - 1.000M",
  "nombreEncuestado": "Juan Pérez",
  "emailEncuestado": "juan@empresa.com",
  "SexoGerenteGeneral": "Hombre",
  "SexoPropietarioPrincipal": "Mujer",
  "FechaTest": "2024-11-15T00:00:00.000Z",
  "nivelMadurez": "Competente",
  "puntajeGeneral": 65.5,
  "puntajeTecnologia": 70.2,
  "puntajeComunicacion": 62.1,
  "puntajeOrganizacion": 58.4,
  "puntajeDatos": 68.9,
  "puntajeEstrategia": 64.3,
  "puntajeProcesos": 69.1
}
```

### PATCH /empresas/:id

Actualizar información de empresa.

**Body**:
```json
{
  "empresa": "Nuevo Nombre",
  "ruc": "80012345-6",
  "idDepartamento": 1,
  "idLocalidad": 10,
  "idSectorActividad": 5,
  "totalEmpleados": 60
}
```

**Response** (200):
```json
{
  "message": "Empresa actualizada exitosamente",
  "empresa": { ... }
}
```

### GET /empresas/:id/usuarios

Listar usuarios asignados a una empresa.

**Response** (200):
```json
{
  "usuarios": [
    {
      "IdUsuario": 789,
      "NombreCompleto": "Juan Pérez",
      "Email": "juan@empresa.com",
      "CargoEmpresa": "Gerente"
    }
  ]
}
```

### POST /empresas/:id/usuarios

Asignar usuario a empresa.

**Body**:
```json
{
  "idUsuario": 789
}
```

### DELETE /empresas/:id/usuarios/:idUsuario

Desasignar usuario de empresa.

### GET /empresas/filters/options

Obtener opciones para filtros.

**Response** (200):
```json
{
  "departamentos": ["Capital", "Central", ...],
  "distritos": ["Asunción", "Luque", ...],
  "nivelesInnovacion": ["Inicial", "Novato", "Competente", "Avanzado"],
  "sectoresActividad": ["Comercio", "Industria", ...],
  "subSectoresPorSector": {
    "Comercio": ["Retail", "Mayorista", ...]
  },
  "tamanosEmpresa": ["Micro", "Pequeña", "Mediana", "Grande"]
}
```

### GET /empresas/export-comprehensive

Exportar reporte de empresas.

**Query Parameters**:
- `format`: `xlsx` | `pdf`
- `fileName`: nombre del archivo
- (todos los filtros de GET /empresas)

**Response**: Archivo binario (Excel o PDF)

### GET /empresas/:id/export-ficha

Exportar ficha individual de empresa en PDF.

**Response**: Archivo PDF

---

## Endpoints de Rechequeos

### GET /rechequeos/kpis

Obtener KPIs de rechequeos.

**Query Parameters**: (mismos filtros que /empresas)

**Response** (200):
```json
{
  "cobertura": {
    "tasaReincidencia": 0.32,
    "promChequeosPorEmpresa": 1.8,
    "tiempoPromEntreChequeosDias": 245,
    "distribucion": {
      "1": 2500,
      "2_3": 800,
      "gt_3": 150
    }
  },
  "magnitud": {
    "deltaGlobalProm": 8.5,
    "deltaPorDimension": {
      "Tecnología": 10.2,
      "Comunicación": 7.8,
      "Organización": 6.5,
      "Datos": 9.1,
      "Estrategia": 8.0,
      "Procesos": 9.4
    },
    "pctMejoraPositiva": 0.72,
    "pctRegresion": 0.18,
    "saltosNivel": {
      "bajo_medio": 120,
      "medio_alto": 45
    }
  },
  "velocidad": {
    "tasaMejoraMensual": 1.2,
    "indiceConsistencia": 0.78
  }
}
```

### GET /rechequeos/table

Obtener tabla de rechequeos.

**Query Parameters**:
- `page`, `limit`: paginación
- `sortBy`: columna de ordenamiento
- `sortOrder`: `asc` | `desc`
- (filtros estándar)

**Response** (200):
```json
{
  "data": [
    {
      "IdEmpresa": 123,
      "EmpresaNombre": "Empresa ABC",
      "NombreUsuario": "Juan Pérez",
      "SectorActividad": "Comercio",
      "TamanoEmpresa": "Mediana",
      "Departamento": "Capital",
      "Distrito": "Asunción",
      "Ubicacion": "Asunción, Capital",
      "TotalChequeos": 3,
      "PrimeraFechaFormatted": "15/03/2023",
      "UltimaFechaFormatted": "20/11/2024",
      "PrimerPuntaje": 45.2,
      "PrimerNivel": "Novato",
      "UltimoPuntaje": 68.7,
      "UltimoNivel": "Competente",
      "DeltaGlobal": 23.5,
      "DiasEntreChequeos": 615,
      "TasaMejoraMensual": 1.15
    }
  ],
  "pagination": { ... }
}
```

### GET /rechequeos/heatmap

Obtener datos para heatmap de mejora por sector/dimensión.

**Response** (200):
```json
[
  {
    "sector": "Comercio",
    "tecnologia": 8.5,
    "comunicacion": 6.2,
    "organizacion": 5.8,
    "datos": 7.9,
    "estrategia": 6.5,
    "procesos": 8.1,
    "empresasEnSector": 150
  }
]
```

### GET /rechequeos/evolution

Obtener series de evolución temporal.

**Query Parameters**:
- `category`: `tamano` | `sector` | `departamento`

**Response** (200):
```json
[
  {
    "categoria": "Comercio",
    "periodo": "2024-01",
    "puntajePromedio": 62.5,
    "empresasUnicas": 45
  }
]
```

### GET /rechequeos/export

Exportar rechequeos en CSV.

**Query Parameters**:
- `format`: `csv`
- `fileName`: nombre del archivo
- (filtros)

**Response**: Archivo CSV

### GET /rechequeos/export-pdf

Exportar reporte PDF de rechequeos.

**Response**: Archivo PDF

---

## Endpoints de Usuarios

### GET /usuarios

Listar usuarios de empresas.

**Query Parameters**:
- `page`, `limit`: paginación
- `searchTerm`: búsqueda

**Response** (200):
```json
{
  "data": [
    {
      "IdUsuario": 789,
      "NombreCompleto": "Juan Pérez",
      "Email": "juan@empresa.com",
      "EmpresaNombre": "Empresa ABC",
      "FechaRegistro": "2024-01-15T00:00:00.000Z",
      "IsConnected": "No",
      "UltimaActividad": "2024-11-20T14:30:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

### POST /usuarios

Crear usuario de empresa.

**Body**:
```json
{
  "nombreCompleto": "María García",
  "email": "maria@empresa.com",
  "password": "password123",
  "idEmpresa": 123,
  "cargo": "Gerente de IT"
}
```

### PUT /usuarios/:id

Actualizar usuario.

### PUT /usuarios/:id/password

Cambiar contraseña de usuario.

**Body**:
```json
{
  "newPassword": "nuevaPassword123"
}
```

### PUT /usuarios/:id/email

Actualizar email de usuario.

**Body**:
```json
{
  "newEmail": "nuevo@email.com"
}
```

### DELETE /usuarios/:id

Eliminar usuario.

**Body**:
```json
{
  "deleteType": "partial"
}
```

---

## Endpoints de Administración

### Usuarios del Sistema

#### GET /usuarios-sistema

Listar usuarios del sistema (backoffice).

#### POST /usuarios-sistema

Crear usuario del sistema.

**Body**:
```json
{
  "email": "nuevo@chequeo.gov.py",
  "password": "password123",
  "nombre": "Nuevo",
  "apellido": "Usuario",
  "roleId": 2,
  "organizacion": "MIC",
  "telefono": "0981123456"
}
```

#### PUT /usuarios-sistema/:id

Actualizar usuario del sistema.

#### PUT /usuarios-sistema/:id/password

Resetear contraseña.

#### DELETE /usuarios-sistema/:id

Desactivar usuario del sistema.

### Roles y Permisos

#### GET /roles

Listar roles del sistema.

**Response** (200):
```json
[
  {
    "IdRol": 1,
    "Nombre": "superadmin",
    "Descripcion": "Control total del sistema"
  },
  {
    "IdRol": 2,
    "Nombre": "contributor",
    "Descripcion": "Acceso operativo"
  },
  {
    "IdRol": 3,
    "Nombre": "viewer",
    "Descripcion": "Solo visualización"
  }
]
```

#### GET /roles/:id/permissions

Obtener permisos de un rol.

**Response** (200):
```json
[
  {
    "IdRol": 1,
    "IdRecurso": 1,
    "CanView": true,
    "CanCreate": true,
    "CanEdit": true,
    "CanDelete": true,
    "ResourceCode": "PAGE_EMPRESAS",
    "ResourceDescription": "Vista de empresas",
    "ResourceCategory": "GLOBAL"
  }
]
```

#### PUT /roles/:roleId/resources/:resourceId/permissions

Actualizar permisos de un rol sobre un recurso.

**Body**:
```json
{
  "canView": true,
  "canCreate": false,
  "canEdit": true,
  "canDelete": false
}
```

#### GET /resources

Listar recursos del sistema.

---

## Códigos de Respuesta

| Código | Significado |
|--------|-------------|
| `200` | OK - Solicitud exitosa |
| `201` | Created - Recurso creado |
| `400` | Bad Request - Parámetros inválidos |
| `401` | Unauthorized - No autenticado |
| `403` | Forbidden - Sin permisos |
| `404` | Not Found - Recurso no encontrado |
| `409` | Conflict - Recurso duplicado |
| `500` | Internal Server Error |

---

## Ejemplos de Uso

### cURL - Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@chequeo.gov.py","password":"password123"}'
```

### cURL - Obtener empresas

```bash
curl -X GET "http://localhost:3001/api/empresas?page=1&limit=10&departamento=Capital" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### JavaScript - Fetch

```javascript
const response = await fetch('http://localhost:3001/api/rechequeos/kpis?departamento=Capital', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.cobertura.tasaReincidencia);
```

---

*Documentación API actualizada: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
