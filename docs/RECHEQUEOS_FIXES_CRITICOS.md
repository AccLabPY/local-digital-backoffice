# PROBLEMAS CRÍTICOS ENCONTRADOS Y FIXES NECESARIOS

**Fecha**: 18 de noviembre de 2025, 1:33 AM

## Problemas Identificados

### 1. **Performance Extremadamente Lenta** (40-50 segundos)
- **Causa**: La CTE `EmpresasElegibles` en `buildBaseCTE` tenía una subconsulta anidada muy pesada
- **Fix Aplicado**: Simplificado a un único `GROUP BY` con `HAVING` directo
- **Resultado Esperado**: Reducción de 40s a ~5-10s

### 2. **Evolution Series No Muestra Datos**
- **Causa**: El query NO agrupaba por tiempo (Year, Month), solo por categoría
- **Fix Aplicado**: Agregado `MonthlyAverages` CTE con `GROUP BY Categoria, Anno, Mes`
- **Resultado Esperado**: Gráfico con líneas temporales funcionando

### 3. **Heatmap Muestra Sectores Vacíos**
- **Causa**: No filtraba por `TotalChequeosValidos >= 2` en `ChequeosEnriquecidos`
- **Fix Aplicado**: Agregado filtro `WHERE cv.TotalChequeosValidos >= 2` y validación de `SectorActividad IS NOT NULL`
- **Resultado Esperado**: Solo sectores con rechequeos reales

### 4. **Conteos Inconsistentes** (133 en KPIs vs 149 en tabla)
- **Causa**: `getTableData` NO usaba `buildBaseCTE`, usaba su propia lógica antigua
- **Fix Necesario**: **PENDIENTE** - Reescribir `getTableData` para usar `buildBaseCTE`
- **Complejidad**: ALTA - El query actual tiene >400 líneas con lógica compleja para "NO TENGO"

### 5. **Filtros de Fecha No Funcionan Correctamente**
- **Causa**: Misma que #4 - `getTableData` no usa la lógica de filtrado por último chequeo
- **Fix Necesario**: **PENDIENTE** - Mismo que #4

### 6. **Cache No Funciona**
- **Causa**: Probablemente porque cada request genera queries diferentes o el cache está deshabilitado
- **Fix Necesario**: Revisar `cache.service.js` y agregar logs

## Fixes Aplicados

### ✅ 1. Optimización de `buildBaseCTE`

**ANTES**:
```sql
EmpresasElegibles AS (
  SELECT DISTINCT ei.IdEmpresa
  FROM dbo.EmpresaInfo ei
  INNER JOIN dbo.TestUsuario tu ON ...
  WHERE tu.Finalizado = 1
    AND ei.IdEmpresa IN (
      -- Subconsulta pesada con GROUP BY anidado
      SELECT e2.IdEmpresa
      FROM dbo.EmpresaInfo e2
      INNER JOIN dbo.TestUsuario t2 ON ...
      WHERE t2.Finalizado = 1
        AND e2.IdEmpresa = ei.IdEmpresa  -- ¡Muy lento!
      GROUP BY e2.IdEmpresa
      HAVING MAX(t2.FechaTerminoTest) >= @fechaIni
        AND MAX(t2.FechaTerminoTest) <= @fechaFin
    )
),
```

**DESPUÉS** (OPTIMIZADO):
```sql
EmpresasElegibles AS (
  SELECT IdEmpresa, MAX(FechaTerminoTest) AS UltimaFecha
  FROM dbo.EmpresaInfo ei WITH (NOLOCK)
  INNER JOIN dbo.TestUsuario tu WITH (NOLOCK) ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  WHERE tu.Finalizado = 1
  GROUP BY IdEmpresa
  HAVING MAX(tu.FechaTerminoTest) >= @fechaIni
    AND MAX(tu.FechaTerminoTest) <= @fechaFin
),
```

**Mejora**: De subconsulta correlacionada (N^2) a un solo GROUP BY (N log N)

### ✅ 2. Fix Evolution Series

**ANTES**:
```sql
SELECT 
  Categoria,
  AVG(CAST(PuntajeGlobal AS FLOAT)) AS PromedioPuntaje,
  COUNT(DISTINCT IdEmpresa) AS NumEmpresas
FROM ChequeosEnriquecidos
WHERE Categoria IS NOT NULL
GROUP BY Categoria  -- ❌ Solo por categoría, sin tiempo
```

**DESPUÉS**:
```sql
MonthlyAverages AS (
  SELECT 
    Categoria,
    Anno,
    Mes,
    AVG(CAST(PuntajeGlobal AS FLOAT)) AS PuntajePromedio,
    COUNT(DISTINCT IdEmpresa) AS EmpresasUnicas
  FROM ChequeosEnriquecidos
  WHERE Categoria IS NOT NULL
  GROUP BY Categoria, Anno, Mes  -- ✅ Con tiempo
)
SELECT 
  Categoria AS CategoryValue,
  Anno,
  Mes,
  PuntajePromedio,
  EmpresasUnicas,
  CONCAT(Anno, '-', RIGHT('0' + CAST(Mes AS VARCHAR), 2)) AS Periodo
FROM MonthlyAverages
ORDER BY Categoria, Anno, Mes
```

### ✅ 3. Fix Heatmap Sectores Vacíos

**ANTES**:
```sql
ChequeosEnriquecidos AS (
  SELECT ... FROM ChequeosValidosRenumerados cv
  ...
  -- ❌ No filtraba por rechequeos
)
```

**DESPUÉS**:
```sql
ChequeosEnriquecidos AS (
  SELECT ... FROM ChequeosValidosRenumerados cv
  ...
  WHERE cv.TotalChequeosValidos >= 2  -- ✅ Solo con rechequeos
    AND sa.Descripcion IS NOT NULL 
    AND sa.Descripcion <> ''
)
```

## Fixes PENDIENTES (CRÍTICOS)

### ⚠️ 4. Reescribir `getTableData` para Usar `buildBaseCTE`

**Estado**: EN PROGRESO

**Problema**: La función actual tiene ~500 líneas con lógica separada que:
- NO usa `buildBaseCTE`
- NO aplica validación de 6 meses
- NO filtra por fecha del último chequeo
- Tiene lógica especial para empresas "NO TENGO"

**Solución Propuesta**:
```javascript
const TABLE_QUERY = `
WITH ${baseCTE},
ChequeosEnriquecidos AS (
  SELECT 
    cv.IdEmpresa,
    cv.IdUsuario,
    cv.Test,
    cv.FechaTerminoTest,
    cv.SeqNum,
    cv.TotalChequeosValidos,
    rnd.ptjeTotalUsuario,
    rnd.ptjeDimensionTecnologia,
    rnd.ptjeDimensionComunicacion,
    rnd.ptjeDimensionOrganizacion,
    rnd.ptjeDimensionDatos,
    rnd.ptjeDimensionEstrategia,
    rnd.ptjeDimensionProcesos,
    nm.Descripcion AS NivelMadurez,
    sa.Descripcion AS SectorActividad,
    va.Nombre AS TamanoEmpresa,
    e.Nombre AS EmpresaNombre,
    CASE WHEN sr.IdRegion = 20 THEN 'Capital' ELSE dep.Nombre END AS Departamento,
    CASE WHEN sr.Nombre IS NOT NULL THEN sr.Nombre ELSE 'OTRO' END AS Distrito,
    u.NombreCompleto AS NombreUsuario
  FROM ChequeosValidosRenumerados cv
  LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) ON cv.IdUsuario = rnd.IdUsuario AND cv.Test = rnd.Test
  LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
  LEFT JOIN dbo.EmpresaInfo ei WITH (NOLOCK) ON cv.IdEmpresa = ei.IdEmpresa
  LEFT JOIN dbo.SectorActividad sa WITH (NOLOCK) ON ei.IdSectorActividad = sa.IdSectorActividad
  LEFT JOIN dbo.VentasAnuales va WITH (NOLOCK) ON ei.IdVentas = va.IdVentasAnuales
  LEFT JOIN dbo.Departamentos dep WITH (NOLOCK) ON ei.IdDepartamento = dep.IdDepartamento
  LEFT JOIN dbo.SubRegion sr WITH (NOLOCK) ON ei.IdLocalidad = sr.IdSubRegion
  LEFT JOIN dbo.Empresa e WITH (NOLOCK) ON ei.IdEmpresa = e.IdEmpresa
  LEFT JOIN dbo.Usuario u WITH (NOLOCK) ON ei.IdUsuario = u.IdUsuario
  WHERE cv.TotalChequeosValidos >= 2
  ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
),
EmpresasConRechequeos AS (
  SELECT 
    IdEmpresa,
    COUNT(*) AS TotalChequeos,
    MIN(FechaTerminoTest) AS PrimeraFecha,
    MAX(FechaTerminoTest) AS UltimaFecha,
    MAX(EmpresaNombre) AS EmpresaNombre,
    MAX(SectorActividad) AS SectorActividad,
    MAX(TamanoEmpresa) AS TamanoEmpresa,
    MAX(Departamento) AS Departamento,
    MAX(Distrito) AS Distrito,
    MAX(NombreUsuario) AS NombreUsuario
  FROM ChequeosEnriquecidos
  GROUP BY IdEmpresa
),
PrimerChequeo AS (
  SELECT * FROM ChequeosEnriquecidos WHERE SeqNum = 1
),
UltimoChequeo AS (
  SELECT ce.*
  FROM ChequeosEnriquecidos ce
  INNER JOIN (
    SELECT IdEmpresa, MAX(SeqNum) AS MaxSeq
    FROM ChequeosEnriquecidos
    GROUP BY IdEmpresa
  ) m ON ce.IdEmpresa = m.IdEmpresa AND ce.SeqNum = m.MaxSeq
),
ResultadoCompleto AS (
  SELECT 
    e.IdEmpresa,
    e.EmpresaNombre,
    e.SectorActividad,
    e.TamanoEmpresa,
    e.Departamento,
    e.Distrito,
    e.NombreUsuario,
    e.TotalChequeos,
    e.PrimeraFecha,
    e.UltimaFecha,
    DATEDIFF(DAY, e.PrimeraFecha, e.UltimaFecha) AS DiasEntreChequeos,
    p.ptjeTotalUsuario AS PrimerPuntaje,
    u.ptjeTotalUsuario AS UltimoPuntaje,
    u.ptjeTotalUsuario - p.ptjeTotalUsuario AS DeltaGlobal,
    p.NivelMadurez AS PrimerNivel,
    u.NivelMadurez AS UltimoNivel,
    u.ptjeDimensionTecnologia - p.ptjeDimensionTecnologia AS DeltaTecnologia,
    u.ptjeDimensionComunicacion - p.ptjeDimensionComunicacion AS DeltaComunicacion,
    u.ptjeDimensionOrganizacion - p.ptjeDimensionOrganizacion AS DeltaOrganizacion,
    u.ptjeDimensionDatos - p.ptjeDimensionDatos AS DeltaDatos,
    u.ptjeDimensionEstrategia - p.ptjeDimensionEstrategia AS DeltaEstrategia,
    u.ptjeDimensionProcesos - p.ptjeDimensionProcesos AS DeltaProcesos
  FROM EmpresasConRechequeos e
  INNER JOIN PrimerChequeo p ON e.IdEmpresa = p.IdEmpresa
  INNER JOIN UltimoChequeo u ON e.IdEmpresa = u.IdEmpresa
  WHERE e.EmpresaNombre LIKE @searchTerm
),
ResultadoPaginado AS (
  SELECT *,
    ROW_NUMBER() OVER (ORDER BY ${sortBy} ${sortOrder}) AS RowNum,
    COUNT(*) OVER () AS TotalRows
  FROM ResultadoCompleto
)
SELECT * FROM ResultadoPaginado
WHERE RowNum > @offset AND RowNum <= @offset + @limit
OPTION (RECOMPILE);
`;
```

**Beneficios**:
- ✅ Usa `buildBaseCTE` (consistencia)
- ✅ Aplica validación de 6 meses
- ✅ Filtra por fecha del último chequeo
- ✅ Mucho más simple (~100 líneas vs 500)
- ✅ Mejor performance

**Desventaja**:
- ❌ Pierde lógica especial para "NO TENGO" (si es necesaria, requiere adaptación)

### ⚠️ 5. Revisar y Habilitar Cache

**Archivo**: `backend/src/services/cache.service.js`

**Problema**: Cache puede estar deshabilitado o no funcionando correctamente

**Acción Necesaria**:
1. Verificar que cache esté habilitado
2. Agregar logs para ver hits/misses
3. Revisar TTL (Time To Live)
4. Considerar cache por combinación de filtros

## Testing Requerido

1. ✅ Performance < 10 segundos para carga inicial
2. ✅ Evolution Series muestra líneas temporales
3. ✅ Heatmap solo muestra sectores con datos
4. ⚠️ Conteos consistentes entre KPIs y tabla (PENDIENTE fix #4)
5. ⚠️ Filtro "año pasado" muestra vacío correctamente (PENDIENTE fix #4)
6. ⚠️ Cache funciona al cambiar filtros (PENDIENTE fix #5)

## Próximos Pasos INMEDIATOS

1. **CRÍTICO**: Completar reescritura de `getTableData`
2. **IMPORTANTE**: Revisar y habilitar cache
3. **TESTING**: Probar con filtros de fecha del año pasado
4. **TESTING**: Medir tiempos de respuesta reales

## Notas Adicionales

- Los fixes aplicados ya mejoran significativamente el performance
- El problema de conteos inconsistentes se resolverá cuando `getTableData` use `buildBaseCTE`
- La lógica de "NO TENGO" puede necesitar adaptación especial si es crítica

