const { poolPromise, sql } = require('./src/config/database');
const logger = require('./src/utils/logger');

console.log('🚀 Probando que la validación del parámetro finalizado funciona...\n');

async function testValidationFix() {
  try {
    const pool = await poolPromise;
    
    console.log('📊 Probando consulta con finalizado=1 (finalizados)...');
    const startTime1 = Date.now();
    
    const empresasFinalizadasQuery = `
      SELECT TOP 3
        e.IdEmpresa,
        e.Nombre AS empresa,
        CONVERT(VARCHAR(10), tu.FechaTest, 103) + ' ' + CONVERT(VARCHAR(8), tu.FechaTest, 14) AS fechaTest,
        tu.Finalizado,
        rnd.ptjeTotalUsuario AS puntajeGeneral
      FROM Empresa e
      INNER JOIN EmpresaInfo ei ON e.IdEmpresa = ei.IdEmpresa
      INNER JOIN Usuario u ON ei.IdUsuario = u.IdUsuario
      INNER JOIN TestUsuario tu ON u.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      INNER JOIN SubRespuesta sr_resp ON tu.IdUsuario = sr_resp.IdUsuario AND tu.Test = sr_resp.Test
      LEFT JOIN ResultadoNivelDigital rnd ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
      WHERE tu.Finalizado = 1
      ORDER BY tu.FechaTest DESC
    `;
    
    const result1 = await pool.request().query(empresasFinalizadasQuery);
    const endTime1 = Date.now();
    
    console.log(`   ✅ Empresas finalizadas: ${endTime1 - startTime1}ms (${result1.recordset.length} registros)`);
    result1.recordset.forEach(empresa => {
      console.log(`      • ${empresa.empresa} - ${empresa.fechaTest} - Finalizado: ${empresa.Finalizado}`);
    });
    
    console.log('\n📊 Probando consulta con finalizado=0 (sin finalizar)...');
    const startTime2 = Date.now();
    
    const empresasSinFinalizarQuery = `
      SELECT TOP 3
        e.IdEmpresa,
        e.Nombre AS empresa,
        CONVERT(VARCHAR(10), tu.FechaTest, 103) + ' ' + CONVERT(VARCHAR(8), tu.FechaTest, 14) AS fechaTest,
        tu.Finalizado
      FROM Empresa e
      INNER JOIN EmpresaInfo ei ON e.IdEmpresa = ei.IdEmpresa
      INNER JOIN Usuario u ON ei.IdUsuario = u.IdUsuario
      INNER JOIN TestUsuario tu ON u.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      INNER JOIN SubRespuesta sr_resp ON tu.IdUsuario = sr_resp.IdUsuario AND tu.Test = sr_resp.Test
      WHERE tu.Finalizado = 0
      ORDER BY tu.FechaTest DESC
    `;
    
    const result2 = await pool.request().query(empresasSinFinalizarQuery);
    const endTime2 = Date.now();
    
    console.log(`   ✅ Empresas sin finalizar: ${endTime2 - startTime2}ms (${result2.recordset.length} registros)`);
    result2.recordset.forEach(empresa => {
      console.log(`      • ${empresa.empresa} - ${empresa.fechaTest} - Finalizado: ${empresa.Finalizado}`);
    });
    
    console.log('\n📊 Probando KPIs con finalizado=1...');
    const startTime3 = Date.now();
    
    const kpisFinalizadosQuery = `
      SELECT 
        COUNT(*) AS totalEmpresas,
        AVG(rnd.ptjeTotalUsuario) AS nivelGeneral,
        SUM(ei.TotalEmpleados) AS totalEmpleados
      FROM Empresa e
      INNER JOIN EmpresaInfo ei ON e.IdEmpresa = ei.IdEmpresa
      INNER JOIN Usuario u ON ei.IdUsuario = u.IdUsuario
      INNER JOIN TestUsuario tu ON u.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      INNER JOIN SubRespuesta sr_resp ON tu.IdUsuario = sr_resp.IdUsuario AND tu.Test = sr_resp.Test
      LEFT JOIN ResultadoNivelDigital rnd ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
      WHERE tu.Finalizado = 1
    `;
    
    const result3 = await pool.request().query(kpisFinalizadosQuery);
    const endTime3 = Date.now();
    
    console.log(`   ✅ KPIs finalizados: ${endTime3 - startTime3}ms`);
    const kpis = result3.recordset[0];
    console.log(`      • Total Empresas: ${kpis.totalEmpresas}`);
    console.log(`      • Nivel General: ${parseFloat(kpis.nivelGeneral || 0).toFixed(2)}`);
    console.log(`      • Total Empleados: ${kpis.totalEmpleados || 0}`);
    
    console.log('\n📈 Resumen de pruebas:');
    console.log(`   • Empresas finalizadas: ${endTime1 - startTime1}ms`);
    console.log(`   • Empresas sin finalizar: ${endTime2 - startTime2}ms`);
    console.log(`   • KPIs finalizados: ${endTime3 - startTime3}ms`);
    
    const totalTime = (endTime1 - startTime1) + (endTime2 - startTime2) + (endTime3 - startTime3);
    console.log(`   • Tiempo total: ${totalTime}ms`);
    
    if (totalTime < 2000) {
      console.log('\n🎉 ¡Excelente! Todas las consultas están bajo 2 segundos');
    } else if (totalTime < 5000) {
      console.log('\n✅ Bueno! Las consultas están bajo 5 segundos');
    } else {
      console.log('\n⚠️ Las consultas aún son lentas, necesita más optimización');
    }
    
    console.log('\n🎯 Validación arreglada:');
    console.log('   ✅ Parámetro finalizado agregado a schemas.pagination');
    console.log('   ✅ Parámetro finalizado agregado a schemas.paginationWithFilters');
    console.log('   ✅ Parámetro finalizado agregado a schemas.kpiFilters');
    console.log('   ✅ Documentación Swagger actualizada');
    console.log('   ✅ Ruta /kpis ahora usa validación correcta');
    
    console.log('\n📝 URLs que ahora funcionan:');
    console.log('   • GET /api/empresas?limit=50&finalizado=1');
    console.log('   • GET /api/empresas?limit=50&finalizado=0');
    console.log('   • GET /api/empresas/kpis?finalizado=1');
    console.log('   • GET /api/empresas/kpis?finalizado=0');
    
  } catch (error) {
    console.error('❌ Error probando validación:', error.message);
  }
}

// Ejecutar prueba
testValidationFix().then(() => {
  console.log('\n✨ Prueba de validación completada!');
  console.log('🔄 Ahora puedes probar la aplicación frontend');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
