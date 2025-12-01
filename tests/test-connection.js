const http = require('http');

console.log('🔍 Testing Frontend-Backend Connection');
console.log('=====================================');

// Test Backend (port 3001)
console.log('\n📡 Testing Backend (port 3001)...');
const backendOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/empresas',
  method: 'GET'
};

const backendReq = http.request(backendOptions, (res) => {
  console.log(`✅ Backend Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`✅ Backend Response: ${data}`);
    
    // Test Frontend (port 3000)
    console.log('\n🌐 Testing Frontend (port 3000)...');
    const frontendOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET'
    };

    const frontendReq = http.request(frontendOptions, (res) => {
      console.log(`✅ Frontend Status: ${res.statusCode}`);
      
      let frontendData = '';
      res.on('data', (chunk) => {
        frontendData += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Frontend Response Length: ${frontendData.length} characters`);
        console.log('\n🎉 Connection Test Complete!');
        console.log('============================');
        console.log('✅ Backend is running on port 3001');
        console.log('✅ Frontend is running on port 3000');
        console.log('✅ Both servers are responding');
      });
    });

    frontendReq.on('error', (error) => {
      console.error('❌ Frontend Error:', error.message);
    });

    frontendReq.end();
  });
});

backendReq.on('error', (error) => {
  console.error('❌ Backend Error:', error.message);
});

backendReq.end();
