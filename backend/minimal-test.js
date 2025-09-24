const sql = require('mssql/msnodesqlv8');

const config = {
  server: 'FRAN\\MSSQL2022',
  database: 'BID_v3',
  options: {
    trustedConnection: true,
    trustServerCertificate: true
  },
  driver: 'msnodesqlv8'
};

console.log('Testing connection...');

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
    console.log('❌ Error:', error);
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    console.log('Error number:', error.number);
    console.log('Error state:', error.state);
    console.log('Error class:', error.class);
    console.log('Error server:', error.server);
    console.log('Error procedure:', error.procName);
    console.log('Error line number:', error.lineNumber);
    console.log('Error stack:', error.stack);
  });
