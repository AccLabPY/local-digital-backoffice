const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function checkColumns() {
  try {
    await sql.connect(config);
    console.log('Conectado a la base de datos');
    
    const result = await sql.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'EmpresaInfo' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Columnas en EmpresaInfo:');
    result.recordset.forEach(col => console.log('- ' + col.COLUMN_NAME));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.close();
  }
}

checkColumns();
