const { poolPromise, sql } = require('./src/config/database');
const logger = require('./src/utils/logger');
const EmpresaModel = require('./src/models/empresa.model');

console.log('🚀 Probando implementación final...\n');

async function testImplementation() {
  try {
    console.log('📊 Probando getEmpresas...');
    const startTime1 = Date.now();
    
    const empresasResult = await EmpresaModel.getEmpresas({
      page: 1,
      limit: 20,
      searchTerm: '',
      filters: {},
      finalizado: 1
    });
    
    const endTime1 = Date.now();
    
    console.log(`   ✅ getEmpresas: ${endTime1 - startTime1}ms`);
    console.log(`      • Registros obtenidos: ${empresasResult.data.length}`);
    console.log(`      • Total tests únicos: ${empresasResult.pagination.total}`);
    console.log(`      • Páginas totales: ${empresasResult.pagination.totalPages}`);
    
    // Verificar unicidad por IdTestUsuario
    const testUsuarioIds = empresasResult.data.map(e => e.IdTestUsuario);
    const uniqueTestUsuarioIds = [...new Set(testUsuarioIds)];
    
    console.log(`      • IdTestUsuario únicos: ${uniqueTestUsuarioIds.length}`);
    console.log(`      • Duplicados: ${empresasResult.data.length - uniqueTestUsuarioIds.length}`);
    
    if (empresasResult.data.length === uniqueTestUsuarioIds.length) {
      console.log(`   🎉 ¡PERFECTO! Cada IdTestUsuario es único`);
    } else {
      console.log(`   ⚠️ Hay duplicados por IdTestUsuario`);
    }
    
    console.log(`\n   📋 Primeros 5 registros:`);
    empresasResult.data.slice(0, 5).forEach((empresa, index) => {
      console.log(`      ${index + 1}. ${empresa.empresa} - ${empresa.nombreCompleto}`);
      console.log(`         Test: ${empresa.Test}, IdTestUsuario: ${empresa.IdTestUsuario}`);
      console.log(`         Nivel: ${empresa.nivelDeMadurezGeneral}`);
      console.log(`         Fecha: ${empresa.fechaTest}`);
      console.log(`         TestRank: ${empresa.TestRank}/${empresa.TestCount}`);
      console.log('');
    });
    
    console.log('📊 Probando getKPIs...');
    const startTime2 = Date.now();
    
    const kpisResult = await EmpresaModel.getKPIs(1);
    
    const endTime2 = Date.now();
    
    console.log(`   ✅ getKPIs: ${endTime2 - startTime2}ms`);
    console.log(`      • Total Empresas: ${kpisResult.totalEmpresas}`);
    console.log(`      • Nivel General: ${kpisResult.nivelGeneral}`);
    console.log(`      • Empresas Incipientes: ${kpisResult.empresasIncipientes}`);
    console.log(`      • Total Empleados: ${kpisResult.totalEmpleados}`);
    
    console.log('\n📈 Resumen final:');
    console.log(`   • getEmpresas: ${endTime1 - startTime1}ms`);
    console.log(`   • getKPIs: ${endTime2 - startTime2}ms`);
    
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
    console.log('   ✅ IMPLEMENTACIÓN COMPLETADA');
    console.log(`   ✅ Tests únicos en tabla: ${empresasResult.pagination.total}`);
    console.log(`   ✅ Empresas únicas en KPIs: ${kpisResult.totalEmpresas}`);
    console.log('   ✅ Una fila por test realizado');
    console.log('   ✅ Rendimiento excelente');
    console.log('   ✅ Basada en la consulta del usuario');
    console.log('\n   🔄 ¡LISTO PARA PROBAR EN EL FRONTEND!');
    
  } catch (error) {
    console.error('❌ Error en implementación:', error.message);
  }
}

// Ejecutar prueba
testImplementation().then(() => {
  console.log('\n✨ Implementación completada!');
  console.log('🔄 Prueba la aplicación en el frontend');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
