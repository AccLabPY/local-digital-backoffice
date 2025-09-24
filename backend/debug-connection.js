/**
 * Enhanced Database Connection Debug Script
 * 
 * This script provides detailed logging and diagnostics for database connection issues
 */

const sql = require('mssql');
require('dotenv').config();

// Database configuration from environment variables
const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'ChequeoDigital',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    debug: {
      packet: true,
      data: true,
      payload: true,
      token: true
    }
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Add instance name if provided
if (process.env.DB_INSTANCE) {
  config.options.instanceName = process.env.DB_INSTANCE;
}

// Configure authentication
if (process.env.DB_USE_WINDOWS_AUTH === 'true') {
  // Windows Authentication
  config.options.integratedSecurity = true;
  if (process.env.DB_DOMAIN && process.env.DB_USER) {
    config.domain = process.env.DB_DOMAIN;
    config.user = process.env.DB_USER;
  }
} else {
  // SQL Server Authentication
  config.user = process.env.DB_USER || 'sa';
  config.password = process.env.DB_PASSWORD || '';
}

async function debugConnection() {
  console.log('🔍 DETAILED DATABASE CONNECTION DEBUG');
  console.log('=====================================');
  console.log('');
  
  // Display configuration
  console.log('📋 Configuration Details:');
  console.log(`   Server: ${config.server}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   Instance: ${config.options.instanceName || 'Not specified'}`);
  console.log(`   Encrypt: ${config.options.encrypt}`);
  console.log(`   Trust Certificate: ${config.options.trustServerCertificate}`);
  console.log(`   Connection Timeout: ${config.connectionTimeout}ms`);
  console.log(`   Request Timeout: ${config.requestTimeout}ms`);
  console.log('');
  
  // Display authentication
  if (process.env.DB_USE_WINDOWS_AUTH === 'true') {
    console.log('🔐 Authentication: Windows Authentication');
    console.log(`   Domain: ${config.domain || 'Not specified'}`);
    console.log(`   User: ${config.user || 'Current Windows User'}`);
    console.log(`   Integrated Security: ${config.options.integratedSecurity}`);
  } else {
    console.log('🔐 Authentication: SQL Server Authentication');
    console.log(`   User: ${config.user}`);
    console.log(`   Password: ${config.password ? '[SET]' : '[NOT SET]'}`);
  }
  console.log('');

  // Test network connectivity
  console.log('🌐 Network Connectivity Tests:');
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // Test ping to server
    try {
      const serverName = config.server.split('\\')[0]; // Get server name without instance
      console.log(`   Testing ping to: ${serverName}`);
      const { stdout } = await execAsync(`ping -n 1 ${serverName}`);
      console.log('   ✅ Ping successful');
    } catch (pingError) {
      console.log('   ❌ Ping failed:', pingError.message);
    }
    
    // Test telnet to port
    try {
      console.log(`   Testing port connectivity: ${config.server}:${config.port}`);
      const { stdout } = await execAsync(`powershell -Command "Test-NetConnection -ComputerName ${config.server.split('\\')[0]} -Port ${config.port}"`);
      console.log('   ✅ Port connectivity test completed');
    } catch (portError) {
      console.log('   ❌ Port connectivity test failed:', portError.message);
    }
  } catch (error) {
    console.log('   ⚠️  Network tests skipped:', error.message);
  }
  console.log('');

  // Test SQL Server service
  console.log('🔧 SQL Server Service Tests:');
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    console.log('   Checking SQL Server services...');
    const { stdout } = await execAsync('sc query MSSQLSERVER');
    console.log('   ✅ SQL Server service check completed');
  } catch (serviceError) {
    console.log('   ❌ Service check failed:', serviceError.message);
  }
  console.log('');

  // Test connection with detailed error handling
  console.log('📡 Attempting Database Connection...');
  console.log('   This may take up to 30 seconds...');
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Enable detailed logging
    sql.on('error', (err) => {
      console.log('   🔴 SQL Error Event:', err.message);
      console.log('   Error Code:', err.code);
      console.log('   Error Number:', err.number);
      console.log('   Error State:', err.state);
      console.log('   Error Class:', err.class);
      console.log('   Error Server:', err.server);
      console.log('   Error Procedure:', err.procName);
      console.log('   Error Line Number:', err.lineNumber);
    });

    // Connect to database
    console.log('   Connecting...');
    await sql.connect(config);
    
    const endTime = Date.now();
    console.log(`   ✅ Connection successful! (${endTime - startTime}ms)`);
    console.log('');

    // Test basic query
    console.log('🔍 Testing Basic Query...');
    try {
      const result = await sql.query('SELECT @@VERSION as version, DB_NAME() as current_db, USER_NAME() as current_user');
      console.log('   ✅ Query successful');
      console.log(`   Current Database: ${result.recordset[0].current_db}`);
      console.log(`   Current User: ${result.recordset[0].current_user}`);
      console.log(`   SQL Server Version: ${result.recordset[0].version.split('\n')[0]}`);
    } catch (queryError) {
      console.log('   ❌ Query failed:', queryError.message);
    }
    console.log('');

    // Test table existence
    console.log('🔍 Checking Database Tables...');
    try {
      const tablesQuery = `
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `;
      
      const tablesResult = await sql.query(tablesQuery);
      console.log(`   ✅ Found ${tablesResult.recordset.length} tables in database`);
      
      if (tablesResult.recordset.length > 0) {
        console.log('   Tables:');
        tablesResult.recordset.slice(0, 10).forEach(table => {
          console.log(`     - ${table.TABLE_NAME}`);
        });
        if (tablesResult.recordset.length > 10) {
          console.log(`     ... and ${tablesResult.recordset.length - 10} more tables`);
        }
      }
    } catch (tableError) {
      console.log('   ❌ Table check failed:', tableError.message);
    }

    console.log('');
    console.log('🎉 Database connection test completed successfully!');

  } catch (error) {
    const endTime = Date.now();
    console.log(`   ❌ Connection failed! (${endTime - startTime}ms)`);
    console.log('');
    console.log('🔍 DETAILED ERROR ANALYSIS:');
    console.log('============================');
    console.log(`Error Message: ${error.message}`);
    console.log(`Error Code: ${error.code || 'N/A'}`);
    console.log(`Error Number: ${error.number || 'N/A'}`);
    console.log(`Error State: ${error.state || 'N/A'}`);
    console.log(`Error Class: ${error.class || 'N/A'}`);
    console.log(`Error Server: ${error.server || 'N/A'}`);
    console.log(`Error Procedure: ${error.procName || 'N/A'}`);
    console.log(`Error Line Number: ${error.lineNumber || 'N/A'}`);
    console.log('');
    
    // Provide specific solutions based on error
    console.log('💡 RECOMMENDED SOLUTIONS:');
    console.log('========================');
    
    if (error.code === 'ELOGIN') {
      console.log('🔐 LOGIN FAILED:');
      console.log('   1. Verify username and password are correct');
      console.log('   2. Check if SQL Server Authentication is enabled');
      console.log('   3. Ensure the user exists in SQL Server');
      console.log('   4. Check if the user has login permissions');
      console.log('   5. Try Windows Authentication instead');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🌐 CONNECTION REFUSED:');
      console.log('   1. Verify SQL Server is running');
      console.log('   2. Check if SQL Server Browser service is running');
      console.log('   3. Verify the server name and instance name');
      console.log('   4. Check firewall settings');
      console.log('   5. Try using localhost instead of computer name');
    } else if (error.code === 'ETIMEOUT') {
      console.log('⏱️  CONNECTION TIMEOUT:');
      console.log('   1. Check network connectivity');
      console.log('   2. Verify SQL Server performance');
      console.log('   3. Try increasing timeout values');
      console.log('   4. Check if SQL Server is under heavy load');
    } else if (error.code === 'ENOTFOUND') {
      console.log('🔍 SERVER NOT FOUND:');
      console.log('   1. Verify the server name/IP address');
      console.log('   2. Check DNS resolution');
      console.log('   3. Try using IP address instead of name');
      console.log('   4. Verify the instance name is correct');
    } else {
      console.log('🔧 GENERAL TROUBLESHOOTING:');
      console.log('   1. Check your .env configuration');
      console.log('   2. Verify SQL Server is accessible');
      console.log('   3. Check user permissions');
      console.log('   4. Try different authentication methods');
      console.log('   5. Check SQL Server error logs');
    }
    
    console.log('');
    console.log('📖 Additional Resources:');
    console.log('   - Check SQL Server Configuration Manager');
    console.log('   - Review Windows Event Logs');
    console.log('   - Check SQL Server Error Logs');
    console.log('   - Verify network protocols are enabled');
    
    process.exit(1);
  } finally {
    // Close the connection
    try {
      await sql.close();
      console.log('   🔌 Connection closed');
    } catch (closeError) {
      console.log('   ⚠️  Error closing connection:', closeError.message);
    }
  }
}

// Run the debug
debugConnection();
