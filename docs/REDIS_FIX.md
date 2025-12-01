# Fix: Redis Infinite Loop

## Problema

Redis entraba en un loop infinito de reconexión cuando no estaba disponible, generando miles de mensajes de log:

```
🔄 Redis: Attempting to reconnect...
⚠️ Redis: Connection error - connect ECCONNREFUSED 127.0.0.1:6379
🔄 Redis: Attempting to reconnect...
⚠️ Redis: Connection error - connect ECCONNREFUSED 127.0.0.1:6379
... (infinito)
```

## Solución Implementada

### 1. Límite de Intentos de Reconexión

- **Máximo de intentos**: 3 intentos
- **Desactivación automática**: Después de 3 fallos, Redis se desactiva permanentemente
- **No más loops**: El sistema deja de intentar reconectar

### 2. Mensajes Claros

Ahora verás solo:

```bash
# Primer intento
⚠️ Redis: Connection error (attempt 1/3) - connect ECCONNREFUSED 127.0.0.1:6379

# Segundo intento
⚠️ Redis: Connection error (attempt 2/3) - connect ECCONNREFUSED 127.0.0.1:6379

# Tercer intento
⚠️ Redis: Connection error (attempt 3/3) - connect ECCONNREFUSED 127.0.0.1:6379

# Final
⚠️ Redis: Permanently disabled. System will use memory cache only.
💡 To enable Redis: Install Redis/Memurai and restart the server.
```

### 3. Fallback Automático

- Sistema funciona completamente sin Redis
- Usa caché en memoria (Map)
- No impacta funcionalidad
- Solo se pierde persistencia entre reinicios

### 4. Nuevas Funcionalidades

```javascript
// Ver estadísticas
redisService.getStats()
// Retorna:
{
  redis: {
    available: false,
    connected: false,
    disabled: true,
    connectionAttempts: 3
  },
  memory: {
    entries: 15,
    withTTL: 15
  }
}

// Forzar reconexión (si instalas Redis después)
redisService.forceEnable()
```

## Cambios en el Código

### Variables Agregadas

```javascript
this.connectionAttempts = 0;
this.maxConnectionAttempts = 3;
this.redisDisabled = false;
```

### Estrategia de Reintentos

```javascript
retryStrategy: (times) => {
  // Stop retrying after max attempts
  if (times > this.maxConnectionAttempts) {
    this.redisDisabled = true;
    return null; // Stop retrying
  }
  
  const delay = Math.min(times * 50, 2000);
  return delay;
}
```

### Event Handlers Mejorados

```javascript
this.redis.on('error', (err) => {
  this.connectionAttempts++;
  
  // Only log if not disabled
  if (!this.redisDisabled && this.connectionAttempts <= this.maxConnectionAttempts) {
    logger.warn(`⚠️ Redis: Connection error (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})`);
  }
  
  // Disable after max attempts
  if (this.connectionAttempts >= this.maxConnectionAttempts && !this.redisDisabled) {
    this.redisDisabled = true;
    this.redis.disconnect(); // Stop retry loop
  }
});
```

## Verificación

### Logs Correctos (Sin Redis)

```bash
# Inicio
⚠️ Redis: Connection error (attempt 1/3) - connect ECCONNREFUSED
⚠️ Redis: Connection error (attempt 2/3) - connect ECCONNREFUSED  
⚠️ Redis: Connection error (attempt 3/3) - connect ECCONNREFUSED
⚠️ Redis: Permanently disabled. System will use memory cache only.
💡 To enable Redis: Install Redis/Memurai and restart the server.

# Funcionamiento normal
✅ Memory SET: rechequeos:kpis:v3:{} (TTL: 300s)
✅ Memory HIT: rechequeos:kpis:v3:{}
```

### Logs Correctos (Con Redis)

```bash
# Inicio
✅ Redis: Connected successfully
✅ Redis: Ready to accept commands

# Funcionamiento normal
✅ Redis SET: rechequeos:kpis:v3:{} (TTL: 300s)
✅ Redis HIT: rechequeos:kpis:v3:{}
```

## Comportamiento

### Sin Redis Instalado

1. Intenta conectar 3 veces
2. Falla las 3 veces
3. Se desactiva permanentemente
4. Usa solo memoria
5. **No más intentos de reconexión**
6. Sistema funciona normal

### Con Redis Instalado

1. Conecta exitosamente
2. Usa Redis para caché
3. Memoria como backup
4. Si Redis se cae, intenta reconectar (3 veces)
5. Si falla, desactiva y usa memoria

## Testing

### Probar Sin Redis

```bash
# Asegurar que Redis no está corriendo
# Iniciar backend
npm run dev

# Verificar logs
# Debe mostrar 3 intentos y desactivación
# No debe seguir intentando
```

### Probar Con Redis

```bash
# Instalar Redis/Memurai
# Iniciar backend
npm run dev

# Verificar logs
# Debe mostrar: ✅ Redis: Connected successfully
```

### Probar Reconexión Manual

```javascript
// En el código o consola
const redisService = require('./src/services/redis.service');

// Ver estado
console.log(redisService.getStats());

// Forzar reconexión (si instalaste Redis después)
await redisService.forceEnable();
```

## Impacto

### Performance

- **Sin cambios**: Sistema funciona igual con memoria
- **Caché en memoria**: Suficiente para un solo servidor
- **Con Redis**: Mejor para múltiples instancias o clusters

### Logs

- **Antes**: Miles de líneas de log (spam)
- **Después**: 4-5 líneas de log (claro y conciso)

### CPU

- **Antes**: CPU alta por intentos infinitos de reconexión
- **Después**: Sin overhead, desactivación limpia

## Conclusión

✅ **Problema resuelto**: No más loops infinitos
✅ **Sistema estable**: Funciona con o sin Redis
✅ **Logs limpios**: Mensajes claros y únicos
✅ **Fallback robusto**: Memoria siempre disponible
✅ **Sin breaking changes**: Compatible con código existente

**Recomendación**: Para producción, instalar Redis/Memurai para mejor performance y persistencia de caché.

