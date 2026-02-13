# Documentación Técnica: Sistema de Caché

## Chequeo Digital 2.0 - Arquitectura de Caché de Alto Rendimiento

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Redis Service](#redis-service)
4. [Estrategias de Caché](#estrategias-de-caché)
5. [Invalidación de Caché](#invalidación-de-caché)
6. [Caché en Frontend](#caché-en-frontend)
7. [Configuración](#configuración)
8. [Monitoreo](#monitoreo)

---

## Visión General

### Problema Original

Las consultas de KPIs de rechequeos realizaban múltiples JOINs y agregaciones complejas sobre tablas con +50,000 registros, resultando en tiempos de respuesta de **30+ segundos**.

### Solución Implementada

Sistema de caché multinivel:

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │        Service Worker Cache (opcional)           │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    SERVIDOR (Node.js)                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Redis Service                       │    │
│  │  ┌─────────────┐    ┌─────────────┐             │    │
│  │  │   Redis     │ OR │  Memory     │             │    │
│  │  │  (Primary)  │    │ (Fallback)  │             │    │
│  │  └─────────────┘    └─────────────┘             │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              BASE DE DATOS (SQL Server)                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │          Vistas Optimizadas (Caché SQL)          │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Beneficios

| Métrica | Sin Caché | Con Caché | Mejora |
|---------|-----------|-----------|--------|
| Tiempo de respuesta (KPIs) | 32 seg | < 100 ms | **99.7%** |
| Carga de BD | 100% | ~5% | **95%** |
| Tiempo primera carga | 32 seg | 1.2 seg | **96%** |

---

## Arquitectura del Sistema

### Componentes

1. **Redis** (Primario): Caché distribuido de alto rendimiento
2. **Memory Cache** (Fallback): Caché en memoria para entornos sin Redis
3. **Service Worker** (Opcional): Caché en navegador para recursos estáticos

### Flujo de Datos

```
Request → Verificar Caché → 
  ├─ HIT: Retornar datos cacheados
  └─ MISS: 
      └─ Consultar BD → Guardar en Caché → Retornar datos
```

---

## Redis Service

### Implementación

```javascript
// services/redis.service.js

class RedisService {
  constructor() {
    this.redis = null;
    this.isRedisAvailable = false;
    this.memoryCache = new Map();
    this.memoryTTLs = new Map();
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
    this.redisDisabled = false;
    
    this.initRedis();
  }

  async initRedis() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || null,
        retryStrategy: (times) => {
          if (times > this.maxConnectionAttempts) {
            this.redisDisabled = true;
            return null; // Stop retrying
          }
          return Math.min(times * 50, 2000);
        },
        connectTimeout: 5000,
        lazyConnect: true,
      };

      this.redis = new Redis(redisConfig);
      
      this.redis.on('ready', () => {
        this.isRedisAvailable = true;
        logger.info('✅ Redis: Ready');
      });

      this.redis.on('error', (err) => {
        this.isRedisAvailable = false;
        logger.warn(`⚠️ Redis: ${err.message}`);
      });

      await this.redis.connect();
      this.startMemoryCleanup();

    } catch (error) {
      this.isRedisAvailable = false;
      this.redisDisabled = true;
      logger.warn('⚠️ Using memory cache only');
    }
  }
}
```

### Métodos Principales

#### get(key)

```javascript
async get(key) {
  try {
    // Intentar Redis primero
    if (this.isRedisAvailable && !this.redisDisabled) {
      const value = await this.redis.get(key);
      if (value) {
        logger.debug(`✅ Redis HIT: ${key}`);
        return JSON.parse(value);
      }
    }

    // Fallback a memoria
    if (this.memoryCache.has(key)) {
      const expiry = this.memoryTTLs.get(key);
      if (!expiry || expiry > Date.now()) {
        logger.debug(`✅ Memory HIT: ${key}`);
        return this.memoryCache.get(key);
      }
      // Expirado
      this.memoryCache.delete(key);
      this.memoryTTLs.delete(key);
    }

    logger.debug(`❌ Cache MISS: ${key}`);
    return null;

  } catch (error) {
    logger.error(`Cache get error: ${error.message}`);
    return this.memoryCache.get(key) || null;
  }
}
```

#### set(key, value, ttlSeconds)

```javascript
async set(key, value, ttlSeconds = 300) {
  try {
    const stringValue = JSON.stringify(value);

    // Guardar en Redis si disponible
    if (this.isRedisAvailable && !this.redisDisabled) {
      await this.redis.setex(key, ttlSeconds, stringValue);
      logger.debug(`✅ Redis SET: ${key} (TTL: ${ttlSeconds}s)`);
    }

    // Siempre guardar en memoria como fallback
    this.memoryCache.set(key, value);
    this.memoryTTLs.set(key, Date.now() + (ttlSeconds * 1000));
    
    return true;

  } catch (error) {
    logger.error(`Cache set error: ${error.message}`);
    // Fallback a solo memoria
    this.memoryCache.set(key, value);
    this.memoryTTLs.set(key, Date.now() + (ttlSeconds * 1000));
    return true;
  }
}
```

#### generateKey(prefix, params)

```javascript
generateKey(prefix, params = {}) {
  // Ordenar parámetros para consistencia
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      const value = params[key];
      if (Array.isArray(value)) {
        acc[key] = value.sort().join(',');
      } else if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});

  return `${prefix}:${JSON.stringify(sortedParams)}`;
}

// Ejemplo de uso:
// generateKey('rechequeos:kpis', { departamento: 'Capital', sector: 'Comercio' })
// → "rechequeos:kpis:{"departamento":"Capital","sector":"Comercio"}"
```

---

## Estrategias de Caché

### 1. Cache-Aside (Lazy Loading)

Patrón principal utilizado:

```javascript
async getKPIs(filters) {
  const cacheKey = redisService.generateKey('rechequeos:kpis', filters);
  
  // 1. Verificar caché
  const cached = await redisService.get(cacheKey);
  if (cached) {
    return cached;  // HIT - Retornar datos cacheados
  }
  
  // 2. MISS - Consultar BD
  const data = await RechequeosModel.getKPIs(filters);
  
  // 3. Guardar en caché
  await redisService.set(cacheKey, data, 300);  // TTL: 5 minutos
  
  return data;
}
```

### 2. TTL por Tipo de Dato

| Recurso | TTL | Razón |
|---------|-----|-------|
| KPIs de Rechequeos | 5 min | Datos estables, cálculo costoso |
| Listado de Empresas | 2 min | Cambios frecuentes |
| Detalle de Empresa | 5 min | Datos semi-estáticos |
| Opciones de Filtros | 10 min | Catálogos estables |
| Heatmap | 5 min | Agregación costosa |

### 3. Claves de Caché

Estructura de claves:

```
{modulo}:{recurso}:{parametros_serializados}

Ejemplos:
- rechequeos:kpis:{"departamento":"Capital"}
- rechequeos:table:{"page":1,"limit":50,"sortBy":"UltimaFecha"}
- empresas:detail:{"id":"123"}
- filters:options:{}
```

---

## Invalidación de Caché

### Invalidación por Patrón

```javascript
async invalidateRechequeosCache() {
  await this.delPattern('rechequeos:*');
}

async invalidateEmpresaCache() {
  await this.delPattern('empresas:*');
  await this.delPattern('kpis:*');
  await this.delPattern('filters:*');
}
```

### Implementación de delPattern

```javascript
async delPattern(pattern) {
  let deletedCount = 0;

  // Eliminar de Redis
  if (this.isRedisAvailable && !this.redisDisabled) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
      deletedCount += keys.length;
    }
  }

  // Eliminar de memoria
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  for (const key of this.memoryCache.keys()) {
    if (regex.test(key)) {
      this.memoryCache.delete(key);
      this.memoryTTLs.delete(key);
      deletedCount++;
    }
  }

  logger.info(`🗑️ Deleted ${deletedCount} keys matching: ${pattern}`);
  return deletedCount;
}
```

### Eventos de Invalidación

| Evento | Acción |
|--------|--------|
| Crear empresa | Invalidar `empresas:*`, `filters:*` |
| Editar empresa | Invalidar `empresas:detail:{id}`, `empresas:*` |
| Reasignar chequeo | Invalidar `rechequeos:*`, `empresas:*` |
| Eliminar chequeo | Invalidar `rechequeos:*` |

---

## Caché en Frontend

### Service Worker

```javascript
// public/sw.js

const CACHE_NAME = 'chequeo-digital-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/logoBID.png',
  '/logoMIC.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Solo cachear recursos estáticos
  if (event.request.url.includes('/api/')) {
    return; // No cachear API calls
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### Registro del Service Worker

```typescript
// components/service-worker-register.tsx

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered');
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    }
  }, []);
  
  return null;
}
```

---

## Configuración

### Variables de Entorno

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cache Settings
CACHE_DEFAULT_TTL=300
CACHE_MAX_MEMORY_MB=100
```

### Sin Redis (Solo Memoria)

El sistema funciona automáticamente sin Redis:

1. Intenta conectar a Redis
2. Si falla después de 3 intentos, desactiva Redis
3. Usa caché en memoria como fallback
4. Logs informan del modo de operación

```
⚠️ Redis: Max connection attempts reached. Using memory cache only.
💡 To enable Redis: Install Redis/Memurai and restart the server.
```

### Instalación de Redis en Windows

**Opción 1: Memurai (Recomendado)**
```powershell
# Descargar desde https://www.memurai.com/
# Instalar y el servicio inicia automáticamente
```

**Opción 2: Redis via WSL**
```bash
# En WSL
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

---

## Monitoreo

### Estadísticas del Caché

```javascript
getStats() {
  return {
    redis: {
      available: this.isRedisAvailable,
      connected: this.redis?.status === 'ready',
      disabled: this.redisDisabled,
      connectionAttempts: this.connectionAttempts
    },
    memory: {
      entries: this.memoryCache.size,
      withTTL: this.memoryTTLs.size
    }
  };
}
```

### Endpoint de Monitoreo

```javascript
// GET /health
app.get('/health', (req, res) => {
  const cacheStats = redisService.getStats();
  
  res.json({
    status: 'UP',
    timestamp: new Date(),
    cache: cacheStats
  });
});
```

### Logs de Caché

```
✅ Redis HIT: rechequeos:kpis:{"departamento":"Capital"}
❌ Cache MISS: rechequeos:table:{"page":1}
✅ Redis SET: rechequeos:table:{"page":1} (TTL: 300s)
🗑️ Deleted 15 keys matching: rechequeos:*
```

### Limpieza de Memoria

```javascript
startMemoryCleanup() {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, expiry] of this.memoryTTLs.entries()) {
      if (expiry && expiry < now) {
        this.memoryCache.delete(key);
        this.memoryTTLs.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`🧹 Memory cache: Cleaned ${cleaned} expired entries`);
    }
  }, 60000); // Cada minuto
}
```

---

## Troubleshooting

### Caché no funciona

1. Verificar que Redis está corriendo: `redis-cli ping`
2. Verificar variables de entorno
3. Revisar logs del backend
4. El sistema funciona sin Redis (memory fallback)

### Datos desactualizados

1. Verificar TTL configurado
2. Forzar invalidación: `redisService.flushAll()`
3. Reiniciar el backend

### Alta memoria

1. Reducir TTL de items
2. Limitar tamaño de caché
3. Revisar tamaño de datos cacheados

---

*Documento técnico actualizado: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
