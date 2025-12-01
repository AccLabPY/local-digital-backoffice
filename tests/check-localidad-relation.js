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

async function checkLocalidadSubRegionRelation() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await sql.connect(config);
    console.log('✅ Conectado exitosamente');

    // Verificar si IdLocalidad corresponde a SubRegion
    const relationCheck = await sql.query(`
      SELECT TOP 10 
        ei.IdLocalidad,
        sr.IdSubRegion,
        sr.Nombre as SubRegionNombre,
        dep.Nombre as DepartamentoNombre
      FROM EmpresaInfo ei
      LEFT JOIN SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
      LEFT JOIN Departamentos dep ON ei.IdDepartamento = dep.IdDepartamento
      WHERE ei.IdLocalidad IS NOT NULL
    `);
    
    console.log('\n🔗 Verificando relación IdLocalidad -> SubRegion:');
    console.log('===============================================');
    relationCheck.recordset.forEach((row, index) => {
      console.log(`${index + 1}. IdLocalidad: ${row.IdLocalidad}, SubRegion: ${row.IdSubRegion}, Nombre: ${row.SubRegionNombre}, Depto: ${row.DepartamentoNombre}`);
    });

    // Verificar si hay coincidencias
    const matches = relationCheck.recordset.filter(row => row.IdSubRegion !== null);
    console.log(`\n✅ Coincidencias encontradas: ${matches.length}/${relationCheck.recordset.length}`);

    if (matches.length > 0) {
      console.log('\n🎉 IdLocalidad SÍ corresponde a SubRegion!');
    } else {
      console.log('\n❌ IdLocalidad NO corresponde a SubRegion');
      
      // Buscar otra posible relación
      console.log('\n🔍 Buscando otras posibles relaciones...');
      
      // Verificar si IdLocalidad corresponde a algún ID en otras tablas
      const otherChecks = await sql.query(`
        SELECT 
          'Region' as Tabla,
          COUNT(*) as Coincidencias
        FROM EmpresaInfo ei
        INNER JOIN Region r ON ei.IdLocalidad = r.IdRegion
        WHERE ei.IdLocalidad IS NOT NULL
        
        UNION ALL
        
        SELECT 
          'Departamentos' as Tabla,
          COUNT(*) as Coincidencias
        FROM EmpresaInfo ei
        INNER JOIN Departamentos d ON ei.IdLocalidad = d.IdDepartamento
        WHERE ei.IdLocalidad IS NOT NULL
      `);
      
      otherChecks.recordset.forEach(row => {
        console.log(`  - ${row.Tabla}: ${row.Coincidencias} coincidencias`);
      });
    }

    await sql.close();
    console.log('\n✅ Conexión cerrada');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkLocalidadSubRegionRelation();
