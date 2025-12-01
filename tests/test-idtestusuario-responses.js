const axios = require('axios');
require('dotenv').config();

/**
 * Script de prueba para obtener todas las preguntas y respuestas del Test=2
 * para IdEmpresa=2743, a través de su IdTestUsuario más reciente
 */
async function testIdTestUsuarioResponses() {
  try {
    console.log('Iniciando prueba de respuestas de encuesta mediante IdTestUsuario...');
    
    // Paso 1: Obtener token de autenticación
    const authResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: "saquino@mic.gov.py", 
      password: "AXbHxVXNsKK3KYOfmAfezWjwRu7q/ghVofbYUdEk2ak="
    });
    
    const token = authResponse.data.token;
    console.log('✅ Autenticación exitosa, token obtenido');

    // Configuración para las peticiones HTTP
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };

    // Paso 2: Obtener el TestUsuario más reciente para Test=2 en IdEmpresa=2743
    const empresaId = 2743;
    const testNumber = 2;
    
    console.log(`Buscando el TestUsuario más reciente para Empresa ${empresaId}, Test ${testNumber}...`);
    const latestTestResponse = await axios.get(
      `http://localhost:3001/api/encuestas/empresas/${empresaId}/latestTest/${testNumber}`, 
      config
    );
    
    if (!latestTestResponse.data) {
      throw new Error(`No se encontró un TestUsuario para la Empresa ${empresaId} con Test ${testNumber}`);
    }
    
    const testUsuarioId = latestTestResponse.data.idTestUsuario;
    console.log(`✅ TestUsuario más reciente encontrado: ID=${testUsuarioId}`);
    console.log(`   Fecha: ${latestTestResponse.data.fechaTermino}`);
    console.log(`   Nombre del test: ${latestTestResponse.data.nombreTest}`);

    // Paso 3: Obtener todas las respuestas para este TestUsuario
    console.log(`\nObteniendo respuestas para TestUsuarioId=${testUsuarioId}...`);
    const responsesResponse = await axios.get(
      `http://localhost:3001/api/encuestas/empresas/${empresaId}/testUsuarios/${testUsuarioId}/responses`,
      config
    );
    
    const responses = responsesResponse.data;
    console.log(`✅ Se encontraron ${responses.length} respuestas`);

    // Paso 4: Agrupar respuestas por dimensión
    const responsesByDimension = responses.reduce((acc, response) => {
      const dimension = response.dimension || 'Sin dimensión';
      if (!acc[dimension]) {
        acc[dimension] = [];
      }
      acc[dimension].push(response);
      return acc;
    }, {});

    // Paso 5: Mostrar estadísticas de respuestas por dimensión
    console.log('\n📊 Estadísticas de respuestas por dimensión:');
    Object.keys(responsesByDimension).forEach(dimension => {
      const dimensionResponses = responsesByDimension[dimension];
      const promedioPuntaje = dimensionResponses.reduce((sum, r) => sum + (r.puntajePregunta || 0), 0) / dimensionResponses.length;
      
      console.log(`\n🔹 Dimensión: ${dimension}`);
      console.log(`   Cantidad de respuestas: ${dimensionResponses.length}`);
      console.log(`   Puntaje promedio: ${promedioPuntaje.toFixed(3)}`);
      
      // Mostrar muestra de las preguntas para esta dimensión (primeras 2)
      console.log('   Muestra de preguntas:');
      dimensionResponses.slice(0, 2).forEach((r, idx) => {
        console.log(`     ${idx + 1}. "${truncateText(r.textoPregunta, 70)}"`);
        console.log(`        Respuesta: "${truncateText(r.respuesta, 70)}"`);
        console.log(`        Puntaje: ${r.puntajePregunta || 0}`);
      });
    });

    console.log('\n✅ Prueba completada con éxito');
    return {
      testUsuarioId,
      totalResponses: responses.length,
      dimensions: Object.keys(responsesByDimension).length,
      responsesByDimension
    };
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.response?.data || error.message);
    throw error;
  }
}

// Función auxiliar para truncar texto largo
function truncateText(text, maxLength) {
  if (!text) return 'N/A';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Ejecutar la prueba
testIdTestUsuarioResponses()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
