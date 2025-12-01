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

async function checkLocalidadTable() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await sql.connect(config);
    console.log('✅ Conectado exitosamente');

    // Buscar tabla relacionada con Localidad
    const localidadTables = await sql.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME LIKE '%Localidad%' 
         OR TABLE_NAME LIKE '%Ciudad%'
         OR TABLE_NAME LIKE '%Municipio%'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n🏘️ Tablas relacionadas con localidad:');
    console.log('=====================================');
    localidadTables.recordset.forEach((row, index) => {
      console.log(`${index + 1}. ${row.TABLE_NAME}`);
    });

    // Verificar si existe una tabla que pueda ser equivalente a distritos
    const allTables = await sql.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n🔍 Buscando tablas que puedan contener distritos/ciudades:');
    const possibleTables = allTables.recordset.filter(t => 
      t.TABLE_NAME.toLowerCase().includes('ciudad') ||
      t.TABLE_NAME.toLowerCase().includes('municipio') ||
      t.TABLE_NAME.toLowerCase().includes('localidad') ||
      t.TABLE_NAME.toLowerCase().includes('distrito')
    );
    
    possibleTables.forEach((row, index) => {
      console.log(`${index + 1}. ${row.TABLE_NAME}`);
    });

    // Verificar datos de EmpresaInfo para ver qué valores tiene IdLocalidad
    const localidadData = await sql.query(`
      SELECT DISTINCT IdLocalidad, COUNT(*) as count
      FROM EmpresaInfo 
      WHERE IdLocalidad IS NOT NULL
      GROUP BY IdLocalidad
      ORDER BY count DESC
    `);
    
    console.log('\n📊 Valores de IdLocalidad en EmpresaInfo:');
    localidadData.recordset.forEach((row, index) => {
      console.log(`  ${index + 1}. IdLocalidad: ${row.IdLocalidad}, Empresas: ${row.count}`);
    });

    await sql.close();
    console.log('\n✅ Conexión cerrada');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkLocalidadTable();
