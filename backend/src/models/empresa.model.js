const { poolPromise, sql } = require('../config/database');
const logger = require('../utils/logger');

class EmpresaModel {
  /**
   * Get companies with pagination and filters
   * @param {Object} options - Query options
   * @param {Number} options.page - Page number
   * @param {Number} options.limit - Number of items per page
   * @param {String} options.searchTerm - Search term
   * @param {Object} options.filters - Filter options
   * @returns {Promise<Object>} - Paginated result with companies and count
   */
  static async getEmpresas({ page = 1, limit = 10, searchTerm = '', filters = {}, finalizado = 1 }) {
    try {
      const offset = (page - 1) * limit;

      // normaliza filtros - arreglar lógica del toggle
      const onlyFinal = filters.estadoEncuesta === undefined ? finalizado : (filters.estadoEncuesta === true ? 1 : 0);

      const pool = await poolPromise;

      // tipa parámetros (¡ojo: búsqueda por PREFIJO!)
      const addParams = (req) => {
        req.input('offset',          sql.Int,           offset);
        req.input('limit',           sql.Int,           limit);
        req.input('searchTerm',      sql.NVarChar(200), searchTerm || null);
        req.input('sectorActividad', sql.NVarChar(150), filters.sectorActividad || null);
        req.input('departamento',    sql.NVarChar(100), filters.departamento || null);
        req.input('distrito',        sql.NVarChar(100), filters.distrito || null);
        req.input('nivelInnovacion', sql.NVarChar(100), filters.nivelInnovacion || null);
        req.input('finalizado',      sql.Bit,           onlyFinal);
      };

      const DATA_QUERY = `
/* ===== 1 fila por IdTestUsuario, con paginado y total correctos ===== */
WITH Filtered AS (
  SELECT tu.IdTestUsuario, tu.IdUsuario, tu.Test, tu.FechaTest, tu.FechaTerminoTest
  FROM dbo.TestUsuario tu
  WHERE (@finalizado IS NULL OR tu.Finalizado = @finalizado)
    AND EXISTS (SELECT 1 FROM dbo.Respuesta r
                WHERE r.IdUsuario = tu.IdUsuario AND r.Test = tu.Test)
),
Enriched AS (
  /* 1 solo EmpresaInfo por (usuario,test) */
SELECT 
    f.IdTestUsuario, f.IdUsuario, f.Test, f.FechaTest, f.FechaTerminoTest,
    ei.IdEmpresa, ei.IdDepartamento, ei.IdLocalidad, ei.IdSectorActividad, ei.IdVentas,
    ei.AnnoCreacion, ei.TotalEmpleados, ei.SexoGerenteGeneral, ei.SexoPropietarioPrincipal
  FROM Filtered f
  OUTER APPLY (
    SELECT TOP (1) ei.*
    FROM dbo.EmpresaInfo ei
    WHERE ei.IdUsuario = f.IdUsuario AND ei.Test = f.Test
    ORDER BY ei.IdEmpresa DESC
  ) ei
  WHERE
    (@sectorActividad IS NULL OR EXISTS (
      SELECT 1 FROM dbo.SectorActividad sa
      WHERE sa.IdSectorActividad = ei.IdSectorActividad AND sa.Descripcion = @sectorActividad))
  AND (@departamento IS NULL OR EXISTS (
      SELECT 1 FROM dbo.Departamentos dep
      WHERE dep.IdDepartamento = ei.IdDepartamento AND dep.Nombre = @departamento))
  AND (@distrito IS NULL OR EXISTS (
      SELECT 1 FROM dbo.SubRegion sr
      WHERE sr.IdSubRegion = ei.IdLocalidad AND sr.Nombre = @distrito))
  AND (
       @searchTerm IS NULL
    OR EXISTS (SELECT 1 FROM dbo.Empresa e
               WHERE e.IdEmpresa = ei.IdEmpresa AND e.Nombre LIKE @searchTerm + '%')
    OR EXISTS (SELECT 1 FROM dbo.Departamentos dep
               WHERE dep.IdDepartamento = ei.IdDepartamento AND dep.Nombre LIKE @searchTerm + '%')
    OR EXISTS (SELECT 1 FROM dbo.SubRegion sr
               WHERE sr.IdSubRegion = ei.IdLocalidad AND sr.Nombre LIKE @searchTerm + '%')
    OR EXISTS (SELECT 1 FROM dbo.SectorActividad sa
               WHERE sa.IdSectorActividad = ei.IdSectorActividad AND sa.Descripcion LIKE @searchTerm + '%')
  )
),
Dedup AS (
  SELECT e.*,
         ROW_NUMBER() OVER (PARTITION BY e.IdTestUsuario ORDER BY e.FechaTest DESC, e.IdTestUsuario DESC) AS rn
  FROM Enriched e
),
/* ⚠️ Cerramos aquí la cardinalidad y el total para que no "explote" luego */
Base AS (
  SELECT
    d.*,
    ROW_NUMBER() OVER (ORDER BY d.FechaTest DESC, d.IdTestUsuario DESC) AS RowNum,
    COUNT(*)    OVER ()                                                AS TotalRows
  FROM Dedup d
  WHERE d.rn = 1
),
/* Paginamos sobre Base primero (1×IdTestUsuario) */
Page AS (
  SELECT *
  FROM Base
  WHERE RowNum BETWEEN @offset + 1 AND @offset + @limit
)
/* Decoramos la página con nombres/descr. usando APPLY (1:1), sin multiplicar */
SELECT
  p.IdTestUsuario,
  p.IdEmpresa,
  e.Nombre                           AS empresa,
  u.NombreCompleto                   AS nombreCompleto,
  sr.Nombre                          AS distrito,
  dep.Nombre                         AS departamento,
  sa.Descripcion                     AS sectorActividadDescripcion,
  p.TotalEmpleados AS totalEmpleados,
  va.Nombre                          AS ventasAnuales,
  rnd.ptjeTotalUsuario               AS puntajeNivelDeMadurezGeneral,
  nm.Descripcion                     AS nivelDeMadurezGeneral,
  CONVERT(VARCHAR(10), p.FechaTest, 103) + ' ' + CONVERT(VARCHAR(8), p.FechaTest, 14) AS fechaTest,
  p.TotalRows
FROM Page p
OUTER APPLY (SELECT TOP (1) e.*   FROM dbo.Empresa        e  WHERE e.IdEmpresa          = p.IdEmpresa)        e
OUTER APPLY (SELECT TOP (1) u.*   FROM dbo.Usuario        u  WHERE u.IdUsuario          = p.IdUsuario)        u
OUTER APPLY (SELECT TOP (1) dep.* FROM dbo.Departamentos  dep WHERE dep.IdDepartamento   = p.IdDepartamento)  dep
OUTER APPLY (SELECT TOP (1) sr.*  FROM dbo.SubRegion      sr  WHERE sr.IdSubRegion       = p.IdLocalidad)     sr
OUTER APPLY (SELECT TOP (1) sa.*  FROM dbo.SectorActividad sa WHERE sa.IdSectorActividad = p.IdSectorActividad) sa
OUTER APPLY (SELECT TOP (1) va.*  FROM dbo.VentasAnuales  va  WHERE va.IdVentasAnuales   = p.IdVentas)        va
OUTER APPLY (
  SELECT TOP (1) rnd.IdNivelMadurez, rnd.ptjeTotalUsuario
  FROM dbo.ResultadoNivelDigital rnd
  WHERE rnd.IdUsuario = p.IdUsuario AND rnd.Test = p.Test
  ORDER BY rnd.IdResultadoNivelDigital DESC
) rnd
OUTER APPLY (SELECT TOP (1) nm.* FROM dbo.NivelMadurez nm WHERE nm.IdNivelMadurez = rnd.IdNivelMadurez) nm
ORDER BY p.RowNum
OPTION (RECOMPILE);
`;

      // ejecuta (SOLO una query ahora)
      const dataReq = pool.request(); addParams(dataReq);
      const dataRs = await dataReq.query(DATA_QUERY);

      const totalCount = dataRs.recordset[0]?.TotalRows ?? 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: dataRs.recordset,
        pagination: { total: totalCount, page, limit, totalPages }
      };
    } catch (err) {
      logger.error(`Error getting empresas: ${err.message}`);
      throw err;
    }
  }
  
  /**
   * Get company details by ID
   * @param {Number} idEmpresa - Company ID
   * @returns {Promise<Object>} - Company details
   */
  static async getEmpresaById(idEmpresa) {
    try {
      const pool = await poolPromise;
      const request = pool.request();
      request.input('idEmpresa', sql.Int, idEmpresa);
      
      const query = `
        WITH LatestTest AS (
          SELECT TOP 1 
            tu.IdUsuario,
            tu.Test,
            tu.FechaTest
          FROM EmpresaInfo ei
          INNER JOIN TestUsuario tu ON ei.IdUsuario = tu.IdUsuario
          WHERE ei.IdEmpresa = @idEmpresa
          ORDER BY tu.FechaTest DESC
        )
        SELECT
          e.IdEmpresa,
          e.Nombre AS empresa,
          e.Rut AS ruc,
          sr.Nombre AS distrito,
          dep.Nombre AS departamento,
          CONCAT(sr.Nombre, ', ', dep.Nombre) AS ubicacion,
          sa.Descripcion AS sectorActividadDescripcion,
          ssa.Descripcion AS subSectorActividadDescripcion,
          ei.AnnoCreacion AS anioCreacion,
          ei.TotalEmpleados,
          va.Nombre AS ventasAnuales,
          ei.SexoGerenteGeneral,
          ei.SexoPropietarioPrincipal,
          rnd.ptjeTotalUsuario AS puntajeGeneral,
          nm.Descripcion AS nivelMadurez,
          rnd.ptjeDimensionTecnologia AS puntajeTecnologia,
          rnd.ptjeDimensionComunicacion AS puntajeComunicacion,
          rnd.ptjeDimensionOrganizacion AS puntajeOrganizacion,
          rnd.ptjeDimensionDatos AS puntajeDatos,
          rnd.ptjeDimensionEstrategia AS puntajeEstrategia,
          rnd.ptjeDimensionProcesos AS puntajeProcesos,
          lt.FechaTest
        FROM Empresa e
        INNER JOIN EmpresaInfo ei ON e.IdEmpresa = ei.IdEmpresa
        LEFT JOIN LatestTest lt ON ei.IdUsuario = lt.IdUsuario
        LEFT JOIN Departamentos dep ON ei.IdDepartamento = dep.IdDepartamento
        LEFT JOIN SubRegion sr ON ei.IdLocalidad = sr.IdSubRegion
        LEFT JOIN SectorActividad sa ON ei.IdSectorActividad = sa.IdSectorActividad
        LEFT JOIN SubSectorActividad ssa ON ei.IdSubSectorActividad = ssa.IdSubSectorActividad
        LEFT JOIN VentasAnuales va ON ei.IdVentas = va.IdVentasAnuales
        LEFT JOIN ResultadoNivelDigital rnd ON lt.IdUsuario = rnd.IdUsuario AND lt.Test = rnd.Test
        LEFT JOIN NivelMadurez nm ON rnd.IdNivelMadurez = nm.IdNivelMadurez
        WHERE e.IdEmpresa = @idEmpresa
      `;
      
      const result = await request.query(query);
      
      if (result.recordset.length === 0) {
        return null;
      }
      
      return result.recordset[0];
    } catch (error) {
      logger.error(`Error getting empresa by ID: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get KPIs for companies list
   * @param {Number} finalizado - Filter by finalized status (1 = finalized, 0 = not finalized)
   * @param {Object} filters - Additional filters (departamento, distrito, nivelInnovacion, sectorActividad)
   * @returns {Promise<Object>} - KPI data
   */
  static async getKPIs(finalizado = 1, filters = {}) {
    try {
      const pool = await poolPromise;
      const req = pool.request();
      req.input('finalizado',      sql.Bit,           finalizado);
      req.input('sectorActividad', sql.NVarChar(150), filters.sectorActividad || null);
      req.input('departamento',    sql.NVarChar(100), filters.departamento || null);
      req.input('distrito',        sql.NVarChar(100), filters.distrito || null);
      req.input('nivelInnovacion', sql.NVarChar(100), filters.nivelInnovacion || null);

      const KPI_QUERY = `
      WITH Filtered AS (
        SELECT tu.IdTestUsuario, tu.IdUsuario, tu.Test, tu.FechaTest, tu.FechaTerminoTest
        FROM dbo.TestUsuario tu
        WHERE (@finalizado IS NULL OR tu.Finalizado = @finalizado)
          AND EXISTS (SELECT 1 FROM dbo.Respuesta r
                      WHERE r.IdUsuario = tu.IdUsuario AND r.Test = tu.Test)
      ),
      Enriched AS (
        SELECT f.IdTestUsuario, f.IdUsuario, f.Test, f.FechaTest, f.FechaTerminoTest,
               ei.IdEmpresa, ei.IdDepartamento, ei.IdLocalidad, ei.IdSectorActividad, ei.IdVentas,
               ei.AnnoCreacion, ei.TotalEmpleados
        FROM Filtered f
        OUTER APPLY (
          SELECT TOP (1) ei.*
          FROM dbo.EmpresaInfo ei
          WHERE ei.IdUsuario = f.IdUsuario AND ei.Test = f.Test
          ORDER BY ei.IdEmpresa DESC
        ) ei
        WHERE
          (@sectorActividad IS NULL OR EXISTS (
            SELECT 1 FROM dbo.SectorActividad sa
            WHERE sa.IdSectorActividad = ei.IdSectorActividad AND sa.Descripcion = @sectorActividad))
        AND (@departamento IS NULL OR EXISTS (
            SELECT 1 FROM dbo.Departamentos dep
            WHERE dep.IdDepartamento = ei.IdDepartamento AND dep.Nombre = @departamento))
        AND (@distrito IS NULL OR EXISTS (
            SELECT 1 FROM dbo.SubRegion sr
            WHERE sr.IdSubRegion = ei.IdLocalidad AND sr.Nombre = @distrito))
        AND (@nivelInnovacion IS NULL OR EXISTS (
            SELECT 1
            FROM dbo.ResultadoNivelDigital rnd
            JOIN dbo.NivelMadurez nm ON nm.IdNivelMadurez = rnd.IdNivelMadurez
            WHERE rnd.IdUsuario = f.IdUsuario AND rnd.Test = f.Test
              AND nm.Descripcion = @nivelInnovacion))
      ),
      Dedup AS (
        SELECT e.*,
               ROW_NUMBER() OVER (PARTITION BY e.IdTestUsuario
                                  ORDER BY e.FechaTest DESC, e.IdTestUsuario DESC) AS rn
        FROM Enriched e
      ),
      Base AS (
        SELECT * FROM Dedup WHERE rn = 1
      )
      SELECT
        /* Total empresas únicas */
        (SELECT COUNT(DISTINCT b1.IdEmpresa) FROM Base b1) AS totalEmpresas,

        /* Promedio de puntaje (último RND por test) */
        (SELECT CONVERT(DECIMAL(5,2), AVG(r1.ptjeTotalUsuario))
         FROM Base b1
         OUTER APPLY (
           SELECT TOP (1) rnd.ptjeTotalUsuario
           FROM dbo.ResultadoNivelDigital rnd
           WHERE rnd.IdUsuario = b1.IdUsuario AND rnd.Test = b1.Test
           ORDER BY rnd.IdResultadoNivelDigital DESC
         ) r1
        ) AS nivelGeneral,

        /* Empresas con Nivel 'Inicial' */
        (SELECT COUNT(DISTINCT CASE WHEN nm1.Descripcion = 'Inicial' THEN b1.IdEmpresa END)
         FROM Base b1
         OUTER APPLY (
           SELECT TOP (1) rnd.IdNivelMadurez
           FROM dbo.ResultadoNivelDigital rnd
           WHERE rnd.IdUsuario = b1.IdUsuario AND rnd.Test = b1.Test
           ORDER BY rnd.IdResultadoNivelDigital DESC
         ) r2
         OUTER APPLY (
           SELECT TOP (1) nm.Descripcion
           FROM dbo.NivelMadurez nm
           WHERE nm.IdNivelMadurez = r2.IdNivelMadurez
         ) nm1
        ) AS empresasIncipientes,

        /* Suma de empleados por empresa única */
        (SELECT SUM(x.TotalEmpleados)
         FROM (
           SELECT b2.IdEmpresa, MAX(ISNULL(b2.TotalEmpleados,0)) AS TotalEmpleados
           FROM Base b2
           GROUP BY b2.IdEmpresa
         ) x
        ) AS totalEmpleados
      OPTION (RECOMPILE);
      `;

      const rs = await req.query(KPI_QUERY);
      const row = rs.recordset[0] || {};
      return {
        totalEmpresas: row.totalEmpresas || 0,
        nivelGeneral: (row.nivelGeneral || 0).toFixed ? row.nivelGeneral.toFixed(2) : Number(row.nivelGeneral || 0).toFixed(2),
        empresasIncipientes: row.empresasIncipientes || 0,
        totalEmpleados: row.totalEmpleados || 0
      };
    } catch (error) {
      logger.error(`Error getting KPIs: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get filter options for companies list
   * @returns {Promise<Object>} - Filter options
   */
  static async getFilterOptions() {
    try {
      const pool = await poolPromise;
      
      // Departamentos
      const departamentosQuery = `SELECT DISTINCT Nombre FROM Departamentos`;
      
      // Distritos (SubRegion)
      const distritosQuery = `SELECT DISTINCT Nombre FROM SubRegion`;
      
      // Nivel de Innovación
      const nivelInnovacionQuery = `SELECT DISTINCT Descripcion FROM NivelMadurez`;
      
      // Sector de Actividad
      const sectorActividadQuery = `SELECT DISTINCT Descripcion FROM SectorActividad`;
      
      // Execute all queries in parallel
      const [
        departamentosResult,
        distritosResult,
        nivelInnovacionResult,
        sectorActividadResult
      ] = await Promise.all([
        pool.request().query(departamentosQuery),
        pool.request().query(distritosQuery),
        pool.request().query(nivelInnovacionQuery),
        pool.request().query(sectorActividadQuery)
      ]);
      
      return {
        departamentos: departamentosResult.recordset.map(item => item.Nombre).sort(),
        distritos: distritosResult.recordset.map(item => item.Nombre).sort(),
        nivelesInnovacion: nivelInnovacionResult.recordset.map(item => item.Descripcion).sort(),
        sectoresActividad: sectorActividadResult.recordset.map(item => item.Descripcion).sort(),
        estadosEncuesta: [
          { value: true, label: 'Completado' },
          { value: false, label: 'En Progreso' }
        ]
      };
    } catch (error) {
      logger.error(`Error getting filter options: ${error.message}`);
      throw error;
    }
  }
}

module.exports = EmpresaModel;