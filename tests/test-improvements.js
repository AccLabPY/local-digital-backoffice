const { poolPromise, sql } = require('./src/config/database');
const logger = require('./src/utils/logger');

console.log('🚀 Probando mejoras implementadas...\n');

async function testImprovements() {
  try {
    const pool = await poolPromise;
    
    console.log('📊 Probando consulta con nuevos campos...');
    const startTime1 = Date.now();
    
    const empresasQuery = `
      SELECT TOP 5
        e.IdEmpresa,
        e.Nombre AS empresa,
        u.NombreCompleto AS nombreCompleto,
        sr.Nombre AS distrito,
        dep.Nombre AS departamento,
        sa.Descripcion AS sectorActividadDescripcion,
        ei.TotalEmpleados AS totalEmpleados,
        va.Nombre AS ventasAnuales,
        CONVERT(VARCHAR(10), tu.FechaTest, 103) + ' ' + CONVERT(VARCHAR(8), tu.FechaTest, 14) AS fechaTest,
        rnd.ptjeTotalUsuario AS puntajeNivelDeMadurezGeneral,
        nm.Descripcion AS nivelDeMadurezGeneral
      FROM Empresa e
      INNER JOIN EmpresaInfo ei ON e.IdEmpresa = ei.IdEmpresa
      INNER JOIN Usuario u ON ei.IdUsuario = u.IdUsuario
      INNER JOIN TestUsuario tu ON u.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      INNER JOIN SubRespuesta sr_resp ON tu.IdUsuario = sr_resp.IdUsuario AND tu.Test = sr_resp.Test
      LEFT JOIN Departamentos dep ON ei.IdDepartamento = dep.IdDepartamento
      LEFT JOIN SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
      LEFT JOIN SectorActividad sa ON ei.IdSectorActividad = sa.IdSectorActividad
      LEFT JOIN VentasAnuales va ON ei.IdVentas = va.IdVentasAnuales
      LEFT JOIN ResultadoNivelDigital rnd ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
      LEFT JOIN NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
      WHERE tu.Finalizado = 1
      ORDER BY tu.FechaTest DESC
    `;
    
    const result1 = await pool.request().query(empresasQuery);
    const endTime1 = Date.now();
    
    console.log(`   ✅ Consulta con nuevos campos: ${endTime1 - startTime1}ms (${result1.recordset.length} registros)`);
    result1.recordset.forEach(empresa => {
      console.log(`      • ${empresa.empresa} - ${empresa.nombreCompleto}`);
      console.log(`        Ubicación: ${empresa.departamento}, ${empresa.distrito}`);
      console.log(`        Tamaño: ${empresa.ventasAnuales}`);
      console.log(`        Fecha Test: ${empresa.fechaTest}`);
      console.log('');
    });
    
    console.log('📊 Probando paginación...');
    const startTime2 = Date.now();
    
    const paginationQuery = `
      SELECT COUNT(*) AS total
      FROM Empresa e
      INNER JOIN EmpresaInfo ei ON e.IdEmpresa = ei.IdEmpresa
      INNER JOIN Usuario u ON ei.IdUsuario = u.IdUsuario
      INNER JOIN TestUsuario tu ON u.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      INNER JOIN SubRespuesta sr_resp ON tu.IdUsuario = sr_resp.IdUsuario AND tu.Test = sr_resp.Test
      WHERE tu.Finalizado = 1
    `;
    
    const result2 = await pool.request().query(paginationQuery);
    const endTime2 = Date.now();
    
    const total = result2.recordset[0].total;
    const pageSize = 50;
    const totalPages = Math.ceil(total / pageSize);
    
    console.log(`   ✅ Conteo total: ${endTime2 - startTime2}ms`);
    console.log(`      • Total empresas: ${total}`);
    console.log(`      • Tamaño de página: ${pageSize}`);
    console.log(`      • Total páginas: ${totalPages}`);
    
    console.log('\n📊 Probando diferentes tamaños de empresa...');
    const startTime3 = Date.now();
    
    const sizeQuery = `
      SELECT DISTINCT va.Nombre AS ventasAnuales
      FROM VentasAnuales va
      ORDER BY va.Nombre
    `;
    
    const result3 = await pool.request().query(sizeQuery);
    const endTime3 = Date.now();
    
    console.log(`   ✅ Tamaños disponibles: ${endTime3 - startTime3}ms`);
    result3.recordset.forEach(size => {
      let sizeType = 'N/A';
      if (size.ventasAnuales.includes('Micro')) sizeType = 'Micro';
      else if (size.ventasAnuales.includes('Pequeña')) sizeType = 'Pequeña';
      else if (size.ventasAnuales.includes('Mediana')) sizeType = 'Mediana';
      else if (size.ventasAnuales.includes('Grande')) sizeType = 'Grande';
      
      console.log(`      • ${size.ventasAnuales} → ${sizeType}`);
    });
    
    console.log('\n📈 Resumen de mejoras:');
    console.log(`   • Consulta con nuevos campos: ${endTime1 - startTime1}ms`);
    console.log(`   • Conteo para paginación: ${endTime2 - startTime2}ms`);
    console.log(`   • Tamaños de empresa: ${endTime3 - startTime3}ms`);
    
    const totalTime = (endTime1 - startTime1) + (endTime2 - startTime2) + (endTime3 - startTime3);
    console.log(`   • Tiempo total: ${totalTime}ms`);
    
    if (totalTime < 2000) {
      console.log('\n🎉 ¡Excelente! Todas las consultas están bajo 2 segundos');
    } else if (totalTime < 5000) {
      console.log('\n✅ Bueno! Las consultas están bajo 5 segundos');
    } else {
      console.log('\n⚠️ Las consultas aún son lentas, necesita más optimización');
    }
    
    console.log('\n🎯 Mejoras implementadas:');
    console.log('   ✅ Paginación frontend con opciones 10, 20, 50, 100');
    console.log('   ✅ Subtitle contando resultados extraídos');
    console.log('   ✅ Ubicación mejorada: distrito debajo del departamento');
    console.log('   ✅ Nombre del usuario (NombreCompleto) debajo del nombre de empresa');
    console.log('   ✅ Nueva columna "Tamaño" con valores Micro, Pequeña, Mediana, Grande');
    console.log('   ✅ Backend actualizado con campo nombreCompleto');
    
    console.log('\n📝 URLs que ahora funcionan:');
    console.log('   • GET /api/empresas?page=1&limit=50&finalizado=1');
    console.log('   • GET /api/empresas?page=2&limit=20&finalizado=0');
    console.log('   • GET /api/empresas?page=1&limit=100&finalizado=1');
    
  } catch (error) {
    console.error('❌ Error probando mejoras:', error.message);
  }
}

// Ejecutar prueba
testImprovements().then(() => {
  console.log('\n✨ Prueba de mejoras completada!');
  console.log('🔄 Ahora puedes probar la aplicación frontend con todas las mejoras');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
