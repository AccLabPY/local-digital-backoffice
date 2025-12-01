const AuthModel = require('../models/auth.model');
const { catchAsync } = require('../middlewares/error.middleware');

/**
 * Controller for authentication operations
 */
const authController = {
  /**
   * Login para usuarios del sistema (backoffice)
   */
  login: catchAsync(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email y contraseña son requeridos'
      });
    }

    const result = await AuthModel.login(email, password);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  }),

  /**
   * Login para empresas/comercios
   */
  loginEmpresa: catchAsync(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email y contraseña son requeridos'
      });
    }

    const result = await AuthModel.loginEmpresa(email, password);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  }),

  /**
   * Logout (revoke token)
   */
  logout: catchAsync(async (req, res) => {
    // Obtener token del header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await AuthModel.logout(token);
    }

    res.status(200).json({
      status: 'success',
      message: 'Sesión cerrada exitosamente'
    });
  }),

  /**
   * Get current user info (with permissions if system user)
   */
  me: catchAsync(async (req, res) => {
    const { userId, type } = req.user;
    
    const userData = await AuthModel.getCurrentUser(userId, type);
    
    res.status(200).json({
      status: 'success',
      data: userData
    });
  }),
  
  /**
   * Register new user (development only)
   */
  register: catchAsync(async (req, res) => {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        status: 'error',
        message: 'Registration is only available in development environment'
      });
    }
    
    const userData = req.body;
    
    const user = await AuthModel.register(userData);
    
    res.status(201).json({
      status: 'success',
      user
    });
  })
};

module.exports = authController;
