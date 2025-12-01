const express = require('express');
const router = express.Router();

const empresaRoutes = require('./empresa.routes');
const encuestaRoutes = require('./encuesta.routes');
const graficoRoutes = require('./grafico.routes');
const authRoutes = require('./auth.routes');
const accountRoutes = require('./account.routes');
const adminRoutes = require('./admin.routes');
const rechequeosRoutes = require('./rechequeos.routes');
const catalogosRoutes = require('./catalogos.routes');
const usuarioRoutes = require('./usuario.routes');
const usuariosSistemaRoutes = require('./usuariosSistema.routes');
const rolesRoutes = require('./roles.routes');
const resourcesRoutes = require('./resources.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/account', accountRoutes);
router.use('/admin', adminRoutes); // Solo superadmin
router.use('/usuarios-sistema', usuariosSistemaRoutes); // Solo superadmin
router.use('/roles', rolesRoutes); // Solo superadmin
router.use('/resources', resourcesRoutes); // Solo superadmin
router.use('/empresas', empresaRoutes);
router.use('/encuestas', encuestaRoutes);
router.use('/graficos', graficoRoutes);
router.use('/rechequeos', rechequeosRoutes);
router.use('/catalogos', catalogosRoutes);
router.use('/usuarios', usuarioRoutes);

module.exports = router;
