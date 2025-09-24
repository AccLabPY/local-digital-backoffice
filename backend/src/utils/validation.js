const Joi = require('joi');

// Validation schemas
const schemas = {
  // Authentication
  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  }),

  // Pagination parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    finalizado: Joi.number().integer().valid(0, 1).default(1)
  }),
  
  // Pagination with filters
  paginationWithFilters: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    searchTerm: Joi.string().allow('').optional(),
    departamento: Joi.string().allow('').optional(),
    distrito: Joi.string().allow('').optional(),
    nivelInnovacion: Joi.string().allow('').optional(),
    sectorActividad: Joi.string().allow('').optional(),
    estadoEncuesta: Joi.boolean().optional(),
    finalizado: Joi.number().integer().valid(0, 1).default(1)
  }),
  
  // Search parameters
  search: Joi.object({
    searchTerm: Joi.string().allow('').optional()
  }),
  
  // Company filter parameters
  companyFilters: Joi.object({
    departamento: Joi.string().allow('').optional(),
    distrito: Joi.string().allow('').optional(),
    nivelInnovacion: Joi.string().allow('').optional(),
    sectorActividad: Joi.string().allow('').optional(),
    estadoEncuesta: Joi.boolean().optional()
  }),
  
  // ID parameter validation
  idParam: Joi.object({
    id: Joi.number().integer().required()
  }),
  
  // Survey response filters
  surveyFilters: Joi.object({
    dimension: Joi.string().valid('Todas', 'Tecnología', 'Comunicación', 'Organización', 'Datos', 'Estrategia', 'Procesos').default('Todas')
  }),
  
  // Export parameters
  exportParams: Joi.object({
    format: Joi.string().valid('csv', 'excel').required(),
    fileName: Joi.string().required()
  }),
  
  // KPI filters
  kpiFilters: Joi.object({
    estadoEncuesta: Joi.boolean().optional(),
    finalizado: Joi.number().integer().valid(0, 1).default(1)
  })
};

// Validation middleware factory
const validate = (schema, property) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      allowUnknown: true,     // no rompas si viene algo extra
      stripUnknown: true      // y bórralo del objeto
    });
    
    if (!error) {
      req[property] = value;  // usa el saneado
      return next();
    }
    
    const message = error.details.map(i => i.message).join(',');
    return res.status(422).json({ 
      status: 'error', 
      message: `Validation error: ${message}` 
    });
  };
};

module.exports = {
  schemas,
  validate
};
