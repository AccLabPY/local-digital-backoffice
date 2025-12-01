const { poolPromise, sql } = require('./src/config/database');
const logger = require('./src/utils/logger');

console.log('🔍 Diagnóstico: Investigando la causa de los duplicados...\n');

async function diagnoseDuplicates() {
  try {
    const pool = await poolPromise;
    
    console.log('📊 Investigando TestUsuario...');
    const testUsuarioQuery = `
      SELECT TOP 10
        tu.IdTestUsuario,
        tu.IdUsuario,
        tu.Test,
        tu.FechaTest,
        tu.Finalizado
      FROM dbo.TestUsuario tu
      WHERE tu.Finalizado = 1
      ORDER BY tu.IdUsuario, tu.Test, tu.FechaTest DESC
    `;
    
    const result1 = await pool.request().query(testUsuarioQuery);
    console.log(`   ✅ TestUsuario: ${result1.recordset.length} registros`);
    result1.recordset.forEach((record, index) => {
      console.log(`      ${index + 1}. Usuario: ${record.IdUsuario}, Test: ${record.Test}, Fecha: ${record.FechaTest}`);
    });
    
    console.log('\n📊 Investigando EmpresaInfo...');
    const empresaInfoQuery = `
      SELECT TOP 10
        ei.IdEmpresaInfo,
        ei.IdEmpresa,
        ei.IdUsuario,
        ei.Test,
        ei.TotalEmpleados
      FROM dbo.EmpresaInfo ei
      ORDER BY ei.IdUsuario, ei.Test
    `;
    
    const result2 = await pool.request().query(empresaInfoQuery);
    console.log(`   ✅ EmpresaInfo: ${result2.recordset.length} registros`);
    result2.recordset.forEach((record, index) => {
      console.log(`      ${index + 1}. Empresa: ${record.IdEmpresa}, Usuario: ${record.IdUsuario}, Test: ${record.Test}`);
    });
    
    console.log('\n📊 Investigando combinaciones únicas...');
    const uniqueQuery = `
      SELECT 
        COUNT(*) AS total_combinations,
        COUNT(DISTINCT CONCAT(ei.IdUsuario, '-', ei.Test)) AS unique_user_test,
        COUNT(DISTINCT CONCAT(e.IdEmpresa, '-', ei.Test)) AS unique_empresa_test
      FROM dbo.EmpresaInfo ei
      JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
      JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
      WHERE tu.Finalizado = 1
    `;
    
    const result3 = await pool.request().query(uniqueQuery);
    console.log(`   ✅ Análisis de combinaciones:`);
    console.log(`      • Total combinaciones: ${result3.recordset[0].total_combinations}`);
    console.log(`      • Únicas (Usuario-Test): ${result3.recordset[0].unique_user_test}`);
    console.log(`      • Únicas (Empresa-Test): ${result3.recordset[0].unique_empresa_test}`);
    
    console.log('\n📊 Investigando duplicados específicos...');
    const duplicatesQuery = `
      SELECT 
        ei.IdUsuario,
        ei.Test,
        COUNT(*) AS count_empresa_info,
        COUNT(DISTINCT ei.IdEmpresa) AS unique_empresas
      FROM dbo.EmpresaInfo ei
      JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
      WHERE tu.Finalizado = 1
      GROUP BY ei.IdUsuario, ei.Test
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `;
    
    const result4 = await pool.request().query(duplicatesQuery);
    console.log(`   ✅ Duplicados encontrados: ${result4.recordset.length} combinaciones`);
    result4.recordset.slice(0, 5).forEach((record, index) => {
      console.log(`      ${index + 1}. Usuario: ${record.IdUsuario}, Test: ${record.Test}`);
      console.log(`         EmpresaInfo records: ${record.count_empresa_info}, Empresas únicas: ${record.unique_empresas}`);
    });
    
    console.log('\n📊 Investigando una empresa específica...');
    const specificQuery = `
      SELECT 
        ei.IdEmpresaInfo,
        ei.IdEmpresa,
        ei.IdUsuario,
        ei.Test,
        e.Nombre AS empresa_nombre,
        tu.FechaTest,
        tu.Finalizado
      FROM dbo.EmpresaInfo ei
      JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
      JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
      WHERE tu.Finalizado = 1
        AND ei.IdUsuario = (SELECT TOP 1 IdUsuario FROM dbo.EmpresaInfo WHERE Test = 2 ORDER BY IdEmpresaInfo)
        AND ei.Test = 2
      ORDER BY ei.IdEmpresaInfo
    `;
    
    const result5 = await pool.request().query(specificQuery);
    console.log(`   ✅ Registros específicos: ${result5.recordset.length} registros`);
    result5.recordset.forEach((record, index) => {
      console.log(`      ${index + 1}. ${record.empresa_nombre} - Usuario: ${record.IdUsuario}, Test: ${record.Test}`);
      console.log(`         EmpresaInfo ID: ${record.IdEmpresaInfo}, Empresa ID: ${record.IdEmpresa}`);
      console.log(`         Fecha Test: ${record.FechaTest}, Finalizado: ${record.Finalizado}`);
    });
    
    console.log('\n🎯 Diagnóstico completado!');
    console.log('📝 Conclusiones:');
    if (result4.recordset.length > 0) {
      console.log('   ❌ Hay múltiples registros en EmpresaInfo para la misma combinación (Usuario, Test)');
      console.log('   💡 Solución: Usar GROUP BY en EmpresaInfo también');
    } else {
      console.log('   ✅ No hay duplicados en EmpresaInfo');
      console.log('   💡 El problema está en otra parte');
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error.message);
  }
}

// Ejecutar diagnóstico
diagnoseDuplicates().then(() => {
  console.log('\n✨ Diagnóstico completado!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
