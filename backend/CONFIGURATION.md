# Configuration Guide for Chequeo Digital 2.0 Backend

This guide explains how to configure the backend application for your specific environment.

## Environment Variables Setup

### Step 1: Create the .env file

1. Copy the template file:
   ```bash
   cp env.template .env
   ```

2. Edit the `.env` file with your specific configuration values.

### Step 2: Configure Database Connection

Update the following variables in your `.env` file:

#### For Windows Authentication (Recommended for Development):

```env
# Database Configuration
DB_SERVER=your_sql_server_hostname_or_ip
DB_PORT=1433
DB_NAME=ChequeoDigital
DB_INSTANCE=your_sql_server_instance_name_if_any

# Windows Authentication
DB_USE_WINDOWS_AUTH=true
DB_DOMAIN=your_domain_name
DB_USER=your_windows_username

# Connection Options
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

#### For SQL Server Authentication:

```env
# Database Configuration
DB_SERVER=your_sql_server_hostname_or_ip
DB_PORT=1433
DB_NAME=ChequeoDigital
DB_INSTANCE=your_sql_server_instance_name_if_any

# SQL Server Authentication
DB_USE_WINDOWS_AUTH=false
DB_USER=your_database_username
DB_PASSWORD=your_database_password

# Connection Options
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

#### Database Configuration Examples:

**Local SQL Server with Windows Authentication:**
```env
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=ChequeoDigital
DB_INSTANCE=
DB_USE_WINDOWS_AUTH=true
DB_DOMAIN=WORKGROUP
DB_USER=your_windows_username
```

**SQL Server with Named Instance (Windows Auth):**
```env
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=ChequeoDigital
DB_INSTANCE=SQLEXPRESS
DB_USE_WINDOWS_AUTH=true
DB_DOMAIN=WORKGROUP
DB_USER=your_windows_username
```

**Domain SQL Server (Windows Auth):**
```env
DB_SERVER=sqlserver.company.local
DB_PORT=1433
DB_NAME=ChequeoDigital
DB_INSTANCE=
DB_USE_WINDOWS_AUTH=true
DB_DOMAIN=COMPANY
DB_USER=your_domain_username
```

**SQL Server Authentication (Alternative):**
```env
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=ChequeoDigital
DB_INSTANCE=
DB_USE_WINDOWS_AUTH=false
DB_USER=webapp
DB_PASSWORD=MySecurePassword123!
```

**Azure SQL Database:**
```env
DB_SERVER=your-server.database.windows.net
DB_PORT=1433
DB_NAME=ChequeoDigital
DB_INSTANCE=
DB_USE_WINDOWS_AUTH=false
DB_USER=webapp@your-server
DB_PASSWORD=MySecurePassword123!
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
```

### Step 3: Configure JWT Secret

**IMPORTANT**: Change the JWT secret for security:

```env
JWT_SECRET=your_very_long_and_secure_random_string_here
```

Generate a secure random string using:
- Online generator: https://generate-secret.vercel.app/32
- Command line: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Step 4: Configure Server Settings

```env
# Server Configuration
PORT=3001
NODE_ENV=development  # Change to 'production' for production deployment

# Logging
LOG_LEVEL=info  # Options: error, warn, info, debug

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100  # Maximum requests per window
```

## Database Setup

### 1. Windows Authentication Setup

For Windows Authentication, you need to ensure your Windows user has access to the SQL Server:

#### Option A: Add Windows User to SQL Server
1. Open SQL Server Management Studio (SSMS)
2. Connect to your SQL Server instance
3. Expand Security → Logins
4. Right-click and select "New Login"
5. Select "Windows Authentication"
6. Click "Search" and find your Windows user
7. Click "OK" to create the login
8. Grant the user appropriate permissions:

```sql
-- Grant permissions to your Windows user
ALTER ROLE db_owner ADD MEMBER [DOMAIN\username];
ALTER ROLE db_accessadmin ADD MEMBER [DOMAIN\username];
ALTER ROLE db_datareader ADD MEMBER [DOMAIN\username];
ALTER ROLE db_datawriter ADD MEMBER [DOMAIN\username];
```

#### Option B: Use SQL Server Authentication (Alternative)
If you prefer SQL Server authentication:

```sql
-- Create login
CREATE LOGIN webapp WITH PASSWORD = 'your_secure_password_here';

-- Create user
CREATE USER webapp FOR LOGIN webapp;

-- Grant permissions
ALTER ROLE db_owner ADD MEMBER webapp;
ALTER ROLE db_accessadmin ADD MEMBER webapp;
ALTER ROLE db_datareader ADD MEMBER webapp;
ALTER ROLE db_datawriter ADD MEMBER webapp;
```

### 2. Initialize Database Schema

Run the database initialization script:

```bash
npm run init-db
```

Or manually run the SQL script:
```bash
node src/scripts/init-db.js path/to/ChequeoScheme10092025.sql
```

## Testing Configuration

### 1. Test Database Connection

Create a simple test script to verify your database connection:

```javascript
// test-db-connection.js
const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  }
};

async function testConnection() {
  try {
    await sql.connect(config);
    console.log('✅ Database connection successful!');
    
    const result = await sql.query('SELECT COUNT(*) as count FROM Empresa');
    console.log(`✅ Found ${result.recordset[0].count} companies in database`);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await sql.close();
  }
}

testConnection();
```

Run the test:
```bash
node test-db-connection.js
```

### 2. Test API Endpoints

Start the server and test the health endpoint:

```bash
npm start
```

Then test:
```bash
curl http://localhost:3001/health
```

## Common Configuration Issues

### Connection Timeout
If you experience connection timeouts, increase the timeout values:

```env
DB_CONNECTION_TIMEOUT=30000
DB_REQUEST_TIMEOUT=30000
```

### SSL Certificate Issues
For Azure SQL or servers with SSL requirements:

```env
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
```

### Firewall Issues
Ensure your SQL Server allows connections on port 1433 and that Windows Firewall is configured appropriately.

## Security Considerations

1. **Never commit `.env` files to version control**
2. **Use strong passwords for database users**
3. **Change default JWT secrets**
4. **Use environment-specific configurations**
5. **Enable SSL/TLS in production**

## Production Configuration

For production deployment:

```env
NODE_ENV=production
LOG_LEVEL=warn
JWT_SECRET=your_production_jwt_secret
DB_SERVER=your_production_server
DB_USER=your_production_user
DB_PASSWORD=your_production_password
```

## Troubleshooting

### Common Error Messages

**"Login failed for user"**
- Check username and password
- Verify user exists in SQL Server
- Check if user has proper permissions

**"Cannot connect to server"**
- Verify server name/IP address
- Check if SQL Server is running
- Verify port number
- Check firewall settings

**"Database does not exist"**
- Create the database first
- Run the schema initialization script

**"Timeout expired"**
- Check network connectivity
- Increase timeout values
- Verify server performance

For additional support, check the application logs in the `logs/` directory.
