require('dotenv').config();
const path = require('path');

// Environment variables with defaults
const config = {
  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '002a2cc2e8c1aa42be5e41fda4e262ae9f1085b1dbc9fb370024a47351cc631d8f1d5f901dc0dcd188ce27863ce6c7792fddca40028e4488dafc7d1166c70390',
    expiresIn: process.env.JWT_EXPIRATION || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  db: {
    server: process.env.DB_SERVER || 'localhost',
    port: parseInt(process.env.DB_PORT) || 1433,
    user: process.env.DB_USER || 'webapp',
    password: process.env.DB_PASSWORD || 'your_secure_password',
    database: process.env.DB_NAME || 'ChequeoDigital',
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      enableArithAbort: true,
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
      instanceName: process.env.DB_INSTANCE || '',
    },
    connectionTimeout: 30000,
    requestTimeout: 120000, // 2 minutes for complex queries
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIRECTORY || path.join(process.cwd(), 'logs'),
  },
  rateLimit: {
    windowMs: eval(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  },
};

module.exports = config;
