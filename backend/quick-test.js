/**
 * Quick Database Connection Test
 */

const sql = require('mssql');
require('dotenv').config();

console.log('🔍 Quick Database Connection Test');
console.log('=================================');

// Simple configuration
const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  options: {
    instanceName: process.env.DB_INSTANCE,
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  connectionTimeout: 10000, // Reduced timeout
  requestTimeout: 10000
};

// Windows Authentication
config.options.integratedSecurity = true;

console.log('Configuration:');
console.log(`  Server: ${config.server}`);
console.log(`  Port: ${config.port}`);
console.log(`  Database: ${config.database}`);
console.log(`  Instance: ${config.options.instanceName}`);
console.log('  Auth: Windows Authentication');
console.log('');

async function quickTest() {
  try {
    console.log('Connecting...');
    const startTime = Date.now();
    
    await sql.connect(config);
    
    const endTime = Date.now();
    console.log(`✅ Connected successfully! (${endTime - startTime}ms)`);
    
    // Quick test query
    const result = await sql.query('SELECT @@VERSION as version');
    console.log('✅ Query successful');
    console.log(`SQL Server: ${result.recordset[0].version.split('\n')[0]}`);
    
    await sql.close();
    console.log('✅ Connection closed');
    
  } catch (error) {
    console.log('❌ Connection failed');
    console.log(`Error: ${error.message}`);
    console.log(`Code: ${error.code || 'N/A'}`);
    
    if (error.code === 'ETIMEOUT') {
      console.log('');
      console.log('💡 TIMEOUT SOLUTIONS:');
      console.log('1. SQL Server Browser service is not running');
      console.log('2. Instance name is incorrect');
      console.log('3. Port is blocked by firewall');
      console.log('4. Try connecting without instance name');
    }
  }
}

quickTest();
