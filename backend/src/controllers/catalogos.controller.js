const { catchAsync } = require('../middlewares/error.middleware');
const { poolPromise } = require('../config/database');
const sql = require('mssql');
const logger = require('../utils/logger');

const catalogosController = {
  /**
   * Get all ventas anuales options
   */
  getVentasAnuales: catchAsync(async (req, res) => {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      
      const query = `
        SELECT IdVentasAnuales AS id, Nombre AS nombre
        FROM VentasAnuales
        ORDER BY IdVentasAnuales
      `;
      
      const result = await request.query(query);
      
      res.status(200).json(result.recordset);
    } catch (error) {
      logger.error(`Error getting ventas anuales: ${error.message}`);
      throw error;
    }
  }),
  
  /**
   * Get usuarios for assignment with search and pagination
   */
  getUsuarios: catchAsync(async (req, res) => {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      
      const limit = parseInt(req.query.limit) || 50;
      const search = req.query.search || '';
      
      let query;
      let params = {};
      
      if (search) {
        query = `
          SELECT TOP ${limit} u.IdUsuario AS id, u.NombreCompleto AS nombre, u.Email AS email, e.Nombre AS empresa
          FROM Usuario u
          LEFT JOIN Empresa e ON u.IdEmpresa = e.IdEmpresa
          WHERE u.NombreCompleto LIKE @search 
          OR u.Email LIKE @search 
          OR ISNULL(e.Nombre, '') LIKE @search
          ORDER BY u.NombreCompleto
        `;
        request.input('search', sql.NVarChar(200), `%${search}%`);
      } else {
        query = `
          SELECT TOP ${limit} u.IdUsuario AS id, u.NombreCompleto AS nombre, u.Email AS email, e.Nombre AS empresa
          FROM Usuario u
          LEFT JOIN Empresa e ON u.IdEmpresa = e.IdEmpresa
          ORDER BY u.NombreCompleto
        `;
      }
      
      const result = await request.query(query);
      
      res.status(200).json(result.recordset);
    } catch (error) {
      logger.error(`Error getting usuarios: ${error.message}`);
      throw error;
    }
  }),

  /**
   * Get empresas for assignment with search and pagination
   */
  getEmpresas: catchAsync(async (req, res) => {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      
      const limit = parseInt(req.query.limit) || 50;
      const search = req.query.search || '';
      const id = req.query.id;
      
      let query;
      
      // Si se proporciona un ID específico, buscar por ID
      if (id) {
        query = `
          SELECT IdEmpresa AS id, Nombre AS nombre, Rut AS rut
          FROM Empresa
          WHERE IdEmpresa = @id
        `;
        request.input('id', sql.Int, parseInt(id));
      } else if (search) {
        query = `
          SELECT TOP ${limit} IdEmpresa AS id, Nombre AS nombre, Rut AS rut
          FROM Empresa
          WHERE Nombre LIKE @search 
          OR Rut LIKE @search
          ORDER BY Nombre
        `;
        request.input('search', sql.NVarChar(200), `%${search}%`);
      } else {
        query = `
          SELECT TOP ${limit} IdEmpresa AS id, Nombre AS nombre, Rut AS rut
          FROM Empresa
          ORDER BY Nombre
        `;
      }
      
      const result = await request.query(query);
      
      res.status(200).json(result.recordset);
    } catch (error) {
      logger.error(`Error getting empresas: ${error.message}`);
      throw error;
    }
  })
};

module.exports = catalogosController;
