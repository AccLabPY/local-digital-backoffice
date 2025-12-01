const { poolPromise, sql } = require('./src/config/database');
const logger = require('./src/utils/logger');

console.log('🔍 Investigación profunda: EmpresaInfo duplicados...\n');

async function investigateEmpresaInfo() {
  try {
    const pool = await poolPromise;
    
    console.log('📊 Investigando EmpresaInfo para Autoiacai...');
    const empresaInfoQuery = `
      SELECT 
        ei.IdEmpresaInfo,
        ei.IdEmpresa,
        ei.IdUsuario,
        ei.Test,
        e.Nombre AS empresa_nombre,
        u.NombreCompleto AS usuario_nombre
      FROM dbo.EmpresaInfo ei
      JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
      JOIN dbo.Usuario u ON u.IdUsuario = ei.IdUsuario
      WHERE e.Nombre = 'Autoiacai'
      ORDER BY ei.IdEmpresaInfo
    `;
    
    const result1 = await pool.request().query(empresaInfoQuery);
    console.log(`   ✅ EmpresaInfo para Autoiacai: ${result1.recordset.length} registros`);
    result1.recordset.forEach((record, index) => {
      console.log(`      ${index + 1}. ID: ${record.IdEmpresaInfo}, Empresa: ${record.IdEmpresa}, Usuario: ${record.IdUsuario}, Test: ${record.Test}`);
      console.log(`         Empresa: ${record.empresa_nombre}, Usuario: ${record.usuario_nombre}`);
    });
    
    console.log('\n📊 Investigando TestUsuario para el usuario de Autoiacai...');
    const testUsuarioQuery = `
      SELECT 
        tu.IdTestUsuario,
        tu.IdUsuario,
        tu.Test,
        tu.FechaTest,
        tu.Finalizado
      FROM dbo.TestUsuario tu
      WHERE tu.IdUsuario = (SELECT TOP 1 IdUsuario FROM dbo.EmpresaInfo ei JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa WHERE e.Nombre = 'Autoiacai')
      ORDER BY tu.Test, tu.FechaTest DESC
    `;
    
    const result2 = await pool.request().query(testUsuarioQuery);
    console.log(`   ✅ TestUsuario para usuario de Autoiacai: ${result2.recordset.length} registros`);
    result2.recordset.forEach((record, index) => {
      console.log(`      ${index + 1}. ID: ${record.IdTestUsuario}, Usuario: ${record.IdUsuario}, Test: ${record.Test}`);
      console.log(`         Fecha: ${record.FechaTest}, Finalizado: ${record.Finalizado}`);
    });
    
    console.log('\n📊 Investigando si hay múltiples EmpresaInfo para la misma empresa...');
    const duplicatesQuery = `
      SELECT 
        ei.IdEmpresa,
        e.Nombre AS empresa_nombre,
        COUNT(*) AS count_empresa_info,
        COUNT(DISTINCT ei.IdUsuario) AS unique_usuarios,
        COUNT(DISTINCT ei.Test) AS unique_tests
      FROM dbo.EmpresaInfo ei
      JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
      GROUP BY ei.IdEmpresa, e.Nombre
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `;
    
    const result3 = await pool.request().query(duplicatesQuery);
    console.log(`   ✅ Empresas con múltiples EmpresaInfo: ${result3.recordset.length} empresas`);
    result3.recordset.slice(0, 5).forEach((record, index) => {
      console.log(`      ${index + 1}. ${record.empresa_nombre} (ID: ${record.IdEmpresa})`);
      console.log(`         EmpresaInfo records: ${record.count_empresa_info}`);
      console.log(`         Usuarios únicos: ${record.unique_usuarios}`);
      console.log(`         Tests únicos: ${record.unique_tests}`);
    });
    
    console.log('\n📊 Investigando la consulta completa para Autoiacai...');
    const fullQuery = `
      SELECT 
        ei.IdEmpresaInfo,
        ei.IdEmpresa,
        ei.IdUsuario,
        ei.Test,
        e.Nombre AS empresa_nombre,
        u.NombreCompleto AS usuario_nombre,
        tu.FechaTest,
        tu.Finalizado
      FROM dbo.EmpresaInfo ei
      JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
      JOIN dbo.Usuario u ON u.IdUsuario = ei.IdUsuario
      JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
      WHERE e.Nombre = 'Autoiacai' AND tu.Finalizado = 1
      ORDER BY ei.IdEmpresaInfo
    `;
    
    const result4 = await pool.request().query(fullQuery);
    console.log(`   ✅ Consulta completa para Autoiacai: ${result4.recordset.length} registros`);
    result4.recordset.forEach((record, index) => {
      console.log(`      ${index + 1}. EmpresaInfo ID: ${record.IdEmpresaInfo}, Empresa: ${record.IdEmpresa}`);
      console.log(`         Usuario: ${record.IdUsuario} (${record.usuario_nombre}), Test: ${record.Test}`);
      console.log(`         Fecha: ${record.FechaTest}, Finalizado: ${record.Finalizado}`);
    });
    
    console.log('\n🎯 Investigación completada!');
    console.log('📝 Conclusiones:');
    if (result3.recordset.length > 0) {
      console.log('   ❌ Hay múltiples registros en EmpresaInfo para la misma empresa');
      console.log('   💡 Esto explica los duplicados');
    } else {
      console.log('   ✅ No hay múltiples EmpresaInfo por empresa');
      console.log('   💡 El problema está en otra parte');
    }
    
  } catch (error) {
    console.error('❌ Error en investigación:', error.message);
  }
}

// Ejecutar investigación
investigateEmpresaInfo().then(() => {
  console.log('\n✨ Investigación completada!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
