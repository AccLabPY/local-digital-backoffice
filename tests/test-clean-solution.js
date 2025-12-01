const { poolPromise, sql } = require('./src/config/database');
const logger = require('./src/utils/logger');

console.log('🚀 Solución limpia: Evitando JOINs problemáticos...\n');

async function testCleanSolution() {
  try {
    const pool = await poolPromise;
    
    console.log('📊 Probando solución limpia...');
    const startTime1 = Date.now();
    
    // Solución limpia: Una empresa = Un registro, sin JOINs problemáticos
    const empresasQuery = `
WITH CompanyLatestTest AS (
  SELECT 
    ei.IdEmpresa,
    ei.IdUsuario,
    ei.Test,
    ei.TotalEmpleados,
    ei.IdDepartamento,
    ei.IdLocalidad,
    ei.IdSectorActividad,
    ei.IdVentas,
    tu.FechaTest,
    ROW_NUMBER() OVER (
      PARTITION BY ei.IdEmpresa 
      ORDER BY tu.FechaTest DESC, tu.IdTestUsuario DESC
    ) AS rn
  FROM dbo.EmpresaInfo ei
  JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
  WHERE tu.Finalizado = 1
)
SELECT TOP 20
  e.IdEmpresa,
  e.Nombre AS empresa,
  ISNULL(u.NombreCompleto, 'N/A') AS nombreCompleto,
  ISNULL(sr.Nombre, 'N/A') AS distrito,
  ISNULL(dep.Nombre, 'N/A') AS departamento,
  ISNULL(sa.Descripcion, 'N/A') AS sectorActividadDescripcion,
  ISNULL(clt.TotalEmpleados, 0) AS totalEmpleados,
  ISNULL(va.Nombre, 'N/A') AS ventasAnuales,
  ISNULL(rnd.ptjeTotalUsuario, 0) AS puntajeNivelDeMadurezGeneral,
  ISNULL(nm.Descripcion, 'Sin evaluar') AS nivelDeMadurezGeneral,
  ISNULL(CONVERT(VARCHAR(10), clt.FechaTest, 103) + ' ' + CONVERT(VARCHAR(8), clt.FechaTest, 14), 'N/A') AS fechaTest,
  ISNULL(clt.Test, 0) AS Test,
  1 AS TestRank,
  1 AS TestCount
FROM dbo.Empresa e
INNER JOIN CompanyLatestTest clt ON e.IdEmpresa = clt.IdEmpresa AND clt.rn = 1
LEFT JOIN dbo.Usuario u ON u.IdUsuario = clt.IdUsuario
LEFT JOIN dbo.Departamentos dep ON dep.IdDepartamento = clt.IdDepartamento
LEFT JOIN dbo.SubRegion sr ON sr.IdSubRegion = clt.IdLocalidad
LEFT JOIN dbo.SectorActividad sa ON sa.IdSectorActividad = clt.IdSectorActividad
LEFT JOIN dbo.VentasAnuales va ON va.IdVentasAnuales = clt.IdVentas
OUTER APPLY (
  SELECT TOP 1 rnd.ptjeTotalUsuario, rnd.IdNivelMadurez
  FROM dbo.ResultadoNivelDigital rnd
  WHERE rnd.IdUsuario = clt.IdUsuario AND rnd.Test = clt.Test
  ORDER BY rnd.IdResultadoNivelDigital DESC
) rnd
LEFT JOIN dbo.NivelMadurez nm ON nm.IdNivelMadurez = rnd.IdNivelMadurez
ORDER BY clt.FechaTest DESC, e.Nombre ASC
OPTION (RECOMPILE);
`;
    
    const result1 = await pool.request().query(empresasQuery);
    const endTime1 = Date.now();
    
    console.log(`   ✅ Solución limpia: ${endTime1 - startTime1}ms (${result1.recordset.length} registros)`);
    
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
WITH CompanyLatestTest AS (
  SELECT 
    ei.IdEmpresa,
    ROW_NUMBER() OVER (
      PARTITION BY ei.IdEmpresa 
      ORDER BY tu.FechaTest DESC, tu.IdTestUsuario DESC
    ) AS rn
  FROM dbo.EmpresaInfo ei
  JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
  WHERE tu.Finalizado = 1
)
SELECT COUNT(*) AS total
FROM dbo.Empresa e
INNER JOIN CompanyLatestTest clt ON e.IdEmpresa = clt.IdEmpresa AND clt.rn = 1
OPTION (RECOMPILE);
`;
    
    const result2 = await pool.request().query(countQuery);
    const endTime2 = Date.now();
    
    console.log(`   ✅ Conteo total: ${endTime2 - startTime2}ms`);
    console.log(`      • Total empresas únicas: ${result2.recordset[0].total}`);
    
    console.log('\n📈 Resumen final:');
    console.log(`   • Solución limpia: ${endTime1 - startTime1}ms`);
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
    console.error('❌ Error en solución limpia:', error.message);
  }
}

// Ejecutar prueba
testCleanSolution().then(() => {
  console.log('\n✨ Solución limpia completada!');
  console.log('🔄 Si esta solución funciona, la aplicaré al modelo');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
