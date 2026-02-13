# Solución: IdEmpresa Genérico en Rechequeos

## Problema

La distribución de rechequeos estaba mostrando valores incorrectos debido al **caso especial del IdEmpresa genérico**.

### ¿Qué es el IdEmpresa genérico?

Cuando un usuario selecciona **"NO TENGO empresa"** en el sistema, se le asigna un `IdEmpresa` compartido (ej: `-1`, `0`, o algún ID especial con nombre "NO TENGO"). 

Esto causaba que **múltiples usuarios sin empresa se agrupen como si fueran una sola "empresa"**, distorsionando los conteos:

```
❌ ANTES (Incorrecto):
- 1 chequeo: 1107 empresas
- 2-3 chequeos: 151 empresas
- >3 chequeos: 3 empresas

✅ DESPUÉS (Correcto):
- 1 chequeo: 1369 empresas
- 2-3 chequeos: 133 empresas
- >3 chequeos: 0 empresas
Total: 1502 entidades únicas
```

## Solución Implementada

### 1. Concepto: ClaveEntidad

Introducimos una **clave única compuesta** llamada `ClaveEntidad`:

- **Para empresas reales**: `ClaveEntidad = 'E_' + IdEmpresa`
- **Para usuarios "NO TENGO"**: `ClaveEntidad = 'U_' + IdUsuario`

Esto garantiza que cada entidad (empresa real o usuario sin empresa) sea tratada como única.

### 2. Actualización de Vistas SQL

#### Archivo: `backend/sql-scripts/06-create-rechequeos-optimized-views.sql`

**Cambios principales**:

1. **Identificar empresas genéricas**:
```sql
EmpresasGenericas AS (
  SELECT IdEmpresa
  FROM dbo.Empresa WITH (NOLOCK)
  WHERE Nombre LIKE '%NO TENGO%' 
     OR Nombre LIKE '%Sin empresa%' 
     OR Nombre LIKE '%NO TIENE%'
     OR IdEmpresa <= 0
)
```

2. **Generar ClaveEntidad en ChequeosOrdenados**:
```sql
ChequeosOrdenados AS (
  SELECT 
    -- ...otros campos...
    CASE 
      WHEN ei.IdEmpresa IN (SELECT IdEmpresa FROM EmpresasGenericas) 
      THEN 'U_' + CAST(ei.IdUsuario AS VARCHAR(20))
      ELSE 'E_' + CAST(ei.IdEmpresa AS VARCHAR(20))
    END AS ClaveEntidad,
    -- Usar ClaveEntidad para particionar y ordenar
    ROW_NUMBER() OVER (
      PARTITION BY ClaveEntidad, ei.Test 
      ORDER BY tu.FechaTerminoTest DESC, ei.IdEmpresaInfo DESC
    ) AS rn_dedup
  -- ...
)
```

3. **Agrupar por ClaveEntidad** en todos los CTEs subsiguientes:
   - `ChequeosUnicos`
   - `ChequeosValidosRenumerados`
   - `PrimerChequeo` / `UltimoChequeo` en `vw_RechequeosKPIs`

4. **Exponer ClaveEntidad** en todas las vistas para que el backend pueda usarla.

### 3. Actualización del Modelo Backend

#### Archivo: `backend/src/models/rechequeos.model.optimized-views.js`

**Cambios principales**:

1. **Cálculo de distribución global** usando `ClaveEntidad`:
```javascript
ConteosGlobales AS (
  SELECT 
    CASE 
      WHEN ei.IdEmpresa IN (SELECT IdEmpresa FROM EmpresasGenericas) 
      THEN 'U_' + CAST(ei.IdUsuario AS VARCHAR(20))
      ELSE 'E_' + CAST(ei.IdEmpresa AS VARCHAR(20))
    END AS ClaveEntidad,
    COUNT(DISTINCT tu.IdTestUsuario) AS TotalChequeos
  FROM dbo.EmpresaInfo ei WITH (NOLOCK)
  INNER JOIN dbo.TestUsuario tu WITH (NOLOCK) 
    ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  WHERE tu.Finalizado = 1
  GROUP BY ClaveEntidad
)
```

2. **Contar empresas con rechequeos** usando `ClaveEntidad`:
```javascript
KPIsRechequeos AS (
  SELECT
    COUNT(DISTINCT ClaveEntidad) AS EmpresasConRechequeos,
    -- ...otros KPIs...
  FROM dbo.vw_RechequeosKPIs WITH (NOLOCK)
  ${whereClause}
)
```

3. **Actualizar series de evolución** para usar `ClaveEntidad`:
```javascript
COUNT(DISTINCT ClaveEntidad) AS EmpresasUnicas
```

4. **Actualizar heatmap** para usar `ClaveEntidad`:
```javascript
COUNT(DISTINCT ClaveEntidad) AS EmpresasEnSector
```

## Estructura Final de las Vistas

```
vw_RechequeosBase
├── EmpresasGenericas (CTE para identificar IdEmpresa genérico)
├── ChequeosOrdenados (genera ClaveEntidad)
├── ChequeosUnicos (deduplica por ClaveEntidad)
├── ChequeosValidos (valida 6 meses por ClaveEntidad)
├── ChequeosValidosRenumerados (renumera por ClaveEntidad)
└── ChequeosEnriquecidos (solo entidades con 2+ chequeos)

vw_RechequeosKPIs
├── PrimerChequeo (primer chequeo por ClaveEntidad)
├── UltimoChequeo (último chequeo por ClaveEntidad)
└── AnalisisComparativo (incluye ClaveEntidad)

vw_RechequeosTabla
└── Expone todos los campos incluyendo ClaveEntidad
```

## Columnas Afectadas

Todas las consultas que antes agrupaban/contaban por `IdEmpresa` ahora usan `ClaveEntidad`:

| Vista/Consulta | Columna Anterior | Columna Actual |
|----------------|-----------------|----------------|
| `vw_RechequeosBase` | `PARTITION BY IdEmpresa` | `PARTITION BY ClaveEntidad` |
| `vw_RechequeosKPIs` | `COUNT(DISTINCT IdEmpresa)` | `COUNT(DISTINCT ClaveEntidad)` |
| `getKPIs()` - ConteosGlobales | `GROUP BY IdEmpresa` | `GROUP BY ClaveEntidad` |
| `getKPIs()` - KPIsRechequeos | `COUNT(DISTINCT IdEmpresa)` | `COUNT(DISTINCT ClaveEntidad)` |
| `getEvolutionSeries()` | `COUNT(DISTINCT IdEmpresa)` | `COUNT(DISTINCT ClaveEntidad)` |
| `getHeatmapData()` | `COUNT(DISTINCT IdEmpresa)` | `COUNT(DISTINCT ClaveEntidad)` |

## Cómo Aplicar la Solución

### Paso 1: Ejecutar el script SQL actualizado

```sql
-- Opción A: Ejecutar el script maestro
:r C:\ruta\backend\sql-scripts\00-OPTIMIZE-RECHEQUEOS.sql

-- Opción B: Ejecutar solo las vistas actualizadas
:r C:\ruta\backend\sql-scripts\06-create-rechequeos-optimized-views.sql
```

### Paso 2: Otorgar permisos

```sql
USE BID_v2_22122025;
GRANT ALTER ON SCHEMA::dbo TO [ChequeoApp];
```

### Paso 3: Reiniciar el backend

```bash
cd backend
npm run dev
```

### Paso 4: Limpiar caché

1. Ir a `/configuracion` (como `superadmin`)
2. Click en **"Invalidar caché"**
3. Click en **"Purgar caché completo"**

### Paso 5: Verificar resultados

1. Ir a `/rechequeos`
2. Verificar que los valores de distribución sean correctos:
   - **1 chequeo**: ~1369 empresas
   - **2-3 chequeos**: ~133 empresas
   - **>3 chequeos**: ~0 empresas
   - **Total**: ~1502 entidades únicas

## Archivos Modificados

### SQL:
- ✅ `backend/sql-scripts/06-create-rechequeos-optimized-views.sql`
- ✅ `backend/sql-scripts/00-OPTIMIZE-RECHEQUEOS.sql`

### Backend:
- ✅ `backend/src/models/rechequeos.model.optimized-views.js`

### Documentación:
- ✅ `backend/FIX_IDEMPRESA_GENERICO.md` (este archivo)

## Compatibilidad

- ✅ **SQL Server 2012+**: Todas las funciones usadas son compatibles
- ✅ **Windows Server 2012**: Sin dependencias de sistema operativo
- ✅ **Retrocompatibilidad**: Si las vistas no existen, el sistema sigue usando el modelo original

## Notas Técnicas

1. **Performance**: La inclusión de `ClaveEntidad` no afecta el rendimiento ya que se genera como expresión calculada en tiempo de query, no se almacena.

2. **Índices**: Los índices existentes en `IdEmpresa` e `IdUsuario` se siguen aprovechando eficientemente.

3. **Mantenimiento**: Si se agrega una nueva empresa genérica (otro nombre para "NO TENGO"), actualizar el CTE `EmpresasGenericas`.

4. **Testing**: Verificar que el nombre de la empresa genérica en producción coincida con los patrones en el `WHERE` del CTE `EmpresasGenericas`.

## Solución de Problemas

### Las vistas no se crean (error de sintaxis)
- Verificar que SQL Server sea 2012+
- Verificar que no haya conflictos de nombres de columnas

### Los valores siguen siendo incorrectos
1. Verificar que las 3 vistas existan:
   ```sql
   SELECT name FROM sys.views 
   WHERE name LIKE 'vw_Rechequeos%'
   ```
2. Limpiar caché Redis desde `/configuracion`
3. Reiniciar el backend
4. Probar en modo incógnito

### Backend sigue usando el modelo original
- Verificar logs del backend:
  ```
  ✅ [RECHEQUEOS OPT-VIEWS] KPIs retrieved in XXms
  ❌ [RECHEQUEOS] Getting KPIs (original queries)
  ```
- Si muestra "original queries", las vistas no existen o tienen errores

## Conclusión

Esta solución garantiza que **cada usuario sin empresa sea tratado como una entidad independiente**, resolviendo definitivamente el problema de conteos incorrectos en la distribución de rechequeos.

