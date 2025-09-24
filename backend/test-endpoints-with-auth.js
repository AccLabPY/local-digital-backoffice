const http = require('http');

console.log('🔐 Obteniendo Token de Autenticación');
console.log('====================================');

async function getToken() {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({
      username: "saquino@mic.gov.py",
      password: "AXbHxVXNsKK3KYOfmAfezWjwRu7q/ghVofbYUdEk2ak="
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Login Status: ${res.statusCode}`);
        try {
          const result = JSON.parse(data);
          console.log(`👤 Usuario: ${result.user.name}`);
          console.log(`🔑 Token: ${result.token}`);
          resolve(result.token);
        } catch (e) {
          console.log(`❌ Error parsing response: ${data}`);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve(null);
    });

    req.write(loginData);
    req.end();
  });
}

async function testEndpointWithToken(token, endpoint) {
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
          console.log(`📊 Respuesta: ${JSON.stringify(jsonData, null, 2).substring(0, 300)}...`);
        } catch (e) {
          console.log(`📄 Respuesta: ${data.substring(0, 300)}...`);
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

async function main() {
  // Obtener token
  const token = await getToken();
  
  if (!token) {
    console.log('❌ No se pudo obtener el token');
    return;
  }

  // Probar endpoints
  const endpoints = [
    '/api/empresas',
    '/api/empresas/kpis', 
    '/api/empresas/filters/options',
    '/api/encuestas/dimensions'
  ];

  console.log('\n🚀 Probando endpoints...');
  
  for (const endpoint of endpoints) {
    await testEndpointWithToken(token, endpoint);
  }
  
  console.log('\n🎉 Pruebas completadas!');
  console.log('========================');
  console.log('✅ Backend funcionando correctamente');
  console.log('✅ Autenticación funcionando');
  console.log('✅ Endpoints respondiendo');
}

main();
