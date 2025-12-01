const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    requestTimeout: 30000
  }
};

async function simpleDepartmentCheck() {
  try {
    await sql.connect(config);
    console.log('🔍 Verificación simple de departamentos...\n');
    
    // 1. Contar empresas en Capital (ASUNCIÓN)
    console.log('1. Contando empresas en Capital (ASUNCIÓN)...');
    const capitalQuery = `
      SELECT COUNT(DISTINCT ei.IdEmpresa) as total_capital
      FROM dbo.EmpresaInfo ei
      INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      INNER JOIN dbo.SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
      WHERE tu.Finalizado = 1
        AND sr.IdRegion = 20
    `;
    
    const capitalResult = await sql.query(capitalQuery);
    const capitalActual = capitalResult.recordset[0].total_capital;
    console.log(`   Capital actual: ${capitalActual} empresas`);
    console.log(`   Capital esperado: 104 empresas`);
    console.log(`   Diferencia: ${capitalActual - 104}`);
    
    // 2. Contar empresas perdidas (sin distrito)
    console.log('\n2. Contando empresas perdidas (sin distrito)...');
    const perdidosQuery = `
      SELECT COUNT(DISTINCT ei.IdEmpresa) as perdidos
      FROM dbo.EmpresaInfo ei
      INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      WHERE tu.Finalizado = 1
        AND ei.IdLocalidad IS NULL
        AND (ei.IdDepartamento = 20 OR ei.IdDepartamento = 0 OR ei.IdDepartamento IS NULL)
    `;
    
    const perdidosResult = await sql.query(perdidosQuery);
    const perdidos = perdidosResult.recordset[0].perdidos;
    console.log(`   Empresas perdidas: ${perdidos}`);
    
    // 3. Verificar algunos ejemplos de empresas perdidas
    console.log('\n3. Ejemplos de empresas perdidas...');
    const ejemplosQuery = `
      SELECT TOP 5
        ei.IdEmpresa,
        e.Nombre as Empresa,
        u.NombreCompleto as Usuario,
        ei.IdDepartamento,
        ei.IdLocalidad,
        tu.FechaTest
      FROM dbo.EmpresaInfo ei
      INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      INNER JOIN dbo.Empresa e ON ei.IdEmpresa = e.IdEmpresa
      INNER JOIN dbo.Usuario u ON ei.IdUsuario = u.IdUsuario
      WHERE tu.Finalizado = 1
        AND ei.IdLocalidad IS NULL
        AND (ei.IdDepartamento = 20 OR ei.IdDepartamento = 0 OR ei.IdDepartamento IS NULL)
      ORDER BY tu.FechaTest DESC
    `;
    
    const ejemplosResult = await sql.query(ejemplosQuery);
    console.log('   Ejemplos:');
    ejemplosResult.recordset.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.Empresa} - ${row.Usuario}`);
      console.log(`      IdDepartamento: ${row.IdDepartamento}, IdLocalidad: ${row.IdLocalidad}`);
    });
    
    // 4. Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`   Capital actual: ${capitalActual} empresas`);
    console.log(`   Empresas perdidas: ${perdidos} empresas`);
    console.log(`   Capital después del patch: ${capitalActual + perdidos} empresas`);
    console.log(`   Capital esperado: 104 empresas`);
    
    if (capitalActual + perdidos === 104) {
      console.log('   ✅ El patch solucionaría el problema completamente');
    } else {
      console.log(`   ⚠️  Aún habría diferencia de ${(capitalActual + perdidos) - 104} empresas`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  simpleDepartmentCheck();
}

module.exports = { simpleDepartmentCheck };
