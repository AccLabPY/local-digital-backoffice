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

async function analyzeMissingRecords() {
  try {
    await sql.connect(config);
    console.log('🔍 Analizando registros perdidos de ASUNCIÓN...\n');
    
    // 1. Contar registros que serían afectados
    const countQuery = `
      SELECT COUNT(*) as total_afectados
      FROM dbo.EmpresaInfo ei
      INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      WHERE tu.Finalizado = 1
        AND ei.IdLocalidad IS NULL
        AND (ei.IdDepartamento = 20 OR ei.IdDepartamento = 0 OR ei.IdDepartamento IS NULL)
    `;
    
    const countResult = await sql.query(countQuery);
    const totalAfectados = countResult.recordset[0].total_afectados;
    
    console.log(`📊 REGISTROS QUE SERÍAN CORREGIDOS: ${totalAfectados}\n`);
    
    // 2. Mostrar algunos ejemplos de registros que serían afectados
    const examplesQuery = `
      SELECT TOP 10
        ei.IdEmpresaInfo,
        ei.IdUsuario,
        ei.IdEmpresa,
        ei.IdDepartamento,
        ei.IdLocalidad,
        e.Nombre as EmpresaNombre,
        u.NombreCompleto,
        tu.FechaTest
      FROM dbo.EmpresaInfo ei
      INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      INNER JOIN dbo.Empresa e ON ei.IdEmpresa = e.IdEmpresa
      INNER JOIN dbo.Usuario u ON ei.IdUsuario = u.IdUsuario
      WHERE tu.Finalizado = 1
        AND ei.IdLocalidad IS NULL
        AND (ei.IdDepartamento = 20 OR ei.IdDepartamento = 0 OR ei.IdDepartamento IS NULL)
      ORDER BY tu.FechaTest DESC
    `;
    
    const examplesResult = await sql.query(examplesQuery);
    
    console.log('📋 EJEMPLOS DE REGISTROS QUE SERÍAN CORREGIDOS:');
    console.log('=' .repeat(120));
    examplesResult.recordset.forEach((record, index) => {
      console.log(`${index + 1}. Empresa: ${record.EmpresaNombre}`);
      console.log(`   Usuario: ${record.NombreCompleto}`);
      console.log(`   IdEmpresaInfo: ${record.IdEmpresaInfo}`);
      console.log(`   IdDepartamento actual: ${record.IdDepartamento}`);
      console.log(`   IdLocalidad actual: ${record.IdLocalidad}`);
      console.log(`   Fecha Test: ${record.FechaTest}`);
      console.log('   ' + '-'.repeat(100));
    });
    
    // 3. Verificar el estado actual de Capital
    const capitalQuery = `
      SELECT COUNT(*) as total_capital
      FROM dbo.EmpresaInfo ei
      INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      INNER JOIN dbo.SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
      WHERE tu.Finalizado = 1
        AND sr.IdRegion = 20
    `;
    
    const capitalResult = await sql.query(capitalQuery);
    const totalCapital = capitalResult.recordset[0].total_capital;
    
    console.log(`\n🏛️  ESTADO ACTUAL DE CAPITAL: ${totalCapital} empresas`);
    console.log(`🎯 DESPUÉS DEL PATCH: ${totalCapital + totalAfectados} empresas`);
    
    return {
      totalAfectados,
      totalCapital,
      totalDespues: totalCapital + totalAfectados
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.close();
  }
}

async function previewPatch() {
  console.log('🔧 PREVIEW DEL PATCH SQL\n');
  
  const previewSQL = `
-- PATCH PARA CORREGIR REGISTROS PERDIDOS DE ASUNCIÓN
-- Este script actualiza IdLocalidad a 244 (ASUNCIÓN) para registros que:
-- 1. Tienen IdLocalidad = NULL
-- 2. Tienen IdDepartamento = 20, 0 o NULL (pertenecen a Capital/ASUNCIÓN)
-- 3. Son tests finalizados

BEGIN TRANSACTION;

-- Contar registros que serán afectados
DECLARE @RegistrosAfectados INT;

SELECT @RegistrosAfectados = COUNT(*)
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE tu.Finalizado = 1
  AND ei.IdLocalidad IS NULL
  AND (ei.IdDepartamento = 20 OR ei.IdDepartamento = 0 OR ei.IdDepartamento IS NULL);

PRINT 'Registros que serán corregidos: ' + CAST(@RegistrosAfectados AS VARCHAR(10));

-- Aplicar la corrección
UPDATE ei
SET IdLocalidad = 244  -- ASUNCIÓN
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE tu.Finalizado = 1
  AND ei.IdLocalidad IS NULL
  AND (ei.IdDepartamento = 20 OR ei.IdDepartamento = 0 OR ei.IdDepartamento IS NULL);

-- Verificar el resultado
SELECT COUNT(*) as 'Registros corregidos'
FROM dbo.EmpresaInfo ei
INNER JOIN dbo.TestUsuario tu ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
WHERE tu.Finalizado = 1
  AND ei.IdLocalidad = 244;

-- COMMIT; -- Descomenta esta línea para aplicar los cambios
-- ROLLBACK; -- Usa esta línea para revertir los cambios
`;

  console.log(previewSQL);
  console.log('\n⚠️  IMPORTANTE:');
  console.log('- Comenta ROLLBACK y descomenta COMMIT para aplicar los cambios');
  console.log('- Mantén ROLLBACK para solo hacer preview sin cambios');
}

async function main() {
  try {
    const analysis = await analyzeMissingRecords();
    console.log('\n' + '='.repeat(80));
    await previewPatch();
    
    console.log('\n✅ ANÁLISIS COMPLETADO');
    console.log(`📈 Total registros que serían corregidos: ${analysis.totalAfectados}`);
    console.log(`🏛️  Capital actual: ${analysis.totalCapital}`);
    console.log(`🎯 Capital después del patch: ${analysis.totalDespues}`);
    
  } catch (error) {
    console.error('❌ Error en el análisis:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { analyzeMissingRecords, previewPatch };
