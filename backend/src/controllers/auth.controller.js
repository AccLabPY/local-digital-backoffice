const AuthModel = require('../models/auth.model');
const { catchAsync } = require('../middlewares/error.middleware');

/**
 * Controller for authentication operations
 */
const authController = {
  /**
   * Login user
   */
  login: catchAsync(async (req, res) => {
    const { username, password } = req.body;
    
    const result = await AuthModel.login(username, password);
    
    res.status(200).json(result);
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
