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

async function checkLocationTables() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await sql.connect(config);
    console.log('✅ Conectado exitosamente');

    // Buscar tablas relacionadas con ubicación
    const locationTables = await sql.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME LIKE '%Distrito%' 
         OR TABLE_NAME LIKE '%Departamento%'
         OR TABLE_NAME LIKE '%Region%'
         OR TABLE_NAME LIKE '%SubRegion%'
      ORDER BY TABLE_NAME
    `);
    
    console.log('\n📍 Tablas de ubicación encontradas:');
    console.log('====================================');
    locationTables.recordset.forEach((row, index) => {
      console.log(`${index + 1}. ${row.TABLE_NAME}`);
    });

    // Verificar estructura de Departamentos
    if (locationTables.recordset.some(t => t.TABLE_NAME === 'Departamentos')) {
      const deptColumns = await sql.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Departamentos'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('\n🏢 Estructura de Departamentos:');
      deptColumns.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    }

    // Verificar si existe SubRegion (posiblemente es el equivalente a Distritos)
    if (locationTables.recordset.some(t => t.TABLE_NAME === 'SubRegion')) {
      const subRegionColumns = await sql.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'SubRegion'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('\n🏘️ Estructura de SubRegion:');
      subRegionColumns.recordset.forEach(col => {
        console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    }

    await sql.close();
    console.log('\n✅ Conexión cerrada');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkLocationTables();
