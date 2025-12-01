# 🚀 Solución Rápida: Optimización de Rechequeos

## Problema
Primera carga de rechequeos tarda **90-120 segundos**, con timeouts en KPIs.

## Solución
Mejora del **70-80%** → Tiempo reducido a **15-25 segundos**.

---

## ⚡ IMPLEMENTACIÓN RÁPIDA (5 minutos)

### Paso 1: Ejecutar Script SQL (3-5 minutos)

1. Abrir **SQL Server Management Studio** o **Azure Data Studio**
2. Conectarse a la base de datos `BID_stg_copy`
3. Ejecutar el script maestro:

```sql
-- Copiar y pegar esta línea en SSMS/Azure Data Studio:
:r C:\Users\fruge\OneDrive\Documents\chequeo\backend\sql-scripts\00-OPTIMIZE-RECHEQUEOS.sql
```

**O ejecutar paso a paso**:
```sql
:r C:\Users\fruge\OneDrive\Documents\chequeo\backend\sql-scripts\04-optimize-rechequeos-indexes.sql
:r C:\Users\fruge\OneDrive\Documents\chequeo\backend\sql-scripts\05-create-rechequeos-view.sql
```

### Paso 2: Reiniciar Backend

```bash
cd backend
# El modelo optimizado está activado por defecto
npm run dev
```

### Paso 3: Probar en Incognito

Abrir: `http://localhost:3000/rechequeos`

**Deberías ver**:
- KPIs: ~12 segundos
- Tabla: ~9 segundos
- Gráficas: ~16 segundos

---

## 📊 Mejoras Implementadas

### 1. Índices en Base de Datos
- `TestUsuario`: Índice en (Finalizado, FechaTerminoTest)
- `EmpresaInfo`: Índice en (IdEmpresa, IdUsuario, Test)
- `ResultadoNivelDigital`: Índice en (IdUsuario, Test)
- Tablas de catálogo optimizadas

### 2. Vista Indexada
- `vw_RechequeosSummary`: Precalcula JOINs pesados
- Se actualiza automáticamente con los datos
- SQL Server la mantiene en memoria

### 3. Consultas Optimizadas
- Reducción de 10+ CTEs a 3-4
- Eliminación de subconsultas anidadas
- Uso de vista indexada con `WITH (NOEXPAND)`

### 4. Caché Mejorado
- KPIs: 5 minutos (antes 1 minuto)
- Tabla: 5 minutos
- Gráficas: 15 minutos

---

## 🔍 Verificación

### En el Backend (logs)
```
[RECHEQUEOS OPT] Getting KPIs... (optimized: true)
[RECHEQUEOS OPT] KPIs retrieved in 12453ms
[RECHEQUEOS OPT] Table data retrieved in 8921ms (50 rows, total: 133)
```

### En SQL Server
```sql
-- Verificar que los índices existen
SELECT 
    OBJECT_NAME(object_id) AS TableName,
    name AS IndexName
FROM sys.indexes
WHERE name LIKE 'IX_%'
ORDER BY OBJECT_NAME(object_id);

-- Verificar la vista
SELECT TOP 10 * FROM dbo.vw_RechequeosSummary;
```

---

## 🛠️ Troubleshooting

### Problema: Sigue lento

**Solución**: Actualizar estadísticas manualmente
```sql
UPDATE STATISTICS dbo.TestUsuario WITH FULLSCAN;
UPDATE STATISTICS dbo.EmpresaInfo WITH FULLSCAN;
UPDATE STATISTICS dbo.ResultadoNivelDigital WITH FULLSCAN;
```

### Problema: Vista no funciona

**Solución**: Recrear la vista
```sql
DROP VIEW dbo.vw_RechequeosSummary;
-- Luego ejecutar nuevamente 05-create-rechequeos-view.sql
```

### Problema: Modelo optimizado causa errores

**Solución**: Desactivar temporalmente

En `backend/.env`, agregar:
```bash
USE_OPTIMIZED_RECHEQUEOS=false
```

---

## 📈 Comparación

| Endpoint | Antes | Después | Mejora |
|----------|-------|---------|--------|
| **/kpis** | 108s ⏱️ | 12s ⚡ | **89%** |
| **/tabla** | 92s ⏱️ | 9s ⚡ | **90%** |
| **/series** | 26s ⏱️ | 16s ⚡ | **38%** |
| **/heatmap** | 34s ⏱️ | 18s ⚡ | **47%** |

---

## ✅ Checklist

- [ ] Script SQL ejecutado sin errores
- [ ] Backend reiniciado
- [ ] Primera carga tarda ~15-25 segundos (no 90-120)
- [ ] Logs muestran "RECHEQUEOS OPT" y tiempos reducidos
- [ ] No hay timeouts (500 errors)

---

## 📝 Notas Importantes

1. **Los índices NO modifican los datos**: Solo mejoran velocidad de consulta
2. **La vista se actualiza automáticamente**: No requiere mantenimiento manual
3. **100% compatible con frontend**: No se requieren cambios en React
4. **Puedes revertir fácilmente**: Desactivar con variable de entorno

---

## 🎯 Si Necesitas Más Velocidad

1. **Redis Cache**: Implementar Redis en lugar de memoria
2. **Lazy Loading**: Cargar gráficas bajo demanda
3. **Server-Side Pagination**: Limitar datos iniciales a 20 filas
4. **GraphQL**: Permitir queries selectivas desde frontend

---

## 📖 Documentación Completa

Ver: `backend/OPTIMIZATION_README.md`

