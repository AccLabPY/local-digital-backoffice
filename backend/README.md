# Chequeo Digital 2.0 - Backend API

Backend API for Chequeo Digital 2.0, a business innovation survey tracking application.

## Features

- RESTful API endpoints for business innovation survey data
- Authentication and authorization using JWT
- Data filtering, searching, and pagination
- Chart data generation for analytics
- Data export functionality (CSV/Excel)
- Comprehensive error handling and logging
- API documentation using Swagger

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **SQL Server**: Database
- **mssql**: SQL Server client for Node.js
- **JWT**: Authentication
- **Winston**: Logging
- **Swagger**: API documentation
- **Jest**: Testing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- NPM (v6 or higher)
- SQL Server instance with the Chequeo Digital database

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # JWT Secret for Authentication
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION=1d
   JWT_REFRESH_EXPIRATION=7d

   # Database Configuration
   DB_SERVER=your_sql_server
   DB_PORT=1433
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=ChequeoDigital
   DB_INSTANCE=
   DB_ENCRYPT=true
   DB_TRUST_SERVER_CERTIFICATE=true

   # Logging
   LOG_LEVEL=info

   # API Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
   RATE_LIMIT_MAX_REQUESTS=100
   ```
4. Start the server:
   ```
   npm start
   ```
   For development with auto-restart:
   ```
   npm run dev
   ```

## API Documentation

Once the server is running, the API documentation is available at:

```
http://localhost:3001/api-docs
```

## API Endpoints

### Authentication

- `POST /api/auth/login`: Login with username and password
- `POST /api/auth/register`: Register a new user (development only)

### Companies

- `GET /api/empresas`: Get paginated list of companies with filters and search
- `GET /api/empresas/:id`: Get company details by ID
- `GET /api/empresas/kpis`: Get KPIs for companies list
- `GET /api/empresas/filters/options`: Get filter options for companies list
- `GET /api/empresas/export`: Export companies data to CSV or Excel

### Surveys

- `GET /api/encuestas/empresas/:idEmpresa/history`: Get survey history for a company
- `GET /api/encuestas/usuarios/:idUsuario/tests/:idTest/responses`: Get detailed survey responses
- `GET /api/encuestas/dimensions`: Get available innovation dimensions
- `GET /api/encuestas/usuarios/:idUsuario/tests/:idTest/export`: Export survey responses to CSV or Excel

### Charts

- `GET /api/graficos/empresas/:idEmpresa/general-evolution`: Get general evolution data for a company
- `GET /api/graficos/empresas/:idEmpresa/dimension-evolution`: Get dimension evolution data for a company

## Folder Structure

```
backend/
├── logs/                  # Log files
├── src/
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middlewares/       # Custom middlewares
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── server.js          # Server entry point
├── .env                   # Environment variables (not in repo)
├── .gitignore
├── package.json
└── README.md
```

## Development

### Code Style

- Use ESLint for linting
- Use Prettier for code formatting

```
# Run linting
npm run lint

# Format code
npm run format
```

### Testing

```
# Run tests
npm test
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## License

This project is proprietary and confidential.
