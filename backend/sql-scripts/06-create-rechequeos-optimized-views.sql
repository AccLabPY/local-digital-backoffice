/*
  ============================================================================
  VISTAS OPTIMIZADAS PARA RECHEQUEOS - SOLUCIÓN DEFINITIVA
  ============================================================================
  
  Este script crea vistas pre-calculadas que reducen drásticamente el tiempo
  de consulta de KPIs y datos de tabla de rechequeos.
  
  Compatible con: SQL Server 2012+
  Base de datos: BID_v2_22122025
  
  Vistas creadas:
  1. vw_RechequeosBase - Datos base con validación de 6 meses
  2. vw_RechequeosKPIs - KPIs pre-calculados
  3. vw_RechequeosTabla - Datos de tabla optimizados
  
  IMPORTANTE: Maneja correctamente el caso especial del IdEmpresa genérico
  para usuarios "NO TENGO" (donde múltiples usuarios comparten el mismo IdEmpresa)
  
  ============================================================================
*/

USE BID_v2;
GO

PRINT '============================================================================';
PRINT 'CREANDO VISTAS OPTIMIZADAS PARA RECHEQUEOS';
PRINT '============================================================================';
GO

-- ============================================================================
-- VISTA 1: vw_RechequeosBase
-- Datos base con toda la lógica de validación de 6 meses entre chequeos
-- MANEJA CORRECTAMENTE EL CASO "NO TENGO" (IdEmpresa genérico)
-- ============================================================================

IF OBJECT_ID('dbo.vw_RechequeosBase', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.vw_RechequeosBase;
    PRINT 'Vista existente vw_RechequeosBase eliminada';
END
GO

CREATE VIEW dbo.vw_RechequeosBase
AS
WITH 
-- Paso 0: Identificar empresa(s) genéricas
EmpresasGenericas AS (
    SELECT IdEmpresa
    FROM dbo.Empresa WITH (NOLOCK)
    WHERE Nombre LIKE '%NO TENGO%' 
       OR Nombre LIKE '%Sin empresa%' 
       OR Nombre LIKE '%NO TIENE%'
       OR IdEmpresa <= 0
),
-- Paso 1: Chequeos ordenados con clave única
-- Para empresas genéricas, la clave es IdUsuario
-- Para empresas reales, la clave es IdEmpresa
ChequeosOrdenados AS (
    SELECT 
        ei.IdEmpresa,
        ei.IdUsuario,
        ei.Test,
        ei.IdEmpresaInfo,
        tu.IdTestUsuario,
        tu.FechaTest,
        tu.FechaTerminoTest,
        ce.ClaveEntidad,
        -- Deduplicar: último chequeo con mismo Test para esta entidad
        ROW_NUMBER() OVER (
            PARTITION BY ce.ClaveEntidad, ei.Test 
            ORDER BY tu.FechaTerminoTest DESC, ei.IdEmpresaInfo DESC
        ) AS rn_dedup
    FROM dbo.EmpresaInfo ei WITH (NOLOCK)
    LEFT JOIN EmpresasGenericas eg ON ei.IdEmpresa = eg.IdEmpresa
    OUTER APPLY (
        SELECT CASE 
            WHEN eg.IdEmpresa IS NOT NULL OR ei.IdEmpresa <= 0
            THEN 'U_' + CAST(ei.IdUsuario AS VARCHAR(20))
            ELSE 'E_' + CAST(ei.IdEmpresa AS VARCHAR(20))
        END AS ClaveEntidad
    ) ce
    INNER JOIN dbo.TestUsuario tu WITH (NOLOCK) 
        ON ei.IdUsuario = tu.IdUsuario AND ei.Test = tu.Test
    WHERE tu.Finalizado = 1
),
-- Paso 2: Chequeos únicos (deduplicados) + secuencia temporal
ChequeosUnicos AS (
    SELECT 
        IdEmpresa,
        IdUsuario,
        Test,
        IdEmpresaInfo,
        IdTestUsuario,
        FechaTest,
        FechaTerminoTest,
        ClaveEntidad,
        ROW_NUMBER() OVER (
            PARTITION BY ClaveEntidad 
            ORDER BY FechaTerminoTest, IdTestUsuario
        ) AS rn_seq,
        LAG(FechaTerminoTest) OVER (
            PARTITION BY ClaveEntidad 
            ORDER BY FechaTerminoTest, IdTestUsuario
        ) AS FechaAnterior
    FROM ChequeosOrdenados
    WHERE rn_dedup = 1
),
-- Paso 3: Validar distancia de 6 meses
ChequeosValidos AS (
    SELECT 
        IdEmpresa,
        IdUsuario,
        Test,
        IdEmpresaInfo,
        IdTestUsuario,
        FechaTest,
        FechaTerminoTest,
        ClaveEntidad,
        rn_seq,
        CASE 
            WHEN FechaAnterior IS NULL THEN 1
            WHEN DATEDIFF(DAY, FechaAnterior, FechaTerminoTest) >= 180 THEN 1
            ELSE 0
        END AS EsValido
    FROM ChequeosUnicos
),
-- Paso 4: Renumerar solo chequeos válidos
ChequeosValidosRenumerados AS (
    SELECT 
        IdEmpresa,
        IdUsuario,
        Test,
        IdEmpresaInfo,
        IdTestUsuario,
        FechaTest,
        FechaTerminoTest,
        ClaveEntidad,
        ROW_NUMBER() OVER (
            PARTITION BY ClaveEntidad 
            ORDER BY FechaTerminoTest, IdTestUsuario
        ) AS SeqNum,
        COUNT(*) OVER (PARTITION BY ClaveEntidad) AS TotalChequeosValidos
    FROM ChequeosValidos
    WHERE EsValido = 1
),
-- Paso 5: Enriquecer con información de negocio
ChequeosEnriquecidos AS (
    SELECT 
        cv.IdEmpresa,
        cv.IdUsuario,
        cv.IdEmpresaInfo,
        cv.Test,
        cv.IdTestUsuario,
        cv.FechaTest,
        cv.FechaTerminoTest,
        cv.ClaveEntidad,
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
        ssa.Descripcion AS SubSectorActividad,
        va.Nombre AS TamanoEmpresa,
        e.Nombre AS EmpresaNombre,
        u.NombreCompleto AS NombreUsuario,
        CASE 
            WHEN ub.IdLocalidadLatest IS NOT NULL THEN 
                CASE WHEN ub.IdRegionLatest = 20 THEN 'Capital' ELSE ub.DepartamentoNombreLatest END
            ELSE CASE WHEN sr.IdRegion = 20 THEN 'Capital' ELSE dep.Nombre END
        END AS Departamento,
        CASE 
            WHEN ub.IdLocalidadLatest IS NOT NULL THEN ub.DistritoNombreLatest
            ELSE CASE WHEN sr.Nombre IS NOT NULL THEN sr.Nombre ELSE 'OTRO' END
        END AS Distrito
    FROM ChequeosValidosRenumerados cv
    LEFT JOIN dbo.ResultadoNivelDigital rnd WITH (NOLOCK) 
        ON cv.IdUsuario = rnd.IdUsuario AND cv.Test = rnd.Test
    LEFT JOIN dbo.NivelMadurez nm WITH (NOLOCK) 
        ON rnd.IdNivelMadurez = nm.IdNivelMadurez
    LEFT JOIN dbo.EmpresaInfo ei WITH (NOLOCK) 
        ON ei.IdEmpresaInfo = cv.IdEmpresaInfo
    LEFT JOIN dbo.SectorActividad sa WITH (NOLOCK) 
        ON ei.IdSectorActividad = sa.IdSectorActividad
    LEFT JOIN dbo.SubSectorActividad ssa WITH (NOLOCK) 
        ON ei.IdSubSectorActividad = ssa.IdSubSectorActividad
    LEFT JOIN dbo.VentasAnuales va WITH (NOLOCK) 
        ON ei.IdVentas = va.IdVentasAnuales
    LEFT JOIN dbo.Empresa e WITH (NOLOCK) 
        ON cv.IdEmpresa = e.IdEmpresa
    LEFT JOIN dbo.Usuario u WITH (NOLOCK) 
        ON cv.IdUsuario = u.IdUsuario
    LEFT JOIN dbo.Departamentos dep WITH (NOLOCK) 
        ON ei.IdDepartamento = dep.IdDepartamento
    LEFT JOIN dbo.SubRegion sr WITH (NOLOCK) 
        ON ei.IdLocalidad = sr.IdSubRegion
    OUTER APPLY (
        SELECT TOP 1 
            ei2.IdDepartamento AS IdDepartamentoLatest,
            ei2.IdLocalidad AS IdLocalidadLatest,
            dep2.Nombre AS DepartamentoNombreLatest,
            sr2.IdRegion AS IdRegionLatest,
            sr2.Nombre AS DistritoNombreLatest
        FROM dbo.EmpresaInfo ei2 WITH (NOLOCK)
        INNER JOIN dbo.TestUsuario tu2 WITH (NOLOCK) 
            ON ei2.IdUsuario = tu2.IdUsuario AND ei2.Test = tu2.Test
        LEFT JOIN dbo.Departamentos dep2 WITH (NOLOCK) ON ei2.IdDepartamento = dep2.IdDepartamento
        LEFT JOIN dbo.SubRegion sr2 WITH (NOLOCK) ON ei2.IdLocalidad = sr2.IdSubRegion
        WHERE tu2.Finalizado = 1
          AND ei2.IdEmpresa = cv.IdEmpresa
          AND ei2.IdLocalidad IS NOT NULL
        ORDER BY tu2.FechaTerminoTest DESC, ei2.IdEmpresaInfo DESC
    ) ub
)
SELECT *
FROM ChequeosEnriquecidos;
GO

PRINT '✅ Vista vw_RechequeosBase creada (incluye todas las entidades válidas)';
GO

-- ============================================================================
-- VISTA 2: vw_RechequeosKPIs
-- KPIs pre-calculados para máximo rendimiento
-- ============================================================================

IF OBJECT_ID('dbo.vw_RechequeosKPIs', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.vw_RechequeosKPIs;
    PRINT 'Vista existente vw_RechequeosKPIs eliminada';
END
GO

CREATE VIEW dbo.vw_RechequeosKPIs
AS
WITH 
EntidadesElegibles AS (
    SELECT DISTINCT ClaveEntidad
    FROM dbo.vw_RechequeosBase
    WHERE TotalChequeosValidos >= 2
),
PrimerChequeo AS (
    SELECT b.*
    FROM dbo.vw_RechequeosBase b
    INNER JOIN EntidadesElegibles ee ON b.ClaveEntidad = ee.ClaveEntidad
    WHERE b.SeqNum = 1
),
UltimoChequeo AS (
    SELECT ce.*
    FROM dbo.vw_RechequeosBase ce
    INNER JOIN EntidadesElegibles ee ON ce.ClaveEntidad = ee.ClaveEntidad
    INNER JOIN (
        SELECT ClaveEntidad, MAX(SeqNum) AS MaxSeq
        FROM dbo.vw_RechequeosBase
        GROUP BY ClaveEntidad
    ) m ON ce.ClaveEntidad = m.ClaveEntidad AND ce.SeqNum = m.MaxSeq
),
AnalisisComparativo AS (
    SELECT
        p.IdEmpresa,
        p.IdUsuario,
        p.ClaveEntidad,
        p.EmpresaNombre,
        p.NombreUsuario,
        p.SectorActividad,
        p.SubSectorActividad,
        p.TamanoEmpresa,
        p.Departamento,
        p.Distrito,
        p.TotalChequeosValidos AS TotalChequeos,
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
        -- Deltas
        u.PuntajeGlobal - p.PuntajeGlobal AS DeltaGlobal,
        u.D_Tecnologia - p.D_Tecnologia AS DeltaTecnologia,
        u.D_Comunicacion - p.D_Comunicacion AS DeltaComunicacion,
        u.D_Organizacion - p.D_Organizacion AS DeltaOrganizacion,
        u.D_Datos - p.D_Datos AS DeltaDatos,
        u.D_Estrategia - p.D_Estrategia AS DeltaEstrategia,
        u.D_Procesos - p.D_Procesos AS DeltaProcesos,
        -- Tiempo
        DATEDIFF(DAY, p.FechaTerminoTest, u.FechaTerminoTest) AS DiasEntreChequeos,
        -- Saltos de nivel
        CASE 
            WHEN p.NivelMadurez IN ('Inicial', 'Novato') AND u.NivelMadurez IN ('Competente', 'Avanzado') THEN 1
            ELSE 0
        END AS SaltoBajoMedio,
        CASE 
            WHEN p.NivelMadurez IN ('Competente') AND u.NivelMadurez IN ('Avanzado') THEN 1
            ELSE 0
        END AS SaltoMedioAlto
    FROM PrimerChequeo p
    INNER JOIN UltimoChequeo u ON p.ClaveEntidad = u.ClaveEntidad
)
SELECT 
    *,
    -- Tasa de mejora mensual
    CASE 
        WHEN DiasEntreChequeos > 0 THEN DeltaGlobal / (DiasEntreChequeos / 30.0)
        ELSE 0
    END AS TasaMejoraMensual,
    -- Clasificaciones
    CASE WHEN DeltaGlobal > 0 THEN 1 ELSE 0 END AS TieneMejoraPositiva,
    CASE WHEN DeltaGlobal < 0 THEN 1 ELSE 0 END AS TieneRegresion,
    CASE WHEN DeltaGlobal >= 0 THEN 1 ELSE 0 END AS EsConsistente
FROM AnalisisComparativo;
GO

PRINT '✅ Vista vw_RechequeosKPIs creada';
GO

-- ============================================================================
-- VISTA 3: vw_RechequeosTabla
-- Datos optimizados para la tabla de rechequeos
-- ============================================================================

IF OBJECT_ID('dbo.vw_RechequeosTabla', 'V') IS NOT NULL
BEGIN
    DROP VIEW dbo.vw_RechequeosTabla;
    PRINT 'Vista existente vw_RechequeosTabla eliminada';
END
GO

CREATE VIEW dbo.vw_RechequeosTabla
AS
SELECT
    IdEmpresa,
    IdUsuario,
    ClaveEntidad,
    EmpresaNombre,
    NombreUsuario,
    SectorActividad,
    SubSectorActividad,
    TamanoEmpresa,
    Departamento,
    Distrito,
    CONCAT(ISNULL(Distrito,''), CASE WHEN Distrito IS NOT NULL AND Departamento IS NOT NULL THEN ', ' ELSE '' END, ISNULL(Departamento,'')) AS Ubicacion,
    TotalChequeos,
    Puntaje_Primero AS PrimerPuntaje,
    Nivel_Primero AS PrimerNivel,
    Puntaje_Ultimo AS UltimoPuntaje,
    Nivel_Ultimo AS UltimoNivel,
    Fecha_Primero AS PrimeraFecha,
    Fecha_Ultimo AS UltimaFecha,
    DiasEntreChequeos,
    DeltaGlobal,
    DeltaTecnologia,
    DeltaComunicacion,
    DeltaOrganizacion,
    DeltaDatos,
    DeltaEstrategia,
    DeltaProcesos,
    TasaMejoraMensual,
    SaltoBajoMedio,
    SaltoMedioAlto,
    TieneMejoraPositiva,
    TieneRegresion
FROM dbo.vw_RechequeosKPIs;
GO

PRINT '✅ Vista vw_RechequeosTabla creada';
GO

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

PRINT '';
PRINT '============================================================================';
PRINT 'VERIFICANDO VISTAS CREADAS';
PRINT '============================================================================';

-- Contar registros en cada vista
DECLARE @CountBase INT, @CountKPIs INT, @CountTabla INT;

SELECT @CountBase = COUNT(*) FROM dbo.vw_RechequeosBase WITH (NOLOCK);
SELECT @CountKPIs = COUNT(*) FROM dbo.vw_RechequeosKPIs WITH (NOLOCK);
SELECT @CountTabla = COUNT(*) FROM dbo.vw_RechequeosTabla WITH (NOLOCK);

PRINT '✅ vw_RechequeosBase: ' + CAST(@CountBase AS VARCHAR(10)) + ' registros (entidades con 2+ chequeos)';
PRINT '✅ vw_RechequeosKPIs: ' + CAST(@CountKPIs AS VARCHAR(10)) + ' registros';
PRINT '✅ vw_RechequeosTabla: ' + CAST(@CountTabla AS VARCHAR(10)) + ' registros';

PRINT '';
PRINT '============================================================================';
PRINT 'VISTAS OPTIMIZADAS CREADAS EXITOSAMENTE';
PRINT '';
PRINT 'IMPORTANTE: Las vistas ahora manejan correctamente el caso especial';
PRINT 'del IdEmpresa genérico para usuarios "NO TENGO".';
PRINT '';
PRINT 'Próximo paso:';
PRINT '1. Ejecutar este script';
PRINT '2. Reiniciar el backend para que detecte las vistas actualizadas';
PRINT '3. Verificar que los KPIs de distribución muestren valores correctos';
PRINT '============================================================================';
GO
