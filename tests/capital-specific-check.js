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
    requestTimeout: 60000
  }
};

async function capitalSpecificCheck() {
  try {
    await sql.connect(config);
    console.log('🔍 Verificación específica de Capital...\n');
    
    // 1. Contar empresas actuales en Capital (ASUNCIÓN)
    console.log('1. Contando empresas actuales en Capital (ASUNCIÓN)...');
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
    
    // 2. Contar empresas perdidas (sin distrito pero con IdDepartamento = 20)
    console.log('\n2. Contando empresas perdidas (IdDepartamento = 20, IdLocalidad = NULL)...');
    const perdidosQuery = `
      SELECT COUNT(DISTINCT ei.IdEmpresa) as perdidos
      FROM dbo.EmpresaInfo ei
      INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      WHERE tu.Finalizado = 1
        AND ei.IdLocalidad IS NULL
        AND ei.IdDepartamento = 20
    `;
    
    const perdidosResult = await sql.query(perdidosQuery);
    const perdidos = perdidosResult.recordset[0].perdidos;
    console.log(`   Empresas perdidas: ${perdidos}`);
    
    // 3. Contar empresas con IdDepartamento = 0 o NULL
    console.log('\n3. Contando empresas con IdDepartamento = 0 o NULL...');
    const otrosQuery = `
      SELECT COUNT(DISTINCT ei.IdEmpresa) as otros
      FROM dbo.EmpresaInfo ei
      INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      WHERE tu.Finalizado = 1
        AND ei.IdLocalidad IS NULL
        AND (ei.IdDepartamento = 0 OR ei.IdDepartamento IS NULL)
    `;
    
    const otrosResult = await sql.query(otrosQuery);
    const otros = otrosResult.recordset[0].otros;
    console.log(`   Empresas con IdDepartamento = 0/NULL: ${otros}`);
    
    // 4. Verificar algunos ejemplos
    console.log('\n4. Ejemplos de empresas perdidas...');
    const ejemplosQuery = `
      SELECT TOP 3
        ei.IdEmpresa,
        e.Nombre as Empresa,
        u.NombreCompleto as Usuario,
        ei.IdDepartamento,
        ei.IdLocalidad
      FROM dbo.EmpresaInfo ei
      INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      INNER JOIN dbo.Empresa e ON ei.IdEmpresa = e.IdEmpresa
      INNER JOIN dbo.Usuario u ON ei.IdUsuario = u.IdUsuario
      WHERE tu.Finalizado = 1
        AND ei.IdLocalidad IS NULL
        AND (ei.IdDepartamento = 20 OR ei.IdDepartamento = 0 OR ei.IdDepartamento IS NULL)
      ORDER BY ei.IdEmpresa
    `;
    
    const ejemplosResult = await sql.query(ejemplosQuery);
    console.log('   Ejemplos:');
    ejemplosResult.recordset.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.Empresa} - ${row.Usuario}`);
      console.log(`      IdEmpresa: ${row.IdEmpresa}, IdDepartamento: ${row.IdDepartamento}, IdLocalidad: ${row.IdLocalidad}`);
    });
    
    // 5. Resumen
    const totalPerdidos = perdidos + otros;
    const capitalDespues = capitalActual + totalPerdidos;
    
    console.log('\n📊 RESUMEN:');
    console.log(`   Capital actual: ${capitalActual} empresas`);
    console.log(`   Empresas perdidas (IdDepartamento=20): ${perdidos}`);
    console.log(`   Empresas perdidas (IdDepartamento=0/NULL): ${otros}`);
    console.log(`   Total empresas perdidas: ${totalPerdidos}`);
    console.log(`   Capital después del patch: ${capitalDespues} empresas`);
    console.log(`   Capital esperado: 104 empresas`);
    
    if (capitalDespues === 104) {
      console.log('   ✅ El patch solucionaría el problema completamente');
    } else if (capitalDespues > 104) {
      console.log(`   ⚠️  Habría ${capitalDespues - 104} empresas de más`);
    } else {
      console.log(`   ❌ Aún faltarían ${104 - capitalDespues} empresas`);
    }
    
    console.log('\n🔧 PATCH RECOMENDADO:');
    console.log('   Actualizar IdLocalidad = 244 para empresas con:');
    console.log('   - IdLocalidad IS NULL');
    console.log('   - IdDepartamento IN (20, 0) OR IdDepartamento IS NULL');
    console.log('   - Test finalizado');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  capitalSpecificCheck();
}

module.exports = { capitalSpecificCheck };
