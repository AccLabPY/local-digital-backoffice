const sql = require('mssql/msnodesqlv8');

const config = {
  server: 'FRAN\\MSSQL2022',
  database: 'BID_v2_22122025',
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  driver: 'msnodesqlv8',
  connectionTimeout: 30000,
  requestTimeout: 30000
};

console.log('Testing connection with explicit config...');
console.log('Config:', JSON.stringify(config, null, 2));

sql.connect(config)
  .then(() => {
    console.log('✅ Connected!');
    return sql.query('SELECT @@VERSION as version');
  })
  .then(result => {
    console.log('✅ Query successful');
    console.log(result.recordset[0].version.split('\n')[0]);
    return sql.close();
  })
  .then(() => {
    console.log('✅ Closed');
  })
  .catch(error => {
    console.log('❌ Error details:');
    console.log('Type:', typeof error);
    console.log('Constructor:', error.constructor.name);
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('Number:', error.number);
    console.log('State:', error.state);
    console.log('Class:', error.class);
    console.log('Server:', error.server);
    console.log('Procedure:', error.procName);
    console.log('Line Number:', error.lineNumber);
    
    // Try to get more details
    if (error.originalError) {
      console.log('Original Error:', error.originalError);
    }
    
    // Show all properties
    console.log('All properties:', Object.getOwnPropertyNames(error));
    
    // Show error as string
    console.log('Error as string:', String(error));
  });
