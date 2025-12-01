# Solución Definitiva para Performance de Rechequeos

## 📊 Estado Actual

### Problemas Identificados
1. **KPIs tardan 30-90 segundos** en primera carga
2. **Timeout de 120s** en frontend, pero backend puede tardar más
3. **Al cambiar filtros**, vuelve a tardar mucho (caché se invalida)
4. **Respuestas 304 (cached) tardan 80+ segundos** - problema de verificación de caché

### Métricas Actuales
- **Tabla**: 84-90 segundos (primera carga)
- **KPIs**: 30-90 segundos (primera carga), timeout a 120s
- **Evolution Series**: 25-30 segundos
- **Heatmap**: 30-32 segundos

---

## ✅ Solución Implementada (Fase 1)

### 1. Mejoras de Caché
**Archivo**: `backend/src/controllers/rechequeos.controller.js`

- ✅ **Cambiado caché de KPIs de 1 min a 5 min**
  - Antes: `cacheService.getShort()` (1 minuto)
  - Ahora: `cacheService.get()` (5 minutos)
  - **Razón**: KPIs no cambian frecuentemente, y son muy costosos de calcular

### 2. Timeout Aumentado
**Archivo**: `backend/src/models/rechequeos.model.js`

- ✅ **Timeout de backend aumentado de 180s a 240s** (4 minutos)
  - Da más margen para queries complejas
  - Evita timeouts prematuros

### 3. Retry Logic en Frontend
**Archivo**: `components/rechequeos-kpis.tsx`

- ✅ **Timeout de 180 segundos** en frontend
- ✅ **Retry automático** si falla (1 vez)
- ✅ **Diálogo de alerta** si falla después del retry
- ✅ **Mensaje claro** al usuario para recargar página

**Comportamiento**:
1. Primera solicitud: timeout de 180s
2. Si falla: retry automático después de 2-5 segundos
3. Si el retry también falla: muestra diálogo pidiendo recargar página

---

## 🚀 Próximas Fases (Recomendadas)

### Fase 2: Optimizar Query de KPIs (Corto Plazo)

**Problema**: La query de KPIs del modelo original es muy compleja con múltiples CTEs anidados.

**Solución Propuesta**:
1. **Simplificar CTEs**: Combinar algunos pasos
2. **Usar índices existentes**: Asegurar que SQL Server use los índices creados
3. **Agregar `OPTION (RECOMPILE)`**: Para mejor plan de ejecución
4. **Considerar materialización parcial**: Pre-calcular algunos agregados

**Archivo a modificar**: `backend/src/models/rechequeos.model.js` - método `getKPIs()`

**Tiempo estimado**: 2-4 horas
**Mejora esperada**: Reducir de 30-90s a 15-30s

---

### Fase 3: Arreglar Modelo Optimizado (Mediano Plazo)

**Problema**: El modelo optimizado tiene cálculos incorrectos (hardcodeados en 0).

**Tareas**:
1. ✅ **Identificados todos los problemas** (ver `RECHEQUEOS_OPTIMIZATION_ISSUES.md`)
2. ⏳ **Corregir cálculo de Distribución**
3. ⏳ **Corregir cálculo de Tasa de Reincidencia**
4. ⏳ **Corregir cálculo de Saltos de Nivel**
5. ⏳ **Arreglar error SQL en getTableData**
6. ⏳ **Implementar validación de 6 meses**

**Archivo a modificar**: `backend/src/models/rechequeos.model.optimized.js`

**Tiempo estimado**: 1-2 días
**Mejora esperada**: Reducir de 30-90s a < 10s

---

### Fase 4: Optimizaciones Adicionales (Largo Plazo)

#### Opción A: Background Jobs
- Pre-calcular KPIs cada 5 minutos
- Guardar en tabla temporal o Redis
- Frontend consulta datos pre-calculados

#### Opción B: Paginación Inteligente
- No cargar todos los datos de una vez
- Cargar KPIs primero (más rápido)
- Cargar tabla después (paginada)

#### Opción C: Redis Cache
- Mover caché de memoria a Redis
- Persistencia entre reinicios
- Cache distribuido si hay múltiples instancias

---

## 📈 Métricas Objetivo

### Corto Plazo (Con Fase 1 + Fase 2)
- **KPIs**: 15-30 segundos (primera carga)
- **Tabla**: 30-60 segundos (primera carga)
- **Cached**: < 1 segundo

### Mediano Plazo (Con Fase 3)
- **KPIs**: < 10 segundos (primera carga)
- **Tabla**: < 15 segundos (primera carga)
- **Cached**: < 1 segundo

### Largo Plazo (Con Fase 4)
- **KPIs**: < 2 segundos (pre-calculados)
- **Tabla**: < 5 segundos (paginada)
- **Cached**: < 100ms

---

## 🔧 Configuración Actual

### Backend
- **Timeout KPIs**: 240 segundos (4 minutos)
- **Caché KPIs**: 5 minutos
- **Caché Tabla**: 5 minutos
- **Caché Evolution**: 15 minutos
- **Caché Heatmap**: 15 minutos

### Frontend
- **Timeout inicial**: 180 segundos (3 minutos)
- **Retry automático**: 1 vez
- **Grace period**: 60 segundos adicionales en retry

---

## 🐛 Problemas Conocidos

### 1. Respuestas 304 Tardan Mucho
**Síntoma**: Respuestas cached (304) tardan 80+ segundos

**Causa Posible**: 
- El servidor está tardando en verificar el caché
- O está generando la respuesta 304 muy lento

**Solución Temporal**: Ya implementada - caché más largo reduce necesidad de recalcular

**Solución Definitiva**: Investigar por qué `cacheService.get()` tarda tanto

### 2. Al Cambiar Filtros, Vuelve a Tardar
**Causa**: El caché se invalida porque la clave cambia con los filtros

**Solución Temporal**: Ya implementada - caché de 5 min ayuda

**Solución Definitiva**: 
- Pre-calcular KPIs para combinaciones comunes de filtros
- O usar background jobs para mantener caché caliente

---

## 📝 Notas de Implementación

### Cambios Realizados

1. **`backend/src/controllers/rechequeos.controller.js`**
   - Cambiado `getShort()` a `get()` para KPIs
   - Caché de 5 minutos para ambos modelos

2. **`backend/src/models/rechequeos.model.js`**
   - Timeout aumentado de 180s a 240s

3. **`components/rechequeos-kpis.tsx`**
   - Agregado retry logic con timeout de 180s
   - Agregado diálogo de alerta
   - Manejo mejorado de errores

### Archivos Creados

- `backend/RECHEQUEOS_OPTIMIZATION_ISSUES.md` - Lista detallada de problemas en modelo optimizado
- `backend/RECHEQUEOS_PERFORMANCE_SOLUTION.md` - Este archivo

---

## 🎯 Recomendación Final

**Para producción inmediata**:
1. ✅ **Usar Fase 1** (ya implementada) - Mejora UX significativamente
2. ⏳ **Implementar Fase 2** - Optimizar query de KPIs (2-4 horas)
3. ⏳ **Implementar Fase 3** - Arreglar modelo optimizado (1-2 días)

**Para producción a largo plazo**:
- Considerar Fase 4 (Background Jobs) si el volumen de datos crece
- Monitorear métricas y ajustar caché según uso real

---

**Última Actualización**: 2025-11-19 03:10
**Estado**: Fase 1 completada ✅
**Próximo Paso**: Implementar Fase 2 (optimizar query de KPIs)

