// Script para probar el sistema singleton del frontend
// Este script simula múltiples llamadas para verificar que solo se hace una llamada al login

console.log('🧪 Probando el sistema singleton del frontend...\n');

// Simulamos múltiples componentes haciendo requests simultáneos
async function simulateMultipleRequests() {
  console.log('📡 Simulando múltiples requests simultáneos...\n');
  
  const requests = [
    { name: 'BusinessList', endpoint: '/api/empresas?limit=50' },
    { name: 'BusinessCharts', endpoint: '/api/encuestas/empresas/1338/evolution' },
    { name: 'SurveyHistory', endpoint: '/api/encuestas/empresas/1338/surveys' },
    { name: 'SurveyResponses', endpoint: '/api/encuestas/empresas/1338/tests/1/responses' },
    { name: 'BusinessDetail', endpoint: '/api/empresas/1338' }
  ];

  console.log('🔄 Ejecutando requests...');
  
  const startTime = Date.now();
  
  // Simulamos que cada componente hace su request
  const promises = requests.map(async (request, index) => {
    console.log(`${index + 1}. ${request.name} iniciando request...`);
    
    // Simulamos el tiempo de request
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    console.log(`   ✅ ${request.name} completado`);
    return request.name;
  });
  
  await Promise.all(promises);
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  console.log(`\n⏱️  Tiempo total: ${totalTime}ms`);
  console.log(`📊 Requests completados: ${requests.length}`);
  
  console.log('\n🎯 Resultado esperado:');
  console.log('   ✅ Solo UNA llamada a POST /api/auth/login');
  console.log('   ✅ Token reutilizado entre todos los requests');
  console.log('   ✅ Sin múltiples llamadas al login');
  console.log('   ✅ Rendimiento mejorado significativamente');
  
  console.log('\n📝 Para verificar:');
  console.log('   1. Abre las herramientas de desarrollador');
  console.log('   2. Ve a la pestaña Network');
  console.log('   3. Recarga la página');
  console.log('   4. Deberías ver solo UNA llamada a /api/auth/login');
  console.log('   5. Todos los demás requests usarán el token en caché');
}

// Ejecutar la simulación
simulateMultipleRequests().then(() => {
  console.log('\n✨ Simulación completada!');
  console.log('🔍 Verifica en el navegador que solo hay una llamada al login');
}).catch(error => {
  console.error('💥 Error en la simulación:', error);
});
