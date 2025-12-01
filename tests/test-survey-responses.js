const axios = require('axios');
require('dotenv').config();

// Test script to fetch survey responses for Test=2 of IdEmpresa 2743
async function fetchSurveyResponses() {
  try {
    // Step 1: Get authentication token
    const authResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: "saquino@mic.gov.py", 
      password: "AXbHxVXNsKK3KYOfmAfezWjwRu7q/ghVofbYUdEk2ak="
    });
    
    const token = authResponse.data.token;
    console.log('Authentication successful, token retrieved');

    // Step 2: Get all test users for empresa 2743
    const empresaId = 2743;
    const testUsersResponse = await axios.get(`http://localhost:3001/api/encuestas/empresas/${empresaId}/surveys`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log(`Found ${testUsersResponse.data.length} tests for empresa ${empresaId}`);
    
    // Step 3: Filter for Test=2 and get the most recent one
    const test2Users = testUsersResponse.data.filter(test => test.test === 2);
    if (test2Users.length === 0) {
      console.log(`No Test=2 found for empresa ${empresaId}`);
      return;
    }
    
    // Sort by fechaTermino descending to get the most recent
    test2Users.sort((a, b) => new Date(b.fechaTermino) - new Date(a.fechaTermino));
    const mostRecentTest = test2Users[0];
    
    console.log('Most recent Test 2:', {
      idTestUsuario: mostRecentTest.idTestUsuario,
      fechaTermino: mostRecentTest.fechaTermino,
      nombreTest: mostRecentTest.nombreTest,
      idUsuario: mostRecentTest.idUsuario
    });

    // Step 4: Get all responses for this test user
    const responsesResponse = await axios.get(`http://localhost:3001/api/encuestas/empresas/${empresaId}/tests/${mostRecentTest.idTestUsuario}/responses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log(`Found ${responsesResponse.data.length} responses for test user ${mostRecentTest.idTestUsuario}`);
    
    // Step 5: Group responses by dimension
    const responsesByDimension = responsesResponse.data.reduce((acc, response) => {
      const dimension = response.dimension || 'Sin Dimensión';
      if (!acc[dimension]) {
        acc[dimension] = [];
      }
      acc[dimension].push(response);
      return acc;
    }, {});

    // Log number of responses per dimension
    Object.keys(responsesByDimension).forEach(dimension => {
      console.log(`Dimension "${dimension}": ${responsesByDimension[dimension].length} responses`);
    });

    // Log a sample of responses from each dimension
    Object.keys(responsesByDimension).forEach(dimension => {
      if (responsesByDimension[dimension].length > 0) {
        const sample = responsesByDimension[dimension][0];
        console.log(`\nSample from "${dimension}":`);
        console.log(`- Pregunta: ${sample.textoPregunta?.substring(0, 50)}...`);
        console.log(`- Respuesta: ${sample.respuesta?.substring(0, 50)}...`);
        console.log(`- Puntaje: ${sample.puntajePregunta}`);
      }
    });

    return {
      testInfo: mostRecentTest,
      responses: responsesResponse.data
    };
    
  } catch (error) {
    console.error('Error fetching survey responses:', error.response?.data || error.message);
  }
}

fetchSurveyResponses()
  .then(() => console.log('Test completed'))
  .catch(err => console.error('Test failed:', err));
