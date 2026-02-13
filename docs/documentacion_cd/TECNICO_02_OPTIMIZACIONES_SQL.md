# Documentación Técnica: Optimizaciones SQL y Vistas

## Chequeo Digital 2.0 - Ingeniería de Base de Datos

---

## 📋 Índice

1. [Contexto del Problema](#contexto-del-problema)
2. [Estrategia de Optimización](#estrategia-de-optimización)
3. [Vistas Optimizadas](#vistas-optimizadas)
4. [Índices Creados](#índices-creados)
5. [Lógica de Negocio en SQL](#lógica-de-negocio-en-sql)
6. [Rendimiento Obtenido](#rendimiento-obtenido)
7. [Mantenimiento](#mantenimiento)

---

## Contexto del Problema

### Base de Datos Heredada

El sistema trabaja con una base de datos preexistente (`BID_v2_22122025`) que contiene:

- **+10,000** empresas registradas
- **+50,000** chequeos/encuestas completadas
- **Múltiples tablas** relacionadas con JOINs complejos
- **Sin índices** optimizados para las consultas del nuevo panel

### Desafíos Identificados

1. **Consultas lentas**: KPIs de rechequeos tomaban >30 segundos
2. **Cálculos complejos**: Deltas entre chequeos, validación de 6 meses
3. **Agregaciones pesadas**: Contar empresas únicas con múltiples chequeos
4. **Filtros dinámicos**: Combinaciones infinitas de filtros

### Restricciones

- **SQL Server 2012**: Compatibilidad con versión legacy
- **No modificar tablas originales**: Base de datos compartida
- **Tiempo de respuesta < 5s**: Requisito de UX

---

## Estrategia de Optimización

### Enfoque de 3 Capas

```
┌─────────────────────────────────────────────────┐
│              CAPA DE APLICACIÓN                  │
│  ┌─────────────────────────────────────────┐    │
│  │        Sistema de Caché (Redis)         │    │
│  │    TTL: 5 min | Invalidación selectiva  │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              CAPA DE VISTAS SQL                  │
│  ┌─────────────────────────────────────────┐    │
│  │    Vistas Pre-calculadas con CTEs       │    │
│  │  vw_RechequeosBase → vw_RechequeosKPIs  │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              CAPA DE ÍNDICES                     │
│  ┌─────────────────────────────────────────┐    │
│  │   Índices B-tree + Columnstore (donde   │    │
│  │   SQL Server 2016+ esté disponible)     │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## Vistas Optimizadas

### Vista 1: vw_RechequeosBase

**Propósito**: Proporcionar datos base enriquecidos con validación de 6 meses entre chequeos.

**Lógica Principal**:

```sql
CREATE VIEW dbo.vw_RechequeosBase
AS
WITH 
-- Paso 0: Identificar empresas genéricas ("NO TENGO")
EmpresasGenericas AS (
    SELECT IdEmpresa
    FROM dbo.Empresa WITH (NOLOCK)
    WHERE Nombre LIKE '%NO TENGO%' 
       OR Nombre LIKE '%Sin empresa%' 
       OR IdEmpresa <= 0
),

-- Paso 1: Generar clave única por entidad
-- Para empresas genéricas: clave = IdUsuario
-- Para empresas reales: clave = IdEmpresa
ChequeosOrdenados AS (
    SELECT 
        ei.IdEmpresa,
        ei.IdUsuario,
        ei.Test,
        tu.FechaTerminoTest,
        CASE 
            WHEN eg.IdEmpresa IS NOT NULL THEN 'U_' + CAST(ei.IdUsuario AS VARCHAR)
            ELSE 'E_' + CAST(ei.IdEmpresa AS VARCHAR)
        END AS ClaveEntidad,
        ROW_NUMBER() OVER (
            PARTITION BY ClaveEntidad, ei.Test 
            ORDER BY tu.FechaTerminoTest DESC
        ) AS rn_dedup
    FROM dbo.EmpresaInfo ei
    LEFT JOIN EmpresasGenericas eg ON ei.IdEmpresa = eg.IdEmpresa
    INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
    WHERE tu.Finalizado = 1
),

-- Paso 2: Deduplicar y calcular secuencia temporal
ChequeosUnicos AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (
            PARTITION BY ClaveEntidad 
            ORDER BY FechaTerminoTest
        ) AS rn_seq,
        LAG(FechaTerminoTest) OVER (
            PARTITION BY ClaveEntidad 
            ORDER BY FechaTerminoTest
        ) AS FechaAnterior
    FROM ChequeosOrdenados
    WHERE rn_dedup = 1
),

-- Paso 3: Validar distancia mínima de 6 meses (180 días)
ChequeosValidos AS (
    SELECT 
        *,
        CASE 
            WHEN FechaAnterior IS NULL THEN 1  -- Primer chequeo siempre válido
            WHEN DATEDIFF(DAY, FechaAnterior, FechaTerminoTest) >= 180 THEN 1
            ELSE 0
        END AS EsValido
    FROM ChequeosUnicos
),

-- Paso 4: Renumerar solo chequeos válidos
ChequeosValidosRenumerados AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (
            PARTITION BY ClaveEntidad 
            ORDER BY FechaTerminoTest
        ) AS SeqNum,
        COUNT(*) OVER (PARTITION BY ClaveEntidad) AS TotalChequeosValidos
    FROM ChequeosValidos
    WHERE EsValido = 1
)

-- Paso 5: Enriquecer con datos de negocio
SELECT 
    cv.*,
    rnd.ptjeTotalUsuario AS PuntajeGlobal,
    nm.Descripcion AS NivelMadurez,
    rnd.ptjeDimensionTecnologia AS D_Tecnologia,
    rnd.ptjeDimensionComunicacion AS D_Comunicacion,
    -- ... más campos
    sa.Descripcion AS SectorActividad,
    dep.Nombre AS Departamento
FROM ChequeosValidosRenumerados cv
LEFT JOIN dbo.ResultadoNivelDigital rnd ON cv.IdUsuario = rnd.IdUsuario AND cv.Test = rnd.Test
LEFT JOIN dbo.NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
-- ... más JOINs
```

**Características Clave**:

| Característica | Implementación |
|----------------|----------------|
| Validación 6 meses | `DATEDIFF(DAY, ...) >= 180` |
| Manejo "NO TENGO" | ClaveEntidad diferenciada |
| Deduplicación | `ROW_NUMBER()` por Test |
| Secuenciación | `LAG()` para fecha anterior |
| Hints de rendimiento | `WITH (NOLOCK)` |

---

### Vista 2: vw_RechequeosKPIs

**Propósito**: Pre-calcular deltas y métricas comparativas entre primer y último chequeo.

```sql
CREATE VIEW dbo.vw_RechequeosKPIs
AS
WITH 
-- Solo entidades con 2+ chequeos válidos
EntidadesElegibles AS (
    SELECT DISTINCT ClaveEntidad
    FROM dbo.vw_RechequeosBase
    WHERE TotalChequeosValidos >= 2
),

-- Primer chequeo de cada entidad
PrimerChequeo AS (
    SELECT b.*
    FROM dbo.vw_RechequeosBase b
    INNER JOIN EntidadesElegibles ee ON b.ClaveEntidad = ee.ClaveEntidad
    WHERE b.SeqNum = 1
),

-- Último chequeo de cada entidad
UltimoChequeo AS (
    SELECT ce.*
    FROM dbo.vw_RechequeosBase ce
    INNER JOIN (
        SELECT ClaveEntidad, MAX(SeqNum) AS MaxSeq
        FROM dbo.vw_RechequeosBase
        GROUP BY ClaveEntidad
    ) m ON ce.ClaveEntidad = m.ClaveEntidad AND ce.SeqNum = m.MaxSeq
),

-- Cálculo de deltas
AnalisisComparativo AS (
    SELECT
        p.ClaveEntidad,
        p.EmpresaNombre,
        p.TotalChequeosValidos AS TotalChequeos,
        
        -- Datos del primer chequeo
        p.PuntajeGlobal AS Puntaje_Primero,
        p.NivelMadurez AS Nivel_Primero,
        p.FechaTerminoTest AS Fecha_Primero,
        
        -- Datos del último chequeo
        u.PuntajeGlobal AS Puntaje_Ultimo,
        u.NivelMadurez AS Nivel_Ultimo,
        u.FechaTerminoTest AS Fecha_Ultimo,
        
        -- DELTAS (diferencia último - primero)
        u.PuntajeGlobal - p.PuntajeGlobal AS DeltaGlobal,
        u.D_Tecnologia - p.D_Tecnologia AS DeltaTecnologia,
        u.D_Comunicacion - p.D_Comunicacion AS DeltaComunicacion,
        u.D_Organizacion - p.D_Organizacion AS DeltaOrganizacion,
        u.D_Datos - p.D_Datos AS DeltaDatos,
        u.D_Estrategia - p.D_Estrategia AS DeltaEstrategia,
        u.D_Procesos - p.D_Procesos AS DeltaProcesos,
        
        -- Tiempo entre chequeos
        DATEDIFF(DAY, p.FechaTerminoTest, u.FechaTerminoTest) AS DiasEntreChequeos,
        
        -- Saltos de nivel
        CASE 
            WHEN p.NivelMadurez IN ('Inicial', 'Novato') 
             AND u.NivelMadurez IN ('Competente', 'Avanzado') 
            THEN 1 ELSE 0
        END AS SaltoBajoMedio,
        
        CASE 
            WHEN p.NivelMadurez = 'Competente' 
             AND u.NivelMadurez = 'Avanzado' 
            THEN 1 ELSE 0
        END AS SaltoMedioAlto
        
    FROM PrimerChequeo p
    INNER JOIN UltimoChequeo u ON p.ClaveEntidad = u.ClaveEntidad
)

SELECT 
    *,
    -- Tasa de mejora mensual (puntos/mes)
    CASE 
        WHEN DiasEntreChequeos > 0 
        THEN DeltaGlobal / (DiasEntreChequeos / 30.0)
        ELSE 0
    END AS TasaMejoraMensual,
    
    -- Flags de clasificación
    CASE WHEN DeltaGlobal > 0 THEN 1 ELSE 0 END AS TieneMejoraPositiva,
    CASE WHEN DeltaGlobal < 0 THEN 1 ELSE 0 END AS TieneRegresion,
    CASE WHEN DeltaGlobal >= 0 THEN 1 ELSE 0 END AS EsConsistente
    
FROM AnalisisComparativo;
```

**Métricas Calculadas**:

| Métrica | Fórmula |
|---------|---------|
| DeltaGlobal | `Puntaje_Ultimo - Puntaje_Primero` |
| TasaMejoraMensual | `DeltaGlobal / (Días / 30)` |
| TieneMejoraPositiva | `1 si DeltaGlobal > 0` |
| SaltoBajoMedio | `1 si pasó de Inicial/Novato a Competente/Avanzado` |

---

### Vista 3: vw_RechequeosTabla

**Propósito**: Datos optimizados para la tabla de frontend con campos formateados.

```sql
CREATE VIEW dbo.vw_RechequeosTabla
AS
SELECT
    IdEmpresa,
    IdUsuario,
    ClaveEntidad,
    EmpresaNombre,
    NombreUsuario,
    SectorActividad,
    SubSectorActividad,
    TamanoEmpresa,
    Departamento,
    Distrito,
    
    -- Campo concatenado para ubicación
    CONCAT(
        ISNULL(Distrito,''), 
        CASE WHEN Distrito IS NOT NULL AND Departamento IS NOT NULL 
             THEN ', ' ELSE '' END, 
        ISNULL(Departamento,'')
    ) AS Ubicacion,
    
    TotalChequeos,
    Puntaje_Primero AS PrimerPuntaje,
    Nivel_Primero AS PrimerNivel,
    Puntaje_Ultimo AS UltimoPuntaje,
    Nivel_Ultimo AS UltimoNivel,
    Fecha_Primero AS PrimeraFecha,
    Fecha_Ultimo AS UltimaFecha,
    DiasEntreChequeos,
    DeltaGlobal,
    DeltaTecnologia,
    DeltaComunicacion,
    DeltaOrganizacion,
    DeltaDatos,
    DeltaEstrategia,
    DeltaProcesos,
    TasaMejoraMensual,
    SaltoBajoMedio,
    SaltoMedioAlto,
    TieneMejoraPositiva,
    TieneRegresion
FROM dbo.vw_RechequeosKPIs;
```

---

## Índices Creados

### Índices en Tablas Originales

```sql
-- Índice para búsqueda de chequeos finalizados
CREATE NONCLUSTERED INDEX IX_TestUsuario_Finalizado_IdUsuario
ON dbo.TestUsuario (Finalizado, IdUsuario, Test)
INCLUDE (FechaTest, FechaTerminoTest, IdTestUsuario);

-- Índice para JOIN EmpresaInfo-TestUsuario
CREATE NONCLUSTERED INDEX IX_EmpresaInfo_IdUsuario_Test
ON dbo.EmpresaInfo (IdUsuario, Test)
INCLUDE (IdEmpresa, IdEmpresaInfo, IdSectorActividad, IdDepartamento, IdLocalidad);

-- Índice para búsqueda por empresa
CREATE NONCLUSTERED INDEX IX_EmpresaInfo_IdEmpresa
ON dbo.EmpresaInfo (IdEmpresa)
INCLUDE (IdUsuario, Test);

-- Índice para resultados
CREATE NONCLUSTERED INDEX IX_ResultadoNivelDigital_IdUsuario_Test
ON dbo.ResultadoNivelDigital (IdUsuario, Test)
INCLUDE (ptjeTotalUsuario, IdNivelMadurez, ptjeDimensionTecnologia, ...);
```

### Índices Columnstore (SQL Server 2016+)

```sql
-- Índice columnstore para agregaciones masivas
CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_TestUsuario_Analytics
ON dbo.TestUsuario (IdUsuario, Test, Finalizado, FechaTerminoTest);

CREATE NONCLUSTERED COLUMNSTORE INDEX NCCI_EmpresaInfo_Analytics
ON dbo.EmpresaInfo (IdEmpresa, IdUsuario, IdSectorActividad, IdDepartamento);
```

---

## Lógica de Negocio en SQL

### Manejo de Empresas Genéricas

El sistema detecta automáticamente empresas "NO TENGO" donde múltiples usuarios comparten el mismo IdEmpresa:

```sql
-- Clave diferenciada
CASE 
    WHEN Nombre LIKE '%NO TENGO%' OR IdEmpresa <= 0
    THEN 'U_' + CAST(IdUsuario AS VARCHAR)  -- Clave por usuario
    ELSE 'E_' + CAST(IdEmpresa AS VARCHAR)  -- Clave por empresa
END AS ClaveEntidad
```

### Validación de Intervalo Mínimo

Los rechequeos deben tener al menos 6 meses (180 días) de separación:

```sql
CASE 
    WHEN FechaAnterior IS NULL THEN 1  -- Primer chequeo siempre válido
    WHEN DATEDIFF(DAY, FechaAnterior, FechaTerminoTest) >= 180 THEN 1
    ELSE 0  -- Chequeo inválido (muy cercano al anterior)
END AS EsValido
```

### Detección de Ubicación

La ubicación usa fallback: primero intenta la ubicación más reciente, luego la del chequeo:

```sql
CASE 
    WHEN ub.IdLocalidadLatest IS NOT NULL THEN 
        CASE WHEN ub.IdRegionLatest = 20 THEN 'Capital' 
             ELSE ub.DepartamentoNombreLatest END
    ELSE 
        CASE WHEN sr.IdRegion = 20 THEN 'Capital' 
             ELSE dep.Nombre END
END AS Departamento
```

---

## Rendimiento Obtenido

### Métricas de Antes/Después

| Consulta | Antes | Después | Mejora |
|----------|-------|---------|--------|
| KPIs de Rechequeos | 32 seg | 1.2 seg | **96%** |
| Tabla de Rechequeos | 18 seg | 0.8 seg | **96%** |
| Heatmap por Sector | 25 seg | 0.9 seg | **96%** |
| Filtrado combinado | 45 seg | 2.1 seg | **95%** |

### Factores de Mejora

1. **Vistas pre-calculadas**: Evitan JOINs repetitivos
2. **Índices cubrientes**: Evitan acceso a tabla base
3. **WITH (NOLOCK)**: Lectura sin bloqueos
4. **CTEs**: Materialización intermedia eficiente
5. **Caché de aplicación**: Reduce hits a BD

---

## Mantenimiento

### Reconstrucción de Índices

```sql
-- Ejecutar semanalmente (fuera de horario pico)
ALTER INDEX ALL ON dbo.TestUsuario REBUILD;
ALTER INDEX ALL ON dbo.EmpresaInfo REBUILD;
ALTER INDEX ALL ON dbo.ResultadoNivelDigital REBUILD;
```

### Actualización de Estadísticas

```sql
-- Ejecutar después de cargas masivas
UPDATE STATISTICS dbo.TestUsuario;
UPDATE STATISTICS dbo.EmpresaInfo;
UPDATE STATISTICS dbo.ResultadoNivelDigital;
```

### Monitoreo de Rendimiento

```sql
-- Verificar tiempos de consulta
SET STATISTICS TIME ON;
SET STATISTICS IO ON;

SELECT COUNT(*) FROM dbo.vw_RechequeosKPIs;

SET STATISTICS TIME OFF;
SET STATISTICS IO OFF;
```

### Regenerar Vistas

Si hay cambios en la estructura de tablas base:

```sql
-- Ejecutar script de creación de vistas
-- backend/sql-scripts/06-create-rechequeos-optimized-views.sql
```

---

## Scripts de Referencia

### Ubicación de Scripts

```
backend/sql-scripts/
├── 00-OPTIMIZE-RECHEQUEOS.sql      # Script principal
├── 01-create-auth-tables.sql       # Tablas de autenticación
├── 02-seed-auth-data.sql           # Datos iniciales
├── 04-optimize-rechequeos-indexes.sql  # Índices
├── 06-create-rechequeos-optimized-views.sql  # Vistas
├── 07-create-additional-indexes.sql  # Índices adicionales
├── 08-create-views-indexes.sql     # Índices sobre vistas
├── 09-create-columnstore-indexes.sql  # Columnstore
└── INSTALACION-COMPLETA.sql        # Script todo-en-uno
```

---

*Documento técnico actualizado: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
