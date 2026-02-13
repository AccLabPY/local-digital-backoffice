const sql = require('mssql');
require('dotenv').config();

console.log('🔍 Testing with SQL Server Authentication...');

const config = {
  server: process.env.DB_SERVER || 'FRAN\\MSSQL2022',
  database: process.env.DB_NAME || 'BID_v2_22122025',
  user: 'ChequeoApp',
  password: 'AppPassword123!',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: process.env.DB_INSTANCE || 'MSSQL2022'
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

console.log('Configuration:');
console.log(`  Server: ${config.server}`);
console.log(`  Database: ${config.database}`);
console.log(`  Instance: ${config.options.instanceName}`);
console.log(`  Auth: SQL Server Authentication`);
console.log(`  User: ${config.user}`);
console.log('');

async function testConnection() {
  try {
    console.log('Connecting...');
    await sql.connect(config);
    console.log('✅ Connected successfully!');
    
    // Test query
    const result = await sql.query('SELECT @@VERSION as version, DB_NAME() as current_db');
    console.log('✅ Query successful');
    console.log(`Current Database: ${result.recordset[0].current_db}`);
    console.log(`Current User: ChequeoApp`);
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
  }
}

testConnection();
