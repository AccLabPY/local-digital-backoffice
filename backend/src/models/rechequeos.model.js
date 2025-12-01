const { poolPromise, sql } = require('../config/database');
const logger = require('../utils/logger');

class RechequeosModel {
  /**
   * Parse query parameters for filters
   * @param {Object} query - Query parameters
   * @returns {Object} - Parsed filters
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
      sortBy: query.sortBy || 'UltimaFechaTermino',
      sortOrder: query.sortOrder || 'desc'
    };
  }

  /**
   * Build WHERE clause for filters
   * @param {Object} filters - Filter object
   * @returns {Object} - WHERE conditions and parameters
   */
  static buildWhereClause(filters) {
    const conditions = [];
    let allParams = [];
    
    // Helper function to add IN conditions
    const addInCondition = (field, values, table, paramPrefix, joinField) => {
      if (values && Array.isArray(values) && values.length > 0) {
        const paramNames = [];
        const params = [];
        
        values.forEach((value, index) => {
          const paramName = `${paramPrefix}${index}`;
          paramNames.push(`@${paramName}`);
          params.push({ name: paramName, value });
        });
        
        const primaryKey = table.includes('SubRegion') ? 'IdSubRegion' : joinField;
        const condition = `EXISTS (SELECT 1 FROM ${table} t WITH (NOLOCK) WHERE t.${field} IN (${paramNames.join(', ')}) AND t.${primaryKey} = ei.${joinField})`;
        conditions.push(condition);
        return params;
      }
      return [];
    };

    // NOTE: Date filtering is now handled in the CTE by filtering on last chequeo date
    // We store the params here but don't add conditions to WHERE clause
    // The filtering happens in the EmpresasElegibles CTE
    if (filters.fechaIni) {
      allParams.push({ name: 'fechaIni', value: filters.fechaIni });
    }
    if (filters.fechaFin) {
      allParams.push({ name: 'fechaFin', value: filters.fechaFin });
    }

    // Departamento filter (including Capital)
    if (filters.departamento && Array.isArray(filters.departamento) && filters.departamento.length > 0) {
      const departamentosNormales = filters.departamento.filter(d => d !== 'Capital');
      const incluirCapital = filters.departamento.includes('Capital');
      
      if (departamentosNormales.length > 0) {
        const depParams = addInCondition('Nombre', departamentosNormales, 'dbo.Departamentos', 'dep', 'IdDepartamento');
        allParams = [...allParams, ...depParams];
      }
      
      if (incluirCapital) {
        conditions.push(`EXISTS (
          SELECT 1 FROM dbo.SubRegion sr_cap 
          WHERE sr_cap.IdSubRegion = ei.IdLocalidad 
          AND sr_cap.IdRegion = 20
        )`);
      }
    }

    // Distrito filter (including OTRO)
    if (filters.distrito && Array.isArray(filters.distrito) && filters.distrito.length > 0) {
      const distritosNormales = filters.distrito.filter(d => d !== 'OTRO');
      const incluirOtro = filters.distrito.includes('OTRO');
      
      if (distritosNormales.length > 0) {
        const distParams = addInCondition('Nombre', distritosNormales, 'dbo.SubRegion', 'dist', 'IdLocalidad');
        allParams = [...allParams, ...distParams];
      }
      
      if (incluirOtro) {
        conditions.push('ei.IdLocalidad IS NULL');
      }
    }

    // Nivel de innovación filter
    if (filters.nivelInnovacion && Array.isArray(filters.nivelInnovacion) && filters.nivelInnovacion.length > 0) {
      const paramNames = [];
      const params = [];
      
      filters.nivelInnovacion.forEach((value, index) => {
        const paramName = `nivel${index}`;
        paramNames.push(`@${paramName}`);
        params.push({ name: paramName, value });
      });
      
      const condition = `EXISTS (SELECT 1 FROM dbo.ResultadoNivelDigital rnd WITH (NOLOCK) 
        INNER JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
        WHERE rnd.IdUsuario = ei.IdUsuario AND rnd.Test = ei.Test 
        AND nm.Descripcion IN (${paramNames.join(', ')}))`;
      conditions.push(condition);
      allParams = [...allParams, ...params];
    }

    // Sector de actividad filter
    if (filters.sectorActividad && Array.isArray(filters.sectorActividad) && filters.sectorActividad.length > 0) {
      const sectorParams = addInCondition('Descripcion', filters.sectorActividad, 'dbo.SectorActividad', 'sector', 'IdSectorActividad');
      allParams = [...allParams, ...sectorParams];
    }

    // SubSector de actividad filter
    if (filters.subSectorActividad && Array.isArray(filters.subSectorActividad) && filters.subSectorActividad.length > 0) {
      const subsectorParams = addInCondition('Descripcion', filters.subSectorActividad, 'dbo.SubSectorActividad', 'subsector', 'IdSubSectorActividad');
      allParams = [...allParams, ...subsectorParams];
    }

    // Tamaño de empresa filter
    if (filters.tamanoEmpresa && Array.isArray(filters.tamanoEmpresa) && filters.tamanoEmpresa.length > 0) {
      const paramNames = [];
      const params = [];
      
      filters.tamanoEmpresa.forEach((value, index) => {
        const paramName = `tamano${index}`;
        paramNames.push(`@${paramName}`);
        params.push({ name: paramName, value });
      });
      
      const condition = `EXISTS (SELECT 1 FROM dbo.VentasAnuales va WITH (NOLOCK) 
        WHERE va.IdVentasAnuales = ei.IdVentas 
        AND va.Nombre IN (${paramNames.join(', ')}))`;
      conditions.push(condition);
      allParams = [...allParams, ...params];
    }

    return {
      whereConditions: conditions,
      allParams,
      hasFechaFilter: !!(filters.fechaIni || filters.fechaFin)
    };
  }

  /**
   * Build base CTE with 6-month validation and date filtering
   * @param {Object} filters - Filter object
   * @returns {String} - Base CTE SQL
   */
  static buildBaseCTE(filters) {
    const hasFechaFilter = !!(filters.fechaIni || filters.fechaFin);
    const { whereConditions } = this.buildWhereClause(filters);
    
    // Construir condiciones de filtro para aplicar en EmpresasElegibles
    const deptConditions = [];
    const distritoConditions = [];
    const sectorConditions = [];
    const subsectorConditions = [];
    const tamanoConditions = [];
    const nivelConditions = [];
    
    // Aplicar filtros de departamento directamente en EmpresasElegibles
    if (filters.departamento && Array.isArray(filters.departamento) && filters.departamento.length > 0) {
      const departamentosNormales = filters.departamento.filter(d => d !== 'Capital');
      const incluirCapital = filters.departamento.includes('Capital');
      
      if (departamentosNormales.length > 0) {
        const depParams = departamentosNormales.map((d, i) => `@dep${i}`).join(', ');
        deptConditions.push(`dep.Nombre IN (${depParams})`);
      }
      
      if (incluirCapital) {
        deptConditions.push(`sr.IdRegion = 20`);
      }
    }
    
    // Aplicar filtros de distrito directamente en EmpresasElegibles
    if (filters.distrito && Array.isArray(filters.distrito) && filters.distrito.length > 0) {
      const distritosNormales = filters.distrito.filter(d => d !== 'OTRO');
      const incluirOtro = filters.distrito.includes('OTRO');
      
      if (distritosNormales.length > 0) {
        const distParams = distritosNormales.map((d, i) => `@dist${i}`).join(', ');
        distritoConditions.push(`sr.Nombre IN (${distParams})`);
      }
      
      if (incluirOtro) {
        distritoConditions.push(`(ei.IdLocalidad IS NULL OR sr.Nombre IS NULL)`);
      }
    }
    
    // Aplicar filtros de sector de actividad
    if (filters.sectorActividad && Array.isArray(filters.sectorActividad) && filters.sectorActividad.length > 0) {
      const sectorParams = filters.sectorActividad.map((s, i) => `@sector${i}`).join(', ');
      sectorConditions.push(`sa.Descripcion IN (${sectorParams})`);
    }
    
    // Aplicar filtros de subsector de actividad
    if (filters.subSectorActividad && Array.isArray(filters.subSectorActividad) && filters.subSectorActividad.length > 0) {
      const subsectorParams = filters.subSectorActividad.map((ss, i) => `@subsector${i}`).join(', ');
      subsectorConditions.push(`ssa.Descripcion IN (${subsectorParams})`);
    }
    
    // Aplicar filtros de tamaño de empresa
    if (filters.tamanoEmpresa && Array.isArray(filters.tamanoEmpresa) && filters.tamanoEmpresa.length > 0) {
      const tamanoParams = filters.tamanoEmpresa.map((t, i) => `@tamano${i}`).join(', ');
      tamanoConditions.push(`va.Nombre IN (${tamanoParams})`);
    }
    
    // Aplicar filtros de nivel de innovación (requiere JOIN con ResultadoNivelDigital)
    if (filters.nivelInnovacion && Array.isArray(filters.nivelInnovacion) && filters.nivelInnovacion.length > 0) {
      const nivelParams = filters.nivelInnovacion.map((n, i) => `@nivel${i}`).join(', ');
      nivelConditions.push(`nm.Descripcion IN (${nivelParams})`);
    }
    
    // Construir WHERE clause combinando condiciones
    const whereParts = [];
    if (deptConditions.length > 0) {
      whereParts.push(`(${deptConditions.join(' OR ')})`);
    }
    if (distritoConditions.length > 0) {
      whereParts.push(`(${distritoConditions.join(' OR ')})`);
    }
    if (sectorConditions.length > 0) {
      whereParts.push(`(${sectorConditions.join(' OR ')})`);
    }
    if (subsectorConditions.length > 0) {
      whereParts.push(`(${subsectorConditions.join(' OR ')})`);
    }
    if (tamanoConditions.length > 0) {
      whereParts.push(`(${tamanoConditions.join(' OR ')})`);
    }
    if (nivelConditions.length > 0) {
      whereParts.push(`(${nivelConditions.join(' OR ')})`);
    }
    
    // Determinar qué JOINs necesitamos
    const needsSectorJoin = sectorConditions.length > 0;
    const needsSubsectorJoin = subsectorConditions.length > 0;
    const needsTamanoJoin = tamanoConditions.length > 0;
    const needsNivelJoin = nivelConditions.length > 0;
    
    return `
    -- ===================================================
    -- PASO 1: Identificar empresas elegibles por fecha del último chequeo (OPTIMIZADO)
    -- ===================================================
    EmpresasElegibles AS (
      SELECT ei.IdEmpresa, MAX(tu.FechaTerminoTest) AS UltimaFecha
      FROM dbo.EmpresaInfo ei WITH (NOLOCK)
      INNER JOIN dbo.TestUsuario tu WITH (NOLOCK) ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      LEFT JOIN dbo.Departamentos dep WITH (NOLOCK) ON ei.IdDepartamento = dep.IdDepartamento
      LEFT JOIN dbo.SubRegion sr WITH (NOLOCK) ON ei.IdLocalidad = sr.IdSubRegion
      ${needsSectorJoin ? 'LEFT JOIN dbo.SectorActividad sa WITH (NOLOCK) ON ei.IdSectorActividad = sa.IdSectorActividad' : ''}
      ${needsSubsectorJoin ? 'LEFT JOIN dbo.SubSectorActividad ssa WITH (NOLOCK) ON ei.IdSubSectorActividad = ssa.IdSubSectorActividad' : ''}
      ${needsTamanoJoin ? 'LEFT JOIN dbo.VentasAnuales va WITH (NOLOCK) ON ei.IdVentas = va.IdVentasAnuales' : ''}
      ${needsNivelJoin ? `LEFT JOIN dbo.ResultadoNivelDigital rnd_nivel WITH (NOLOCK) ON tu.IdUsuario = rnd_nivel.IdUsuario AND tu.Test = rnd_nivel.Test
      LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd_nivel.IdNivelMadurez = nm.IdNivelMadurez` : ''}
      WHERE tu.Finalizado = 1
        ${whereParts.length > 0 ? 'AND ' + whereParts.join(' AND ') : ''}
      GROUP BY ei.IdEmpresa
      ${hasFechaFilter ? `
      HAVING MAX(tu.FechaTerminoTest) >= ${filters.fechaIni ? '@fechaIni' : 'CAST(\'1900-01-01\' AS DATE)'}
        AND MAX(tu.FechaTerminoTest) <= ${filters.fechaFin ? '@fechaFin' : 'CAST(\'9999-12-31\' AS DATE)'}
      ` : ''}
    ),
    
    -- ===================================================
    -- PASO 2: Obtener todos los chequeos ordenados con distancia temporal
    -- ===================================================
    ChequeosOrdenados AS (
      SELECT 
        ei.IdEmpresa,
        ei.IdUsuario,
        ei.Test,
        tu.IdTestUsuario,
        tu.FechaTest,
        tu.FechaTerminoTest,
        ROW_NUMBER() OVER (PARTITION BY ei.IdEmpresa, ei.Test ORDER BY tu.FechaTerminoTest DESC, ei.IdEmpresaInfo DESC) AS rn_dedup,
        ROW_NUMBER() OVER (PARTITION BY ei.IdEmpresa ORDER BY tu.FechaTerminoTest, tu.IdTestUsuario) AS rn_seq
      FROM dbo.EmpresaInfo ei WITH (NOLOCK)
      INNER JOIN dbo.TestUsuario tu WITH (NOLOCK) ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
      WHERE tu.Finalizado = 1
        AND ei.IdEmpresa IN (SELECT IdEmpresa FROM EmpresasElegibles)
    ),
    
    -- ===================================================
    -- PASO 3: Chequeos únicos (deduplicados) con fecha anterior
    -- ===================================================
    ChequeosUnicos AS (
      SELECT 
        IdEmpresa, IdUsuario, Test, IdTestUsuario, FechaTest, FechaTerminoTest, rn_seq,
        LAG(FechaTerminoTest) OVER (PARTITION BY IdEmpresa ORDER BY FechaTerminoTest, IdTestUsuario) AS FechaAnterior
      FROM ChequeosOrdenados
      WHERE rn_dedup = 1
    ),
    
    -- ===================================================
    -- PASO 4: Validar distancia mínima de 6 meses (180 días)
    -- ===================================================
    ChequeosValidos AS (
      SELECT 
        IdEmpresa, IdUsuario, Test, IdTestUsuario, FechaTest, FechaTerminoTest, rn_seq,
        CASE 
          WHEN FechaAnterior IS NULL THEN 1  -- Primer chequeo siempre es válido
          WHEN DATEDIFF(DAY, FechaAnterior, FechaTerminoTest) >= 180 THEN 1  -- >= 6 meses
          ELSE 0  -- Muy cercano al anterior, no contar
        END AS EsValido
      FROM ChequeosUnicos
    ),
    
    -- ===================================================
    -- PASO 5: Renumerar secuencialmente solo los chequeos válidos
    -- ===================================================
    ChequeosValidosRenumerados AS (
      SELECT 
        IdEmpresa, IdUsuario, Test, IdTestUsuario, FechaTest, FechaTerminoTest,
        ROW_NUMBER() OVER (PARTITION BY IdEmpresa ORDER BY FechaTerminoTest, IdTestUsuario) AS SeqNum,
        COUNT(*) OVER (PARTITION BY IdEmpresa) AS TotalChequeosValidos
      FROM ChequeosValidos
      WHERE EsValido = 1
    )`;
  }

  /**
   * Helper: Add unique filter parameters to request
   * @param {Object} req - SQL request object
   * @param {Array} allParams - Parameters from buildWhereClause
   */
  static addFilterParameters(req, allParams) {
    const addedNames = new Set();
    allParams.forEach(param => {
      if (!addedNames.has(param.name)) {
        req.input(param.name, sql.NVarChar(500), param.value);
        addedNames.add(param.name);
      }
    });
  }

  /**
   * Get KPIs for rechequeos dashboard
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - KPI data
   */
  static async getKPIs(filters = {}) {
    try {
      logger.info(`[RECHEQUEOS] Getting KPIs with filters: ${JSON.stringify(filters)}`);
      
      const pool = await poolPromise;
      const { whereConditions, allParams } = this.buildWhereClause(filters);
      const baseCTE = this.buildBaseCTE(filters);
      
      const req = pool.request();
      req.timeout = 240000; // 4 minutes for complex KPI queries (increased for safety)
      
      // Add filter parameters (including buildBaseCTE params)
      this.addFilterParameters(req, allParams);

      const KPI_QUERY = `
      WITH ${baseCTE},
      -- ===================================================
      -- Enriquecer con información de negocio
      -- ===================================================
      ChequeosEnriquecidos AS (
        SELECT 
          cv.IdEmpresa,
          cv.IdUsuario,
          cv.Test,
          cv.IdTestUsuario,
          cv.FechaTest,
          cv.FechaTerminoTest,
          cv.SeqNum,
          cv.TotalChequeosValidos,
          rnd.ptjeTotalUsuario AS PuntajeGlobal,
          nm.Descripcion AS NivelMadurez,
          rnd.ptjeDimensionTecnologia AS D_Tecnologia,
          rnd.ptjeDimensionComunicacion AS D_Comunicacion,
          rnd.ptjeDimensionOrganizacion AS D_Organizacion,
          rnd.ptjeDimensionDatos AS D_Datos,
          rnd.ptjeDimensionEstrategia AS D_Estrategia,
          rnd.ptjeDimensionProcesos AS D_Procesos,
          sa.Descripcion AS SectorActividad,
          va.Nombre AS TamanoEmpresa,
          CASE WHEN sr.IdRegion = 20 THEN 'Capital' ELSE dep.Nombre END AS Departamento,
          CASE WHEN sr.Nombre IS NOT NULL THEN sr.Nombre ELSE 'OTRO' END AS Distrito
        FROM ChequeosValidosRenumerados cv
        LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) ON cv.IdUsuario = rnd.IdUsuario AND cv.Test = rnd.Test
        LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
        LEFT JOIN dbo.EmpresaInfo ei WITH (NOLOCK) ON cv.IdEmpresa = ei.IdEmpresa AND cv.IdUsuario = ei.IdUsuario AND cv.Test = ei.Test
        LEFT JOIN dbo.SectorActividad sa WITH (NOLOCK) ON ei.IdSectorActividad = sa.IdSectorActividad
        LEFT JOIN dbo.VentasAnuales va WITH (NOLOCK) ON ei.IdVentas = va.IdVentasAnuales
        LEFT JOIN dbo.Departamentos dep WITH (NOLOCK) ON ei.IdDepartamento = dep.IdDepartamento
        LEFT JOIN dbo.SubRegion sr WITH (NOLOCK) ON ei.IdLocalidad = sr.IdSubRegion
        ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''}
      ),
      -- ===================================================
      -- Empresas con múltiples chequeos válidos (2+)
      -- ===================================================
      EmpresasConRechequeos AS (
        SELECT IdEmpresa
        FROM ChequeosEnriquecidos
        GROUP BY IdEmpresa
        HAVING COUNT(*) >= 2
      ),
      -- ===================================================
      -- Primer y último chequeo por empresa
      -- ===================================================
      PrimerChequeo AS (
        SELECT *
        FROM ChequeosEnriquecidos
        WHERE SeqNum = 1
          AND IdEmpresa IN (SELECT IdEmpresa FROM EmpresasConRechequeos)
      ),
      UltimoChequeo AS (
        SELECT ce.*
        FROM ChequeosEnriquecidos ce
        INNER JOIN (
          SELECT IdEmpresa, MAX(SeqNum) AS MaxSeq
          FROM ChequeosEnriquecidos
          WHERE IdEmpresa IN (SELECT IdEmpresa FROM EmpresasConRechequeos)
          GROUP BY IdEmpresa
        ) m ON ce.IdEmpresa = m.IdEmpresa AND ce.SeqNum = m.MaxSeq
      ),
      -- ===================================================
      -- Análisis comparativo (primero vs último)
      -- ===================================================
      Analisis AS (
        SELECT
          p.IdEmpresa,
          -- Primer chequeo
          p.PuntajeGlobal AS Puntaje_Primero,
          p.NivelMadurez AS Nivel_Primero,
          p.FechaTerminoTest AS Fecha_Primero,
          p.D_Tecnologia AS D1_Tecnologia,
          p.D_Comunicacion AS D1_Comunicacion,
          p.D_Organizacion AS D1_Organizacion,
          p.D_Datos AS D1_Datos,
          p.D_Estrategia AS D1_Estrategia,
          p.D_Procesos AS D1_Procesos,
          -- Último chequeo
          u.PuntajeGlobal AS Puntaje_Ultimo,
          u.NivelMadurez AS Nivel_Ultimo,
          u.FechaTerminoTest AS Fecha_Ultimo,
          u.D_Tecnologia AS DN_Tecnologia,
          u.D_Comunicacion AS DN_Comunicacion,
          u.D_Organizacion AS DN_Organizacion,
          u.D_Datos AS DN_Datos,
          u.D_Estrategia AS DN_Estrategia,
          u.D_Procesos AS DN_Procesos,
          -- Metadatos
          u.TotalChequeosValidos AS n_cheq,
          u.SectorActividad,
          u.TamanoEmpresa,
          u.Departamento,
          u.Distrito
        FROM PrimerChequeo p
        INNER JOIN UltimoChequeo u ON p.IdEmpresa = u.IdEmpresa
      ),
      -- ===================================================
      -- Niveles ordinales
      -- ===================================================
      NivelesOrdinales AS (
        SELECT *,
          CASE Nivel_Primero
            WHEN 'Inicial' THEN 1 WHEN 'Novato' THEN 2
            WHEN 'Competente' THEN 3 WHEN 'Avanzado' THEN 4 ELSE NULL END AS lvl1,
          CASE Nivel_Ultimo
            WHEN 'Inicial' THEN 1 WHEN 'Novato' THEN 2
            WHEN 'Competente' THEN 3 WHEN 'Avanzado' THEN 4 ELSE NULL END AS lvlN
        FROM Analisis
      ),
      -- ===================================================
      -- KPIs agregados
      -- ===================================================
      ChequeosEnriquecidosStats AS (
        SELECT 
          COUNT(DISTINCT IdEmpresa) AS TotalEmpresasUnicas,
          COUNT(*) AS TotalChequeosUnicos
        FROM ChequeosEnriquecidos
      ),
      Cobertura AS (
        SELECT 
          COUNT(DISTINCT a.IdEmpresa) AS EmpresasConRechequeos,
          ces.TotalEmpresasUnicas,
          ces.TotalChequeosUnicos,
          AVG(CAST(a.n_cheq AS FLOAT)) AS PromChequeosPorEmpresa,
          AVG(DATEDIFF(DAY, a.Fecha_Primero, a.Fecha_Ultimo)) AS TiempoPromEntreChequeosDias
        FROM Analisis a
        CROSS JOIN ChequeosEnriquecidosStats ces
        GROUP BY ces.TotalEmpresasUnicas, ces.TotalChequeosUnicos
      ),
      Distribucion AS (
        SELECT
          SUM(CASE WHEN n_cheq = 1 THEN 1 ELSE 0 END) AS EmpresasCon1Chequeo,
          SUM(CASE WHEN n_cheq BETWEEN 2 AND 3 THEN 1 ELSE 0 END) AS EmpresasCon2_3Chequeos,
          SUM(CASE WHEN n_cheq > 3 THEN 1 ELSE 0 END) AS EmpresasConMasDe3Chequeos
        FROM (
          SELECT IdEmpresa, TotalChequeosValidos AS n_cheq
          FROM ChequeosEnriquecidos
          GROUP BY IdEmpresa, TotalChequeosValidos
        ) t
      ),
      Magnitud AS (
        SELECT 
          AVG(CAST(Puntaje_Ultimo - Puntaje_Primero AS FLOAT)) AS DeltaGlobalProm,
          AVG(CAST(DN_Tecnologia - D1_Tecnologia AS FLOAT)) AS DeltaTecnologiaProm,
          AVG(CAST(DN_Comunicacion - D1_Comunicacion AS FLOAT)) AS DeltaComunicacionProm,
          AVG(CAST(DN_Organizacion - D1_Organizacion AS FLOAT)) AS DeltaOrganizacionProm,
          AVG(CAST(DN_Datos - D1_Datos AS FLOAT)) AS DeltaDatosProm,
          AVG(CAST(DN_Estrategia - D1_Estrategia AS FLOAT)) AS DeltaEstrategiaProm,
          AVG(CAST(DN_Procesos - D1_Procesos AS FLOAT)) AS DeltaProcesosProm,
          AVG(CASE WHEN (Puntaje_Ultimo - Puntaje_Primero) > 0 THEN 1.0 ELSE 0.0 END) AS PctMejoraPositiva,
          AVG(CASE WHEN (Puntaje_Ultimo - Puntaje_Primero) < 0 THEN 1.0 ELSE 0.0 END) AS PctRegresion,
          AVG(CASE WHEN (lvl1 IN (1,2)) AND (lvlN >= 3) THEN 1.0 ELSE 0.0 END) AS TotalSaltosBajoMedio,
          AVG(CASE WHEN (lvl1 = 3) AND (lvlN = 4) THEN 1.0 ELSE 0.0 END) AS TotalSaltosMedioAlto
        FROM NivelesOrdinales
        WHERE lvl1 IS NOT NULL AND lvlN IS NOT NULL
      ),
      Velocidad AS (
        SELECT 
          AVG(
            CAST(Puntaje_Ultimo - Puntaje_Primero AS FLOAT) / 
            CASE 
              WHEN DATEDIFF(DAY, Fecha_Primero, Fecha_Ultimo) < 1 THEN (1.0/30.0)
              ELSE (CAST(DATEDIFF(DAY, Fecha_Primero, Fecha_Ultimo) AS FLOAT)/30.0)
            END
          ) AS TasaMejoraMensual,
          AVG(CASE WHEN (Puntaje_Ultimo - Puntaje_Primero) >= 0 THEN 1.0 ELSE 0.0 END) AS IndiceConsistencia,
          0.5 AS RatioMejoraTemprana -- Placeholder
        FROM Analisis
      )
      SELECT 
        -- Cobertura
        c.EmpresasConRechequeos,
        c.TotalEmpresasUnicas AS EmpresasConAlMenosUnChequeo,
        CASE 
          WHEN c.TotalEmpresasUnicas > 0 
          THEN CAST(c.EmpresasConRechequeos AS FLOAT) / c.TotalEmpresasUnicas
          ELSE 0
        END AS TasaReincidencia,
        c.PromChequeosPorEmpresa,
        c.TiempoPromEntreChequeosDias,
        d.EmpresasCon1Chequeo AS Distribucion1,
        d.EmpresasCon2_3Chequeos AS Distribucion2_3,
        d.EmpresasConMasDe3Chequeos AS DistribucionGt3,
        -- Magnitud
        m.DeltaGlobalProm,
        m.DeltaTecnologiaProm,
        m.DeltaComunicacionProm,
        m.DeltaOrganizacionProm,
        m.DeltaDatosProm,
        m.DeltaEstrategiaProm,
        m.DeltaProcesosProm,
        m.PctMejoraPositiva,
        m.PctRegresion,
        m.TotalSaltosBajoMedio,
        m.TotalSaltosMedioAlto,
        -- Velocidad
        v.TasaMejoraMensual,
        v.IndiceConsistencia,
        v.RatioMejoraTemprana
      FROM Cobertura c
      CROSS JOIN Distribucion d
      CROSS JOIN Magnitud m
      CROSS JOIN Velocidad v
      OPTION (RECOMPILE);
      `;

      const rs = await req.query(KPI_QUERY);
      const row = rs.recordset[0] || {};

      logger.info(`[RECHEQUEOS] KPIs calculated successfully`);

      return {
        cobertura: {
          tasaReincidencia: row.TasaReincidencia || 0,
          promChequeosPorEmpresa: row.PromChequeosPorEmpresa || 0,
          tiempoPromEntreChequeosDias: row.TiempoPromEntreChequeosDias || 0,
          distribucion: {
            "1": row.Distribucion1 || 0,
            "2_3": row.Distribucion2_3 || 0,
            "gt_3": row.DistribucionGt3 || 0
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
          ratioMejoraTemprana: row.RatioMejoraTemprana || 0
        }
      };
    } catch (error) {
      logger.error(`Error getting rechequeos KPIs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed table data for companies with multiple check-ups
   * @param {Object} filters - Filter options
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @returns {Promise<Object>} - Table data with pagination
   */
  static async getTabla(filters = {}, page = 1, limit = 50) {
    try {
      const pool = await poolPromise;
      const { whereConditions, allParams } = this.buildWhereClause(filters);
      const offset = (page - 1) * limit;
      
      const req = pool.request();
      req.timeout = 180000; // 3 minutes for complex table queries
      req.input('offset', sql.Int, offset);
      req.input('limit', sql.Int, limit);
      
      // Add search parameter
      const searchTerm = filters.search || '';
      req.input('searchTerm', sql.NVarChar(500), `%${searchTerm}%`);
      
      // Add sorting parameters
      const sortBy = filters.sortBy || 'UltimaFechaTermino';
      const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
      
      logger.info('[RECHEQUEOS] getTabla called - This function will be deprecated, use getTableData instead');
      
      // Redirect to getTableData
      return this.getTableData({ page, limit, filters });
    } catch (error) {
      logger.error(`Error getting rechequeos table: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed table data for companies with multiple check-ups (OLD VERSION - DEPRECATED)
   * This function redirects to the new optimized version below that includes "NO TENGO" logic
   * @deprecated Use the newer getTableData implementation starting at line 1390
   */
  static async getTableData_OLD_DEPRECATED({ page = 1, limit = 50, filters = {} }) {
    logger.info('[RECHEQUEOS] getTableData_OLD_DEPRECATED called - redirecting to new implementation with NO TENGO logic');
    // This redirect is here because there were multiple getTableData implementations
    // The correct one is further down in the file (around line 1390) and includes:
    // - buildBaseCTE integration
    // - 6-month validation
    // - Special "NO TENGO" logic (grouped by IdUsuario instead of IdEmpresa)
    
    // Return empty to force use of the new implementation
    throw new Error('This function is deprecated. The system should use the new getTableData implementation.');
  }

  /**
   * Get evolution series data (OLD - redirects to new implementation)
   */
  static async getEvolutionSeries_OLD(filters = {}, category = 'tamano') {
    logger.info('[RECHEQUEOS] getEvolutionSeries_OLD called - redirecting to new implementation');
    return this.getEvolutionSeries(filters, category);
  }

  /**
   * Get evolution series data (OPTIMIZED)
   */
  static async getEvolutionSeries(filters = {}, category = 'tamano') {
    try {
      logger.info(`[RECHEQUEOS] Getting evolution series for category: ${category}`);
      
      const pool = await poolPromise;
      const { whereConditions, allParams } = this.buildWhereClause(filters);
      const baseCTE = this.buildBaseCTE(filters);
      
      const req = pool.request();
      req.timeout = 180000;
      
      // Add filter parameters (including buildBaseCTE params)
      this.addFilterParameters(req, allParams);
      
      // Category mapping
      const categoryMapping = {
        'tamano': { field: 'va.Nombre', label: 'TamanoEmpresa' },
        'sector': { field: 'sa.Descripcion', label: 'SectorActividad' },
        'departamento': { field: 'CASE WHEN sr.IdRegion = 20 THEN \'Capital\' ELSE dep.Nombre END', label: 'Departamento' }
      };
      
      const catConfig = categoryMapping[category] || categoryMapping['tamano'];
      
      const SERIES_QUERY = `
      WITH ${baseCTE},
      ChequeosEnriquecidos AS (
        SELECT 
          cv.IdEmpresa,
          cv.IdUsuario,
          cv.Test,
          cv.IdTestUsuario,
          cv.FechaTest,
          cv.FechaTerminoTest,
          cv.SeqNum,
          cv.TotalChequeosValidos,
          rnd.ptjeTotalUsuario AS PuntajeGlobal,
          nm.Descripcion AS NivelMadurez,
          rnd.ptjeDimensionTecnologia AS D_Tecnologia,
          rnd.ptjeDimensionComunicacion AS D_Comunicacion,
          rnd.ptjeDimensionOrganizacion AS D_Organizacion,
          rnd.ptjeDimensionDatos AS D_Datos,
          rnd.ptjeDimensionEstrategia AS D_Estrategia,
          rnd.ptjeDimensionProcesos AS D_Procesos,
          sa.Descripcion AS SectorActividad,
          va.Nombre AS TamanoEmpresa,
          e.Nombre AS EmpresaNombre,
          u.NombreCompleto AS NombreUsuario,
          CASE WHEN sr.IdRegion = 20 THEN 'Capital' ELSE dep.Nombre END AS Departamento,
          CASE WHEN sr.Nombre IS NOT NULL THEN sr.Nombre ELSE 'OTRO' END AS Distrito
        FROM ChequeosValidosRenumerados cv
        LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) ON cv.IdUsuario = rnd.IdUsuario AND cv.Test = rnd.Test
        LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
        LEFT JOIN dbo.EmpresaInfo ei WITH (NOLOCK) ON cv.IdEmpresa = ei.IdEmpresa AND cv.IdUsuario = ei.IdUsuario AND cv.Test = ei.Test
        LEFT JOIN dbo.SectorActividad sa WITH (NOLOCK) ON ei.IdSectorActividad = sa.IdSectorActividad
        LEFT JOIN dbo.VentasAnuales va WITH (NOLOCK) ON ei.IdVentas = va.IdVentasAnuales
        LEFT JOIN dbo.Empresa e WITH (NOLOCK) ON cv.IdEmpresa = e.IdEmpresa
        LEFT JOIN dbo.Usuario u WITH (NOLOCK) ON cv.IdUsuario = u.IdUsuario
        LEFT JOIN dbo.Departamentos dep WITH (NOLOCK) ON ei.IdDepartamento = dep.IdDepartamento
        LEFT JOIN dbo.SubRegion sr WITH (NOLOCK) ON ei.IdLocalidad = sr.IdSubRegion
        ${whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : ''}
      ),
      EmpresasConRechequeos AS (
        SELECT IdEmpresa
        FROM ChequeosEnriquecidos
        GROUP BY IdEmpresa
        HAVING COUNT(*) >= 2
      ),
      PrimerChequeo AS (
        SELECT *
        FROM ChequeosEnriquecidos
        WHERE SeqNum = 1
          AND IdEmpresa IN (SELECT IdEmpresa FROM EmpresasConRechequeos)
      ),
      UltimoChequeo AS (
        SELECT ce.*
        FROM ChequeosEnriquecidos ce
        INNER JOIN (
          SELECT IdEmpresa, MAX(SeqNum) AS MaxSeq
          FROM ChequeosEnriquecidos
          WHERE IdEmpresa IN (SELECT IdEmpresa FROM EmpresasConRechequeos)
          GROUP BY IdEmpresa
        ) m ON ce.IdEmpresa = m.IdEmpresa AND ce.SeqNum = m.MaxSeq
      ),
      ResultadoCompleto AS (
        SELECT
          p.IdEmpresa,
          p.EmpresaNombre,
          p.SectorActividad,
          p.TamanoEmpresa,
          p.Departamento,
          p.Distrito,
          p.NombreUsuario,
          p.TotalChequeosValidos AS n_cheq,
          -- Primer chequeo
          p.FechaTerminoTest AS Fecha_Primero,
          p.PuntajeGlobal AS Puntaje_Primero,
          p.NivelMadurez AS Nivel_Primero,
          p.D_Tecnologia AS D1_Tecnologia,
          p.D_Comunicacion AS D1_Comunicacion,
          p.D_Organizacion AS D1_Organizacion,
          p.D_Datos AS D1_Datos,
          p.D_Estrategia AS D1_Estrategia,
          p.D_Procesos AS D1_Procesos,
          -- Último chequeo
          u.FechaTerminoTest AS Fecha_Ultimo,
          u.PuntajeGlobal AS Puntaje_Ultimo,
          u.NivelMadurez AS Nivel_Ultimo,
          u.D_Tecnologia AS DN_Tecnologia,
          u.D_Comunicacion AS DN_Comunicacion,
          u.D_Organizacion AS DN_Organizacion,
          u.D_Datos AS DN_Datos,
          u.D_Estrategia AS DN_Estrategia,
          u.D_Procesos AS DN_Procesos,
          -- Deltas
          (u.PuntajeGlobal - p.PuntajeGlobal) AS DeltaPuntaje,
          (u.D_Tecnologia - p.D_Tecnologia) AS DeltaTecnologia,
          (u.D_Comunicacion - p.D_Comunicacion) AS DeltaComunicacion,
          (u.D_Organizacion - p.D_Organizacion) AS DeltaOrganizacion,
          (u.D_Datos - p.D_Datos) AS DeltaDatos,
          (u.D_Estrategia - p.D_Estrategia) AS DeltaEstrategia,
          (u.D_Procesos - p.D_Procesos) AS DeltaProcesos,
          DATEDIFF(DAY, p.FechaTerminoTest, u.FechaTerminoTest) AS DiasEntreChequeos
        FROM PrimerChequeo p
        INNER JOIN UltimoChequeo u ON p.IdEmpresa = u.IdEmpresa
        WHERE (@searchTerm = '%%' OR p.EmpresaNombre LIKE @searchTerm)
      ),
      ResultadoPaginado AS (
        SELECT *, COUNT(*) OVER() AS TotalRecords
        FROM ResultadoCompleto
        ORDER BY ${sortColumn} ${sortOrder}
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      )
      SELECT * FROM ResultadoPaginado
      OPTION (RECOMPILE);
      `;
      
      const rs = await req.query(TABLE_QUERY);
      
      logger.info(`[RECHEQUEOS] Table data retrieved: ${rs.recordset.length} rows`);
      
      return {
        data: rs.recordset.map(row => ({
          idEmpresa: row.IdEmpresa,
          empresaNombre: row.EmpresaNombre,
          sectorActividad: row.SectorActividad,
          tamanoEmpresa: row.TamanoEmpresa,
          departamento: row.Departamento,
          distrito: row.Distrito,
          nombreUsuario: row.NombreUsuario,
          totalChequeos: row.n_cheq,
          primeraFecha: row.Fecha_Primero,
          primerPuntaje: row.Puntaje_Primero,
          primerNivel: row.Nivel_Primero,
          ultimaFecha: row.Fecha_Ultimo,
          ultimoPuntaje: row.Puntaje_Ultimo,
          ultimoNivel: row.Nivel_Ultimo,
          deltaPuntaje: row.DeltaPuntaje,
          deltaTecnologia: row.DeltaTecnologia,
          deltaComunicacion: row.DeltaComunicacion,
          deltaOrganizacion: row.DeltaOrganizacion,
          deltaDatos: row.DeltaDatos,
          deltaEstrategia: row.DeltaEstrategia,
          deltaProcesos: row.DeltaProcesos,
          diasEntreChequeos: row.DiasEntreChequeos
        })),
        pagination: {
          page,
          limit,
          total: rs.recordset.length > 0 ? rs.recordset[0].TotalRecords : 0,
          totalPages: rs.recordset.length > 0 ? Math.ceil(rs.recordset[0].TotalRecords / limit) : 0
        }
      };
    } catch (error) {
      logger.error(`Error getting rechequeos table data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get evolution series data (OLD - redirects to new implementation)
   */
  static async getEvolutionSeries_OLD(filters = {}, category = 'tamano') {
    logger.info('[RECHEQUEOS] getEvolutionSeries_OLD called - redirecting to new implementation');
    return this.getEvolutionSeries(filters, category);
  }

  /**
   * Get evolution series data (OPTIMIZED)
   */
  static async getEvolutionSeries(filters = {}, category = 'tamano') {
    try {
      logger.info(`[RECHEQUEOS] Getting evolution series for category: ${category}`);
      
      const pool = await poolPromise;
      const { whereConditions, allParams } = this.buildWhereClause(filters);
      const baseCTE = this.buildBaseCTE(filters);
      
      const req = pool.request();
      req.timeout = 180000;
      
      // Add filter parameters (including buildBaseCTE params)
      this.addFilterParameters(req, allParams);
      
      // Category mapping
      const categoryMapping = {
        'tamano': { field: 'va.Nombre', label: 'TamanoEmpresa' },
        'sector': { field: 'sa.Descripcion', label: 'SectorActividad' },
        'departamento': { field: 'CASE WHEN sr.IdRegion = 20 THEN \'Capital\' ELSE dep.Nombre END', label: 'Departamento' }
      };
      
      const catConfig = categoryMapping[category] || categoryMapping['tamano'];
      
      const SERIES_QUERY = `
      WITH ${baseCTE},
      ChequeosEnriquecidos AS (
        SELECT 
          cv.IdEmpresa,
          cv.FechaTerminoTest,
          cv.SeqNum,
          cv.TotalChequeosValidos,
          rnd.ptjeTotalUsuario AS PuntajeGlobal,
          ${catConfig.field} AS Categoria,
          YEAR(cv.FechaTerminoTest) AS Anno,
          MONTH(cv.FechaTerminoTest) AS Mes
        FROM ChequeosValidosRenumerados cv
        LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) ON cv.IdUsuario = rnd.IdUsuario AND cv.Test = rnd.Test
        LEFT JOIN dbo.EmpresaInfo ei WITH (NOLOCK) ON cv.IdEmpresa = ei.IdEmpresa
        LEFT JOIN dbo.SectorActividad sa WITH (NOLOCK) ON ei.IdSectorActividad = sa.IdSectorActividad
        LEFT JOIN dbo.VentasAnuales va WITH (NOLOCK) ON ei.IdVentas = va.IdVentasAnuales
        LEFT JOIN dbo.Departamentos dep WITH (NOLOCK) ON ei.IdDepartamento = dep.IdDepartamento
        LEFT JOIN dbo.SubRegion sr WITH (NOLOCK) ON ei.IdLocalidad = sr.IdSubRegion
        WHERE cv.TotalChequeosValidos >= 2
        ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
      ),
      MonthlyAverages AS (
        SELECT 
          Categoria,
          Anno,
          Mes,
          AVG(CAST(PuntajeGlobal AS FLOAT)) AS PuntajePromedio,
          COUNT(DISTINCT IdEmpresa) AS EmpresasUnicas
        FROM ChequeosEnriquecidos
        WHERE Categoria IS NOT NULL
        GROUP BY Categoria, Anno, Mes
      )
      SELECT 
        Categoria AS CategoryValue,
        Anno,
        Mes,
        PuntajePromedio,
        EmpresasUnicas,
        CONCAT(Anno, '-', RIGHT('0' + CAST(Mes AS VARCHAR), 2)) AS Periodo
      FROM MonthlyAverages
      ORDER BY Categoria, Anno, Mes
      OPTION (RECOMPILE);
      `;
      
      const rs = await req.query(SERIES_QUERY);
      
      logger.info(`[RECHEQUEOS] Evolution series retrieved: ${rs.recordset.length} categories`);
      
      return rs.recordset.map(row => ({
        categoria: row.CategoryValue || 'Sin categoría',
        periodo: row.Periodo,
        puntajePromedio: row.PuntajePromedio || 0,
        empresasUnicas: row.EmpresasUnicas || 0
      }));
    } catch (error) {
      logger.error(`Error getting rechequeos evolution series: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed table data for companies with multiple check-ups
   * @param {Object} filters - Filter options
   * @param {Number} page - Page number
   * @param {Number} limit - Items per page
   * @returns {Promise<Object>} - Table data with pagination
   */
  static async getTabla(filters = {}, page = 1, limit = 50) {
    try {
      const pool = await poolPromise;
      const { whereConditions, allParams } = this.buildWhereClause(filters);
      const offset = (page - 1) * limit;
      
      const req = pool.request();
      req.timeout = 180000; // 3 minutes for complex table queries
      req.input('offset', sql.Int, offset);
      req.input('limit', sql.Int, limit);
      
      // Add search parameter
      const searchTerm = filters.search || '';
      req.input('searchTerm', sql.NVarChar(500), `%${searchTerm}%`);
      
      // Add sorting parameters
      const sortBy = filters.sortBy || 'UltimaFechaTermino';
      const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
      
      // Map frontend column names to database column names/expressions
      const orderByMap = {
        'EmpresaNombre': 'EmpresaNombre',
        'TamanoEmpresa': 'TamanoEmpresa',
        'SectorActividad': 'SectorActividad',
        'DiasEntreChequeos': 'DiasEntreChequeos',
        'DeltaGlobal': '(UltimoPuntaje - PrimerPuntaje)',
        'TasaMejoraMensual': 'CASE WHEN DiasEntreChequeos > 0 THEN (UltimoPuntaje - PrimerPuntaje) / (DiasEntreChequeos / 30.0) ELSE 0 END',
        'UltimaFechaTermino': 'UltimaFechaTermino'
      };
      
      const sortByColumn = orderByMap[sortBy] || 'UltimaFechaTermino';
      
      // Add filter parameters
      allParams.forEach(param => {
        req.input(param.name, sql.NVarChar(500), param.value);
      });

      const TABLA_QUERY = `
             WITH BaseDataRaw AS (
               SELECT 
                 ei.IdEmpresa,
                 ei.IdUsuario,
                 ei.Test,
                 tu.IdTestUsuario,
                 tu.FechaTest,
                 tu.FechaTerminoTest,
                 rnd.ptjeTotalUsuario,
                 rnd.ptjeDimensionTecnologia,
                 rnd.ptjeDimensionComunicacion,
                 rnd.ptjeDimensionOrganizacion,
                 rnd.ptjeDimensionDatos,
                 rnd.ptjeDimensionEstrategia,
                 rnd.ptjeDimensionProcesos,
                 nm.Descripcion AS NivelMadurez,
                 sa.Descripcion AS SectorActividad,
                 va.Nombre AS TamanoEmpresa,
                 e.Nombre AS EmpresaNombre,
                 CASE 
                   WHEN sr.IdRegion = 20 THEN 'Capital'
                   ELSE dep.Nombre 
                 END AS Departamento,
                 sr.Nombre AS Distrito,
                 u.NombreCompleto AS NombreUsuario,
                 ROW_NUMBER() OVER (PARTITION BY ei.IdEmpresa, ei.Test ORDER BY tu.FechaTerminoTest DESC, ei.IdEmpresaInfo DESC) AS rn
               FROM dbo.EmpresaInfo ei WITH (NOLOCK)
               INNER JOIN dbo.TestUsuario tu WITH (NOLOCK) ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
               LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) ON tu.IdUsuario = rnd.IdUsuario AND tu.Test = rnd.Test
               LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
               LEFT JOIN dbo.SectorActividad sa WITH (NOLOCK) ON ei.IdSectorActividad = sa.IdSectorActividad
               LEFT JOIN dbo.VentasAnuales va WITH (NOLOCK) ON ei.IdVentas = va.IdVentasAnuales
               LEFT JOIN dbo.Departamentos dep WITH (NOLOCK) ON ei.IdDepartamento = dep.IdDepartamento
               LEFT JOIN dbo.SubRegion sr WITH (NOLOCK) ON ei.IdLocalidad = sr.IdSubRegion
               LEFT JOIN dbo.Empresa e WITH (NOLOCK) ON ei.IdEmpresa = e.IdEmpresa
               LEFT JOIN dbo.Usuario u WITH (NOLOCK) ON ei.IdUsuario = u.IdUsuario
               WHERE tu.Finalizado = 1
                 ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
             ),
             BaseData AS (
               SELECT 
                 IdEmpresa, IdUsuario, Test, IdTestUsuario, FechaTest, FechaTerminoTest,
                 ptjeTotalUsuario, ptjeDimensionTecnologia, ptjeDimensionComunicacion,
                 ptjeDimensionOrganizacion, ptjeDimensionDatos, ptjeDimensionEstrategia, ptjeDimensionProcesos,
                 NivelMadurez, SectorActividad, TamanoEmpresa, EmpresaNombre, Departamento, Distrito, NombreUsuario
               FROM BaseDataRaw
               WHERE rn = 1
             ),
             -- Primer chequeo por empresa
             PrimerChequeo AS (
               SELECT 
                 IdEmpresa,
                 ptjeTotalUsuario AS PrimerPuntaje,
                 NivelMadurez AS PrimerNivel,
                 FechaTerminoTest AS PrimeraFechaTermino,
                 ptjeDimensionTecnologia AS PrimerTecnologia,
                 ptjeDimensionComunicacion AS PrimerComunicacion,
                 ptjeDimensionOrganizacion AS PrimerOrganizacion,
                 ptjeDimensionDatos AS PrimerDatos,
                 ptjeDimensionEstrategia AS PrimerEstrategia,
                 ptjeDimensionProcesos AS PrimerProcesos
               FROM BaseData
               WHERE Test = 1
             ),
             -- Último chequeo por empresa
             UltimoChequeo AS (
               SELECT 
                 IdEmpresa,
                 ptjeTotalUsuario AS UltimoPuntaje,
                 NivelMadurez AS UltimoNivel,
                 FechaTerminoTest AS UltimaFechaTermino,
                 ptjeDimensionTecnologia AS UltimoTecnologia,
                 ptjeDimensionComunicacion AS UltimoComunicacion,
                 ptjeDimensionOrganizacion AS UltimoOrganizacion,
                 ptjeDimensionDatos AS UltimoDatos,
                 ptjeDimensionEstrategia AS UltimoEstrategia,
                 ptjeDimensionProcesos AS UltimoProcesos
               FROM BaseData bd1
               WHERE Test = (SELECT MAX(Test) FROM BaseData bd2 WHERE bd2.IdEmpresa = bd1.IdEmpresa)
             ),
             -- Para "NO TENGO": identificar usuarios con rechequeos genuinos (> 6 meses)
             UsuariosNoTengoStats AS (
               SELECT 
                 bd.IdEmpresa,
                 bd.IdUsuario,
                 COUNT(DISTINCT bd.Test) AS TotalChequeosUsuario,
                 MIN(bd.FechaTerminoTest) AS PrimeraFechaUsuario,
                 MAX(bd.FechaTerminoTest) AS UltimaFechaUsuario,
                 DATEDIFF(DAY, MIN(bd.FechaTerminoTest), MAX(bd.FechaTerminoTest)) AS DiasEntreChequeosUsuario
               FROM BaseData bd
               WHERE bd.EmpresaNombre LIKE '%NO TENGO%'
               GROUP BY bd.IdEmpresa, bd.IdUsuario
               HAVING COUNT(DISTINCT bd.Test) >= 2 
                 AND DATEDIFF(DAY, MIN(bd.FechaTerminoTest), MAX(bd.FechaTerminoTest)) > 180
             ),
             -- Estadísticas por empresa (manejo especial para NO TENGO)
             -- Primero: datos de empresas normales (no NO TENGO)
             EmpresasNormalesStats AS (
               SELECT 
                 bd.IdEmpresa,
                 NULL AS IdUsuario,  -- NULL para empresas normales
                 COUNT(DISTINCT bd.Test) AS TotalChequeos,
                 MIN(CASE WHEN bd.Test = 1 THEN bd.FechaTerminoTest END) AS PrimeraFechaTermino,
                 MAX(bd.FechaTerminoTest) AS UltimaFechaTermino,
                 -- Primer puntaje: del Test = 1
                 (SELECT TOP 1 ptjeTotalUsuario FROM BaseData b2 
                  WHERE b2.IdEmpresa = bd.IdEmpresa AND b2.Test = 1) AS PrimerPuntaje,
                 -- Último puntaje: del test con fecha más reciente
                 (SELECT TOP 1 ptjeTotalUsuario FROM BaseData b2 
                  WHERE b2.IdEmpresa = bd.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC, b2.Test DESC) AS UltimoPuntaje,
                 -- Primer nivel: del Test = 1
                 (SELECT TOP 1 NivelMadurez FROM BaseData b2 
                  WHERE b2.IdEmpresa = bd.IdEmpresa AND b2.Test = 1) AS PrimerNivel,
                 -- Último nivel: del test con fecha más reciente
                 (SELECT TOP 1 NivelMadurez FROM BaseData b2 
                  WHERE b2.IdEmpresa = bd.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC, b2.Test DESC) AS UltimoNivel,
                 DATEDIFF(DAY, 
                   MIN(CASE WHEN bd.Test = 1 THEN bd.FechaTerminoTest END),
                   MAX(bd.FechaTerminoTest)
                 ) AS DiasEntreChequeos,
                 MAX(bd.EmpresaNombre) AS EmpresaNombre,
                 MAX(bd.SectorActividad) AS SectorActividad,
                 MAX(bd.TamanoEmpresa) AS TamanoEmpresa,
                 MAX(bd.Departamento) AS Departamento,
                 MAX(bd.Distrito) AS Distrito,
                 MAX(bd.NombreUsuario) AS NombreUsuario
               FROM BaseData bd
               WHERE bd.EmpresaNombre NOT LIKE '%NO TENGO%'
               GROUP BY bd.IdEmpresa
               HAVING COUNT(DISTINCT bd.Test) >= 2
             ),
             -- Segundo: datos de usuarios NO TENGO con rechequeos genuinos
             UsuariosNoTengoStatsFinal AS (
               SELECT DISTINCT
                 uns.IdEmpresa,
                 uns.IdUsuario,
                 uns.TotalChequeosUsuario AS TotalChequeos,
                 uns.PrimeraFechaUsuario AS PrimeraFechaTermino,
                 uns.UltimaFechaUsuario AS UltimaFechaTermino,
                 uns.DiasEntreChequeosUsuario AS DiasEntreChequeos,
                 (SELECT TOP 1 ptjeTotalUsuario FROM BaseData b2 
                  WHERE b2.IdUsuario = uns.IdUsuario AND b2.IdEmpresa = uns.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest ASC) AS PrimerPuntaje,
                 (SELECT TOP 1 ptjeTotalUsuario FROM BaseData b2 
                  WHERE b2.IdUsuario = uns.IdUsuario AND b2.IdEmpresa = uns.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) AS UltimoPuntaje,
                 (SELECT TOP 1 NivelMadurez FROM BaseData b2 
                  WHERE b2.IdUsuario = uns.IdUsuario AND b2.IdEmpresa = uns.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest ASC) AS PrimerNivel,
                 (SELECT TOP 1 NivelMadurez FROM BaseData b2 
                  WHERE b2.IdUsuario = uns.IdUsuario AND b2.IdEmpresa = uns.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) AS UltimoNivel,
                 (SELECT TOP 1 EmpresaNombre FROM BaseData b2 
                  WHERE b2.IdUsuario = uns.IdUsuario AND b2.IdEmpresa = uns.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) AS EmpresaNombre,
                 (SELECT TOP 1 SectorActividad FROM BaseData b2 
                  WHERE b2.IdUsuario = uns.IdUsuario AND b2.IdEmpresa = uns.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) AS SectorActividad,
                 (SELECT TOP 1 TamanoEmpresa FROM BaseData b2 
                  WHERE b2.IdUsuario = uns.IdUsuario AND b2.IdEmpresa = uns.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) AS TamanoEmpresa,
                 (SELECT TOP 1 Departamento FROM BaseData b2 
                  WHERE b2.IdUsuario = uns.IdUsuario AND b2.IdEmpresa = uns.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) AS Departamento,
                 (SELECT TOP 1 Distrito FROM BaseData b2 
                  WHERE b2.IdUsuario = uns.IdUsuario AND b2.IdEmpresa = uns.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) AS Distrito,
                 (SELECT TOP 1 NombreUsuario FROM BaseData b2 
                  WHERE b2.IdUsuario = uns.IdUsuario AND b2.IdEmpresa = uns.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) AS NombreUsuario
               FROM UsuariosNoTengoStats uns
             ),
             -- Deltas para empresas normales
             DeltasNormales AS (
               SELECT 
                 ens.IdEmpresa,
                 -- Deltas: último test (por fecha) menos primer test
                 (SELECT TOP 1 ptjeDimensionTecnologia FROM BaseData b2 
                  WHERE b2.IdEmpresa = ens.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC, b2.Test DESC) -
                 (SELECT TOP 1 ptjeDimensionTecnologia FROM BaseData b2 
                  WHERE b2.IdEmpresa = ens.IdEmpresa AND b2.Test = 1) AS DeltaTecnologia,
                 (SELECT TOP 1 ptjeDimensionComunicacion FROM BaseData b2 
                  WHERE b2.IdEmpresa = ens.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC, b2.Test DESC) -
                 (SELECT TOP 1 ptjeDimensionComunicacion FROM BaseData b2 
                  WHERE b2.IdEmpresa = ens.IdEmpresa AND b2.Test = 1) AS DeltaComunicacion,
                 (SELECT TOP 1 ptjeDimensionOrganizacion FROM BaseData b2 
                  WHERE b2.IdEmpresa = ens.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC, b2.Test DESC) -
                 (SELECT TOP 1 ptjeDimensionOrganizacion FROM BaseData b2 
                  WHERE b2.IdEmpresa = ens.IdEmpresa AND b2.Test = 1) AS DeltaOrganizacion,
                 (SELECT TOP 1 ptjeDimensionDatos FROM BaseData b2 
                  WHERE b2.IdEmpresa = ens.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC, b2.Test DESC) -
                 (SELECT TOP 1 ptjeDimensionDatos FROM BaseData b2 
                  WHERE b2.IdEmpresa = ens.IdEmpresa AND b2.Test = 1) AS DeltaDatos,
                 (SELECT TOP 1 ptjeDimensionEstrategia FROM BaseData b2 
                  WHERE b2.IdEmpresa = ens.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC, b2.Test DESC) -
                 (SELECT TOP 1 ptjeDimensionEstrategia FROM BaseData b2 
                  WHERE b2.IdEmpresa = ens.IdEmpresa AND b2.Test = 1) AS DeltaEstrategia,
                 (SELECT TOP 1 ptjeDimensionProcesos FROM BaseData b2 
                  WHERE b2.IdEmpresa = ens.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC, b2.Test DESC) -
                 (SELECT TOP 1 ptjeDimensionProcesos FROM BaseData b2 
                  WHERE b2.IdEmpresa = ens.IdEmpresa AND b2.Test = 1) AS DeltaProcesos
               FROM EmpresasNormalesStats ens
             ),
             -- Deltas para usuarios NO TENGO
             DeltasNoTengo AS (
               SELECT 
                 unsf.IdEmpresa,
                 unsf.IdUsuario,
                 (SELECT TOP 1 ptjeDimensionTecnologia FROM BaseData b2 
                  WHERE b2.IdUsuario = unsf.IdUsuario AND b2.IdEmpresa = unsf.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) -
                 (SELECT TOP 1 ptjeDimensionTecnologia FROM BaseData b2 
                  WHERE b2.IdUsuario = unsf.IdUsuario AND b2.IdEmpresa = unsf.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest ASC) AS DeltaTecnologia,
                 (SELECT TOP 1 ptjeDimensionComunicacion FROM BaseData b2 
                  WHERE b2.IdUsuario = unsf.IdUsuario AND b2.IdEmpresa = unsf.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) -
                 (SELECT TOP 1 ptjeDimensionComunicacion FROM BaseData b2 
                  WHERE b2.IdUsuario = unsf.IdUsuario AND b2.IdEmpresa = unsf.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest ASC) AS DeltaComunicacion,
                 (SELECT TOP 1 ptjeDimensionOrganizacion FROM BaseData b2 
                  WHERE b2.IdUsuario = unsf.IdUsuario AND b2.IdEmpresa = unsf.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) -
                 (SELECT TOP 1 ptjeDimensionOrganizacion FROM BaseData b2 
                  WHERE b2.IdUsuario = unsf.IdUsuario AND b2.IdEmpresa = unsf.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest ASC) AS DeltaOrganizacion,
                 (SELECT TOP 1 ptjeDimensionDatos FROM BaseData b2 
                  WHERE b2.IdUsuario = unsf.IdUsuario AND b2.IdEmpresa = unsf.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) -
                 (SELECT TOP 1 ptjeDimensionDatos FROM BaseData b2 
                  WHERE b2.IdUsuario = unsf.IdUsuario AND b2.IdEmpresa = unsf.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest ASC) AS DeltaDatos,
                 (SELECT TOP 1 ptjeDimensionEstrategia FROM BaseData b2 
                  WHERE b2.IdUsuario = unsf.IdUsuario AND b2.IdEmpresa = unsf.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) -
                 (SELECT TOP 1 ptjeDimensionEstrategia FROM BaseData b2 
                  WHERE b2.IdUsuario = unsf.IdUsuario AND b2.IdEmpresa = unsf.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest ASC) AS DeltaEstrategia,
                 (SELECT TOP 1 ptjeDimensionProcesos FROM BaseData b2 
                  WHERE b2.IdUsuario = unsf.IdUsuario AND b2.IdEmpresa = unsf.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest DESC) -
                 (SELECT TOP 1 ptjeDimensionProcesos FROM BaseData b2 
                  WHERE b2.IdUsuario = unsf.IdUsuario AND b2.IdEmpresa = unsf.IdEmpresa 
                  ORDER BY b2.FechaTerminoTest ASC) AS DeltaProcesos
               FROM UsuariosNoTengoStatsFinal unsf
             ),
             -- Unir ambas: empresas normales y usuarios NO TENGO
             EmpresaStats AS (
               SELECT 
                 es.IdEmpresa,
                 es.EmpresaNombre,
                 es.NombreUsuario,
                 es.SectorActividad,
                 es.TamanoEmpresa,
                 es.Departamento,
                 es.Distrito,
                 es.TotalChequeos,
                 es.PrimeraFechaTermino,
                 es.UltimaFechaTermino,
                 es.PrimerPuntaje,
                 es.UltimoPuntaje,
                 es.PrimerNivel,
                 es.UltimoNivel,
                 es.DiasEntreChequeos,
                 ISNULL(dn.DeltaTecnologia, dnt.DeltaTecnologia) AS DeltaTecnologia,
                 ISNULL(dn.DeltaComunicacion, dnt.DeltaComunicacion) AS DeltaComunicacion,
                 ISNULL(dn.DeltaOrganizacion, dnt.DeltaOrganizacion) AS DeltaOrganizacion,
                 ISNULL(dn.DeltaDatos, dnt.DeltaDatos) AS DeltaDatos,
                 ISNULL(dn.DeltaEstrategia, dnt.DeltaEstrategia) AS DeltaEstrategia,
                 ISNULL(dn.DeltaProcesos, dnt.DeltaProcesos) AS DeltaProcesos,
                 -- Saltos de nivel
                 CASE 
                   WHEN es.PrimerNivel IN ('Inicial','Novato') AND es.UltimoNivel IN ('Competente','Avanzado')
                   THEN 1 ELSE 0 
                 END AS SaltoBajoMedio,
                 CASE 
                   WHEN es.PrimerNivel = 'Competente' AND es.UltimoNivel = 'Avanzado'
                   THEN 1 ELSE 0 
                 END AS SaltoMedioAlto
               FROM (
                 SELECT * FROM EmpresasNormalesStats
                 UNION ALL
                 SELECT IdEmpresa, IdUsuario, TotalChequeos, PrimeraFechaTermino, UltimaFechaTermino, PrimerPuntaje, 
                        UltimoPuntaje, PrimerNivel, UltimoNivel, DiasEntreChequeos, EmpresaNombre, 
                        SectorActividad, TamanoEmpresa, Departamento, Distrito, NombreUsuario
                 FROM UsuariosNoTengoStatsFinal
               ) es
               LEFT JOIN DeltasNormales dn ON dn.IdEmpresa = es.IdEmpresa AND es.IdUsuario IS NULL
               LEFT JOIN DeltasNoTengo dnt ON dnt.IdEmpresa = es.IdEmpresa AND dnt.IdUsuario = es.IdUsuario
             ),
             EmpresasConMultiplesChequeos AS (
               SELECT * FROM EmpresaStats WHERE TotalChequeos >= 2
             ),
             FilteredData AS (
               SELECT *
               FROM EmpresaStats
               WHERE TotalChequeos >= 2
                 AND (
                   @searchTerm = '%%' 
                   OR EmpresaNombre LIKE @searchTerm 
                   OR SectorActividad LIKE @searchTerm
                   OR NombreUsuario LIKE @searchTerm
                 )
             ),
             PaginatedData AS (
               SELECT 
                 *,
                 ROW_NUMBER() OVER (ORDER BY ${sortByColumn} ${sortOrder}, IdEmpresa ${sortOrder}) AS RowNum,
                 COUNT(*) OVER() AS TotalRows
               FROM FilteredData
             )
             SELECT 
               IdEmpresa,
               EmpresaNombre,
               NombreUsuario,
               SectorActividad,
               TamanoEmpresa,
               CONCAT(ISNULL(Distrito,''), CASE WHEN Distrito IS NOT NULL AND Departamento IS NOT NULL THEN ', ' ELSE '' END, ISNULL(Departamento,'')) AS Ubicacion,
               TotalChequeos,
               CONVERT(VARCHAR(10), PrimeraFechaTermino, 103) AS PrimeraFechaFormatted,
               CONVERT(VARCHAR(10), UltimaFechaTermino, 103) AS UltimaFechaFormatted,
               PrimerPuntaje,
               UltimoPuntaje,
               (UltimoPuntaje - PrimerPuntaje) AS DeltaGlobal,
               DeltaTecnologia,
               DeltaComunicacion,
               DeltaOrganizacion,
               DeltaDatos,
               DeltaEstrategia,
               DeltaProcesos,
               PrimerNivel,
               UltimoNivel,
               DiasEntreChequeos,
               CASE WHEN DiasEntreChequeos > 0 THEN (UltimoPuntaje - PrimerPuntaje) / (DiasEntreChequeos / 30.0) ELSE 0 END AS TasaMejoraMensual,
               SaltoBajoMedio,
               SaltoMedioAlto,
               TotalRows
             FROM PaginatedData
             WHERE RowNum BETWEEN @offset + 1 AND @offset + @limit
             ORDER BY RowNum
             OPTION (RECOMPILE);
      `;

      let finalQuery = TABLA_QUERY.replace('${whereConditions.length > 0 ? \'AND \' + whereConditions.join(\' AND \') : \'\'}', 
        whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : '');
      
      // Replace sorting placeholders in ROW_NUMBER OVER clause
      finalQuery = finalQuery.replace(/\$\{sortByColumn\}/g, sortByColumn);
      finalQuery = finalQuery.replace(/\$\{sortOrder\}/g, sortOrder);

      const rs = await req.query(finalQuery);
      const totalCount = rs.recordset[0]?.TotalRows || 0;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: rs.recordset,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      logger.error(`Error getting rechequeos table: ${error.message}`);
      throw error;
    }
  }

  // ⚠️ FUNCIÓN ANTIGUA ELIMINADA - Usar la versión OPTIMIZADA en línea 761
  // Esta versión duplicada no usaba buildBaseCTE y ha sido removida

  /**
   * Get heatmap data for dimensions vs sectors (OPTIMIZED)
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Heatmap data
   */
  static async getHeatmapData(filters = {}) {
    try {
      logger.info('[RECHEQUEOS] Getting heatmap data');
      
      const pool = await poolPromise;
      const { whereConditions, allParams } = this.buildWhereClause(filters);
      const baseCTE = this.buildBaseCTE(filters);
      
      const req = pool.request();
      req.timeout = 180000; // 3 minutes for complex heatmap queries
      
      // Add filter parameters (including buildBaseCTE params)
      this.addFilterParameters(req, allParams);

      const HEATMAP_QUERY = `
      WITH ${baseCTE},
      ChequeosEnriquecidos AS (
        SELECT 
          cv.IdEmpresa,
          cv.SeqNum,
          cv.TotalChequeosValidos,
          rnd.ptjeDimensionTecnologia,
          rnd.ptjeDimensionComunicacion,
          rnd.ptjeDimensionOrganizacion,
          rnd.ptjeDimensionDatos,
          rnd.ptjeDimensionEstrategia,
          rnd.ptjeDimensionProcesos,
          sa.Descripcion AS SectorActividad
        FROM ChequeosValidosRenumerados cv
        LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) ON cv.IdUsuario = rnd.IdUsuario AND cv.Test = rnd.Test
        LEFT JOIN dbo.EmpresaInfo ei WITH (NOLOCK) ON cv.IdEmpresa = ei.IdEmpresa
        LEFT JOIN dbo.SectorActividad sa WITH (NOLOCK) ON ei.IdSectorActividad = sa.IdSectorActividad
        WHERE cv.TotalChequeosValidos >= 2
          AND sa.Descripcion IS NOT NULL 
          AND sa.Descripcion <> ''
        ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
      ),
      PrimerChequeo AS (
        SELECT *
        FROM ChequeosEnriquecidos
        WHERE SeqNum = 1
      ),
      UltimoChequeo AS (
        SELECT ce.*
        FROM ChequeosEnriquecidos ce
        INNER JOIN (
          SELECT IdEmpresa, MAX(SeqNum) AS MaxSeq
          FROM ChequeosEnriquecidos
          GROUP BY IdEmpresa
        ) m ON ce.IdEmpresa = m.IdEmpresa AND ce.SeqNum = m.MaxSeq
      ),
      EmpresaDeltas AS (
        SELECT
          p.IdEmpresa,
          p.SectorActividad,
          ISNULL(u.ptjeDimensionTecnologia, 0) - ISNULL(p.ptjeDimensionTecnologia, 0) AS DeltaTecnologia,
          ISNULL(u.ptjeDimensionComunicacion, 0) - ISNULL(p.ptjeDimensionComunicacion, 0) AS DeltaComunicacion,
          ISNULL(u.ptjeDimensionOrganizacion, 0) - ISNULL(p.ptjeDimensionOrganizacion, 0) AS DeltaOrganizacion,
          ISNULL(u.ptjeDimensionDatos, 0) - ISNULL(p.ptjeDimensionDatos, 0) AS DeltaDatos,
          ISNULL(u.ptjeDimensionEstrategia, 0) - ISNULL(p.ptjeDimensionEstrategia, 0) AS DeltaEstrategia,
          ISNULL(u.ptjeDimensionProcesos, 0) - ISNULL(p.ptjeDimensionProcesos, 0) AS DeltaProcesos
        FROM PrimerChequeo p
        INNER JOIN UltimoChequeo u ON p.IdEmpresa = u.IdEmpresa
      ),
      SectorAverages AS (
        SELECT 
          SectorActividad,
          ISNULL(AVG(CAST(DeltaTecnologia AS FLOAT)), 0) AS PromDeltaTecnologia,
          ISNULL(AVG(CAST(DeltaComunicacion AS FLOAT)), 0) AS PromDeltaComunicacion,
          ISNULL(AVG(CAST(DeltaOrganizacion AS FLOAT)), 0) AS PromDeltaOrganizacion,
          ISNULL(AVG(CAST(DeltaDatos AS FLOAT)), 0) AS PromDeltaDatos,
          ISNULL(AVG(CAST(DeltaEstrategia AS FLOAT)), 0) AS PromDeltaEstrategia,
          ISNULL(AVG(CAST(DeltaProcesos AS FLOAT)), 0) AS PromDeltaProcesos,
          COUNT(DISTINCT IdEmpresa) AS EmpresasEnSector
        FROM EmpresaDeltas
        GROUP BY SectorActividad
        HAVING COUNT(DISTINCT IdEmpresa) > 0
      )
      SELECT 
        SectorActividad,
        PromDeltaTecnologia,
        PromDeltaComunicacion,
        PromDeltaOrganizacion,
        PromDeltaDatos,
        PromDeltaEstrategia,
        PromDeltaProcesos,
        EmpresasEnSector
      FROM SectorAverages
      ORDER BY SectorActividad
      OPTION (RECOMPILE);
      `;

      const rs = await req.query(HEATMAP_QUERY);
      
      logger.info(`[RECHEQUEOS] Heatmap data retrieved: ${rs.recordset.length} sectors`);
      
      return rs.recordset
        .filter(row => row.SectorActividad && row.SectorActividad.trim() !== '' && row.SectorActividad !== 'N/A')
        .map(row => ({
          sector: row.SectorActividad.trim(),
          // Convertir null a 0.00 para evitar N/A% en el frontend
          tecnologia: row.PromDeltaTecnologia !== null && row.PromDeltaTecnologia !== undefined ? parseFloat(row.PromDeltaTecnologia) : 0,
          comunicacion: row.PromDeltaComunicacion !== null && row.PromDeltaComunicacion !== undefined ? parseFloat(row.PromDeltaComunicacion) : 0,
          organizacion: row.PromDeltaOrganizacion !== null && row.PromDeltaOrganizacion !== undefined ? parseFloat(row.PromDeltaOrganizacion) : 0,
          datos: row.PromDeltaDatos !== null && row.PromDeltaDatos !== undefined ? parseFloat(row.PromDeltaDatos) : 0,
          estrategia: row.PromDeltaEstrategia !== null && row.PromDeltaEstrategia !== undefined ? parseFloat(row.PromDeltaEstrategia) : 0,
          procesos: row.PromDeltaProcesos !== null && row.PromDeltaProcesos !== undefined ? parseFloat(row.PromDeltaProcesos) : 0,
          empresasEnSector: row.EmpresasEnSector || 0
        }));
    } catch (error) {
      logger.error(`Error getting heatmap data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed table data for rechequeos (OPTIMIZED WITH buildBaseCTE)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Paginated table data
   */
  static async getTableData({ page = 1, limit = 50, filters = {} }) {
    try {
      logger.info(`[RECHEQUEOS] Getting table data (page ${page}, limit ${limit})`);
      
      const offset = (page - 1) * limit;
      const pool = await poolPromise;
      const { whereConditions, allParams } = this.buildWhereClause(filters);
      const baseCTE = this.buildBaseCTE(filters);
      
      const req = pool.request();
      req.input('offset', sql.Int, offset);
      req.input('limit', sql.Int, limit);
      
      // Add filter parameters (including buildBaseCTE params)
      this.addFilterParameters(req, allParams);
      
      // Add search parameter
      const searchTerm = filters.search || '';
      req.input('searchTerm', sql.NVarChar(500), `%${searchTerm}%`);
      
      // Column mapping for sorting (sin prefijos de alias)
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

      const TABLE_QUERY = `
      WITH ${baseCTE},
      ChequeosEnriquecidos AS (
        SELECT 
          cv.IdEmpresa,
          cv.IdUsuario,
          cv.Test,
          cv.FechaTest,
          cv.FechaTerminoTest,
          cv.SeqNum,
          cv.TotalChequeosValidos,
          rnd.ptjeTotalUsuario,
          rnd.ptjeDimensionTecnologia,
          rnd.ptjeDimensionComunicacion,
          rnd.ptjeDimensionOrganizacion,
          rnd.ptjeDimensionDatos,
          rnd.ptjeDimensionEstrategia,
          rnd.ptjeDimensionProcesos,
          nm.Descripcion AS NivelMadurez,
          sa.Descripcion AS SectorActividad,
          va.Nombre AS TamanoEmpresa,
          e.Nombre AS EmpresaNombre,
          CASE WHEN sr.IdRegion = 20 THEN 'Capital' ELSE dep.Nombre END AS Departamento,
          CASE WHEN sr.Nombre IS NOT NULL THEN sr.Nombre ELSE 'OTRO' END AS Distrito,
          u.NombreCompleto AS NombreUsuario
        FROM ChequeosValidosRenumerados cv
        LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) ON cv.IdUsuario = rnd.IdUsuario AND cv.Test = rnd.Test
        LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
        LEFT JOIN dbo.EmpresaInfo ei WITH (NOLOCK) ON cv.IdEmpresa = ei.IdEmpresa AND cv.IdUsuario = ei.IdUsuario AND cv.Test = ei.Test
        LEFT JOIN dbo.SectorActividad sa WITH (NOLOCK) ON ei.IdSectorActividad = sa.IdSectorActividad
        LEFT JOIN dbo.VentasAnuales va WITH (NOLOCK) ON ei.IdVentas = va.IdVentasAnuales
        LEFT JOIN dbo.Departamentos dep WITH (NOLOCK) ON ei.IdDepartamento = dep.IdDepartamento
        LEFT JOIN dbo.SubRegion sr WITH (NOLOCK) ON ei.IdLocalidad = sr.IdSubRegion
        LEFT JOIN dbo.Empresa e WITH (NOLOCK) ON cv.IdEmpresa = e.IdEmpresa
        LEFT JOIN dbo.Usuario u WITH (NOLOCK) ON cv.IdUsuario = u.IdUsuario
        WHERE cv.TotalChequeosValidos >= 2
        ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
      ),
      EmpresasConRechequeos AS (
        SELECT 
          IdEmpresa,
          COUNT(*) AS TotalChequeos,
          MIN(FechaTerminoTest) AS PrimeraFecha,
          MAX(FechaTerminoTest) AS UltimaFecha,
          MAX(EmpresaNombre) AS EmpresaNombre,
          MAX(SectorActividad) AS SectorActividad,
          MAX(TamanoEmpresa) AS TamanoEmpresa,
          MAX(Departamento) AS Departamento,
          MAX(Distrito) AS Distrito,
          MAX(NombreUsuario) AS NombreUsuario
        FROM ChequeosEnriquecidos
        GROUP BY IdEmpresa
      ),
      PrimerChequeo AS (
        SELECT * FROM ChequeosEnriquecidos WHERE SeqNum = 1
      ),
      UltimoChequeo AS (
        SELECT ce.*
        FROM ChequeosEnriquecidos ce
        INNER JOIN (
          SELECT IdEmpresa, MAX(SeqNum) AS MaxSeq
          FROM ChequeosEnriquecidos
          GROUP BY IdEmpresa
        ) m ON ce.IdEmpresa = m.IdEmpresa AND ce.SeqNum = m.MaxSeq
      ),
      -- Lógica especial para "NO TENGO": agrupar por IdUsuario en lugar de IdEmpresa
      UsuariosNoTengoEnriquecidos AS (
        SELECT 
          cv.IdEmpresa,
          cv.IdUsuario,
          cv.SeqNum,
          cv.TotalChequeosValidos,
          rnd.ptjeTotalUsuario,
          rnd.ptjeDimensionTecnologia,
          rnd.ptjeDimensionComunicacion,
          rnd.ptjeDimensionOrganizacion,
          rnd.ptjeDimensionDatos,
          rnd.ptjeDimensionEstrategia,
          rnd.ptjeDimensionProcesos,
          nm.Descripcion AS NivelMadurez,
          sa.Descripcion AS SectorActividad,
          va.Nombre AS TamanoEmpresa,
          e.Nombre AS EmpresaNombre,
          CASE WHEN sr.IdRegion = 20 THEN 'Capital' ELSE dep.Nombre END AS Departamento,
          CASE WHEN sr.Nombre IS NOT NULL THEN sr.Nombre ELSE 'OTRO' END AS Distrito,
          u.NombreCompleto AS NombreUsuario,
          cv.FechaTerminoTest
        FROM ChequeosValidosRenumerados cv
        LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) ON cv.IdUsuario = rnd.IdUsuario AND cv.Test = rnd.Test
        LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) ON rnd.IdNivelMadurez = nm.IdNivelMadurez
        LEFT JOIN dbo.EmpresaInfo ei WITH (NOLOCK) ON cv.IdEmpresa = ei.IdEmpresa AND cv.IdUsuario = ei.IdUsuario AND cv.Test = ei.Test
        LEFT JOIN dbo.SectorActividad sa WITH (NOLOCK) ON ei.IdSectorActividad = sa.IdSectorActividad
        LEFT JOIN dbo.VentasAnuales va WITH (NOLOCK) ON ei.IdVentas = va.IdVentasAnuales
        LEFT JOIN dbo.Departamentos dep WITH (NOLOCK) ON ei.IdDepartamento = dep.IdDepartamento
        LEFT JOIN dbo.SubRegion sr WITH (NOLOCK) ON ei.IdLocalidad = sr.IdSubRegion
        LEFT JOIN dbo.Empresa e WITH (NOLOCK) ON cv.IdEmpresa = e.IdEmpresa
        LEFT JOIN dbo.Usuario u WITH (NOLOCK) ON cv.IdUsuario = u.IdUsuario
        WHERE cv.TotalChequeosValidos >= 2
          AND e.Nombre LIKE '%NO TENGO%'
        ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
      ),
      UsuariosNoTengoStats AS (
        SELECT 
          IdEmpresa,
          IdUsuario,
          COUNT(*) AS TotalChequeos,
          MIN(FechaTerminoTest) AS PrimeraFecha,
          MAX(FechaTerminoTest) AS UltimaFecha,
          MAX(EmpresaNombre) AS EmpresaNombre,
          MAX(SectorActividad) AS SectorActividad,
          MAX(TamanoEmpresa) AS TamanoEmpresa,
          MAX(Departamento) AS Departamento,
          MAX(Distrito) AS Distrito,
          MAX(NombreUsuario) AS NombreUsuario
        FROM UsuariosNoTengoEnriquecidos
        GROUP BY IdEmpresa, IdUsuario
      ),
      PrimerChequeoNoTengo AS (
        SELECT * FROM UsuariosNoTengoEnriquecidos WHERE SeqNum = 1
      ),
      UltimoChequeoNoTengo AS (
        SELECT ce.*
        FROM UsuariosNoTengoEnriquecidos ce
        INNER JOIN (
          SELECT IdEmpresa, IdUsuario, MAX(SeqNum) AS MaxSeq
          FROM UsuariosNoTengoEnriquecidos
          GROUP BY IdEmpresa, IdUsuario
        ) m ON ce.IdEmpresa = m.IdEmpresa AND ce.IdUsuario = m.IdUsuario AND ce.SeqNum = m.MaxSeq
      ),
      -- Empresas normales (no "NO TENGO")
      EmpresasNormalesEnriquecidas AS (
        SELECT * FROM ChequeosEnriquecidos
        WHERE EmpresaNombre NOT LIKE '%NO TENGO%'
      ),
      EmpresasNormalesStats AS (
        SELECT 
          IdEmpresa,
          COUNT(*) AS TotalChequeos,
          MIN(FechaTerminoTest) AS PrimeraFecha,
          MAX(FechaTerminoTest) AS UltimaFecha,
          MAX(EmpresaNombre) AS EmpresaNombre,
          MAX(SectorActividad) AS SectorActividad,
          MAX(TamanoEmpresa) AS TamanoEmpresa,
          MAX(Departamento) AS Departamento,
          MAX(Distrito) AS Distrito,
          MAX(NombreUsuario) AS NombreUsuario
        FROM EmpresasNormalesEnriquecidas
        GROUP BY IdEmpresa
      ),
      PrimerChequeoNormal AS (
        SELECT * FROM EmpresasNormalesEnriquecidas WHERE SeqNum = 1
      ),
      UltimoChequeoNormal AS (
        SELECT ce.*
        FROM EmpresasNormalesEnriquecidas ce
        INNER JOIN (
          SELECT IdEmpresa, MAX(SeqNum) AS MaxSeq
          FROM EmpresasNormalesEnriquecidas
          GROUP BY IdEmpresa
        ) m ON ce.IdEmpresa = m.IdEmpresa AND ce.SeqNum = m.MaxSeq
      ),
      -- Unir empresas normales y usuarios NO TENGO
      ResultadoCompleto AS (
        -- Empresas normales
        SELECT 
          e.IdEmpresa,
          NULL AS IdUsuario,
          e.EmpresaNombre,
          e.SectorActividad,
          e.TamanoEmpresa,
          e.Departamento,
          e.Distrito,
          e.NombreUsuario,
          e.TotalChequeos,
          e.PrimeraFecha,
          e.UltimaFecha,
          DATEDIFF(DAY, e.PrimeraFecha, e.UltimaFecha) AS DiasEntreChequeos,
          ISNULL(p.ptjeTotalUsuario, 0) AS PrimerPuntaje,
          ISNULL(u.ptjeTotalUsuario, 0) AS UltimoPuntaje,
          ISNULL(u.ptjeTotalUsuario, 0) - ISNULL(p.ptjeTotalUsuario, 0) AS DeltaGlobal,
          p.NivelMadurez AS PrimerNivel,
          u.NivelMadurez AS UltimoNivel,
          ISNULL(u.ptjeDimensionTecnologia, 0) - ISNULL(p.ptjeDimensionTecnologia, 0) AS DeltaTecnologia,
          ISNULL(u.ptjeDimensionComunicacion, 0) - ISNULL(p.ptjeDimensionComunicacion, 0) AS DeltaComunicacion,
          ISNULL(u.ptjeDimensionOrganizacion, 0) - ISNULL(p.ptjeDimensionOrganizacion, 0) AS DeltaOrganizacion,
          ISNULL(u.ptjeDimensionDatos, 0) - ISNULL(p.ptjeDimensionDatos, 0) AS DeltaDatos,
          ISNULL(u.ptjeDimensionEstrategia, 0) - ISNULL(p.ptjeDimensionEstrategia, 0) AS DeltaEstrategia,
          ISNULL(u.ptjeDimensionProcesos, 0) - ISNULL(p.ptjeDimensionProcesos, 0) AS DeltaProcesos,
          CASE 
            WHEN DATEDIFF(DAY, e.PrimeraFecha, e.UltimaFecha) > 0 
            THEN (ISNULL(u.ptjeTotalUsuario, 0) - ISNULL(p.ptjeTotalUsuario, 0)) / (DATEDIFF(DAY, e.PrimeraFecha, e.UltimaFecha) / 30.0)
            ELSE 0
          END AS TasaMejoraMensual,
          CASE 
            WHEN p.NivelMadurez IN ('Inicial', 'Novato') AND u.NivelMadurez IN ('Competente', 'Avanzado') THEN 1
            ELSE 0
          END AS SaltoBajoMedio,
          CASE 
            WHEN p.NivelMadurez IN ('Competente') AND u.NivelMadurez IN ('Avanzado') THEN 1
            ELSE 0
          END AS SaltoMedioAlto
        FROM EmpresasNormalesStats e
        INNER JOIN PrimerChequeoNormal p ON e.IdEmpresa = p.IdEmpresa
        INNER JOIN UltimoChequeoNormal u ON e.IdEmpresa = u.IdEmpresa
        
        UNION ALL
        
        -- Usuarios NO TENGO (agrupados por IdUsuario)
        SELECT 
          e.IdEmpresa,
          e.IdUsuario,
          e.EmpresaNombre,
          e.SectorActividad,
          e.TamanoEmpresa,
          e.Departamento,
          e.Distrito,
          e.NombreUsuario,
          e.TotalChequeos,
          e.PrimeraFecha,
          e.UltimaFecha,
          DATEDIFF(DAY, e.PrimeraFecha, e.UltimaFecha) AS DiasEntreChequeos,
          ISNULL(p.ptjeTotalUsuario, 0) AS PrimerPuntaje,
          ISNULL(u.ptjeTotalUsuario, 0) AS UltimoPuntaje,
          ISNULL(u.ptjeTotalUsuario, 0) - ISNULL(p.ptjeTotalUsuario, 0) AS DeltaGlobal,
          p.NivelMadurez AS PrimerNivel,
          u.NivelMadurez AS UltimoNivel,
          ISNULL(u.ptjeDimensionTecnologia, 0) - ISNULL(p.ptjeDimensionTecnologia, 0) AS DeltaTecnologia,
          ISNULL(u.ptjeDimensionComunicacion, 0) - ISNULL(p.ptjeDimensionComunicacion, 0) AS DeltaComunicacion,
          ISNULL(u.ptjeDimensionOrganizacion, 0) - ISNULL(p.ptjeDimensionOrganizacion, 0) AS DeltaOrganizacion,
          ISNULL(u.ptjeDimensionDatos, 0) - ISNULL(p.ptjeDimensionDatos, 0) AS DeltaDatos,
          ISNULL(u.ptjeDimensionEstrategia, 0) - ISNULL(p.ptjeDimensionEstrategia, 0) AS DeltaEstrategia,
          ISNULL(u.ptjeDimensionProcesos, 0) - ISNULL(p.ptjeDimensionProcesos, 0) AS DeltaProcesos,
          CASE 
            WHEN DATEDIFF(DAY, e.PrimeraFecha, e.UltimaFecha) > 0 
            THEN (ISNULL(u.ptjeTotalUsuario, 0) - ISNULL(p.ptjeTotalUsuario, 0)) / (DATEDIFF(DAY, e.PrimeraFecha, e.UltimaFecha) / 30.0)
            ELSE 0
          END AS TasaMejoraMensual,
          CASE 
            WHEN p.NivelMadurez IN ('Inicial', 'Novato') AND u.NivelMadurez IN ('Competente', 'Avanzado') THEN 1
            ELSE 0
          END AS SaltoBajoMedio,
          CASE 
            WHEN p.NivelMadurez IN ('Competente') AND u.NivelMadurez IN ('Avanzado') THEN 1
            ELSE 0
          END AS SaltoMedioAlto
        FROM UsuariosNoTengoStats e
        INNER JOIN PrimerChequeoNoTengo p ON e.IdEmpresa = p.IdEmpresa AND e.IdUsuario = p.IdUsuario
        INNER JOIN UltimoChequeoNoTengo u ON e.IdEmpresa = u.IdEmpresa AND e.IdUsuario = u.IdUsuario
      ),
      ResultadoFiltrado AS (
        SELECT * FROM ResultadoCompleto
        WHERE EmpresaNombre LIKE @searchTerm
      ),
      ResultadoPaginado AS (
        SELECT *,
          ROW_NUMBER() OVER (ORDER BY ${sortColumn} ${sortOrder}) AS RowNum,
          COUNT(*) OVER () AS TotalRows
        FROM ResultadoFiltrado
      )
      SELECT 
        IdEmpresa,
        EmpresaNombre,
        NombreUsuario,
        SectorActividad,
        TamanoEmpresa,
        Departamento,
        Distrito,
        CONCAT(ISNULL(Distrito,''), CASE WHEN Distrito IS NOT NULL AND Departamento IS NOT NULL THEN ', ' ELSE '' END, ISNULL(Departamento,'')) AS Ubicacion,
        TotalChequeos,
        FORMAT(PrimeraFecha, 'dd/MM/yyyy') AS PrimeraFechaFormatted,
        FORMAT(UltimaFecha, 'dd/MM/yyyy') AS UltimaFechaFormatted,
        PrimerPuntaje,
        UltimoPuntaje,
        DeltaGlobal,
        DeltaTecnologia,
        DeltaComunicacion,
        DeltaOrganizacion,
        DeltaDatos,
        DeltaEstrategia,
        DeltaProcesos,
        PrimerNivel,
        UltimoNivel,
        DiasEntreChequeos,
        TasaMejoraMensual,
        SaltoBajoMedio,
        SaltoMedioAlto,
        TotalRows
      FROM ResultadoPaginado
      WHERE RowNum > @offset AND RowNum <= @offset + @limit
      OPTION (RECOMPILE);
      `;

      const rs = await req.query(TABLE_QUERY);
      
      const totalCount = rs.recordset[0]?.TotalRows ?? 0;
      const totalPages = Math.ceil(totalCount / limit);
      
      logger.info(`[RECHEQUEOS] Table data retrieved: ${rs.recordset.length} rows (total: ${totalCount})`);

      return {
        data: rs.recordset,
        pagination: { total: totalCount, page, limit, totalPages }
      };
    } catch (error) {
      logger.error(`Error getting rechequeos table data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get filter options for rechequeos (reuse from empresa model with modifications)
   * @param {Object} activeFilters - Currently active filters
   * @returns {Promise<Object>} - Filter options
   */
  static async getFilterOptions(activeFilters = {}) {
    try {
      // For now, reuse the empresa filter options
      // This can be enhanced later with rechequeos-specific logic
      const EmpresaModel = require('./empresa.model');
      return await EmpresaModel.getFilterOptions(activeFilters);
    } catch (error) {
      logger.error(`Error getting rechequeos filter options: ${error.message}`);
      throw error;
    }
  }
}

module.exports = RechequeosModel;
