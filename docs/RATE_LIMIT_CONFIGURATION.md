# Configuración de Rate Limiting

Este documento explica cómo configurar y reactivar el rate limiting en el backend de Chequeo Digital 2.0.

## Estado Actual

El rate limiting está **DESHABILITADO** por defecto para facilitar el desarrollo y testing.

## Reactivar Rate Limiting

### 1. Habilitar Rate Limiting en el Servidor

Para reactivar el rate limiting, edita el archivo `backend/src/server.js` y descomenta las siguientes líneas:

```javascript
// Comentar esta línea:
// Rate limiting disabled for development

// Descomentar estas líneas:
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after some time',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts from this IP, please try again after some time',
});

app.use('/api/auth', authLimiter);
app.use('/api', generalLimiter);
```

### 2. Configurar Variables de Entorno

Edita el archivo `.env` para configurar los límites:

```env
# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000    # 15 minutos en milisegundos
RATE_LIMIT_MAX_REQUESTS=100    # Máximo 100 requests por ventana de tiempo
```

## Configuraciones Disponibles

### Rate Limiting General

- **Endpoint**: `/api/*` (todos los endpoints excepto auth)
- **Ventana de tiempo**: 15 minutos (configurable)
- **Límite**: 100 requests por IP por ventana (configurable)
- **Mensaje**: "Too many requests from this IP, please try again after some time"

### Rate Limiting para Autenticación

- **Endpoint**: `/api/auth/*` (endpoints de login, registro, etc.)
- **Ventana de tiempo**: 15 minutos (fijo)
- **Límite**: 20 intentos de login por IP por ventana (fijo)
- **Mensaje**: "Too many login attempts from this IP, please try again after some time"

## Variables de Configuración

| Variable | Descripción | Valor por Defecto | Ejemplo |
|----------|-------------|-------------------|---------|
| `RATE_LIMIT_WINDOW_MS` | Ventana de tiempo en milisegundos | `900000` (15 min) | `600000` (10 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Máximo requests por ventana | `100` | `200` |

## Configuraciones Recomendadas

### Desarrollo
```env
RATE_LIMIT_WINDOW_MS=300000    # 5 minutos
RATE_LIMIT_MAX_REQUESTS=1000   # 1000 requests (muy permisivo)
```

### Testing
```env
RATE_LIMIT_WINDOW_MS=60000     # 1 minuto
RATE_LIMIT_MAX_REQUESTS=50     # 50 requests
```

### Producción
```env
RATE_LIMIT_WINDOW_MS=900000    # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100    # 100 requests
```

### Alta Seguridad
```env
RATE_LIMIT_WINDOW_MS=1800000   # 30 minutos
RATE_LIMIT_MAX_REQUESTS=50     # 50 requests
```

## Headers de Respuesta

Cuando el rate limiting está activo, las respuestas incluyen los siguientes headers:

- `X-RateLimit-Limit`: Límite máximo de requests
- `X-RateLimit-Remaining`: Requests restantes en la ventana actual
- `X-RateLimit-Reset`: Timestamp cuando se resetea la ventana

## Manejo de Errores

Cuando se excede el límite, el servidor responde con:

- **Status Code**: `429 Too Many Requests`
- **Content-Type**: `application/json`
- **Body**: 
```json
{
  "error": "Too many requests from this IP, please try again after some time"
}
```

## Deshabilitar Rate Limiting

Para deshabilitar completamente el rate limiting:

1. Comenta las líneas de configuración en `server.js`
2. O establece límites muy altos en las variables de entorno:

```env
RATE_LIMIT_WINDOW_MS=3600000   # 1 hora
RATE_LIMIT_MAX_REQUESTS=10000  # 10,000 requests
```

## Monitoreo

Para monitorear el uso del rate limiting, revisa los logs del servidor:

```bash
# Ver logs de acceso
tail -f backend/logs/access.log

# Buscar errores 429
grep "429" backend/logs/access.log
```

## Troubleshooting

### Problema: "Too many requests" durante desarrollo

**Solución**: Deshabilitar temporalmente el rate limiting o aumentar los límites.

### Problema: Rate limiting no funciona

**Verificaciones**:
1. Confirmar que las líneas están descomentadas en `server.js`
2. Verificar que las variables de entorno están configuradas
3. Reiniciar el servidor después de los cambios

### Problema: Límites muy restrictivos

**Solución**: Ajustar las variables de entorno según el entorno:
- Desarrollo: Límites altos
- Producción: Límites moderados
- Alta seguridad: Límites bajos

## Consideraciones de Seguridad

1. **Nunca deshabilitar completamente en producción**
2. **Configurar límites apropiados según el tráfico esperado**
3. **Monitorear regularmente los logs para detectar ataques**
4. **Considerar implementar rate limiting por usuario además de por IP**

## Ejemplos de Implementación

### Rate Limiting por Usuario (Avanzado)

Para implementar rate limiting por usuario autenticado, puedes modificar el middleware:

```javascript
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => {
    return req.user ? req.user.id : req.ip;
  },
  message: 'Too many requests from this user, please try again later'
});

app.use('/api/protected', authenticateToken, userLimiter);
```

### Rate Limiting Dinámico

Para límites que cambian según la hora del día:

```javascript
const dynamicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: (req) => {
    const hour = new Date().getHours();
    return hour >= 9 && hour <= 17 ? 100 : 50; // Más permisivo en horario laboral
  }
});
```
