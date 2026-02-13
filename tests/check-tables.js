const sql = require('mssql');
require('dotenv').config();

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

async function checkTables() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await sql.connect(config);
    console.log('✅ Conectado exitosamente');

    // Verificar tablas existentes
    const result = await sql.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    console.log('\n📋 Tablas disponibles en la base de datos:');
    console.log('==========================================');
    
    if (result.recordset.length === 0) {
      console.log('❌ No se encontraron tablas');
    } else {
      result.recordset.forEach((row, index) => {
        console.log(`${index + 1}. ${row.TABLE_NAME}`);
      });
    }

    // Verificar si existe tabla de usuarios
    const userTableCheck = await sql.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Usuarios'
    `);

    if (userTableCheck.recordset[0].count > 0) {
      console.log('\n✅ Tabla "Usuarios" existe');
      
      // Verificar estructura de la tabla
      const columns = await sql.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Usuarios'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('\n📊 Estructura de la tabla Usuarios:');
      columns.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    } else {
      console.log('\n❌ Tabla "Usuarios" NO existe');
    }

    await sql.close();
    console.log('\n✅ Conexión cerrada');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkTables();
