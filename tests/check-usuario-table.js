const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'FRAN\\MSSQL2022',
  database: process.env.DB_NAME || 'BID_stg_copy',
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

async function checkUsuarioTable() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await sql.connect(config);
    console.log('✅ Conectado exitosamente');

    // Verificar estructura de la tabla Usuario
    const columns = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Usuario'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n📊 Estructura de la tabla Usuario:');
    console.log('===================================');
    columns.recordset.forEach(col => {
      const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Verificar datos existentes
    const count = await sql.query('SELECT COUNT(*) as count FROM Usuario');
    console.log(`\n📈 Total de usuarios: ${count.recordset[0].count}`);

    if (count.recordset[0].count > 0) {
      const users = await sql.query('SELECT TOP 3 * FROM Usuario');
      console.log('\n👥 Primeros usuarios:');
      users.recordset.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.IdUsuario}, Username: ${user.Username || 'N/A'}, Email: ${user.Email || 'N/A'}`);
      });
    }

    await sql.close();
    console.log('\n✅ Conexión cerrada');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkUsuarioTable();
