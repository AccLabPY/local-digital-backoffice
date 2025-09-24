const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
// const rateLimit = require('express-rate-limit'); // DISABLED - Rate limiting removed
const path = require('path');
const fs = require('fs');

const config = require('./config/config');
const logger = require('./utils/logger');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const { swaggerSpec, swaggerUi } = require('./config/swagger');

// Initialize express app
const app = express();

// Set security HTTP headers
app.use(helmet());

// Parse JSON request body
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parse cookies
app.use(cookieParser());

// Gzip compression
app.use(compression());

// Enable CORS
app.use(cors());

// Rate limiting DISABLED - Removed to prevent 429 errors
// const limiter = rateLimit({
//   windowMs: config.rateLimit.windowMs,
//   max: config.rateLimit.max,
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: 'Too many requests from this IP, please try again after some time',
// });
// app.use('/api', limiter);

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Request logging
const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// API routes
app.use('/api', routes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Handle 404 - Not Found
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${config.server.nodeEnv} mode`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// For testing
module.exports = app;
