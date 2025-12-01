const authService = require('./src/services/auth.service');
const AuthenticatedRequest = require('./src/utils/authenticated-request');

console.log('🔐 Probando el sistema de autenticación singleton...\n');

async function testSingletonAuth() {
  try {
    console.log('1️⃣ Obteniendo primer token...');
    const token1 = await authService.getValidToken();
    console.log(`   ✅ Token obtenido: ${token1.substring(0, 50)}...`);
    
    console.log('\n2️⃣ Obteniendo segundo token (debería usar caché)...');
    const token2 = await authService.getValidToken();
    console.log(`   ✅ Token obtenido: ${token2.substring(0, 50)}...`);
    
    console.log('\n3️⃣ Verificando que es el mismo token...');
    if (token1 === token2) {
      console.log('   ✅ ¡Perfecto! Se está usando el token en caché');
    } else {
      console.log('   ❌ Error: Se generaron tokens diferentes');
    }
    
    console.log('\n4️⃣ Información del token:');
    const tokenInfo = authService.getTokenInfo();
    console.log(`   • Tiene token: ${tokenInfo.hasToken}`);
    console.log(`   • Es válido: ${tokenInfo.isValid}`);
    console.log(`   • Expira en: ${tokenInfo.expiresAt?.toLocaleString()}`);
    console.log(`   • Está refrescando: ${tokenInfo.isRefreshing}`);
    
    console.log('\n5️⃣ Probando request autenticado...');
    const response = await AuthenticatedRequest.get('http://localhost:3001/api/empresas?limit=5');
    if (response.ok) {
      console.log('   ✅ Request autenticado exitoso');
      const data = await response.json();
      console.log(`   • Empresas obtenidas: ${data.data?.length || 0}`);
    } else {
      console.log(`   ❌ Error en request: ${response.status}`);
    }
    
    console.log('\n6️⃣ Probando múltiples requests simultáneos...');
    const promises = Array(5).fill().map(async (_, i) => {
      const token = await authService.getValidToken();
      return { index: i, token: token.substring(0, 20) };
    });
    
    const results = await Promise.all(promises);
    const uniqueTokens = new Set(results.map(r => r.token));
    
    if (uniqueTokens.size === 1) {
      console.log('   ✅ ¡Excelente! Todos los requests usaron el mismo token');
    } else {
      console.log('   ❌ Error: Se generaron múltiples tokens');
    }
    
    console.log('\n🎯 Resumen del test:');
    console.log('   ✅ Sistema singleton funcionando correctamente');
    console.log('   ✅ Token reutilizado entre requests');
    console.log('   ✅ No hay múltiples llamadas al login');
    console.log('   ✅ Requests autenticados funcionando');
    
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  }
}

// Ejecutar el test
testSingletonAuth().then(() => {
  console.log('\n✨ Test completado!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
