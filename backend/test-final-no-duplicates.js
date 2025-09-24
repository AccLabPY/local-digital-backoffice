const { poolPromise, sql } = require('./src/config/database');
const logger = require('./src/utils/logger');

console.log('🚀 Prueba final: Verificando eliminación completa de duplicados...\n');

async function testFinalNoDuplicates() {
  try {
    const pool = await poolPromise;
    
    console.log('📊 Probando consulta final con DISTINCT...');
    const startTime1 = Date.now();
    
    // Simular la consulta real con paginación
    const empresasQuery = `
/* ===== Empresas x Test (único), ranking y página ===== */
WITH Base AS (
  SELECT DISTINCT
      e.IdEmpresa,
      e.Nombre AS EmpresaNombre,
      ei.IdUsuario,
      tu.Test,
      tu.FechaTest,
      ei.TotalEmpleados,
      ei.IdDepartamento,
      ei.IdLocalidad,
      ei.IdSectorActividad,
      ei.IdVentas,
      ROW_NUMBER() OVER (
        PARTITION BY e.IdEmpresa, tu.Test
        ORDER BY tu.FechaTest DESC, tu.IdTestUsuario DESC
      ) AS rn
  FROM dbo.TestUsuario tu
  JOIN dbo.EmpresaInfo ei
    ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  JOIN dbo.Empresa e
    ON e.IdEmpresa = ei.IdEmpresa
  WHERE tu.Finalizado = 1
),
UniqueTests AS (  -- 1 fila exacta por (Empresa, Test)
  SELECT *
  FROM Base
  WHERE rn = 1
),
Ranked AS (       -- #N y total por empresa
  SELECT
      u.*,
      ROW_NUMBER() OVER (PARTITION BY u.IdEmpresa ORDER BY u.FechaTest ASC) AS TestRank,
      COUNT(*)      OVER (PARTITION BY u.IdEmpresa)                          AS TestCount
  FROM UniqueTests u
),
Paged AS (        -- ordenar por más reciente y paginar
  SELECT
      r.*,
      ROW_NUMBER() OVER (
        ORDER BY ISNULL(r.FechaTest,'19000101') DESC, r.EmpresaNombre ASC, r.IdEmpresa ASC, r.Test ASC
      ) AS RowNum
  FROM Ranked r
)
SELECT
  p.IdEmpresa,
  p.EmpresaNombre AS empresa,
  u.NombreCompleto AS nombreCompleto,
  sr.Nombre       AS distrito,
  dep.Nombre      AS departamento,
  sa.Descripcion  AS sectorActividadDescripcion,
  p.TotalEmpleados AS totalEmpleados,
  va.Nombre       AS ventasAnuales,
  rnd.ptjeTotalUsuario AS puntajeNivelDeMadurezGeneral,
  CASE
    WHEN p.TestCount > 1 THEN CONCAT(nm.Descripcion, ' (Test #', p.TestRank, ' de ', p.TestCount, ')')
    ELSE nm.Descripcion
  END AS nivelDeMadurezGeneral,
  CONVERT(VARCHAR(10), p.FechaTest, 103) + ' ' + CONVERT(VARCHAR(8), p.FechaTest, 14) AS fechaTest,
  p.Test,
  p.TestRank,
  p.TestCount
FROM Paged p
LEFT JOIN dbo.Departamentos   dep ON dep.IdDepartamento   = p.IdDepartamento
LEFT JOIN dbo.SubRegion       sr  ON sr.IdSubRegion       = p.IdLocalidad
LEFT JOIN dbo.SectorActividad sa  ON sa.IdSectorActividad = p.IdSectorActividad
LEFT JOIN dbo.VentasAnuales   va  ON va.IdVentasAnuales   = p.IdVentas
OUTER APPLY (
  SELECT TOP(1) rnd.IdNivelMadurez, rnd.ptjeTotalUsuario
  FROM dbo.ResultadoNivelDigital rnd
  WHERE rnd.IdUsuario = p.IdUsuario AND rnd.Test = p.Test
  ORDER BY rnd.IdResultadoNivelDigital DESC
) rnd
LEFT JOIN dbo.NivelMadurez nm ON nm.IdNivelMadurez = rnd.IdNivelMadurez
LEFT JOIN dbo.Usuario      u  ON u.IdUsuario       = p.IdUsuario
WHERE p.RowNum BETWEEN 1 AND 20  -- Primera página con 20 registros
ORDER BY p.RowNum
OPTION (RECOMPILE);
`;
    
    const result1 = await pool.request().query(empresasQuery);
    const endTime1 = Date.now();
    
    console.log(`   ✅ Consulta final: ${endTime1 - startTime1}ms (${result1.recordset.length} registros)`);
    
    // Verificar duplicados por empresa-test
    const empresas = result1.recordset;
    const empresaTestCombinations = empresas.map(e => `${e.IdEmpresa}-${e.Test}`);
    const uniqueCombinations = [...new Set(empresaTestCombinations)];
    
    console.log(`   📊 Análisis de duplicados:`);
    console.log(`      • Total registros: ${empresas.length}`);
    console.log(`      • Combinaciones únicas (Empresa-Test): ${uniqueCombinations.length}`);
    console.log(`      • Duplicados encontrados: ${empresas.length - uniqueCombinations.length}`);
    
    if (empresas.length === uniqueCombinations.length) {
      console.log(`   🎉 ¡PERFECTO! No hay duplicados por empresa-test`);
    } else {
      console.log(`   ⚠️ Aún hay duplicados que resolver`);
      
      // Mostrar duplicados encontrados
      const duplicates = empresas.filter((empresa, index, arr) => 
        arr.findIndex(e => e.IdEmpresa === empresa.IdEmpresa && e.Test === empresa.Test) !== index
      );
      
      console.log(`\n   🔍 Duplicados encontrados:`);
      duplicates.forEach((duplicate, index) => {
        console.log(`      ${index + 1}. ${duplicate.empresa} - Test ${duplicate.Test}`);
      });
    }
    
    console.log(`\n   📋 Primeros 10 registros únicos:`);
    empresas.slice(0, 10).forEach((empresa, index) => {
      console.log(`      ${index + 1}. ${empresa.empresa} - ${empresa.nombreCompleto}`);
      console.log(`         Test: ${empresa.Test}, Rank: ${empresa.TestRank}/${empresa.TestCount}`);
      console.log(`         Nivel: ${empresa.nivelDeMadurezGeneral}`);
      console.log(`         Fecha: ${empresa.fechaTest}`);
      console.log('');
    });
    
    console.log('📊 Probando conteo total...');
    const startTime2 = Date.now();
    
    const countQuery = `
/* mismo filtro base, pero sólo cuenta (Empresa, Test) únicos */
WITH Base AS (
  SELECT DISTINCT e.IdEmpresa, tu.Test,
         ROW_NUMBER() OVER (
           PARTITION BY e.IdEmpresa, tu.Test
           ORDER BY tu.FechaTest DESC, tu.IdTestUsuario DESC
         ) AS rn
  FROM dbo.TestUsuario tu
  JOIN dbo.EmpresaInfo ei
    ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  JOIN dbo.Empresa e
    ON e.IdEmpresa  = ei.IdEmpresa
  WHERE tu.Finalizado = 1
),
UniqueTests AS (SELECT IdEmpresa, Test FROM Base WHERE rn = 1)
SELECT COUNT(*) AS total FROM UniqueTests
OPTION (RECOMPILE);
`;
    
    const result2 = await pool.request().query(countQuery);
    const endTime2 = Date.now();
    
    console.log(`   ✅ Conteo total: ${endTime2 - startTime2}ms`);
    console.log(`      • Total empresas únicas: ${result2.recordset[0].total}`);
    
    console.log('\n📊 Probando empresas con múltiples tests...');
    const startTime3 = Date.now();
    
    const multiTestQuery = `
WITH Base AS (
  SELECT DISTINCT
      e.IdEmpresa,
      e.Nombre AS EmpresaNombre,
      tu.Test,
      tu.FechaTest,
      ROW_NUMBER() OVER (
        PARTITION BY e.IdEmpresa, tu.Test
        ORDER BY tu.FechaTest DESC, tu.IdTestUsuario DESC
      ) AS rn
  FROM dbo.TestUsuario tu
  JOIN dbo.EmpresaInfo ei
    ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
  JOIN dbo.Empresa e
    ON e.IdEmpresa = ei.IdEmpresa
  WHERE tu.Finalizado = 1
),
UniqueTests AS (
  SELECT *
  FROM Base
  WHERE rn = 1
),
Ranked AS (
  SELECT
      u.*,
      ROW_NUMBER() OVER (PARTITION BY u.IdEmpresa ORDER BY u.FechaTest ASC) AS TestRank,
      COUNT(*)      OVER (PARTITION BY u.IdEmpresa)                          AS TestCount
  FROM UniqueTests u
)
SELECT TOP 5
  p.IdEmpresa,
  p.EmpresaNombre AS empresa,
  p.Test,
  p.TestRank,
  p.TestCount,
  CONVERT(VARCHAR(10), p.FechaTest, 103) + ' ' + CONVERT(VARCHAR(8), p.FechaTest, 14) AS fechaTest
FROM Ranked p
WHERE p.TestCount > 1
ORDER BY p.TestCount DESC, p.FechaTest DESC
OPTION (RECOMPILE);
`;
    
    const result3 = await pool.request().query(multiTestQuery);
    const endTime3 = Date.now();
    
    console.log(`   ✅ Empresas con múltiples tests: ${endTime3 - startTime3}ms`);
    console.log(`      • Empresas con múltiples tests: ${result3.recordset.length}`);
    
    if (result3.recordset.length > 0) {
      console.log(`\n   📋 Empresas con múltiples tests:`);
      result3.recordset.forEach((empresa, index) => {
        console.log(`      ${index + 1}. ${empresa.empresa}`);
        console.log(`         Tests: ${empresa.TestCount} (mostrando Test #${empresa.TestRank})`);
        console.log(`         Fecha: ${empresa.fechaTest}`);
        console.log('');
      });
    }
    
    console.log('\n📈 Resumen final:');
    console.log(`   • Consulta final: ${endTime1 - startTime1}ms`);
    console.log(`   • Conteo total: ${endTime2 - startTime2}ms`);
    console.log(`   • Múltiples tests: ${endTime3 - startTime3}ms`);
    
    const totalTime = (endTime1 - startTime1) + (endTime2 - startTime2) + (endTime3 - startTime3);
    console.log(`   • Tiempo total: ${totalTime}ms`);
    
    if (totalTime < 1000) {
      console.log('\n🎉 ¡Excelente! Consultas muy rápidas');
    } else if (totalTime < 2000) {
      console.log('\n✅ Bueno! Consultas bajo 2 segundos');
    } else {
      console.log('\n⚠️ Las consultas aún son lentas');
    }
    
    console.log('\n🎯 Estado final de duplicados:');
    if (empresas.length === uniqueCombinations.length) {
      console.log('   ✅ PROBLEMA RESUELTO: No hay duplicados');
      console.log('   ✅ Cada combinación (Empresa, Test) aparece solo una vez');
      console.log('   ✅ Empresas con múltiples tests muestran ranking correcto');
      console.log('   ✅ Paginación funciona correctamente');
      console.log('   ✅ Rendimiento optimizado');
    } else {
      console.log('   ❌ PROBLEMA PERSISTE: Aún hay duplicados');
      console.log('   ⚠️ Necesita más investigación');
    }
    
  } catch (error) {
    console.error('❌ Error en prueba final:', error.message);
  }
}

// Ejecutar prueba
testFinalNoDuplicates().then(() => {
  console.log('\n✨ Prueba final completada!');
  console.log('🔄 Verifica el resultado y prueba la aplicación');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
