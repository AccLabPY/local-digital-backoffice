const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    requestTimeout: 60000
  }
};

const TARGET_ID_EMPRESA = 1361;
const TARGET_DEPARTAMENTO = 'Alto Paraná';

async function diagnosticarDistritos() {
  try {
    await sql.connect(config);
    console.log('🔍 DIAGNÓSTICO DE DISTRITOS EN RECHEQUEOS\n');
    console.log('='.repeat(100));
    
    // 1. Verificar empresas en vw_RechequeosBase
    console.log('\n📊 1. EMPRESAS EN vw_RechequeosBase (con 2+ chequeos):');
    console.log('-'.repeat(100));
    
    console.log(`Empresa objetivo IdEmpresa = ${TARGET_ID_EMPRESA} (${TARGET_DEPARTAMENTO})`);

    const baseQuery = `
      SELECT TOP 20
        IdEmpresa,
        IdUsuario,
        IdEmpresaInfo,
        ClaveEntidad,
        EmpresaNombre,
        Departamento,
        Distrito,
        SeqNum,
        TotalChequeosValidos
      FROM dbo.vw_RechequeosBase
      WHERE IdEmpresa = ${TARGET_ID_EMPRESA}
      ORDER BY SeqNum
    `;
    
    const baseResult = await sql.query(baseQuery);
    console.log(`Total registros en vista: ${baseResult.recordset.length}`);
    baseResult.recordset.forEach(row => {
      console.log(`  ${row.EmpresaNombre} | Seq:${row.SeqNum}/${row.TotalChequeosValidos} | Dist:"${row.Distrito}" | IdEmpInfo:${row.IdEmpresaInfo} | Clave:${row.ClaveEntidad}`);
    });
    
    // 2. Verificar datos directos de EmpresaInfo para esas empresas
    console.log('\n📋 2. DATOS DIRECTOS DE EmpresaInfo:');
    console.log('-'.repeat(100));
    
    const empresaInfoQuery = `
      SELECT TOP 20
        ei.IdEmpresaInfo,
        ei.IdEmpresa,
        ei.IdUsuario,
        ei.Test,
        ei.IdDepartamento,
        ei.IdLocalidad,
        e.Nombre AS EmpresaNombre,
        d.Nombre AS DeptoNombre,
        sr.IdSubRegion,
        sr.Nombre AS DistritoNombre,
        sr.IdRegion,
        tu.Finalizado
      FROM dbo.EmpresaInfo ei
      INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      INNER JOIN dbo.Empresa e ON ei.IdEmpresa = e.IdEmpresa
      LEFT JOIN dbo.Departamentos d ON ei.IdDepartamento = d.IdDepartamento
      LEFT JOIN dbo.SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
      WHERE tu.Finalizado = 1
        AND ei.IdEmpresa = ${TARGET_ID_EMPRESA}
      ORDER BY tu.FechaTerminoTest DESC
    `;
    
    const empresaInfoResult = await sql.query(empresaInfoQuery);
    console.log(`Total registros en EmpresaInfo: ${empresaInfoResult.recordset.length}`);
    empresaInfoResult.recordset.forEach(row => {
      const distDisplay = row.IdLocalidad 
        ? `${row.DistritoNombre} (IdLocalidad:${row.IdLocalidad})` 
        : 'NULL';
      console.log(`  ${row.EmpresaNombre} | IdEmpInfo:${row.IdEmpresaInfo} | Depto:${row.DeptoNombre} | Distrito:${distDisplay}`);
    });
    
    // 3. Contar distritos NULL vs con valor
    console.log('\n📈 3. ESTADÍSTICAS DE DISTRITOS:');
    console.log('-'.repeat(100));
    
    const statsQuery = `
      WITH EmpresasObjetivo AS (
        SELECT 
          ei.IdEmpresaInfo,
          ei.IdEmpresa,
          ei.IdLocalidad,
          sr.Nombre AS DistritoNombre,
          e.Nombre AS EmpresaNombre
        FROM dbo.EmpresaInfo ei
        INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
        INNER JOIN dbo.Empresa e ON ei.IdEmpresa = e.IdEmpresa
        LEFT JOIN dbo.SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
        WHERE tu.Finalizado = 1
          AND ei.IdEmpresa = ${TARGET_ID_EMPRESA}
      )
      SELECT
        COUNT(*) AS TotalRegistros,
        SUM(CASE WHEN IdLocalidad IS NULL THEN 1 ELSE 0 END) AS ConDistritoNULL,
        SUM(CASE WHEN IdLocalidad IS NOT NULL THEN 1 ELSE 0 END) AS ConDistritoValido,
        COUNT(DISTINCT IdEmpresa) AS EmpresasUnicas,
        COUNT(DISTINCT CASE WHEN IdLocalidad IS NOT NULL THEN IdEmpresa END) AS EmpresasConDistrito
      FROM EmpresasObjetivo
    `;
    
    const statsResult = await sql.query(statsQuery);
    const stats = statsResult.recordset[0];
    console.log(`  Total registros Alto Paraná: ${stats.TotalRegistros}`);
    console.log(`  Con IdLocalidad NULL: ${stats.ConDistritoNULL} (${(stats.ConDistritoNULL/stats.TotalRegistros*100).toFixed(1)}%)`);
    console.log(`  Con IdLocalidad válido: ${stats.ConDistritoValido} (${(stats.ConDistritoValido/stats.TotalRegistros*100).toFixed(1)}%)`);
    console.log(`  Empresas únicas: ${stats.EmpresasUnicas}`);
    console.log(`  Empresas con distrito: ${stats.EmpresasConDistrito}`);
    
    // 4. Verificar la vista vw_RechequeosTabla
    console.log('\n📊 4. DATOS EN vw_RechequeosTabla:');
    console.log('-'.repeat(100));
    
    const tablaQuery = `
      SELECT TOP 20
        IdEmpresa,
        EmpresaNombre,
        Departamento,
        Distrito,
        Ubicacion,
        TotalChequeos
      FROM dbo.vw_RechequeosTabla
      WHERE IdEmpresa = ${TARGET_ID_EMPRESA}
      ORDER BY EmpresaNombre
    `;
    
    const tablaResult = await sql.query(tablaQuery);
    console.log(`Total empresas en tabla: ${tablaResult.recordset.length}`);
    tablaResult.recordset.forEach(row => {
      console.log(`  ${row.EmpresaNombre} | Distrito:"${row.Distrito}" | Ubicacion:"${row.Ubicacion}"`);
    });
    
    // 5. Verificar join de IdEmpresaInfo
    console.log('\n🔗 5. VERIFICAR JOIN POR IdEmpresaInfo:');
    console.log('-'.repeat(100));
    
    const joinTestQuery = `
      SELECT TOP 10
        cv.IdEmpresaInfo AS CV_IdEmpresaInfo,
        cv.IdEmpresa AS CV_IdEmpresa,
        ei.IdEmpresaInfo AS EI_IdEmpresaInfo,
        ei.IdEmpresa AS EI_IdEmpresa,
        ei.IdLocalidad,
        sr.Nombre AS DistritoNombre,
        e.Nombre AS EmpresaNombre
      FROM dbo.vw_RechequeosBase cv
      LEFT JOIN dbo.EmpresaInfo ei ON ei.IdEmpresaInfo = cv.IdEmpresaInfo
      LEFT JOIN dbo.SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
      LEFT JOIN dbo.Empresa e ON cv.IdEmpresa = e.IdEmpresa
      WHERE cv.IdEmpresa = ${TARGET_ID_EMPRESA}
        AND cv.SeqNum = 1
      ORDER BY e.Nombre
    `;
    
    const joinTestResult = await sql.query(joinTestQuery);
    console.log(`Total registros testeados: ${joinTestResult.recordset.length}`);
    joinTestResult.recordset.forEach(row => {
      const match = row.CV_IdEmpresaInfo === row.EI_IdEmpresaInfo ? '✅' : '❌';
      const distDisplay = row.IdLocalidad ? `${row.DistritoNombre} (${row.IdLocalidad})` : 'NULL';
      console.log(`  ${match} ${row.EmpresaNombre} | CV_Info:${row.CV_IdEmpresaInfo} EI_Info:${row.EI_IdEmpresaInfo} | Dist:${distDisplay}`);
    });
    
    // 6. Probar query completo de la vista
    console.log('\n🧪 6. QUERY COMPLETO DE ENRIQUECIMIENTO:');
    console.log('-'.repeat(100));
    
    const fullQuery = `
      SELECT TOP 5
        cv.IdEmpresaInfo,
        cv.EmpresaNombre,
        cv.Departamento AS CV_Depto,
        cv.Distrito AS CV_Distrito,
        ei.IdLocalidad AS EI_IdLocalidad,
        sr.Nombre AS SR_Nombre,
        CASE WHEN sr.IdRegion = 20 THEN 'Capital' ELSE dep.Nombre END AS Calc_Depto,
        CASE WHEN sr.Nombre IS NOT NULL THEN sr.Nombre ELSE 'OTRO' END AS Calc_Distrito
      FROM dbo.vw_RechequeosBase cv
      LEFT JOIN dbo.EmpresaInfo ei ON ei.IdEmpresaInfo = cv.IdEmpresaInfo
      LEFT JOIN dbo.Departamentos dep ON ei.IdDepartamento = dep.IdDepartamento
      LEFT JOIN dbo.SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
      WHERE cv.IdEmpresa = ${TARGET_ID_EMPRESA}
        AND cv.SeqNum = 1
    `;
    
    const fullResult = await sql.query(fullQuery);
    fullResult.recordset.forEach(row => {
      console.log(`\n  Empresa: ${row.EmpresaNombre}`);
      console.log(`    IdEmpresaInfo: ${row.IdEmpresaInfo}`);
      console.log(`    Vista dice Depto: "${row.CV_Depto}", Distrito: "${row.CV_Distrito}"`);
      console.log(`    EmpresaInfo.IdLocalidad: ${row.EI_IdLocalidad || 'NULL'}`);
      console.log(`    SubRegion.Nombre: ${row.SR_Nombre || 'NULL'}`);
      console.log(`    Cálculo Depto: "${row.Calc_Depto}", Distrito: "${row.Calc_Distrito}"`);
    });
    
    console.log('\n' + '='.repeat(100));
    console.log('✅ Diagnóstico completado\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sql.close();
  }
}

// Ejecutar
diagnosticarDistritos();

