const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'FRAN\\MSSQL2022',
  database: process.env.DB_NAME || 'BID_v3',
  user: 'ChequeoApp',
  password: 'AppPassword123!',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: process.env.DB_INSTANCE || 'MSSQL2022'
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

async function getTestUser() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    await sql.connect(config);
    console.log('✅ Conectado exitosamente');

    // Obtener un usuario de prueba
    const result = await sql.query(`
      SELECT TOP 1 IdUsuario, NombreCompleto, Email, Contraseña
      FROM Usuario 
      WHERE Email IS NOT NULL AND Contraseña IS NOT NULL
    `);
    
    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      console.log('\n👤 Usuario de prueba encontrado:');
      console.log('================================');
      console.log(`ID: ${user.IdUsuario}`);
      console.log(`Nombre: ${user.NombreCompleto}`);
      console.log(`Email: ${user.Email}`);
      console.log(`Contraseña: ${user.Contraseña}`);
      
      console.log('\n🔐 Credenciales para probar:');
      console.log(`Email: ${user.Email}`);
      console.log(`Password: ${user.Contraseña}`);
    } else {
      console.log('❌ No se encontraron usuarios válidos');
    }

    await sql.close();
    console.log('\n✅ Conexión cerrada');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

getTestUser();
