# Actualización: Migración Automática de Respuestas

## Resumen de Cambios

Se ha actualizado la funcionalidad de reasignación de chequeos para incluir **migración automática de respuestas**. Anteriormente, la reasignación solo actualizaba `EmpresaInfo`, `TestUsuario` y `ResultadoNivelDigital`, dejando las respuestas desincronizadas.

## Problema Identificado

### Antes de la Actualización

Cuando se reasignaba un chequeo:
- ✅ Se actualizaba `EmpresaInfo`
- ✅ Se actualizaba `TestUsuario`
- ✅ Se actualizaba `ResultadoNivelDigital`
- ❌ **NO se actualizaban** `Respuesta`, `SubRespuesta`, ni `ResultadoProcesoCalculoPreguntas`

**Resultado:** Las respuestas quedaban huérfanas, causando errores 404 al intentar ver detalles de encuestas.

**Ejemplo del problema (Empresa 1418 - El Escondite):**
- TestUsuario 5672: IdUsuario=1292, Test=2, Finalizado=1
- Respuestas reales: IdUsuario=5652, Test=1 (51 respuestas)
- Error: `No responses found for TestUsuario 5672 in company 1418`

### Después de la Actualización

Ahora la reasignación actualiza **todas las tablas necesarias**:
- ✅ `EmpresaInfo`
- ✅ `TestUsuario`
- ✅ `ResultadoNivelDigital`
- ✅ `Respuesta`
- ✅ `SubRespuesta`
- ✅ `ResultadoProcesoCalculoPreguntas`

## Cambios Realizados

### 1. Actualización del Método `reassignChequeo()`

**Archivo:** `backend/src/models/empresa.model.js`

**Líneas agregadas** (~2192-2257):
```javascript
// 4) Migrar Respuestas, SubRespuestas y ResultadoProcesoCalculoPreguntas
await syncRequest.query(`
  -- Identificar respuestas huérfanas
  CREATE TABLE #RespuestasAMigrar (
    IdEmpresa           INT NOT NULL,
    CanonIdUsuario      INT NOT NULL,
    IdUsuarioOriginal   INT NOT NULL,
    TestOriginal        INT NOT NULL
  );
  
  INSERT INTO #RespuestasAMigrar (...)
  SELECT DISTINCT
    c.IdEmpresa,
    c.CanonIdUsuario,
    u.IdUsuario,
    r.Test
  FROM #Canon c
  JOIN Usuario u ON u.IdEmpresa = c.IdEmpresa
  JOIN Respuesta r ON r.IdUsuario = u.IdUsuario
  WHERE u.IdUsuario <> c.CanonIdUsuario
    AND NOT EXISTS (
      SELECT 1 FROM Respuesta r2
      WHERE r2.IdUsuario = c.CanonIdUsuario AND r2.Test = 2
    );
  
  -- Migrar Respuesta, SubRespuesta y ResultadoProcesoCalculoPreguntas
  UPDATE ... 
`);
```

### 2. Actualización del Método `manualReassignChequeo()`

**Archivo:** `backend/src/models/empresa.model.js`

**Líneas agregadas** (~2566-2606):
```javascript
// Migrar Respuestas, SubRespuestas y ResultadoProcesoCalculoPreguntas
const respuestasRequest = new sql.Request(transaction);
respuestasRequest.input('fromIdUsuario', sql.Int, fromIdUsuario);
respuestasRequest.input('toIdUsuario', sql.Int, toIdUsuario);
respuestasRequest.input('testNumber', sql.Int, testNumber);
respuestasRequest.input('idEmpresa', sql.Int, idEmpresa);

// Verificar si ya existen respuestas para el usuario destino
const respCheckQuery = `
  SELECT COUNT(*) AS count 
  FROM Respuesta 
  WHERE IdUsuario = @toIdUsuario AND Test = @testNumber
`;
const respCheckResult = await respuestasRequest.query(respCheckQuery);

if (respCheckResult.recordset[0].count === 0) {
  // No existen respuestas para el destino, migrar las existentes
  await respuestasRequest.query(`
    UPDATE Respuesta SET IdUsuario = @toIdUsuario, IdEmpresa = @idEmpresa ...
    UPDATE SubRespuesta SET IdUsuario = @toIdUsuario, IdEmpresa = @idEmpresa ...
    UPDATE ResultadoProcesoCalculoPreguntas SET IdUsuario = @toIdUsuario ...
  `);
}
```

### 3. Nuevo Script SQL Generalizado

**Archivo:** `backend/sql-scripts/03-migrate-responses-after-reassignment.sql`

Un script SQL completo y reutilizable para migrar respuestas en casos donde se ejecutaron scripts de reasignación manualmente sin usar la API.

**Características:**
- Modo dry run por defecto
- Identificación automática de respuestas huérfanas
- Migración transaccional con rollback automático en caso de error
- Verificación final de integridad
- Compatible con SQL Server 2014+

## Uso

### Desde la API (Recomendado)

**Reasignación Automática:**
```bash
POST /api/empresas/1418/reassign
Authorization: Bearer {token}
Content-Type: application/json

{
  "targetIdUsuario": 1292,
  "dryRun": false
}
```

**Reasignación Manual:**
```bash
POST /api/empresas/1418/manual-reassign
Authorization: Bearer {token}
Content-Type: application/json

{
  "fromIdUsuario": 5652,
  "toIdUsuario": 1292,
  "testNumber": 1,
  "dryRun": false
}
```

### Desde SQL (Solo si ya ejecutaste scripts manuales)

Si ya ejecutaste scripts de reasignación manualmente y las respuestas quedaron desincronizadas:

1. Abrir `backend/sql-scripts/03-migrate-responses-after-reassignment.sql`
2. Ejecutar en modo preview (`@DryRun = 1`)
3. Revisar los cambios propuestos
4. Cambiar `@DryRun = 0` y ejecutar

## Verificación

### Verificar que las respuestas están correctamente asociadas:

```sql
-- Verificar respuestas de un TestUsuario específico
SELECT 
  tu.IdTestUsuario,
  tu.IdUsuario,
  tu.Test,
  COUNT(DISTINCT r.IdRespuesta) AS TotalRespuestas,
  COUNT(DISTINCT sr.IdSubRespuesta) AS TotalSubRespuestas
FROM TestUsuario tu
LEFT JOIN Respuesta r ON r.IdUsuario = tu.IdUsuario AND r.Test = tu.Test
LEFT JOIN SubRespuesta sr ON sr.IdUsuario = tu.IdUsuario AND sr.Test = tu.Test
WHERE tu.IdTestUsuario = 5672
GROUP BY tu.IdTestUsuario, tu.IdUsuario, tu.Test;
```

Resultado esperado:
- `TotalRespuestas` > 0
- `TotalSubRespuestas` >= 0 (puede ser 0 si la encuesta no tiene subpreguntas)

### Verificar endpoint de respuestas:

```bash
GET /api/encuestas/empresas/1418/testUsuarios/5672/responses
Authorization: Bearer {token}
```

Debe retornar **200 OK** con las respuestas, no **404 Not Found**.

## Casos de Uso

### Caso 1: Re-test con Usuario Diferente
**Situación:**
- Empresa hizo Test=1 con Usuario A
- Posteriormente hizo re-test con Usuario B
- Ambos quedaron como Test=1

**Solución Automática:**
1. La API detecta el problema
2. Normaliza EmpresaInfo (Test=1 → Test=2)
3. Sincroniza TestUsuario y ResultadoNivelDigital
4. **Migra automáticamente las respuestas**

### Caso 2: Scripts SQL Ejecutados Manualmente
**Situación:**
- Se ejecutaron scripts 1 y 2 manualmente
- Las respuestas quedaron desincronizadas
- Los detalles de encuesta muestran 404

**Solución:**
1. Ejecutar Script 3: `03-migrate-responses-after-reassignment.sql`
2. Las respuestas se migran al usuario canónico con Test=2
3. Los detalles de encuesta funcionan correctamente

## Impacto

### Tablas Afectadas
- `Respuesta` - Migra IdUsuario y Test
- `SubRespuesta` - Migra IdUsuario y Test
- `ResultadoProcesoCalculoPreguntas` - Migra IdUsuario y Test

### Datos Preservados
- ✅ Todas las respuestas originales se mantienen
- ✅ Fechas de respuesta originales se preservan
- ✅ No se pierde información
- ✅ Solo se actualizan referencias de usuario y test

### Integridad Referencial
- ✅ Todas las foreign keys se mantienen válidas
- ✅ Las transacciones garantizan atomicidad
- ✅ Rollback automático en caso de error

## Compatibilidad con Versiones Anteriores

Esta actualización es **retrocompatible**:
- Los endpoints existentes no cambian
- Los parámetros de las API siguen siendo los mismos
- Solo se añade funcionalidad adicional (migración de respuestas)
- No se requieren cambios en el frontend

## Testing

### Casos de Prueba

1. **Reasignación automática con respuestas:**
   - Crear empresa con 2 chequeos Test=1, diferentes usuarios
   - Ejecutar reasignación automática
   - Verificar que las respuestas se migraron correctamente

2. **Reasignación manual con respuestas:**
   - Seleccionar empresa con respuestas
   - Ejecutar reasignación manual
   - Verificar que las respuestas se asociaron al nuevo usuario

3. **Script SQL independiente:**
   - Ejecutar scripts 1 y 2 manualmente
   - Ejecutar script 3
   - Verificar que las respuestas se migraron

4. **Sin respuestas existentes:**
   - Reasignar chequeo sin respuestas
   - Verificar que no causa errores

## Rollback

Si necesitas revertir los cambios:

1. **Desde transacción:**
   - Los scripts SQL usan transacciones
   - Rollback automático en caso de error

2. **Backup recomendado:**
   - Hacer backup antes de ejecutar reasignaciones masivas
   - Especialmente si se ejecutan scripts SQL manualmente

## Documentación Adicional

- `docs/REASSIGNMENT_FEATURE.md` - Documentación original de reasignación
- `backend/sql-scripts/README.md` - Guía de scripts SQL
- `docs/REASSIGNMENT_FIXES.md` - Historial de correcciones

## Fecha de Actualización

**Fecha:** 18 de noviembre de 2025
**Versión:** 1.1.0
**Autor:** Sistema de Desarrollo

## Notas Importantes

- ⚠️ **Siempre usar modo dry run primero** para preview de cambios
- ⚠️ **Hacer backup** antes de reasignaciones masivas
- ✅ **Verificar** los detalles de encuesta después de cada reasignación
- ✅ **Usar la API** en lugar de scripts SQL cuando sea posible

