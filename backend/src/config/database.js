const config = require('./config');
const logger = require('../utils/logger');

const useWindowsAuth = process.env.DB_USE_WINDOWS_AUTH === 'true';
const sql = useWindowsAuth ? require('mssql/msnodesqlv8') : require('mssql');

// Build database configuration based on authentication method
const buildDbConfig = () => {
  const dbConfig = {
    server: config.db.server,
    port: config.db.port,
    database: config.db.database,
    options: config.db.options,
    connectionTimeout: config.db.connectionTimeout,
    requestTimeout: config.db.requestTimeout,
    pool: config.db.pool
  };

  // Add instance name if provided
  if (config.db.instanceName) {
    dbConfig.options.instanceName = config.db.instanceName;
  }

  // Configure authentication
  if (useWindowsAuth) {
    dbConfig.driver = 'msnodesqlv8';
    dbConfig.options.trustServerCertificate = true;

    if (process.env.DB_DOMAIN || process.env.DB_USER) {
      // NTLM authentication with explicit credentials
      dbConfig.authentication = {
        type: 'ntlm',
        options: {
          domain: process.env.DB_DOMAIN || undefined,
          userName: process.env.DB_USER || undefined,
          password: process.env.DB_PASSWORD || undefined
        }
      };
    } else {
      // Use the Windows identity of the process (service account)
      dbConfig.options.trustedConnection = true;
    }

    logger.info('Using Windows Authentication (msnodesqlv8 driver)');
  } else {
    // SQL Server Authentication
    dbConfig.user = config.db.user;
    dbConfig.password = config.db.password;
    logger.info('Using SQL Server Authentication');
  }

  return dbConfig;
};

// Create a connection pool
const poolPromise = new sql.ConnectionPool(buildDbConfig())
  .connect()
  .then((pool) => {
    logger.info('Connected to SQL Server successfully');
    return pool;
  })
  .catch((err) => {
    logger.error('Database Connection Failed! Bad Config: ', err);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise,
  // Helper function for parameterized queries
  executeQuery: async (query, params = {}) => {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      
      // Increase timeout for complex queries
      request.timeout = 180000; // 3 minutes
      
      // Add parameters to the request
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
      
      const result = await request.query(query);
      return result;
    } catch (error) {
      logger.error(`SQL Error: ${error.message}`);
      throw error;
    }
  },
  // Helper function for stored procedures
  executeStoredProcedure: async (procedureName, params = {}) => {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      
      // Add parameters to the request
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
      
      const result = await request.execute(procedureName);
      return result;
    } catch (error) {
      logger.error(`SQL Error in stored procedure ${procedureName}: ${error.message}`);
      throw error;
    }
  }
};
