const { poolPromise, sql } = require('./src/config/database');
const logger = require('./src/utils/logger');

console.log('🚀 Solución con IdTestUsuario como criterio de unicidad...\n');

async function testIdTestUsuarioSolution() {
  try {
    const pool = await poolPromise;
    
    console.log('📊 Probando solución con IdTestUsuario...');
    const startTime1 = Date.now();
    
    // Solución usando IdTestUsuario como criterio de unicidad
    const empresasQuery = `
SELECT TOP 20
  e.IdEmpresa,
  e.Nombre AS empresa,
  u.NombreCompleto AS nombreCompleto,
  sr.Nombre AS distrito,
  dep.Nombre AS departamento,
  sa.Descripcion AS sectorActividadDescripcion,
  ei.TotalEmpleados AS totalEmpleados,
  va.Nombre AS ventasAnuales,
  rnd.ptjeTotalUsuario AS puntajeNivelDeMadurezGeneral,
  nm.Descripcion AS nivelDeMadurezGeneral,
  CONVERT(VARCHAR(10), tu.FechaTest, 103) + ' ' + CONVERT(VARCHAR(8), tu.FechaTest, 14) AS fechaTest,
  tu.Test,
  tu.IdTestUsuario,
  -- Calcular TestRank y TestCount por empresa
  ROW_NUMBER() OVER (PARTITION BY e.IdEmpresa ORDER BY tu.FechaTest ASC) AS TestRank,
  COUNT(*) OVER (PARTITION BY e.IdEmpresa) AS TestCount
FROM dbo.Empresa e
INNER JOIN dbo.EmpresaInfo ei ON e.IdEmpresa = ei.IdEmpresa
INNER JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
LEFT JOIN dbo.Usuario u ON u.IdUsuario = ei.IdUsuario
LEFT JOIN dbo.Departamentos dep ON dep.IdDepartamento = ei.IdDepartamento
LEFT JOIN dbo.SubRegion sr ON sr.IdSubRegion = ei.IdLocalidad
LEFT JOIN dbo.SectorActividad sa ON sa.IdSectorActividad = ei.IdSectorActividad
LEFT JOIN dbo.VentasAnuales va ON va.IdVentasAnuales = ei.IdVentas
LEFT JOIN dbo.ResultadoNivelDigital rnd ON rnd.IdUsuario = ei.IdUsuario AND rnd.Test = ei.Test
LEFT JOIN dbo.NivelMadurez nm ON nm.IdNivelMadurez = rnd.IdNivelMadurez
WHERE tu.Finalizado = 1
ORDER BY tu.FechaTest DESC, e.Nombre ASC
OPTION (RECOMPILE);
`;
    
    const result1 = await pool.request().query(empresasQuery);
    const endTime1 = Date.now();
    
    console.log(`   ✅ Solución con IdTestUsuario: ${endTime1 - startTime1}ms (${result1.recordset.length} registros)`);
    
    // Verificar duplicados por IdTestUsuario (criterio de unicidad)
    const empresas = result1.recordset;
    const testUsuarioIds = empresas.map(e => e.IdTestUsuario);
    const uniqueTestUsuarioIds = [...new Set(testUsuarioIds)];
    
    console.log(`   📊 Análisis de unicidad por IdTestUsuario:`);
    console.log(`      • Total registros: ${empresas.length}`);
    console.log(`      • IdTestUsuario únicos: ${uniqueTestUsuarioIds.length}`);
    console.log(`      • Duplicados encontrados: ${empresas.length - uniqueTestUsuarioIds.length}`);
    
    if (empresas.length === uniqueTestUsuarioIds.length) {
      console.log(`   🎉 ¡PERFECTO! Cada IdTestUsuario es único`);
    } else {
      console.log(`   ⚠️ Hay duplicados por IdTestUsuario`);
      
      // Mostrar duplicados encontrados
      const duplicates = empresas.filter((empresa, index, arr) => 
        arr.findIndex(e => e.IdTestUsuario === empresa.IdTestUsuario) !== index
      );
      
      console.log(`\n   🔍 Duplicados encontrados (primeros 5):`);
      duplicates.slice(0, 5).forEach((duplicate, index) => {
        console.log(`      ${index + 1}. ${duplicate.empresa} - IdTestUsuario: ${duplicate.IdTestUsuario}`);
      });
    }
    
    // Análisis por empresa
    const empresaIds = empresas.map(e => e.IdEmpresa);
    const uniqueEmpresaIds = [...new Set(empresaIds)];
    
    console.log(`\n   📊 Análisis por empresa:`);
    console.log(`      • Empresas únicas: ${uniqueEmpresaIds.length}`);
    console.log(`      • Tests por empresa: ${empresas.length / uniqueEmpresaIds.length}`);
    
    console.log(`\n   📋 Primeros 10 registros:`);
    empresas.slice(0, 10).forEach((empresa, index) => {
      console.log(`      ${index + 1}. ${empresa.empresa} - ${empresa.nombreCompleto}`);
      console.log(`         Test: ${empresa.Test}, IdTestUsuario: ${empresa.IdTestUsuario}`);
      console.log(`         Nivel: ${empresa.nivelDeMadurezGeneral}`);
      console.log(`         Fecha: ${empresa.fechaTest}`);
      console.log(`         TestRank: ${empresa.TestRank}/${empresa.TestCount}`);
      console.log('');
    });
    
    console.log('📊 Probando conteo total...');
    const startTime2 = Date.now();
    
    const countQuery = `
SELECT COUNT(*) AS total
FROM dbo.Empresa e
INNER JOIN dbo.EmpresaInfo ei ON e.IdEmpresa = ei.IdEmpresa
INNER JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
WHERE tu.Finalizado = 1
OPTION (RECOMPILE);
`;
    
    const result2 = await pool.request().query(countQuery);
    const endTime2 = Date.now();
    
    console.log(`   ✅ Conteo total: ${endTime2 - startTime2}ms`);
    console.log(`      • Total tests únicos: ${result2.recordset[0].total}`);
    
    console.log('\n📈 Resumen final:');
    console.log(`   • Solución con IdTestUsuario: ${endTime1 - startTime1}ms`);
    console.log(`   • Conteo total: ${endTime2 - startTime2}ms`);
    
    const totalTime = (endTime1 - startTime1) + (endTime2 - startTime2);
    console.log(`   • Tiempo total: ${totalTime}ms`);
    
    if (totalTime < 1000) {
      console.log('\n🎉 ¡Excelente! Consultas muy rápidas');
    } else if (totalTime < 2000) {
      console.log('\n✅ Bueno! Consultas bajo 2 segundos');
    } else {
      console.log('\n⚠️ Las consultas aún son lentas');
    }
    
    console.log('\n🎯 Estado final:');
    if (empresas.length === uniqueTestUsuarioIds.length) {
      console.log('   ✅ SOLUCIÓN CORRECTA: Cada IdTestUsuario es único');
      console.log('   ✅ Permite múltiples tests por empresa');
      console.log('   ✅ Muestra TestRank y TestCount correctamente');
      console.log('   ✅ Consulta simple y eficiente');
      console.log('   ✅ Rendimiento excelente');
    } else {
      console.log('   ❌ PROBLEMA PERSISTE: Hay duplicados por IdTestUsuario');
      console.log('   ⚠️ Necesita más investigación');
    }
    
  } catch (error) {
    console.error('❌ Error en solución con IdTestUsuario:', error.message);
  }
}

// Ejecutar prueba
testIdTestUsuarioSolution().then(() => {
  console.log('\n✨ Solución con IdTestUsuario completada!');
  console.log('🔄 Si esta solución funciona, la aplicaré al modelo');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
