# Funcionalidad de Reasignación de Chequeos

## Descripción General

Esta funcionalidad permite reasignar chequeos (tests) entre usuarios cuando se detecta que una empresa tiene 2 chequeos marcados como `Test=1` pero con diferentes `IdUsuario`. Esto ocurre típicamente cuando:

1. Una empresa realizó un test inicial con un usuario
2. Posteriormente, realizó un re-test con un usuario diferente
3. Ambos quedaron marcados como `Test=1` en lugar de `Test=1` y `Test=2`

## Flujo de Trabajo

### 1. Detección Automática
El sistema detecta automáticamente empresas que cumplen los siguientes criterios:
- Tienen exactamente 2 filas en `EmpresaInfo`
- Ambas filas tienen `Test=1`
- Las filas tienen diferentes `IdUsuario`

### 2. Interfaz de Usuario
En la tabla de empresas (`http://localhost:3000/empresas`), cada empresa tiene un nuevo botón de acción:
- **Icono**: RefreshCw (círculo con flechas)
- **Color**: Azul oscuro (#150773)
- **Tooltip**: "Reasignar chequeo"

### 3. Modal de Reasignación
Al hacer clic en el botón de reasignación, se abre un modal que muestra:

#### Información Mostrada:
- **Empresa**: Nombre de la empresa
- **Usuario Actual**: El usuario que tiene el test más reciente (Test=1)
- **Selector de Usuario**: Lista de usuarios disponibles para reasignar
- **Preview del Cambio**: Muestra qué usuario tendrá el chequeo después de la reasignación

#### Acciones Disponibles:
- **Seleccionar Usuario**: Dropdown con todos los usuarios asociados a la empresa
- **Reasignar**: Ejecuta la reasignación
- **Cancelar**: Cierra el modal sin hacer cambios

### 4. Proceso de Reasignación
Cuando se confirma la reasignación, el sistema:

1. **Actualiza `EmpresaInfo`**:
   - Cambia el `IdUsuario` del registro más reciente al usuario seleccionado
   - Cambia `Test` de 1 a 2

2. **Sincroniza `TestUsuario`**:
   - Si existe un `TestUsuario` con el usuario canónico y `Test=2`: ELIMINA el registro duplicado
   - Si NO existe: ACTUALIZA el `IdUsuario` y cambia `Test` a 2

3. **Sincroniza `ResultadoNivelDigital`**:
   - Aplica la misma lógica que `TestUsuario`

## Endpoints API

### 1. Obtener Candidatos para Reasignación
```
GET /api/empresas/reassignment/candidates?idEmpresa={id}
```
**Autenticación**: Bearer Token requerido

**Parámetros**:
- `idEmpresa` (opcional): ID de empresa específica

**Respuesta**:
```json
{
  "success": true,
  "count": 2,
  "candidates": [
    {
      "IdEmpresa": 144,
      "NombreEmpresa": "TYT SERVICIOS INFORMATICOS",
      "IdEmpresaInfo_Antigua": 123,
      "IdUsuario_Antigua": 40,
      "NombreUsuario_Antigua": "Eric Delvalle",
      "IdEmpresaInfo_Reciente": 456,
      "IdUsuario_Reciente": 41,
      "NombreUsuario_Reciente": "Maria Lopez",
      "NuevoIdUsuario_para_Reciente": 40,
      "NuevoTest_para_Reciente": 2
    }
  ]
}
```

### 2. Reasignar Chequeo
```
POST /api/empresas/{id}/reassign
```
**Autenticación**: Bearer Token requerido

**Body**:
```json
{
  "targetIdUsuario": 40,  // Opcional: Si no se proporciona, usa el usuario más antiguo
  "dryRun": true          // true = preview, false = ejecutar
}
```

**Respuesta (Preview)**:
```json
{
  "success": true,
  "dryRun": true,
  "preview": {
    "idEmpresa": 144,
    "idEmpresaInfo_Reciente": 456,
    "currentIdUsuario": 41,
    "newIdUsuario": 40,
    "currentTest": 1,
    "newTest": 2
  }
}
```

**Respuesta (Ejecución)**:
```json
{
  "success": true,
  "message": "Chequeo reasignado exitosamente",
  "result": {
    "idEmpresa": 144,
    "idEmpresaInfo_Reciente": 456,
    "oldIdUsuario": 41,
    "newIdUsuario": 40,
    "oldTest": 1,
    "newTest": 2
  }
}
```

### 3. Obtener Usuarios Disponibles para Reasignación
```
GET /api/empresas/{id}/available-users-reassignment
```
**Autenticación**: Bearer Token requerido

**Respuesta**:
```json
{
  "success": true,
  "users": [
    {
      "IdUsuario": 40,
      "NombreCompleto": "Eric Delvalle",
      "Email": "eric@example.com",
      "CargoEmpresa": "Gerente",
      "Test": 1,
      "FechaTest": "2023-12-05 14:42:57"
    }
  ]
}
```

## Archivos Modificados/Creados

### Backend
1. **`backend/src/models/empresa.model.js`**
   - `getReassignmentCandidates()`: Obtiene empresas candidatas para reasignación
   - `reassignChequeo()`: Ejecuta la reasignación
   - `getAvailableUsersForReassignment()`: Obtiene usuarios disponibles

2. **`backend/src/controllers/empresa.controller.js`**
   - `getReassignmentCandidates`: Controlador para obtener candidatos
   - `reassignChequeo`: Controlador para reasignar
   - `getAvailableUsersForReassignment`: Controlador para usuarios disponibles

3. **`backend/src/routes/empresa.routes.js`**
   - `GET /reassignment/candidates`: Ruta para obtener candidatos
   - `POST /:id/reassign`: Ruta para reasignar
   - `GET /:id/available-users-reassignment`: Ruta para usuarios disponibles

### Frontend
1. **`components/reassign-chequeo-dialog.tsx`** (NUEVO)
   - Componente modal para la interfaz de reasignación
   - Maneja la carga de usuarios disponibles
   - Muestra preview del cambio
   - Ejecuta la reasignación

2. **`components/business-list.tsx`**
   - Añadido botón de reasignación en la tabla
   - Añadidos estados para el modal de reasignación
   - Añadidas funciones para manejar apertura/cierre del modal
   - Añadida función para recargar datos después de reasignación exitosa

## Consideraciones Importantes

### Seguridad
- Todos los endpoints requieren autenticación Bearer Token
- Se registran todas las operaciones de reasignación en los logs
- Las transacciones incluyen rollback automático en caso de error

### Base de Datos
- Utiliza transacciones SQL para garantizar la integridad de los datos
- Sincroniza automáticamente las tablas:
  - `EmpresaInfo`
  - `TestUsuario`
  - `ResultadoNivelDigital`

### Validaciones
- Verifica que la empresa exista antes de proceder
- Verifica que haya exactamente 2 chequeos con Test=1
- Verifica que los chequeos tengan diferentes usuarios
- Valida que el usuario objetivo exista

## Casos de Uso

### Caso 1: Re-test con Usuario Diferente
**Situación**: 
- Empresa hizo Test=1 con Usuario A el 01/01/2024
- Empresa hizo re-test con Usuario B el 15/01/2024
- Ambos quedaron como Test=1

**Solución**:
1. Detectar automáticamente esta situación
2. Reasignar el test del 15/01/2024 a Usuario A
3. Marcar el test del 15/01/2024 como Test=2

### Caso 2: Nombre de Usuario Incorrecto
**Situación**:
- Se creó un usuario con nombre incorrecto para hacer el test
- Se quiere reasignar a otro usuario existente de la misma empresa

**Solución**:
1. Seleccionar el usuario correcto en el dropdown
2. Confirmar la reasignación
3. El sistema sincroniza todas las tablas automáticamente

## SQL de Referencia

La funcionalidad está basada en los siguientes scripts SQL optimizados:
- `sync_testusuario_resultado_final.sql`: Script de sincronización completo
- Incluye detección automática de casos problemáticos
- Implementa lógica UPDATE/DELETE según corresponda
- Compatible con SQL Server 2014+

## Testing

Para probar la funcionalidad:

1. **Verificar candidatos**:
   ```bash
   curl -X GET "http://localhost:3001/api/empresas/reassignment/candidates" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Preview de reasignación**:
   ```bash
   curl -X POST "http://localhost:3001/api/empresas/144/reassign" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"dryRun": true}'
   ```

3. **Ejecutar reasignación**:
   ```bash
   curl -X POST "http://localhost:3001/api/empresas/144/reassign" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"dryRun": false, "targetIdUsuario": 40}'
   ```

## Logs

Todas las operaciones se registran en los logs del backend con el siguiente formato:
```
Reasignación de chequeo iniciada - ID Empresa: 144, Target IdUsuario: 40, Dry Run: false, Usuario: admin@example.com
Chequeo reasignado exitosamente - IdEmpresa: 144, Old IdUsuario: 41, New IdUsuario: 40
```

## Mantenimiento

### Actualizar Queries SQL
Si necesitas modificar la lógica de detección o reasignación:
1. Actualizar `backend/src/models/empresa.model.js`
2. Probar con `dryRun: true` primero
3. Verificar que las transacciones funcionen correctamente
4. Actualizar esta documentación

### Agregar Validaciones
Para agregar nuevas validaciones:
1. Backend: `backend/src/controllers/empresa.controller.js`
2. Frontend: `components/reassign-chequeo-dialog.tsx`

## Soporte

Para reportar problemas o solicitar mejoras:
1. Revisar los logs del backend
2. Verificar el estado de la base de datos
3. Contactar al equipo de desarrollo con los detalles completos

