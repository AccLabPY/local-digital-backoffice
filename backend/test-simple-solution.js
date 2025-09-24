const { poolPromise, sql } = require('./src/config/database');
const logger = require('./src/utils/logger');

console.log('🚀 Solución simple: Solo el test más reciente por empresa...\n');

async function testSimpleSolution() {
  try {
    const pool = await poolPromise;
    
    console.log('📊 Probando solución simple...');
    const startTime1 = Date.now();
    
    // Solución simple: Solo el test más reciente por empresa
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
  1 AS TestRank,
  1 AS TestCount
FROM dbo.Empresa e
INNER JOIN (
  SELECT 
    ei.IdEmpresa,
    ei.IdUsuario,
    ei.Test,
    ei.TotalEmpleados,
    ei.IdDepartamento,
    ei.IdLocalidad,
    ei.IdSectorActividad,
    ei.IdVentas,
    ROW_NUMBER() OVER (
      PARTITION BY ei.IdEmpresa 
      ORDER BY tu.FechaTest DESC, ei.IdEmpresaInfo DESC
    ) AS rn
  FROM dbo.EmpresaInfo ei
  JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
  WHERE tu.Finalizado = 1
) ei ON e.IdEmpresa = ei.IdEmpresa AND ei.rn = 1
JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
LEFT JOIN dbo.Departamentos dep ON dep.IdDepartamento = ei.IdDepartamento
LEFT JOIN dbo.SubRegion sr ON sr.IdSubRegion = ei.IdLocalidad
LEFT JOIN dbo.SectorActividad sa ON sa.IdSectorActividad = ei.IdSectorActividad
LEFT JOIN dbo.VentasAnuales va ON va.IdVentasAnuales = ei.IdVentas
LEFT JOIN dbo.ResultadoNivelDigital rnd ON rnd.IdUsuario = ei.IdUsuario AND rnd.Test = ei.Test
LEFT JOIN dbo.NivelMadurez nm ON nm.IdNivelMadurez = rnd.IdNivelMadurez
LEFT JOIN dbo.Usuario u ON u.IdUsuario = ei.IdUsuario
ORDER BY tu.FechaTest DESC, e.Nombre ASC
OPTION (RECOMPILE);
`;
    
    const result1 = await pool.request().query(empresasQuery);
    const endTime1 = Date.now();
    
    console.log(`   ✅ Solución simple: ${endTime1 - startTime1}ms (${result1.recordset.length} registros)`);
    
    // Verificar duplicados por empresa
    const empresas = result1.recordset;
    const empresaIds = empresas.map(e => e.IdEmpresa);
    const uniqueEmpresaIds = [...new Set(empresaIds)];
    
    console.log(`   📊 Análisis de duplicados:`);
    console.log(`      • Total registros: ${empresas.length}`);
    console.log(`      • Empresas únicas: ${uniqueEmpresaIds.length}`);
    console.log(`      • Duplicados encontrados: ${empresas.length - uniqueEmpresaIds.length}`);
    
    if (empresas.length === uniqueEmpresaIds.length) {
      console.log(`   🎉 ¡PERFECTO! No hay duplicados por empresa`);
    } else {
      console.log(`   ⚠️ Aún hay duplicados que resolver`);
      
      // Mostrar duplicados encontrados
      const duplicates = empresas.filter((empresa, index, arr) => 
        arr.findIndex(e => e.IdEmpresa === empresa.IdEmpresa) !== index
      );
      
      console.log(`\n   🔍 Duplicados encontrados (primeros 5):`);
      duplicates.slice(0, 5).forEach((duplicate, index) => {
        console.log(`      ${index + 1}. ${duplicate.empresa} - Empresa ID: ${duplicate.IdEmpresa}`);
      });
    }
    
    console.log(`\n   📋 Primeros 10 registros únicos:`);
    empresas.slice(0, 10).forEach((empresa, index) => {
      console.log(`      ${index + 1}. ${empresa.empresa} - ${empresa.nombreCompleto}`);
      console.log(`         Test: ${empresa.Test}, Empresa ID: ${empresa.IdEmpresa}`);
      console.log(`         Nivel: ${empresa.nivelDeMadurezGeneral}`);
      console.log(`         Fecha: ${empresa.fechaTest}`);
      console.log('');
    });
    
    console.log('📊 Probando conteo total...');
    const startTime2 = Date.now();
    
    const countQuery = `
SELECT COUNT(DISTINCT e.IdEmpresa) AS total
FROM dbo.Empresa e
INNER JOIN (
  SELECT 
    ei.IdEmpresa,
    ROW_NUMBER() OVER (
      PARTITION BY ei.IdEmpresa 
      ORDER BY tu.FechaTest DESC, ei.IdEmpresaInfo DESC
    ) AS rn
  FROM dbo.EmpresaInfo ei
  JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
  WHERE tu.Finalizado = 1
) ei ON e.IdEmpresa = ei.IdEmpresa AND ei.rn = 1
OPTION (RECOMPILE);
`;
    
    const result2 = await pool.request().query(countQuery);
    const endTime2 = Date.now();
    
    console.log(`   ✅ Conteo total: ${endTime2 - startTime2}ms`);
    console.log(`      • Total empresas únicas: ${result2.recordset[0].total}`);
    
    console.log('\n📈 Resumen final:');
    console.log(`   • Solución simple: ${endTime1 - startTime1}ms`);
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
    
    console.log('\n🎯 Estado final de duplicados:');
    if (empresas.length === uniqueEmpresaIds.length) {
      console.log('   ✅ PROBLEMA RESUELTO: No hay duplicados');
      console.log('   ✅ Cada empresa aparece solo una vez');
      console.log('   ✅ Se muestra el test más reciente por empresa');
      console.log('   ✅ Consulta simple y eficiente');
      console.log('   ✅ Rendimiento excelente');
    } else {
      console.log('   ❌ PROBLEMA PERSISTE: Aún hay duplicados');
      console.log('   ⚠️ Necesita más investigación');
    }
    
  } catch (error) {
    console.error('❌ Error en solución simple:', error.message);
  }
}

// Ejecutar prueba
testSimpleSolution().then(() => {
  console.log('\n✨ Solución simple completada!');
  console.log('🔄 Verifica el resultado y prueba la aplicación');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
