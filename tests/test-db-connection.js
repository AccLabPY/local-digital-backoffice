/**
 * Database Connection Test Script
 * 
 * This script tests the database connection using the configuration
 * from your .env file. Run this to verify your database setup.
 * 
 * Usage: node test-db-connection.js
 */

const sql = require('mssql');
require('dotenv').config();

// Database configuration from environment variables
const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'ChequeoDigital',
  user: process.env.DB_USER || 'ChequeoApp',
  password: process.env.DB_PASSWORD || 'AppPassword123!',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    instanceName: process.env.DB_INSTANCE || 'MSSQL2022'
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

// Add instance name if provided
if (process.env.DB_INSTANCE) {
  config.options.instanceName = process.env.DB_INSTANCE;
}

// SQL Server Authentication configuration

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log(`Server: ${config.server}`);
  console.log(`Database: ${config.database}`);
  console.log(`Instance: ${config.options.instanceName || 'Default'}`);
  console.log(`Authentication: SQL Server Authentication`);
  console.log(`User: ${config.user}`);
  console.log('');

  try {
    // Connect to database
    console.log('📡 Connecting to SQL Server...');
    await sql.connect(config);
    console.log('✅ Database connection successful!');
    console.log('');

    // Test basic query
    console.log('🔍 Testing basic query...');
    const result = await sql.query('SELECT COUNT(*) as count FROM Empresa');
    console.log(`✅ Found ${result.recordset[0].count} companies in database`);
    console.log('');

    // Test table existence
    console.log('🔍 Checking required tables...');
    const tablesQuery = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_NAME IN ('Empresa', 'EmpresaInfo', 'TestUsuario', 'ResultadoNivelDigital', 'Pregunta', 'Respuesta')
      ORDER BY TABLE_NAME
    `;
    
    const tablesResult = await sql.query(tablesQuery);
    const tableNames = tablesResult.recordset.map(row => row.TABLE_NAME);
    
    if (tableNames.length >= 6) {
      console.log('✅ All required tables found:');
      tableNames.forEach(table => console.log(`   - ${table}`));
    } else {
      console.log('⚠️  Some required tables are missing:');
      tableNames.forEach(table => console.log(`   - ${table}`));
      console.log('   Please run the database initialization script: npm run init-db');
    }
    console.log('');

    // Test stored procedures
    console.log('🔍 Checking stored procedures...');
    const spQuery = `
      SELECT ROUTINE_NAME 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_TYPE = 'PROCEDURE'
      AND ROUTINE_NAME LIKE '%Chequeo%'
    `;
    
    const spResult = await sql.query(spQuery);
    if (spResult.recordset.length > 0) {
      console.log('✅ Found stored procedures:');
      spResult.recordset.forEach(sp => console.log(`   - ${sp.ROUTINE_NAME}`));
    } else {
      console.log('⚠️  No stored procedures found');
    }
    console.log('');

    console.log('🎉 Database test completed successfully!');
    console.log('Your database is ready for the Chequeo Digital 2.0 application.');

  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('');
    console.error('Error details:');
    console.error(`Message: ${error.message}`);
    console.error('');
    
    if (error.code) {
      console.error('Common solutions:');
      console.error('');
      
      switch (error.code) {
        case 'ELOGIN':
          console.error('🔐 Login failed:');
          console.error('   - Check your username and password');
          console.error('   - Verify the user exists in SQL Server');
          console.error('   - Ensure the user has proper permissions');
          break;
          
        case 'ECONNREFUSED':
          console.error('🌐 Connection refused:');
          console.error('   - Check if SQL Server is running');
          console.error('   - Verify the server name/IP address');
          console.error('   - Check the port number (default: 1433)');
          console.error('   - Check firewall settings');
          break;
          
        case 'ETIMEOUT':
          console.error('⏱️  Connection timeout:');
          console.error('   - Check network connectivity');
          console.error('   - Verify server performance');
          console.error('   - Try increasing timeout values');
          break;
          
        case 'ENOTFOUND':
          console.error('🔍 Server not found:');
          console.error('   - Verify the server name/IP address');
          console.error('   - Check DNS resolution');
          break;
          
        default:
          console.error('   - Check your .env configuration');
          console.error('   - Verify SQL Server is accessible');
          console.error('   - Check user permissions');
      }
    }
    
    console.error('');
    console.error('📖 For more help, see CONFIGURATION.md');
    process.exit(1);
  } finally {
    // Close the connection
    await sql.close();
  }
}

// Run the test
testConnection();
