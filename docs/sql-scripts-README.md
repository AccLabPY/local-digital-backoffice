# Scripts SQL de Migración y Reasignación

Este directorio contiene los scripts SQL necesarios para normalizar y migrar datos después de procesos de reasignación de chequeos.

## Orden de Ejecución

Los scripts deben ejecutarse en el siguiente orden:

### 1. Script 1: Normalizar EmpresaInfo
**Archivo:** `01-normalize-empresainfo.sql`

**Propósito:** Normaliza empresas que tienen 2 filas en `EmpresaInfo`, ambas con `Test=1` pero con diferentes `IdUsuario` (casos de re-test con otro usuario).

**Acción:**
- Mantiene la fila más antigua como `Test=1` (sin cambios)
- Actualiza la fila más reciente:
  - Copia el `IdUsuario` de la antigua
  - Cambia `Test` a `2`

**Tablas Afectadas:**
- `EmpresaInfo`

**Pre-requisitos:** Ninguno

**Modo Dry Run:** Por defecto está en modo preview (`@DryRun = 1`)

---

### 2. Script 2: Sincronizar TestUsuario y ResultadoNivelDigital
**Archivo:** `02-sync-testusuario-resultado.sql`

**Propósito:** Sincroniza las tablas `TestUsuario` y `ResultadoNivelDigital` con los cambios realizados en `EmpresaInfo` por el Script 1.

**Acción:**
- Identifica el usuario canónico por empresa (el que tiene `Test=1` y `Test=2` en `EmpresaInfo`)
- Corrige registros desincronizados en `TestUsuario` y `ResultadoNivelDigital`
- Mueve registros de `Test=1` (con usuario diferente al canónico) a `Test=2` (con usuario canónico)
- Elimina duplicados cuando ya existe un registro canónico

**Tablas Afectadas:**
- `TestUsuario`
- `ResultadoNivelDigital`

**Pre-requisitos:** Script 1 ejecutado exitosamente

**Modo Dry Run:** Por defecto está en modo preview (`@DryRun = 1`)

---

### 3. Script 3: Migrar Respuestas
**Archivo:** `03-migrate-responses-after-reassignment.sql`

**Propósito:** Migra las respuestas de encuestas después de que `EmpresaInfo`, `TestUsuario` y `ResultadoNivelDigital` han sido normalizados.

**Acción:**
- Identifica respuestas "huérfanas" (asociadas a usuarios que ya no son el usuario canónico)
- Migra estas respuestas al usuario canónico con `Test=2`
- Asegura la integridad referencial entre todas las tablas

**Tablas Afectadas:**
- `Respuesta`
- `SubRespuesta`
- `ResultadoProcesoCalculoPreguntas` (si existe)

**Pre-requisitos:** Scripts 1 y 2 ejecutados exitosamente

**Modo Dry Run:** Por defecto está en modo preview (`@DryRun = 1`)

---

## Uso

### Ejecución Manual (SQL Server Management Studio)

1. **Conectarse a la base de datos:**
   ```sql
   USE [BID_stg_copy_copy];  -- o la base de datos que corresponda
   ```

2. **Ejecutar Script 1 en modo preview:**
   - Abrir `01-normalize-empresainfo.sql`
   - Revisar el preview de cambios
   - Si está correcto, cambiar `@DryRun = 0`
   - Ejecutar nuevamente

3. **Ejecutar Script 2 en modo preview:**
   - Abrir `02-sync-testusuario-resultado.sql`
   - Revisar el preview de cambios
   - Si está correcto, cambiar `@DryRun = 0`
   - Ejecutar nuevamente

4. **Ejecutar Script 3 en modo preview:**
   - Abrir `03-migrate-responses-after-reassignment.sql`
   - Revisar el preview de cambios
   - Si está correcto, cambiar `@DryRun = 0`
   - Ejecutar nuevamente

### Ejecución Automática (Desde la Aplicación)

La aplicación incluye funciones de reasignación que ejecutan automáticamente toda la lógica de estos scripts:

**Reasignación Automática:**
```javascript
POST /api/empresas/{id}/reassign
{
  "targetIdUsuario": 1292,  // Opcional
  "dryRun": false
}
```

**Reasignación Manual:**
```javascript
POST /api/empresas/{id}/manual-reassign
{
  "fromIdUsuario": 5652,
  "toIdUsuario": 1292,
  "testNumber": 1,
  "dryRun": false
}
```

Las funciones de la aplicación incluyen **automáticamente** la migración de respuestas.

---

## Verificación

Después de ejecutar los scripts, verificar:

1. **EmpresaInfo normalizado:**
   ```sql
   SELECT IdEmpresa, IdUsuario, Test, COUNT(*) AS Registros
   FROM EmpresaInfo
   WHERE IdEmpresa IN (SELECT DISTINCT IdEmpresa FROM EmpresaInfo WHERE Test = 2)
   GROUP BY IdEmpresa, IdUsuario, Test
   ORDER BY IdEmpresa, Test
   ```
   Debe haber:
   - 1 fila con `Test=1`
   - 1 fila con `Test=2`
   - Mismo `IdUsuario` para ambas

2. **TestUsuario sincronizado:**
   ```sql
   SELECT tu.IdUsuario, tu.Test, ei.IdUsuario AS EI_IdUsuario, ei.Test AS EI_Test
   FROM TestUsuario tu
   JOIN EmpresaInfo ei ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
   WHERE tu.IdUsuario IN (SELECT IdUsuario FROM EmpresaInfo WHERE Test = 2)
   ```
   Los `IdUsuario` y `Test` deben coincidir

3. **Respuestas migradas:**
   ```sql
   SELECT r.IdUsuario, r.Test, COUNT(*) AS TotalRespuestas
   FROM Respuesta r
   WHERE r.IdUsuario = 1292 AND r.Test = 2
   GROUP BY r.IdUsuario, r.Test
   ```
   Debe haber respuestas para el usuario canónico con `Test=2`

---

## Rollback

Si algo sale mal:

1. **Los scripts usan transacciones:** Si hay un error, se hace rollback automático
2. **Antes de aplicar cambios:** Siempre revisar el preview con `@DryRun = 1`
3. **Backup:** Se recomienda hacer backup antes de ejecutar los scripts

---

## Notas Importantes

- **Ejecutar en orden:** Los scripts deben ejecutarse en el orden especificado (1 → 2 → 3)
- **Modo DryRun:** Siempre revisar el preview antes de aplicar cambios
- **Compatible:** SQL Server 2014+
- **Transacciones:** Todos los scripts usan transacciones para garantizar integridad
- **Logs:** Los scripts imprimen información detallada durante la ejecución

---

## Soporte

Para problemas o dudas:
1. Revisar los logs de ejecución del script
2. Verificar que los pre-requisitos se cumplan
3. Contactar al equipo de desarrollo con los detalles completos

