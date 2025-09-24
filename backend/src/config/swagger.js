const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Chequeo Digital 2.0 API',
    version: '1.0.0',
    description: 'API for Chequeo Digital 2.0 business innovation survey tracking application',
    contact: {
      name: 'Support',
      email: 'support@chequeodigital.com'
    }
  },
  servers: [
    {
      url: `http://localhost:${config.server.port}/api`,
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Company: {
        type: 'object',
        properties: {
          IdEmpresa: { type: 'integer' },
          empresa: { type: 'string' },
          distrito: { type: 'string' },
          departamento: { type: 'string' },
          sectorActividadDescripcion: { type: 'string' },
          totalEmpleados: { type: 'integer' },
          ventasAnuales: { type: 'string' },
          puntajeNivelDeMadurezGeneral: { type: 'number', format: 'float' },
          nivelDeMadurezGeneral: { type: 'string' },
          fechaUltimaEvaluacion: { type: 'string', format: 'date-time' }
        }
      },
      CompanyDetails: {
        type: 'object',
        properties: {
          IdEmpresa: { type: 'integer' },
          empresa: { type: 'string' },
          ruc: { type: 'string' },
          distrito: { type: 'string' },
          departamento: { type: 'string' },
          ubicacion: { type: 'string' },
          sectorActividadDescripcion: { type: 'string' },
          subSectorActividadDescripcion: { type: 'string' },
          anioCreacion: { type: 'integer' },
          totalEmpleados: { type: 'integer' },
          ventasAnuales: { type: 'string' },
          contactoPrincipal: { type: 'string' },
          cargo: { type: 'string' },
          email: { type: 'string' },
          liderazgo: { type: 'string' },
          puntajeGeneral: { type: 'number', format: 'float' },
          nivelMadurez: { type: 'string' },
          puntajeTecnologia: { type: 'number', format: 'float' },
          puntajeComunicacion: { type: 'number', format: 'float' },
          puntajeOrganizacion: { type: 'number', format: 'float' },
          puntajeDatos: { type: 'number', format: 'float' },
          puntajeEstrategia: { type: 'number', format: 'float' },
          puntajeProcesos: { type: 'number', format: 'float' },
          fechaTest: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['./src/routes/*.js'],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerSpec,
  swaggerUi
};
