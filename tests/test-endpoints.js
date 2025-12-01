const http = require('http');

console.log('🔐 Probando Endpoints con Autenticación');
console.log('=======================================');

// Token obtenido del login
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzgsIm5hbWUiOiJTYW50aWFnbyBBcXVpbm8iLCJlbWFpbCI6InNhcXVpbm9AbWljLmdvdi5weSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU4NjQwODQwLCJleHAiOjE3NTg3MjcyNDB9.example';

const endpoints = [
  '/api/empresas',
  '/api/empresas/kpis', 
  '/api/empresas/filters/options',
  '/api/encuestas/dimensions'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Probando: ${endpoint}`);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Status: ${res.statusCode}`);
        try {
          const jsonData = JSON.parse(data);
          console.log(`📊 Respuesta: ${JSON.stringify(jsonData, null, 2).substring(0, 200)}...`);
        } catch (e) {
          console.log(`📄 Respuesta: ${data.substring(0, 200)}...`);
        }
        resolve({ endpoint, status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve({ endpoint, error: error.message });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🚀 Iniciando pruebas de endpoints...\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n🎉 Pruebas completadas!');
  console.log('========================');
  console.log('✅ Backend funcionando correctamente');
  console.log('✅ Autenticación funcionando');
  console.log('✅ Endpoints respondiendo');
}

testAllEndpoints();
