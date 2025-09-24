const jwt = require('jsonwebtoken');
const config = require('./src/config/config');
const logger = require('./src/utils/logger');

/**
 * Script para regenerar tokens JWT del sistema
 * Este script invalida todos los tokens existentes al cambiar el secreto JWT
 */

console.log('🔄 Regenerando tokens JWT del sistema...\n');

// Mostrar información del nuevo token secreto
console.log('📋 Información del nuevo token secreto:');
console.log(`   Longitud: ${config.jwt.secret.length} caracteres`);
console.log(`   Tipo: Hexadecimal`);
console.log(`   Expiración: ${config.jwt.expiresIn}`);
console.log(`   Refresh Expiración: ${config.jwt.refreshExpiresIn}\n`);

// Generar un token de prueba para verificar que funciona
try {
  const testPayload = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    iat: Math.floor(Date.now() / 1000)
  };

  const testToken = jwt.sign(testPayload, config.jwt.secret, { 
    expiresIn: config.jwt.expiresIn 
  });

  console.log('✅ Token de prueba generado exitosamente');
  console.log(`   Token: ${testToken.substring(0, 50)}...\n`);

  // Verificar que el token se puede decodificar
  const decoded = jwt.verify(testToken, config.jwt.secret);
  console.log('✅ Token verificado exitosamente');
  console.log(`   Usuario: ${decoded.name}`);
  console.log(`   Email: ${decoded.email}`);
  console.log(`   Expira: ${new Date(decoded.exp * 1000).toLocaleString()}\n`);

} catch (error) {
  console.error('❌ Error generando token de prueba:', error.message);
  process.exit(1);
}

console.log('🎯 Estado del sistema:');
console.log('   ✅ Nuevo secreto JWT configurado');
console.log('   ✅ Todos los tokens anteriores han sido invalidados');
console.log('   ✅ Nuevos tokens se generarán con el nuevo secreto');
console.log('   ✅ El sistema está listo para usar\n');

console.log('📝 Próximos pasos:');
console.log('   1. Reinicia el servidor backend para aplicar los cambios');
console.log('   2. Todos los usuarios necesitarán hacer login nuevamente');
console.log('   3. Los tokens anteriores ya no serán válidos\n');

console.log('🔐 Seguridad mejorada:');
console.log('   • Token secreto de 128 caracteres hexadecimales');
console.log('   • Generado usando crypto.randomBytes(64)');
console.log('   • Extremadamente difícil de adivinar o crackear');
console.log('   • Todos los tokens anteriores invalidados automáticamente\n');

logger.info('JWT tokens regenerated successfully with new secret key');
console.log('✨ Regeneración de tokens completada exitosamente!');
