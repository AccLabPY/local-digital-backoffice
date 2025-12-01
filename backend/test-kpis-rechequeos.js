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
    requestTimeout: 180000
  }
};

async function testKPIs() {
  try {
    await sql.connect(config);
    console.log('🔍 TEST DE KPIs - RECHEQUEOS\n');
    console.log('='.repeat(100));
    
    // 1. Verificar conteos en vw_RechequeosBase (empresas con 2+ chequeos)
    console.log('\n📊 1. CONTEOS EN vw_RechequeosBase (solo 2+ chequeos válidos):');
    console.log('-'.repeat(100));
    
    const baseQuery = `
      SELECT 
        COUNT(DISTINCT ClaveEntidad) AS EntidadesUnicas,
        COUNT(*) AS TotalRegistros,
        SUM(TotalChequeosValidos) AS TotalChequeos
      FROM dbo.vw_RechequeosBase WITH (NOLOCK)
    `;
    
    const baseResult = await sql.query(baseQuery);
    const base = baseResult.recordset[0];
    console.log(`  Entidades únicas (con 2+ chequeos): ${base.EntidadesUnicas}`);
    console.log(`  Total registros en vista: ${base.TotalRegistros}`);
    console.log(`  Total chequeos: ${base.TotalChequeos}`);
    
    // 2. Distribución desde vw_RechequeosBase
    console.log('\n📊 2. DISTRIBUCIÓN DESDE vw_RechequeosBase:');
    console.log('-'.repeat(100));
    
    const distQuery = `
      WITH ConteosBase AS (
        SELECT 
          ClaveEntidad,
          MAX(TotalChequeosValidos) AS TotalChequeos
        FROM dbo.vw_RechequeosBase WITH (NOLOCK)
        GROUP BY ClaveEntidad
      )
      SELECT
        SUM(CASE WHEN TotalChequeos = 1 THEN 1 ELSE 0 END) AS Dist1,
        SUM(CASE WHEN TotalChequeos BETWEEN 2 AND 3 THEN 1 ELSE 0 END) AS Dist2_3,
        SUM(CASE WHEN TotalChequeos > 3 THEN 1 ELSE 0 END) AS DistGt3,
        COUNT(*) AS TotalEntidades,
        SUM(TotalChequeos) AS TotalChequeos
      FROM ConteosBase
    `;
    
    const distResult = await sql.query(distQuery);
    const dist = distResult.recordset[0];
    console.log(`  1 chequeo: ${dist.Dist1}`);
    console.log(`  2-3 chequeos: ${dist.Dist2_3}`);
    console.log(`  >3 chequeos: ${dist.DistGt3}`);
    console.log(`  Total entidades: ${dist.TotalEntidades}`);
    console.log(`  Promedio: ${(dist.TotalChequeos / dist.TotalEntidades).toFixed(2)}`);
    
    // 3. Distribución desde vw_RechequeosKPIs
    console.log('\n📊 3. DISTRIBUCIÓN DESDE vw_RechequeosKPIs:');
    console.log('-'.repeat(100));
    
    const kpisDistQuery = `
      WITH ConteosKPIs AS (
        SELECT 
          ClaveEntidad,
          MAX(TotalChequeos) AS TotalChequeos
        FROM dbo.vw_RechequeosKPIs WITH (NOLOCK)
        GROUP BY ClaveEntidad
      )
      SELECT
        SUM(CASE WHEN TotalChequeos = 1 THEN 1 ELSE 0 END) AS Dist1,
        SUM(CASE WHEN TotalChequeos BETWEEN 2 AND 3 THEN 1 ELSE 0 END) AS Dist2_3,
        SUM(CASE WHEN TotalChequeos > 3 THEN 1 ELSE 0 END) AS DistGt3,
        COUNT(*) AS TotalEntidades,
        SUM(TotalChequeos) AS TotalChequeos
      FROM ConteosKPIs
    `;
    
    const kpisDistResult = await sql.query(kpisDistQuery);
    const kpisDist = kpisDistResult.recordset[0];
    console.log(`  1 chequeo: ${kpisDist.Dist1}`);
    console.log(`  2-3 chequeos: ${kpisDist.Dist2_3}`);
    console.log(`  >3 chequeos: ${kpisDist.DistGt3}`);
    console.log(`  Total entidades: ${kpisDist.TotalEntidades}`);
    console.log(`  Promedio: ${(kpisDist.TotalChequeos / kpisDist.TotalEntidades).toFixed(2)}`);
    
    // 4. Conteo GLOBAL (todas las empresas con al menos 1 chequeo finalizado)
    console.log('\n📊 4. CONTEO GLOBAL (TODAS las entidades con 1+ chequeo):');
    console.log('-'.repeat(100));
    
    const globalQuery = `
      WITH EmpresasGenericas AS (
        SELECT IdEmpresa
        FROM dbo.Empresa WITH (NOLOCK)
        WHERE Nombre LIKE '%NO TENGO%' 
           OR Nombre LIKE '%Sin empresa%' 
           OR Nombre LIKE '%NO TIENE%'
           OR IdEmpresa <= 0
      ),
      ConteosGlobales AS (
        SELECT 
          CASE 
            WHEN eg.IdEmpresa IS NOT NULL OR ei.IdEmpresa <= 0
            THEN 'U_' + CAST(ei.IdUsuario AS VARCHAR(20))
            ELSE 'E_' + CAST(ei.IdEmpresa AS VARCHAR(20))
          END AS ClaveEntidad,
          COUNT(DISTINCT tu.IdTestUsuario) AS TotalChequeos
        FROM dbo.EmpresaInfo ei WITH (NOLOCK)
        LEFT JOIN EmpresasGenericas eg ON ei.IdEmpresa = eg.IdEmpresa
        INNER JOIN dbo.TestUsuario tu WITH (NOLOCK) 
          ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
        WHERE tu.Finalizado = 1
        GROUP BY 
          CASE 
            WHEN eg.IdEmpresa IS NOT NULL OR ei.IdEmpresa <= 0
            THEN 'U_' + CAST(ei.IdUsuario AS VARCHAR(20))
            ELSE 'E_' + CAST(ei.IdEmpresa AS VARCHAR(20))
          END
      )
      SELECT
        SUM(CASE WHEN TotalChequeos = 1 THEN 1 ELSE 0 END) AS Dist1,
        SUM(CASE WHEN TotalChequeos BETWEEN 2 AND 3 THEN 1 ELSE 0 END) AS Dist2_3,
        SUM(CASE WHEN TotalChequeos > 3 THEN 1 ELSE 0 END) AS DistGt3,
        COUNT(*) AS TotalEntidades,
        SUM(TotalChequeos) AS TotalChequeos
      FROM ConteosGlobales
    `;
    
    const globalResult = await sql.query(globalQuery);
    const global = globalResult.recordset[0];
    console.log(`  1 chequeo: ${global.Dist1} ← DEBE SER ~1369`);
    console.log(`  2-3 chequeos: ${global.Dist2_3} ← DEBE SER ~133`);
    console.log(`  >3 chequeos: ${global.DistGt3} ← DEBE SER 0`);
    console.log(`  Total entidades: ${global.TotalEntidades} ← DEBE SER ~1502`);
    console.log(`  Total chequeos: ${global.TotalChequeos}`);
    console.log(`  Promedio: ${(global.TotalChequeos / global.TotalEntidades).toFixed(2)} ← DEBE SER ~1.11`);
    
    // 5. Tasa de reincidencia
    console.log('\n📊 5. TASA DE REINCIDENCIA:');
    console.log('-'.repeat(100));
    
    const empresasConRechequeos = kpisDist.TotalEntidades; // Desde vw_RechequeosKPIs (2+)
    const totalEmpresasGlobal = global.TotalEntidades; // Global (1+)
    const tasaReincidencia = (empresasConRechequeos / totalEmpresasGlobal) * 100;
    
    console.log(`  Empresas con rechequeos (2+): ${empresasConRechequeos}`);
    console.log(`  Total empresas (1+): ${totalEmpresasGlobal}`);
    console.log(`  Tasa de reincidencia: ${tasaReincidencia.toFixed(1)}% ← DEBE SER ~8.9%`);
    
    // 6. Verificar el query exacto del modelo
    console.log('\n📊 6. QUERY EXACTO DEL MODELO (sin filtros):');
    console.log('-'.repeat(100));
    
    const modelQuery = `
      WITH 
      -- Distribución FILTRADA basada en vw_RechequeosKPIs (responde a todos los filtros)
      ConteosConFiltros AS (
        SELECT 
          ClaveEntidad,
          MAX(TotalChequeos) AS TotalChequeos
        FROM dbo.vw_RechequeosKPIs WITH (NOLOCK)
        
        GROUP BY ClaveEntidad
      ),
      Distribucion AS (
        SELECT
          SUM(CASE WHEN TotalChequeos = 1 THEN 1 ELSE 0 END) AS Dist1,
          SUM(CASE WHEN TotalChequeos BETWEEN 2 AND 3 THEN 1 ELSE 0 END) AS Dist2_3,
          SUM(CASE WHEN TotalChequeos > 3 THEN 1 ELSE 0 END) AS DistGt3,
          COUNT(*) AS TotalEmpresasUnicas,
          SUM(TotalChequeos) AS TotalChequeos
        FROM ConteosConFiltros
      ),
      KPIsRechequeos AS (
        SELECT
          COUNT(DISTINCT ClaveEntidad) AS EmpresasConRechequeos
        FROM dbo.vw_RechequeosKPIs WITH (NOLOCK)
        
      )
      SELECT
        d.TotalEmpresasUnicas,
        d.Dist1,
        d.Dist2_3,
        d.DistGt3,
        CAST(d.TotalChequeos AS FLOAT) / NULLIF(d.TotalEmpresasUnicas, 0) AS PromChequeosPorEmpresa,
        kpi.EmpresasConRechequeos
      FROM Distribucion d
      CROSS JOIN KPIsRechequeos kpi
    `;
    
    const modelResult = await sql.query(modelQuery);
    const model = modelResult.recordset[0];
    console.log(`  TotalEmpresasUnicas: ${model.TotalEmpresasUnicas}`);
    console.log(`  Dist1: ${model.Dist1}`);
    console.log(`  Dist2_3: ${model.Dist2_3}`);
    console.log(`  DistGt3: ${model.DistGt3}`);
    console.log(`  PromChequeosPorEmpresa: ${model.PromChequeosPorEmpresa.toFixed(2)}`);
    console.log(`  EmpresasConRechequeos: ${model.EmpresasConRechequeos}`);
    console.log(`  Tasa calculada: ${((model.EmpresasConRechequeos / model.TotalEmpresasUnicas) * 100).toFixed(1)}%`);
    
    console.log('\n' + '='.repeat(100));
    console.log('✅ Test completado\n');
    
    console.log('🔴 PROBLEMA IDENTIFICADO:');
    console.log('   El modelo actual usa vw_RechequeosKPIs que SOLO tiene empresas con 2+ chequeos');
    console.log('   Por eso la distribución sale mal (no incluye empresas con 1 chequeo)');
    console.log('');
    console.log('✅ SOLUCIÓN:');
    console.log('   La distribución debe calcularse desde el CONTEO GLOBAL (sección 4)');
    console.log('   Pero los demás KPIs (deltas, mejoras) desde vw_RechequeosKPIs (solo 2+)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await sql.close();
  }
}

// Ejecutar
testKPIs();

