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

// Conteos esperados según el usuario
const expectedCounts = {
  'CAPITAL': 104,
  'CENTRAL': 163,
  'ALTO PARANÁ': 140,
  'AMAMBAY': 1,
  'BOQUERÓN': 1,
  'CAAGUAZÚ': 10,
  'CONCEPCIÓN': 136,
  'CORDILLERA': 7,
  'GUAIRÁ': 60,
  'ITAPÚA': 359,
  'MISIONES': 1,
  'PARAGUARÍ': 6,
  'SAN PEDRO': 1,
  'ÑEEMBUCÚ': 134
};

async function countUniqueEnterprises() {
  try {
    await sql.connect(config);
    console.log('🔍 Contando EMPRESAS ÚNICAS por departamento...\n');
    
    // Consulta que cuenta empresas únicas por departamento
    const query = `
      WITH EmpresasFinalizadas AS (
        SELECT DISTINCT 
          ei.IdEmpresa,
          ei.IdDepartamento,
          ei.IdLocalidad,
          d.Nombre as NombreDepartamento,
          sr.IdRegion,
          sr.Nombre as NombreSubRegion
        FROM dbo.EmpresaInfo ei
        INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
        LEFT JOIN dbo.Departamentos d ON ei.IdDepartamento = d.IdDepartamento
        LEFT JOIN dbo.SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
        WHERE tu.Finalizado = 1
      )
      SELECT 
        CASE 
          WHEN IdRegion = 20 THEN 'CAPITAL'
          ELSE COALESCE(NombreDepartamento, 'SIN_DEPARTAMENTO')
        END as Departamento,
        COUNT(*) as Total_Empresas,
        COUNT(CASE WHEN IdLocalidad IS NULL THEN 1 END) as Sin_Distrito
      FROM EmpresasFinalizadas
      GROUP BY 
        CASE 
          WHEN IdRegion = 20 THEN 'CAPITAL'
          ELSE COALESCE(NombreDepartamento, 'SIN_DEPARTAMENTO')
        END
      ORDER BY Total_Empresas DESC
    `;
    
    const result = await sql.query(query);
    
    console.log('📊 EMPRESAS ÚNICAS POR DEPARTAMENTO:');
    console.log('=' .repeat(80));
    console.log('Departamento'.padEnd(20) + 'Actual'.padEnd(10) + 'Esperado'.padEnd(10) + 'Diferencia'.padEnd(12) + 'Sin Distrito'.padEnd(12) + 'Estado');
    console.log('-'.repeat(80));
    
    let totalActual = 0;
    let totalEsperado = 0;
    let problemas = [];
    let totalSinDistrito = 0;
    
    result.recordset.forEach(row => {
      const departamento = row.Departamento;
      const actual = row.Total_Empresas;
      const esperado = expectedCounts[departamento] || 0;
      const diferencia = actual - esperado;
      const sinDistrito = row.Sin_Distrito || 0;
      
      totalActual += actual;
      totalEsperado += esperado;
      totalSinDistrito += sinDistrito;
      
      let estado = '✅ OK';
      if (diferencia > 0) {
        estado = `⚠️  +${diferencia}`;
        problemas.push(`${departamento}: +${diferencia}`);
      } else if (diferencia < 0) {
        estado = `❌ ${diferencia}`;
        problemas.push(`${departamento}: ${diferencia}`);
      }
      
      console.log(
        departamento.padEnd(20) + 
        actual.toString().padEnd(10) + 
        esperado.toString().padEnd(10) + 
        (diferencia > 0 ? '+' + diferencia : diferencia.toString()).padEnd(12) + 
        sinDistrito.toString().padEnd(12) + 
        estado
      );
    });
    
    console.log('-'.repeat(80));
    console.log(`TOTAL`.padEnd(20) + totalActual.toString().padEnd(10) + totalEsperado.toString().padEnd(10) + (totalActual - totalEsperado).toString().padEnd(12) + totalSinDistrito.toString().padEnd(12));
    
    console.log('\n📋 RESUMEN:');
    if (problemas.length === 0) {
      console.log('✅ Todos los departamentos tienen el conteo esperado');
    } else {
      console.log('⚠️  Problemas encontrados:');
      problemas.forEach(problema => console.log(`   - ${problema}`));
    }
    
    console.log(`\n🔍 Total empresas sin distrito: ${totalSinDistrito}`);
    
    // Verificar específicamente Capital
    const capitalRow = result.recordset.find(row => row.Departamento === 'CAPITAL');
    if (capitalRow) {
      console.log(`\n🏛️  CAPITAL:`);
      console.log(`   Empresas actuales: ${capitalRow.Total_Empresas}`);
      console.log(`   Empresas sin distrito: ${capitalRow.Sin_Distrito}`);
      console.log(`   Empresas después del patch: ${capitalRow.Total_Empresas + capitalRow.Sin_Distrito}`);
      console.log(`   Empresas esperadas: 104`);
      
      if (capitalRow.Total_Empresas + capitalRow.Sin_Distrito === 104) {
        console.log('   ✅ El patch solucionaría el problema de Capital');
      } else {
        console.log(`   ⚠️  Aún habría diferencia de ${(capitalRow.Total_Empresas + capitalRow.Sin_Distrito) - 104} empresas`);
      }
    }
    
    // Verificar empresas perdidas específicamente
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
    
    console.log(`\n💡 Empresas perdidas (IdDepartamento=20/0/NULL y IdLocalidad=NULL): ${perdidos}`);
    
    if (perdidos > 0) {
      console.log('   Estas empresas necesitan IdLocalidad = 244 para aparecer en Capital');
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
  countUniqueEnterprises();
}

module.exports = { countUniqueEnterprises };
