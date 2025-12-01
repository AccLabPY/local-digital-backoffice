const { poolPromise, sql } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Rechequeos Model - Optimized with SQL Views
 * Uses pre-calculated views for maximum performance
 * Falls back to original model if views don't exist
 */
class RechequeosModelOptimizedViews {
  /**
   * Check if optimized views exist
   */
  static async hasOptimizedViews() {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT 
          COUNT(*) AS ViewCount
        FROM sys.views
        WHERE name IN ('vw_RechequeosBase', 'vw_RechequeosKPIs', 'vw_RechequeosTabla')
      `);
      
      const viewCount = result.recordset[0].ViewCount;
      const hasAll = viewCount === 3;
      
      if (!hasAll) {
        logger.warn(`⚠️ Only ${viewCount}/3 optimized views found. Falling back to original queries.`);
      }
      
      return hasAll;
    } catch (error) {
      logger.error(`Error checking for optimized views: ${error.message}`);
      return false;
    }
  }

  /**
   * Parse query parameters (same as original)
   */
  static parseFilters(query) {
    const parseQueryArray = (value) => {
      if (!value) return [];
      return Array.isArray(value) ? value : [value];
    };

    return {
      departamento: parseQueryArray(query.departamento),
      distrito: parseQueryArray(query.distrito),
      nivelInnovacion: parseQueryArray(query.nivelInnovacion),
      sectorActividad: parseQueryArray(query.sectorActividad),
      subSectorActividad: parseQueryArray(query.subSectorActividad),
      tamanoEmpresa: parseQueryArray(query.tamanoEmpresa),
      fechaIni: query.fechaIni || null,
      fechaFin: query.fechaFin || null,
      search: query.search || '',
      sortBy: query.sortBy || 'UltimaFecha',
      sortOrder: query.sortOrder || 'desc'
    };
  }

  /**
   * Build WHERE clause for filtered queries on views
   */
  static buildWhereClause(filters) {
    const conditions = [];
    const params = [];

    // Date filters
    if (filters.fechaIni) {
      conditions.push('UltimaFecha >= @fechaIni');
      params.push({ name: 'fechaIni', type: sql.Date, value: filters.fechaIni });
    }
    if (filters.fechaFin) {
      conditions.push('UltimaFecha <= @fechaFin');
      params.push({ name: 'fechaFin', type: sql.Date, value: filters.fechaFin });
    }

    // Departamento (including Capital)
    if (filters.departamento && filters.departamento.length > 0) {
      const paramNames = [];
      filters.departamento.forEach((dept, i) => {
        const paramName = `dep${i}`;
        paramNames.push(`@${paramName}`);
        params.push({ name: paramName, type: sql.NVarChar(500), value: dept });
      });
      conditions.push(`Departamento IN (${paramNames.join(', ')})`);
    }

    // Distrito (including OTRO)
    if (filters.distrito && filters.distrito.length > 0) {
      const paramNames = [];
      filters.distrito.forEach((dist, i) => {
        const paramName = `dist${i}`;
        paramNames.push(`@${paramName}`);
        params.push({ name: paramName, type: sql.NVarChar(500), value: dist });
      });
      conditions.push(`Distrito IN (${paramNames.join(', ')})`);
    }

    // Nivel de innovación
    if (filters.nivelInnovacion && filters.nivelInnovacion.length > 0) {
      const paramNames = [];
      filters.nivelInnovacion.forEach((nivel, i) => {
        const paramName = `nivel${i}`;
        paramNames.push(`@${paramName}`);
        params.push({ name: paramName, type: sql.NVarChar(500), value: nivel });
      });
      conditions.push(`Nivel_Ultimo IN (${paramNames.join(', ')})`);
    }

    // Sector de actividad
    if (filters.sectorActividad && filters.sectorActividad.length > 0) {
      const paramNames = [];
      filters.sectorActividad.forEach((sector, i) => {
        const paramName = `sector${i}`;
        paramNames.push(`@${paramName}`);
        params.push({ name: paramName, type: sql.NVarChar(500), value: sector });
      });
      conditions.push(`SectorActividad IN (${paramNames.join(', ')})`);
    }

    // SubSector de actividad
    if (filters.subSectorActividad && filters.subSectorActividad.length > 0) {
      const paramNames = [];
      filters.subSectorActividad.forEach((subsector, i) => {
        const paramName = `subsector${i}`;
        paramNames.push(`@${paramName}`);
        params.push({ name: paramName, type: sql.NVarChar(500), value: subsector });
      });
      conditions.push(`SubSectorActividad IN (${paramNames.join(', ')})`);
    }

    // Tamaño de empresa
    if (filters.tamanoEmpresa && filters.tamanoEmpresa.length > 0) {
      const paramNames = [];
      filters.tamanoEmpresa.forEach((tamano, i) => {
        const paramName = `tamano${i}`;
        paramNames.push(`@${paramName}`);
        params.push({ name: paramName, type: sql.NVarChar(500), value: tamano });
      });
      conditions.push(`TamanoEmpresa IN (${paramNames.join(', ')})`);
    }

    // Search
    if (filters.search && filters.search.trim() !== '') {
      conditions.push(`(
        EmpresaNombre LIKE @search 
        OR SectorActividad LIKE @search 
        OR NombreUsuario LIKE @search
        OR Departamento LIKE @search
        OR Distrito LIKE @search
      )`);
      params.push({ name: 'search', type: sql.NVarChar(500), value: `%${filters.search}%` });
    }

    return { conditions, params };
  }

  /**
   * Get KPIs using optimized views (ULTRA FAST)
   */
  static async getKPIs(filters = {}) {
    const startTime = Date.now();
    
    try {
      logger.info(`[RECHEQUEOS OPT-VIEWS] Getting KPIs with filters`);

      const pool = await poolPromise;
      const { conditions, params } = this.buildWhereClause(filters);

      const req = pool.request();
      req.timeout = 60000; // 60 seconds for filtered queries

      // Add parameters
      params.forEach(p => req.input(p.name, p.type, p.value));

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      // Query using pre-calculated view
      // IMPORTANTE: Distribución desde vw_RechequeosBase (incluye 1+ chequeos)
      //             KPIs de mejora desde vw_RechequeosKPIs (solo 2+ chequeos)
      const KPI_QUERY = `
        WITH 
        -- Distribución desde vw_RechequeosBase (incluye TODOS los conteos, incluso 1 chequeo)
        ConteosBase AS (
          SELECT 
            ClaveEntidad,
            MAX(TotalChequeosValidos) AS TotalChequeos
          FROM dbo.vw_RechequeosBase WITH (NOLOCK)
          ${whereClause}
          GROUP BY ClaveEntidad
        ),
        Distribucion AS (
          SELECT
            SUM(CASE WHEN TotalChequeos = 1 THEN 1 ELSE 0 END) AS Dist1,
            SUM(CASE WHEN TotalChequeos BETWEEN 2 AND 3 THEN 1 ELSE 0 END) AS Dist2_3,
            SUM(CASE WHEN TotalChequeos > 3 THEN 1 ELSE 0 END) AS DistGt3,
            COUNT(*) AS TotalEmpresasUnicas,
            SUM(TotalChequeos) AS TotalChequeos
          FROM ConteosBase
        ),
        -- KPIs de rechequeos (CON filtros, solo entidades con 2+ chequeos válidos)
        KPIsRechequeos AS (
          SELECT
            COUNT(DISTINCT ClaveEntidad) AS EmpresasConRechequeos,
            AVG(CAST(DiasEntreChequeos AS FLOAT)) AS TiempoPromEntreChequeosDias,
            AVG(CAST(DeltaGlobal AS FLOAT)) AS DeltaGlobalProm,
            AVG(CAST(DeltaTecnologia AS FLOAT)) AS DeltaTecnologiaProm,
            AVG(CAST(DeltaComunicacion AS FLOAT)) AS DeltaComunicacionProm,
            AVG(CAST(DeltaOrganizacion AS FLOAT)) AS DeltaOrganizacionProm,
            AVG(CAST(DeltaDatos AS FLOAT)) AS DeltaDatosProm,
            AVG(CAST(DeltaEstrategia AS FLOAT)) AS DeltaEstrategiaProm,
            AVG(CAST(DeltaProcesos AS FLOAT)) AS DeltaProcesosProm,
            AVG(CAST(TieneMejoraPositiva AS FLOAT)) AS PctMejoraPositiva,
            AVG(CAST(TieneRegresion AS FLOAT)) AS PctRegresion,
            SUM(SaltoBajoMedio) AS TotalSaltosBajoMedio,
            SUM(SaltoMedioAlto) AS TotalSaltosMedioAlto,
            AVG(CAST(TasaMejoraMensual AS FLOAT)) AS TasaMejoraMensual,
            AVG(CAST(EsConsistente AS FLOAT)) AS IndiceConsistencia
          FROM dbo.vw_RechequeosKPIs WITH (NOLOCK)
          ${whereClause}
        )
        SELECT
          -- Cobertura y distribución (CON FILTROS - responden a filtros activos)
          d.TotalEmpresasUnicas,
          d.Dist1,
          d.Dist2_3,
          d.DistGt3,
          CAST(d.TotalChequeos AS FLOAT) / NULLIF(d.TotalEmpresasUnicas, 0) AS PromChequeosPorEmpresa,
          -- KPIs de rechequeos (con filtros)
          kpi.EmpresasConRechequeos,
          kpi.TiempoPromEntreChequeosDias,
          kpi.DeltaGlobalProm,
          kpi.DeltaTecnologiaProm,
          kpi.DeltaComunicacionProm,
          kpi.DeltaOrganizacionProm,
          kpi.DeltaDatosProm,
          kpi.DeltaEstrategiaProm,
          kpi.DeltaProcesosProm,
          kpi.PctMejoraPositiva,
          kpi.PctRegresion,
          kpi.TotalSaltosBajoMedio,
          kpi.TotalSaltosMedioAlto,
          kpi.TasaMejoraMensual,
          kpi.IndiceConsistencia
        FROM Distribucion d
        CROSS JOIN KPIsRechequeos kpi
        OPTION (RECOMPILE, MAXDOP 0, USE HINT('ENABLE_PARALLEL_PLAN_PREFERENCE'));
      `;

      const result = await req.query(KPI_QUERY);
      const row = result.recordset[0] || {};

      const elapsed = Date.now() - startTime;
      logger.info(`[RECHEQUEOS OPT-VIEWS] KPIs retrieved in ${elapsed}ms ⚡`);

      const empresasConRechequeos = row.EmpresasConRechequeos || 0;
      const totalEmpresas = row.TotalEmpresasUnicas || 0;
      const tasaReincidencia = totalEmpresas > 0
        ? (empresasConRechequeos / totalEmpresas)
        : 0;

      return {
        cobertura: {
          tasaReincidencia: tasaReincidencia,
          promChequeosPorEmpresa: row.PromChequeosPorEmpresa || 0,
          tiempoPromEntreChequeosDias: row.TiempoPromEntreChequeosDias || 0,
          distribucion: {
            "1": row.Dist1 || 0,
            "2_3": row.Dist2_3 || 0,
            "gt_3": row.DistGt3 || 0
          }
        },
        magnitud: {
          deltaGlobalProm: row.DeltaGlobalProm || 0,
          deltaPorDimension: {
            "Tecnología": row.DeltaTecnologiaProm || 0,
            "Comunicación": row.DeltaComunicacionProm || 0,
            "Organización": row.DeltaOrganizacionProm || 0,
            "Datos": row.DeltaDatosProm || 0,
            "Estrategia": row.DeltaEstrategiaProm || 0,
            "Procesos": row.DeltaProcesosProm || 0
          },
          pctMejoraPositiva: row.PctMejoraPositiva || 0,
          pctRegresion: row.PctRegresion || 0,
          saltosNivel: {
            "bajo_medio": row.TotalSaltosBajoMedio || 0,
            "medio_alto": row.TotalSaltosMedioAlto || 0
          }
        },
        velocidad: {
          tasaMejoraMensual: row.TasaMejoraMensual || 0,
          indiceConsistencia: row.IndiceConsistencia || 0,
          ratioMejoraTemprana: 0.5 // Placeholder
        }
      };

    } catch (error) {
      logger.error(`[RECHEQUEOS OPT-VIEWS] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get table data using optimized views (ULTRA FAST)
   */
  static async getTableData({ page = 1, limit = 50, filters = {} }) {
    const startTime = Date.now();
    
    try {
      logger.info(`[RECHEQUEOS OPT-VIEWS] Getting table data (page ${page}, limit ${limit})`);

      const offset = (page - 1) * limit;
      const pool = await poolPromise;
      const { conditions, params } = this.buildWhereClause(filters);

      const req = pool.request();
      req.timeout = 60000; // 60 seconds for filtered queries
      req.input('offset', sql.Int, offset);
      req.input('limit', sql.Int, limit);

      // Add filter parameters
      params.forEach(p => req.input(p.name, p.type, p.value));

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      // Column mapping for sorting
      const columnMapping = {
        'EmpresaNombre': 'EmpresaNombre',
        'TamanoEmpresa': 'TamanoEmpresa',
        'SectorActividad': 'SectorActividad',
        'Departamento': 'Departamento',
        'TotalChequeos': 'TotalChequeos',
        'PrimeraFecha': 'PrimeraFecha',
        'UltimaFecha': 'UltimaFecha',
        'UltimaFechaTermino': 'UltimaFecha',
        'DiasEntreChequeos': 'DiasEntreChequeos',
        'DeltaGlobal': 'DeltaGlobal',
        'TasaMejoraMensual': 'TasaMejoraMensual'
      };

      const sortBy = filters.sortBy || 'UltimaFecha';
      const sortColumn = columnMapping[sortBy] || 'UltimaFecha';
      const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

      // Query using pre-calculated view
      const TABLE_QUERY = `
        SELECT
          IdEmpresa,
          EmpresaNombre,
          NombreUsuario,
          SectorActividad,
          SubSectorActividad,
          TamanoEmpresa,
          Departamento,
          Distrito,
          Ubicacion,
          TotalChequeos,
          FORMAT(PrimeraFecha, 'dd/MM/yyyy') AS PrimeraFechaFormatted,
          FORMAT(UltimaFecha, 'dd/MM/yyyy') AS UltimaFechaFormatted,
          PrimerPuntaje,
          PrimerNivel,
          UltimoPuntaje,
          UltimoNivel,
          DeltaGlobal,
          DeltaTecnologia,
          DeltaComunicacion,
          DeltaOrganizacion,
          DeltaDatos,
          DeltaEstrategia,
          DeltaProcesos,
          DiasEntreChequeos,
          TasaMejoraMensual,
          SaltoBajoMedio,
          SaltoMedioAlto,
          COUNT(*) OVER() AS TotalRows
        FROM dbo.vw_RechequeosTabla WITH (NOLOCK)
        ${whereClause}
        ORDER BY ${sortColumn} ${sortOrder}
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        OPTION (RECOMPILE, MAXDOP 0, USE HINT('ENABLE_PARALLEL_PLAN_PREFERENCE'));
      `;

      const result = await req.query(TABLE_QUERY);

      const totalCount = result.recordset[0]?.TotalRows ?? 0;
      const totalPages = Math.ceil(totalCount / limit);

      const elapsed = Date.now() - startTime;
      logger.info(`[RECHEQUEOS OPT-VIEWS] Table data retrieved in ${elapsed}ms ⚡ (${result.recordset.length} rows)`);

      return {
        data: result.recordset,
        pagination: { total: totalCount, page, limit, totalPages }
      };

    } catch (error) {
      logger.error(`[RECHEQUEOS OPT-VIEWS] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get evolution series (optimized)
   */
  static async getEvolutionSeries(filters = {}, category = 'tamano') {
    const startTime = Date.now();
    
    try {
      logger.info(`[RECHEQUEOS OPT-VIEWS] Getting evolution series for: ${category}`);

      const pool = await poolPromise;
      const { conditions, params } = this.buildWhereClause(filters);

      const req = pool.request();
      req.timeout = 30000;

      params.forEach(p => req.input(p.name, p.type, p.value));

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      const categoryMapping = {
        'tamano': 'TamanoEmpresa',
        'sector': 'SectorActividad',
        'departamento': 'Departamento'
      };

      const categoryField = categoryMapping[category] || 'TamanoEmpresa';

      const SERIES_QUERY = `
        SELECT
          ${categoryField} AS CategoryValue,
          YEAR(UltimaFecha) AS Anno,
          MONTH(UltimaFecha) AS Mes,
          AVG(CAST(UltimoPuntaje AS FLOAT)) AS PuntajePromedio,
          COUNT(DISTINCT ClaveEntidad) AS EmpresasUnicas
        FROM dbo.vw_RechequeosTabla WITH (NOLOCK)
        ${whereClause}
        GROUP BY ${categoryField}, YEAR(UltimaFecha), MONTH(UltimaFecha)
        ORDER BY ${categoryField}, Anno, Mes
        OPTION (RECOMPILE);
      `;

      const result = await req.query(SERIES_QUERY);

      const elapsed = Date.now() - startTime;
      logger.info(`[RECHEQUEOS OPT-VIEWS] Evolution series retrieved in ${elapsed}ms ⚡`);

      return result.recordset.map(row => ({
        categoria: row.CategoryValue || 'Sin categoría',
        periodo: `${row.Anno}-${String(row.Mes).padStart(2, '0')}`,
        puntajePromedio: row.PuntajePromedio || 0,
        empresasUnicas: row.EmpresasUnicas || 0
      }));

    } catch (error) {
      logger.error(`[RECHEQUEOS OPT-VIEWS] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get heatmap data (optimized)
   */
  static async getHeatmapData(filters = {}) {
    const startTime = Date.now();
    
    try {
      logger.info('[RECHEQUEOS OPT-VIEWS] Getting heatmap data');

      const pool = await poolPromise;
      const { conditions, params } = this.buildWhereClause(filters);

      const req = pool.request();
      req.timeout = 30000;

      params.forEach(p => req.input(p.name, p.type, p.value));

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      const HEATMAP_QUERY = `
        SELECT
          SectorActividad,
          AVG(CAST(DeltaTecnologia AS FLOAT)) AS PromDeltaTecnologia,
          AVG(CAST(DeltaComunicacion AS FLOAT)) AS PromDeltaComunicacion,
          AVG(CAST(DeltaOrganizacion AS FLOAT)) AS PromDeltaOrganizacion,
          AVG(CAST(DeltaDatos AS FLOAT)) AS PromDeltaDatos,
          AVG(CAST(DeltaEstrategia AS FLOAT)) AS PromDeltaEstrategia,
          AVG(CAST(DeltaProcesos AS FLOAT)) AS PromDeltaProcesos,
          COUNT(DISTINCT ClaveEntidad) AS EmpresasEnSector
        FROM dbo.vw_RechequeosKPIs WITH (NOLOCK)
        ${whereClause}
          AND SectorActividad IS NOT NULL 
          AND SectorActividad <> '' 
          AND SectorActividad <> 'N/A'
        GROUP BY SectorActividad
        HAVING COUNT(DISTINCT ClaveEntidad) > 0
        ORDER BY SectorActividad
        OPTION (RECOMPILE);
      `;

      const result = await req.query(HEATMAP_QUERY);

      const elapsed = Date.now() - startTime;
      logger.info(`[RECHEQUEOS OPT-VIEWS] Heatmap data retrieved in ${elapsed}ms ⚡`);

      return result.recordset
        .filter(row => row.SectorActividad && row.SectorActividad.trim() !== '')
        .map(row => ({
          sector: row.SectorActividad.trim(),
          tecnologia: parseFloat(row.PromDeltaTecnologia) || 0,
          comunicacion: parseFloat(row.PromDeltaComunicacion) || 0,
          organizacion: parseFloat(row.PromDeltaOrganizacion) || 0,
          datos: parseFloat(row.PromDeltaDatos) || 0,
          estrategia: parseFloat(row.PromDeltaEstrategia) || 0,
          procesos: parseFloat(row.PromDeltaProcesos) || 0,
          empresasEnSector: row.EmpresasEnSector || 0
        }));

    } catch (error) {
      logger.error(`[RECHEQUEOS OPT-VIEWS] Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get filter options (reuse from original model)
   */
  static async getFilterOptions(activeFilters = {}) {
    try {
      const EmpresaModel = require('./empresa.model');
      return await EmpresaModel.getFilterOptions(activeFilters);
    } catch (error) {
      logger.error(`Error getting filter options: ${error.message}`);
      throw error;
    }
  }
}

module.exports = RechequeosModelOptimizedViews;

