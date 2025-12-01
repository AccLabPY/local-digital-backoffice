/**
 * Simple msnodesqlv8 Test
 */

const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

console.log('🔍 Testing msnodesqlv8 connection...');

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'BID_stg_copy',
  options: {
    trustedConnection: true,
    trustServerCertificate: true
  },
  driver: 'msnodesqlv8'
};

// Add instance name if provided
if (process.env.DB_INSTANCE) {
  config.options.instanceName = process.env.DB_INSTANCE;
}

console.log('Configuration:');
console.log(`  Server: ${config.server}`);
console.log(`  Database: ${config.database}`);
console.log(`  Instance: ${config.options.instanceName || 'Default'}`);
console.log(`  Driver: ${config.driver}`);
console.log('');

async function testConnection() {
  try {
    console.log('Connecting...');
    await sql.connect(config);
    console.log('✅ Connected successfully!');
    
    // Test query
    const result = await sql.query('SELECT @@VERSION as version, DB_NAME() as current_db, USER_NAME() as current_user');
    console.log('✅ Query successful');
    console.log(`Current Database: ${result.recordset[0].current_db}`);
    console.log(`Current User: ${result.recordset[0].current_user}`);
    console.log(`SQL Server Version: ${result.recordset[0].version.split('\n')[0]}`);
    
    await sql.close();
    console.log('✅ Connection closed');
    
  } catch (error) {
    console.log('❌ Connection failed');
    console.log('Error details:');
    console.log(`  Message: ${error.message}`);
    console.log(`  Code: ${error.code || 'N/A'}`);
    console.log(`  Number: ${error.number || 'N/A'}`);
    console.log(`  State: ${error.state || 'N/A'}`);
    console.log(`  Class: ${error.class || 'N/A'}`);
    console.log(`  Server: ${error.server || 'N/A'}`);
    console.log(`  Procedure: ${error.procName || 'N/A'}`);
    console.log(`  Line Number: ${error.lineNumber || 'N/A'}`);
    
    // Show full error object for debugging
    console.log('\nFull error object:');
    console.log(JSON.stringify(error, null, 2));
  }
}

testConnection();
