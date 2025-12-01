const Redis = require('ioredis');
const logger = require('../utils/logger');

/**
 * Redis Service with Memory Fallback
 * Provides caching with Redis as primary, in-memory as fallback
 */
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

  /**
   * Initialize Redis connection
   */
  async initRedis() {
    // If Redis was explicitly disabled, don't try to connect
    if (this.redisDisabled) {
      return;
    }

    try {
      // Redis configuration for Windows Server 2012
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || null,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryStrategy: (times) => {
          // Stop retrying after max attempts
          if (times > this.maxConnectionAttempts) {
            this.redisDisabled = true;
            logger.warn('⚠️ Redis: Max connection attempts reached. Redis disabled. Using memory cache only.');
            return null; // Stop retrying
          }
          
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        connectTimeout: 5000, // Reduced from 10000
        lazyConnect: true, // Don't connect immediately
      };

      this.redis = new Redis(redisConfig);

      // Set up event handlers
      this.redis.on('connect', () => {
        logger.info('✅ Redis: Connected successfully');
        this.isRedisAvailable = true;
        this.connectionAttempts = 0; // Reset on successful connection
      });

      this.redis.on('ready', () => {
        logger.info('✅ Redis: Ready to accept commands');
        this.isRedisAvailable = true;
        this.connectionAttempts = 0; // Reset on ready
      });

      this.redis.on('error', (err) => {
        this.connectionAttempts++;
        
        // Only log if not disabled
        if (!this.redisDisabled && this.connectionAttempts <= this.maxConnectionAttempts) {
          logger.warn(`⚠️ Redis: Connection error (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}) - ${err.message}`);
        }
        
        this.isRedisAvailable = false;
        
        // Disable after max attempts
        if (this.connectionAttempts >= this.maxConnectionAttempts && !this.redisDisabled) {
          this.redisDisabled = true;
          logger.warn('⚠️ Redis: Permanently disabled. System will use memory cache only.');
          logger.info('💡 To enable Redis: Install Redis/Memurai and restart the server.');
          
          // Disconnect to stop retry loop
          if (this.redis) {
            this.redis.disconnect();
          }
        }
      });

      this.redis.on('close', () => {
        if (!this.redisDisabled && this.connectionAttempts === 0) {
          logger.warn('⚠️ Redis: Connection closed. Using memory cache.');
        }
        this.isRedisAvailable = false;
      });

      this.redis.on('reconnecting', () => {
        if (!this.redisDisabled && this.connectionAttempts < this.maxConnectionAttempts) {
          logger.debug('🔄 Redis: Attempting to reconnect...');
        }
      });

      // Try to connect (non-blocking)
      try {
        await this.redis.connect();
      } catch (error) {
        this.connectionAttempts++;
        logger.warn(`⚠️ Redis: Could not connect - ${error.message}. Using memory cache as fallback.`);
        this.isRedisAvailable = false;
        
        // Disable if initial connection failed
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
          this.redisDisabled = true;
          logger.warn('⚠️ Redis: Permanently disabled after failed connection attempts.');
          logger.info('💡 To enable Redis: Install Redis/Memurai and restart the server.');
          
          if (this.redis) {
            this.redis.disconnect();
          }
        }
      }

      // Start TTL cleanup for memory cache
      this.startMemoryCleanup();

    } catch (error) {
      logger.warn(`⚠️ Redis: Initialization failed - ${error.message}. Using memory cache only.`);
      this.isRedisAvailable = false;
      this.redisDisabled = true;
    }
  }

  /**
   * Start periodic cleanup of expired memory cache entries
   */
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
    }, 60000); // Check every minute
  }

  /**
   * Get value from cache (Redis first, then memory)
   */
  async get(key) {
    try {
      // Try Redis first (only if not disabled)
      if (this.isRedisAvailable && this.redis && !this.redisDisabled) {
        const value = await this.redis.get(key);
        if (value !== null) {
          logger.debug(`✅ Redis HIT: ${key}`);
          return JSON.parse(value);
        }
      }

      // Fallback to memory
      if (this.memoryCache.has(key)) {
        const expiry = this.memoryTTLs.get(key);
        if (!expiry || expiry > Date.now()) {
          logger.debug(`✅ Memory HIT: ${key}`);
          return this.memoryCache.get(key);
        } else {
          // Expired
          this.memoryCache.delete(key);
          this.memoryTTLs.delete(key);
        }
      }

      logger.debug(`❌ Cache MISS: ${key}`);
      return null;

    } catch (error) {
      logger.error(`Cache get error for key ${key}: ${error.message}`);
      
      // Try memory fallback on error
      if (this.memoryCache.has(key)) {
        return this.memoryCache.get(key);
      }
      
      return null;
    }
  }

  /**
   * Set value in cache (Redis and memory)
   */
  async set(key, value, ttlSeconds = 300) {
    try {
      const stringValue = JSON.stringify(value);

      // Try Redis first (only if not disabled)
      if (this.isRedisAvailable && this.redis && !this.redisDisabled) {
        await this.redis.setex(key, ttlSeconds, stringValue);
        logger.debug(`✅ Redis SET: ${key} (TTL: ${ttlSeconds}s)`);
      }

      // Always set in memory as fallback
      this.memoryCache.set(key, value);
      this.memoryTTLs.set(key, Date.now() + (ttlSeconds * 1000));
      logger.debug(`✅ Memory SET: ${key} (TTL: ${ttlSeconds}s)`);

      return true;

    } catch (error) {
      logger.error(`Cache set error for key ${key}: ${error.message}`);
      
      // Try memory fallback on error
      try {
        this.memoryCache.set(key, value);
        this.memoryTTLs.set(key, Date.now() + (ttlSeconds * 1000));
        return true;
      } catch (memError) {
        logger.error(`Memory cache set error: ${memError.message}`);
        return false;
      }
    }
  }

  /**
   * Delete key from cache
   */
  async del(key) {
    try {
      // Delete from Redis (only if not disabled)
      if (this.isRedisAvailable && this.redis && !this.redisDisabled) {
        await this.redis.del(key);
      }

      // Delete from memory
      this.memoryCache.delete(key);
      this.memoryTTLs.delete(key);

      logger.debug(`🗑️ Cache DEL: ${key}`);

    } catch (error) {
      logger.error(`Cache delete error for key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern) {
    try {
      let deletedCount = 0;

      // Delete from Redis (only if not disabled)
      if (this.isRedisAvailable && this.redis && !this.redisDisabled) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          deletedCount += keys.length;
        }
      }

      // Delete from memory
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
          this.memoryTTLs.delete(key);
          deletedCount++;
        }
      }

      logger.info(`🗑️ Deleted ${deletedCount} keys matching pattern: ${pattern}`);
      return deletedCount;

    } catch (error) {
      logger.error(`Cache delete pattern error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Flush all caches
   */
  async flushAll() {
    try {
      // Flush Redis (only if not disabled)
      if (this.isRedisAvailable && this.redis && !this.redisDisabled) {
        await this.redis.flushdb();
      }

      // Flush memory
      this.memoryCache.clear();
      this.memoryTTLs.clear();

      logger.info('🗑️ All caches flushed');

    } catch (error) {
      logger.error(`Cache flush error: ${error.message}`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      redis: {
        available: this.isRedisAvailable,
        connected: this.redis && this.redis.status === 'ready',
        disabled: this.redisDisabled,
        connectionAttempts: this.connectionAttempts
      },
      memory: {
        entries: this.memoryCache.size,
        withTTL: this.memoryTTLs.size
      }
    };
  }

  /**
   * Check if Redis is available
   */
  isAvailable() {
    return this.isRedisAvailable;
  }

  /**
   * Generate cache key
   */
  generateKey(prefix, params = {}) {
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

  /**
   * Invalidate rechequeos-related caches
   */
  async invalidateRechequeosCache() {
    await this.delPattern('rechequeos:*');
  }

  /**
   * Invalidate empresa-related caches
   */
  async invalidateEmpresaCache() {
    await this.delPattern('empresas:*');
    await this.delPattern('kpis:*');
    await this.delPattern('filters:*');
  }

  /**
   * Close connections
   */
  async close() {
    try {
      if (this.redis && !this.redisDisabled) {
        await this.redis.quit();
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error(`Error closing Redis connection: ${error.message}`);
    }
  }

  /**
   * Force enable Redis (for testing or manual reconnection)
   */
  async forceEnable() {
    this.redisDisabled = false;
    this.connectionAttempts = 0;
    logger.info('🔄 Redis: Manually re-enabled. Attempting to reconnect...');
    await this.initRedis();
  }
}

// Export singleton instance
const redisService = new RedisService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redisService.close();
});

process.on('SIGINT', async () => {
  await redisService.close();
});

module.exports = redisService;

