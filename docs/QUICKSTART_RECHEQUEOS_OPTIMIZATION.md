# 🚀 INICIO RÁPIDO - Optimización de Rechequeos

**Tiempo estimado**: 10 minutos
**Mejora esperada**: De 120s a < 5s

---

## Paso 1: Ejecutar Script SQL (CRÍTICO)

### Opción A: Script Maestro (RECOMENDADO)
**Ejecuta todo de una vez**: índices + vistas
```
1. Abrir SQL Server Management Studio
2. Conectar a: FRAN\MSSQL2022
3. Abrir: backend/sql-scripts/00-OPTIMIZE-RECHEQUEOS.sql
4. Ejecutar (F5) - tarda 3-7 minutos
```

Este script ejecuta automáticamente:
- ✅ Índices estratégicos (`04-optimize-rechequeos-indexes.sql`)
- ✅ **Índices adicionales** (`07-create-additional-indexes.sql`) ← NUEVO
- ✅ Vistas optimizadas (`06-create-rechequeos-optimized-views.sql`)

### Opción B: Script Individual (Solo vistas)
```
1. Abrir: backend/sql-scripts/06-create-rechequeos-optimized-views.sql
2. Ejecutar (F5)
```

**Verificar** que se crearon las 3 vistas:
```sql
USE BID_v2_22122025;
SELECT name FROM sys.views WHERE name LIKE 'vw_Rechequeos%';
-- Debe mostrar 3 filas:
-- vw_RechequeosBase
-- vw_RechequeosKPIs
-- vw_RechequeosTabla
```

✅ **Resultado**: Query de KPIs pasa de 120s a 3-5s  
✅ **Con índices adicionales**: Búsquedas y filtros hasta 10x más rápidos

---

## Paso 2: Configurar Redis (OPCIONAL pero Recomendado)

### Opción A: Instalar Memurai (Recomendado)
1. Descargar: https://www.memurai.com/get-memurai
2. Instalar con opciones por defecto
3. Se instalará como servicio Windows automáticamente

### Opción B: Sin Redis (Funciona Perfectamente)
**El sistema funciona completo sin Redis**, usa memoria del servidor.

**Comportamiento sin Redis**:
- 3 intentos de conexión (< 5 segundos total)
- Se desactiva automáticamente
- Usa caché en memoria
- **No más intentos** - sin loops infinitos
- Logs limpios: solo 4-5 líneas de advertencia

**Logs esperados sin Redis**:
```
⚠️ Redis: Connection error (attempt 1/3) - connect ECCONNREFUSED
⚠️ Redis: Connection error (attempt 2/3) - connect ECCONNREFUSED
⚠️ Redis: Connection error (attempt 3/3) - connect ECCONNREFUSED
⚠️ Redis: Permanently disabled. System will use memory cache only.
💡 To enable Redis: Install Redis/Memurai and restart the server.
```

**Agregar a `.env`** (solo si instalas Redis):
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

✅ **Con Redis**: Caché persiste entre reinicios
✅ **Sin Redis**: Todo funciona igual, solo pierde caché al reiniciar

---

## Paso 3: Reiniciar Backend

**Nodemon reiniciará automáticamente**. Buscar en logs:

✅ **Con vistas**:
```
✅ Optimized SQL views found - using ultra-fast queries
```

✅ **Con Redis**:
```
✅ Redis: Connected successfully
```

⚠️ **Sin Redis** (funciona igual):
```
⚠️ Redis: Could not connect - Using memory cache as fallback
```

---

## Paso 4: Probar

1. Ir a: http://localhost:3000/rechequeos
2. **Primera carga con Lazy Loading**:
   - KPIs aparecen en ~15-25s (antes 120s)
   - Charts aparecen +300ms después
   - Tabla aparece +600ms después
   - **Carga progresiva** - no más pantalla blanca
3. **Cambiar filtro**: Debe tardar < 5 segundos
4. **Segunda carga** (mismo filtro): < 1 segundo (desde cache)

---

## 🎯 Resultados Esperados

| Endpoint | Antes | Con Vistas | Con Vistas + Índices | Con Cache Redis |
|----------|-------|------------|----------------------|-----------------|
| KPIs | 120s (timeout) | ~20s ⚡ | ~15s ⚡⚡ | < 0.1s 🚀 |
| Tabla | 90s | < 3s ⚡ | < 0.1s 🚀 |
| Evolution | 30s | < 3s ⚡ | < 0.1s 🚀 |
| Heatmap | 32s | < 2s ⚡ | < 0.1s 🚀 |

---

## ⚠️ Si Algo Falla

### Las vistas no se crearon
```sql
-- Verificar errores en el script
-- Ver mensajes de error en SSMS
-- Verificar permisos del usuario
```

### Sigue lento
```bash
# Ver logs del backend, buscar:
[RECHEQUEOS] Getting KPIs (OPTIMIZED VIEWS)  ← Debe decir "OPTIMIZED VIEWS"

# Si dice "original queries":
# Las vistas no existen o no se detectaron
```

### Redis no conecta
```bash
# Es normal si no instalaste Redis
# El sistema funciona igual con memoria
# Solo verás esta advertencia:
⚠️ Redis: Could not connect - Using memory cache as fallback
```

---

## 📊 Monitorear Performance

**Ver logs del backend**:
```bash
[RECHEQUEOS OPT-VIEWS] KPIs retrieved in 2341ms ⚡
[RECHEQUEOS] Returning cached KPIs from Redis/Memory
```

**Tiempo normal con vistas**:
- Primera carga: 2-5 segundos
- Desde caché: < 100ms

---

## ✅ Checklist

- [ ] Ejecutar script SQL para crear vistas
- [ ] Verificar que se crearon las 3 vistas
- [ ] (Opcional) Instalar Redis/Memurai
- [ ] Reiniciar backend
- [ ] Verificar logs (debe decir "OPTIMIZED VIEWS")
- [ ] Probar página de rechequeos
- [ ] Confirmar que tarda < 5 segundos

---

## 📖 Documentación Completa

Ver: `backend/RECHEQUEOS_FINAL_SOLUTION.md`

---

**¿Problemas?** Contactar al equipo de desarrollo con los logs del backend.

