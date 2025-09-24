const express = require('express');
const router = express.Router();

const empresaRoutes = require('./empresa.routes');
const encuestaRoutes = require('./encuesta.routes');
const graficoRoutes = require('./grafico.routes');
const authRoutes = require('./auth.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/empresas', empresaRoutes);
router.use('/encuestas', encuestaRoutes);
router.use('/graficos', graficoRoutes);

module.exports = router;
