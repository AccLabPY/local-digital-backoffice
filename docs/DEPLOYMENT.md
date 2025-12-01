# Deployment Guide for Chequeo Digital 2.0 Backend

This guide provides detailed instructions for deploying the Chequeo Digital 2.0 backend to different production environments.

## Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Deployment Options](#deployment-options)
   - [Option 1: Traditional Server Deployment](#option-1-traditional-server-deployment)
   - [Option 2: Docker Deployment](#option-2-docker-deployment)
   - [Option 3: Cloud Deployment](#option-3-cloud-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Node.js v14 or higher installed
- NPM v6 or higher installed
- Access to a SQL Server instance
- Necessary permissions to create/modify databases
- The Chequeo Digital 2.0 backend code repository

## Environment Configuration

1. Create a production `.env` file based on the template below:

```
# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Secret for Authentication
JWT_SECRET=your_strong_production_jwt_secret
JWT_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d

# Database Configuration
DB_SERVER=your_production_sql_server
DB_PORT=1433
DB_USER=your_production_db_user
DB_PASSWORD=your_strong_production_db_password
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

**IMPORTANT**: Generate a strong, random JWT secret for production and never reuse development secrets.

## Database Setup

1. Create the Chequeo Digital database on your SQL Server:

```sql
CREATE DATABASE ChequeoDigital;
```

2. Run the database schema script (`ChequeoScheme10092025.sql`) to create all tables, stored procedures, and other database objects.

3. Create the necessary user for the application:

```sql
CREATE LOGIN webapp WITH PASSWORD = 'your_strong_production_db_password';
CREATE USER webapp FOR LOGIN webapp;
ALTER ROLE db_owner ADD MEMBER webapp;
```

## Deployment Options

### Option 1: Traditional Server Deployment

This option involves deploying the application directly on a server.

1. Transfer the code to your production server:

```bash
# On your local machine
git clone https://your-repo/chequeo-digital-backend.git
cd chequeo-digital-backend
npm install --production
```

2. Create the production `.env` file as described in the [Environment Configuration](#environment-configuration) section.

3. Set up a process manager like PM2:

```bash
npm install pm2 -g
pm2 start src/server.js --name "chequeo-digital-backend"
pm2 save
pm2 startup
```

4. Set up a reverse proxy with NGINX:

```nginx
server {
    listen 80;
    server_name api.chequeodigital.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. Secure with SSL (using Certbot):

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.chequeodigital.com
```

### Option 2: Docker Deployment

1. Create a `Dockerfile` in the project root:

```Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
```

2. Create a `.dockerignore` file:

```
node_modules
npm-debug.log
.env
.git
.github
.gitignore
logs
*.md
```

3. Build and run the Docker container:

```bash
docker build -t chequeo-digital-backend .
docker run -d -p 3001:3001 --name chequeo-backend \
  --env-file .env \
  chequeo-digital-backend
```

4. Alternatively, use Docker Compose:

```yaml
# docker-compose.yml
version: '3'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    env_file: .env
    restart: always
    volumes:
      - ./logs:/app/logs
```

Then run:

```bash
docker-compose up -d
```

### Option 3: Cloud Deployment

#### Azure App Service

1. Create an Azure App Service:
   - Navigate to the Azure Portal
   - Create a new App Service (Web App)
   - Select Node.js as the runtime stack
   - Configure the deployment settings

2. Set up environment variables:
   - Go to Configuration > Application settings
   - Add all the variables from your `.env` file

3. Deploy the code:
   - Set up GitHub Actions or Azure DevOps for CI/CD, or
   - Use VS Code Azure extension, or
   - Use Azure CLI:

```bash
az webapp up --name chequeo-digital-backend --location eastus --sku F1
```

#### AWS Elastic Beanstalk

1. Install the EB CLI:

```bash
pip install awsebcli
```

2. Initialize your EB application:

```bash
eb init
```

3. Create an environment and deploy:

```bash
eb create chequeo-digital-production
```

4. Configure environment variables:

```bash
eb setenv JWT_SECRET=your_secret DB_SERVER=your_server ...
```

## Post-Deployment Verification

After deployment, verify that the application is working correctly:

1. Check the health endpoint:

```bash
curl https://your-api-url/health
```

2. Verify API documentation access:

```
https://your-api-url/api-docs
```

3. Test authentication:

```bash
curl -X POST https://your-api-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

## Monitoring and Logging

1. Set up log rotation to prevent log files from growing too large:

```bash
npm install -g log-rotate
```

2. Consider integrating with external monitoring services:
   - New Relic
   - Datadog
   - Sentry (for error tracking)

3. Set up alerts for critical errors or performance issues.

## Backup and Recovery

1. Set up regular database backups:

```sql
BACKUP DATABASE ChequeoDigital TO DISK = 'D:\backups\chequeo_backup.bak'
```

2. Implement a backup rotation strategy.

3. Document the restoration process in case of failures.

## Troubleshooting

Common issues and solutions:

1. **Database Connection Errors**:
   - Verify the database server is reachable
   - Check connection string parameters
   - Ensure the database user has the correct permissions

2. **API Unavailable**:
   - Check the process/container status
   - Verify network/firewall settings
   - Check application logs for errors

3. **Authentication Issues**:
   - Verify the JWT secret is correctly set
   - Check if tokens are being generated correctly

4. **Performance Issues**:
   - Monitor CPU and memory usage
   - Check for slow database queries
   - Consider adding caching for frequently accessed data

For additional support, contact the development team.
