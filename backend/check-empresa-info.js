const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'FRAN\\MSSQL2022',
  database: process.env.DB_NAME || 'BID_v3',
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

async function checkEmpresaInfoTable() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await sql.connect(config);
    console.log('✅ Conectado exitosamente');

    // Verificar estructura de EmpresaInfo
    const columns = await sql.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'EmpresaInfo'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n🏢 Estructura de la tabla EmpresaInfo:');
    console.log('=====================================');
    columns.recordset.forEach(col => {
      const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Verificar algunos datos de ejemplo
    const sample = await sql.query(`
      SELECT TOP 3 IdEmpresa, IdDepartamento, IdSubRegion, IdSectorActividad, IdUsuario, Test
      FROM EmpresaInfo
    `);
    
    console.log('\n📊 Datos de ejemplo:');
    sample.recordset.forEach((row, index) => {
      console.log(`  ${index + 1}. Empresa: ${row.IdEmpresa}, Depto: ${row.IdDepartamento}, SubRegion: ${row.IdSubRegion}, Sector: ${row.IdSectorActividad}, Usuario: ${row.IdUsuario}, Test: ${row.Test}`);
    });

    await sql.close();
    console.log('\n✅ Conexión cerrada');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkEmpresaInfoTable();
