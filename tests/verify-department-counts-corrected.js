const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true
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

async function verifyDepartmentCountsCorrected() {
  try {
    await sql.connect(config);
    console.log('🔍 Verificando conteos de departamentos (versión corregida)...\n');
    
    // Consulta corregida que cuenta empresas únicas por departamento
    const query = `
      WITH EmpresasUnicas AS (
        SELECT DISTINCT
          ei.IdEmpresa,
          CASE 
            WHEN sr.IdRegion = 20 THEN 'CAPITAL'
            ELSE COALESCE(d.Nombre, 'SIN_DEPARTAMENTO')
          END as Departamento,
          CASE 
            WHEN sr.IdRegion = 20 THEN 'Capital'
            WHEN d.Nombre = 'Central' THEN 'CENTRAL'
            WHEN d.Nombre = 'Alto Paraná' THEN 'ALTO PARANÁ'
            WHEN d.Nombre = 'Amambay' THEN 'AMAMBAY'
            WHEN d.Nombre = 'Boquerón' THEN 'BOQUERÓN'
            WHEN d.Nombre = 'Caaguazú' THEN 'CAAGUAZÚ'
            WHEN d.Nombre = 'Concepción' THEN 'CONCEPCIÓN'
            WHEN d.Nombre = 'Cordillera' THEN 'CORDILLERA'
            WHEN d.Nombre = 'Guairá' THEN 'GUAIRÁ'
            WHEN d.Nombre = 'Itapúa' THEN 'ITAPÚA'
            WHEN d.Nombre = 'Misiones' THEN 'MISIONES'
            WHEN d.Nombre = 'Paraguarí' THEN 'PARAGUARÍ'
            WHEN d.Nombre = 'San Pedro' THEN 'SAN PEDRO'
            WHEN d.Nombre = 'Ñeembucú' THEN 'ÑEEMBUCÚ'
            ELSE 'OTRO'
          END as Departamento_Esperado,
          ei.IdLocalidad,
          ei.IdDepartamento
        FROM dbo.EmpresaInfo ei
        INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
        LEFT JOIN dbo.Departamentos d ON ei.IdDepartamento = d.IdDepartamento
        LEFT JOIN dbo.SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
        WHERE tu.Finalizado = 1
      )
      SELECT 
        Departamento_Esperado as Departamento,
        COUNT(*) as Total_Actual,
        COUNT(CASE WHEN IdLocalidad IS NULL THEN 1 END) as Sin_Distrito
      FROM EmpresasUnicas
      GROUP BY Departamento_Esperado
      ORDER BY Total_Actual DESC
    `;
    
    const result = await sql.query(query);
    
    console.log('📊 CONTEOS ACTUALES POR DEPARTAMENTO (EMPRESAS ÚNICAS):');
    console.log('=' .repeat(90));
    console.log('Departamento'.padEnd(20) + 'Actual'.padEnd(10) + 'Esperado'.padEnd(10) + 'Diferencia'.padEnd(12) + 'Sin Distrito'.padEnd(12) + 'Estado');
    console.log('-'.repeat(90));
    
    let totalActual = 0;
    let totalEsperado = 0;
    let problemas = [];
    let sinDistrito = 0;
    
    result.recordset.forEach(row => {
      const departamento = row.Departamento || 'OTRO';
      const actual = row.Total_Actual;
      const esperado = expectedCounts[departamento] || 0;
      const diferencia = actual - esperado;
      const sinDistritoCount = row.Sin_Distrito || 0;
      
      totalActual += actual;
      totalEsperado += esperado;
      sinDistrito += sinDistritoCount;
      
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
        sinDistritoCount.toString().padEnd(12) + 
        estado
      );
    });
    
    console.log('-'.repeat(90));
    console.log(`TOTAL`.padEnd(20) + totalActual.toString().padEnd(10) + totalEsperado.toString().padEnd(10) + (totalActual - totalEsperado).toString().padEnd(12) + sinDistrito.toString().padEnd(12));
    
    console.log('\n📋 RESUMEN:');
    if (problemas.length === 0) {
      console.log('✅ Todos los departamentos tienen el conteo esperado');
    } else {
      console.log('⚠️  Problemas encontrados:');
      problemas.forEach(problema => console.log(`   - ${problema}`));
    }
    
    console.log(`\n🔍 Total empresas sin distrito: ${sinDistrito}`);
    
    if (sinDistrito > 0) {
      console.log('💡 Estas empresas probablemente pertenecen a Capital y necesitan IdLocalidad = 244');
    }
    
    // Verificar específicamente los registros perdidos de Capital
    const capitalPerdidosQuery = `
      SELECT COUNT(DISTINCT ei.IdEmpresa) as perdidos_capital
      FROM dbo.EmpresaInfo ei
      INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      WHERE tu.Finalizado = 1
        AND ei.IdLocalidad IS NULL
        AND (ei.IdDepartamento = 20 OR ei.IdDepartamento = 0 OR ei.IdDepartamento IS NULL)
    `;
    
    const capitalPerdidosResult = await sql.query(capitalPerdidosQuery);
    const perdidosCapital = capitalPerdidosResult.recordset[0].perdidos_capital;
    
    console.log(`\n🏛️  Empresas perdidas de Capital: ${perdidosCapital}`);
    console.log(`🎯 Capital después del patch: ${464 + perdidosCapital} empresas`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verifyDepartmentCountsCorrected();
}

module.exports = { verifyDepartmentCountsCorrected };
