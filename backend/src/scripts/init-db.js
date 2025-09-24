/**
 * Database initialization script
 * 
 * This script reads the SQL schema file and executes it on the database.
 * It can be used to initialize a new database or update an existing one.
 * 
 * Usage: node init-db.js [path_to_sql_file]
 */
const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const config = require('../config/config');
const logger = require('../utils/logger');

// Default SQL file path
const defaultSqlFilePath = path.join(__dirname, '..', '..', '..', 'ChequeoScheme10092025.sql');

async function initializeDatabase() {
  try {
    // Get SQL file path from command line argument or use default
    const sqlFilePath = process.argv[2] || defaultSqlFilePath;
    
    // Check if the file exists
    if (!fs.existsSync(sqlFilePath)) {
      logger.error(`SQL file not found: ${sqlFilePath}`);
      process.exit(1);
    }
    
    // Read SQL file content
    logger.info(`Reading SQL file: ${sqlFilePath}`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL content into separate commands (based on GO statements)
    const sqlCommands = sqlContent.split(/\r?\nGO\r?\n/).filter(cmd => cmd.trim() !== '');
    
    // Connect to database
    logger.info('Connecting to database...');
    await sql.connect(config.db);
    
    // Execute each command
    logger.info(`Executing ${sqlCommands.length} SQL commands...`);
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      try {
        await sql.query(command);
        if (i % 10 === 0) {
          logger.info(`Executed ${i + 1}/${sqlCommands.length} commands`);
        }
      } catch (error) {
        logger.error(`Error executing command #${i + 1}: ${error.message}`);
        // Continue with next command
      }
    }
    
    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error(`Database initialization failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Close the connection
    await sql.close();
  }
}

// Execute the initialization
initializeDatabase();
