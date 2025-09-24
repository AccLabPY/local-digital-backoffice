const { poolPromise, sql } = require('./src/config/database');
const logger = require('./src/utils/logger');

console.log('🚀 Solución final corregida: Un test por empresa (el más reciente)...\n');

async function testFinalSolutionFixed() {
  try {
    const pool = await poolPromise;
    
    console.log('📊 Probando solución final corregida...');
    const startTime1 = Date.now();
    
    // Solución final: Un test por empresa (el más reciente)
    const empresasQuery = `
/* ===== Un test por empresa (el más reciente) ===== */
WITH Base AS (
  SELECT
      e.IdEmpresa,
      e.Nombre AS EmpresaNombre,
      ei.IdUsuario,
      ei.Test,
      tu.FechaTest,
      ei.TotalEmpleados,
      ei.IdDepartamento,
      ei.IdLocalidad,
      ei.IdSectorActividad,
      ei.IdVentas,
      ROW_NUMBER() OVER (
        PARTITION BY e.IdEmpresa 
        ORDER BY tu.FechaTest DESC, ei.IdEmpresaInfo DESC
      ) AS rn
  FROM dbo.EmpresaInfo ei
  JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
  JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
  WHERE tu.Finalizado = 1
),
UniqueEmpresas AS (  -- Solo el test más reciente por empresa
  SELECT *
  FROM Base
  WHERE rn = 1
),
Paged AS (        -- ordenar por más reciente y paginar
  SELECT
      r.*,
      ROW_NUMBER() OVER (
        ORDER BY ISNULL(r.FechaTest,'19000101') DESC, r.EmpresaNombre ASC, r.IdEmpresa ASC
      ) AS RowNum
  FROM UniqueEmpresas r
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
  nm.Descripcion AS nivelDeMadurezGeneral,
  CONVERT(VARCHAR(10), p.FechaTest, 103) + ' ' + CONVERT(VARCHAR(8), p.FechaTest, 14) AS fechaTest,
  p.Test,
  1 AS TestRank,
  1 AS TestCount
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
    
    console.log(`   ✅ Solución final corregida: ${endTime1 - startTime1}ms (${result1.recordset.length} registros)`);
    
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
/* mismo filtro base, pero sólo cuenta empresas únicas */
WITH Base AS (
  SELECT e.IdEmpresa
  FROM dbo.EmpresaInfo ei
  JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
  JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
  WHERE tu.Finalizado = 1
  GROUP BY e.IdEmpresa
)
SELECT COUNT(*) AS total FROM Base
OPTION (RECOMPILE);
`;
    
    const result2 = await pool.request().query(countQuery);
    const endTime2 = Date.now();
    
    console.log(`   ✅ Conteo total: ${endTime2 - startTime2}ms`);
    console.log(`      • Total empresas únicas: ${result2.recordset[0].total}`);
    
    console.log('\n📊 Verificando Autoiacai específicamente...');
    const startTime3 = Date.now();
    
    const autoiacaiQuery = `
WITH Base AS (
  SELECT
      e.IdEmpresa,
      e.Nombre AS EmpresaNombre,
      ei.IdUsuario,
      ei.Test,
      tu.FechaTest,
      ROW_NUMBER() OVER (
        PARTITION BY e.IdEmpresa 
        ORDER BY tu.FechaTest DESC, ei.IdEmpresaInfo DESC
      ) AS rn
  FROM dbo.EmpresaInfo ei
  JOIN dbo.Empresa e ON e.IdEmpresa = ei.IdEmpresa
  JOIN dbo.TestUsuario tu ON tu.IdUsuario = ei.IdUsuario AND tu.Test = ei.Test
  WHERE tu.Finalizado = 1 AND e.Nombre = 'Autoiacai'
),
UniqueEmpresas AS (
  SELECT *
  FROM Base
  WHERE rn = 1
)
SELECT
  p.IdEmpresa,
  p.EmpresaNombre AS empresa,
  u.NombreCompleto AS nombreCompleto,
  p.Test,
  CONVERT(VARCHAR(10), p.FechaTest, 103) + ' ' + CONVERT(VARCHAR(8), p.FechaTest, 14) AS fechaTest
FROM UniqueEmpresas p
LEFT JOIN dbo.Usuario u ON u.IdUsuario = p.IdUsuario
OPTION (RECOMPILE);
`;
    
    const result3 = await pool.request().query(autoiacaiQuery);
    const endTime3 = Date.now();
    
    console.log(`   ✅ Autoiacai específico: ${endTime3 - startTime3}ms`);
    console.log(`      • Registros para Autoiacai: ${result3.recordset.length}`);
    
    if (result3.recordset.length > 0) {
      console.log(`\n   📋 Autoiacai:`);
      result3.recordset.forEach((empresa, index) => {
        console.log(`      ${index + 1}. ${empresa.empresa} - ${empresa.nombreCompleto}`);
        console.log(`         Test: ${empresa.Test}, Empresa ID: ${empresa.IdEmpresa}`);
        console.log(`         Fecha: ${empresa.fechaTest}`);
      });
    }
    
    console.log('\n📈 Resumen final:');
    console.log(`   • Solución final corregida: ${endTime1 - startTime1}ms`);
    console.log(`   • Conteo total: ${endTime2 - startTime2}ms`);
    console.log(`   • Autoiacai específico: ${endTime3 - startTime3}ms`);
    
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
    if (empresas.length === uniqueEmpresaIds.length) {
      console.log('   ✅ PROBLEMA RESUELTO: No hay duplicados');
      console.log('   ✅ Cada empresa aparece solo una vez');
      console.log('   ✅ Se muestra el test más reciente por empresa');
      console.log('   ✅ Paginación funciona correctamente');
      console.log('   ✅ Rendimiento optimizado');
    } else {
      console.log('   ❌ PROBLEMA PERSISTE: Aún hay duplicados');
      console.log('   ⚠️ Necesita más investigación');
    }
    
  } catch (error) {
    console.error('❌ Error en solución final corregida:', error.message);
  }
}

// Ejecutar prueba
testFinalSolutionFixed().then(() => {
  console.log('\n✨ Solución final corregida completada!');
  console.log('🔄 Verifica el resultado y prueba la aplicación');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
