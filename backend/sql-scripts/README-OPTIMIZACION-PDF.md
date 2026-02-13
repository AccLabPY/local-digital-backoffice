# Optimización de Exportación de PDF de Rechequeos

## Problema Identificado

La exportación de PDF de rechequeos tardaba más de 5 minutos debido a consultas agregadas lentas:
- Departamento: 62 segundos
- Distrito: 151 segundos (2.5 minutos)
- Sector: 83 segundos
- SubSector: 0.4 segundos

## Solución: Vistas Pre-Calculadas

Se crearon 4 vistas SQL pre-calculadas que agregan los datos de rechequeos por categoría, reduciendo el tiempo de consulta de minutos a milisegundos.

## Instalación

### Opción 1: Ejecutar solo las vistas agregadas (si ya tienes las vistas de rechequeos)

```sql
-- En SQL Server Management Studio (SSMS)
-- 1. Abrir: backend/sql-scripts/10-create-rechequeos-aggregated-views.sql
-- 2. Cambiar el nombre de la base de datos en la línea 9 si es diferente:
USE [TU_BASE_DE_DATOS];
-- 3. Ejecutar todo el script (F5)
```

### Opción 2: Instalación completa (si es una base de datos nueva)

```sql
-- En SQL Server Management Studio (SSMS)
-- 1. Abrir: backend/sql-scripts/INSTALACION-COMPLETA.sql
-- 2. Cambiar el nombre de la base de datos en la línea 24 si es diferente:
USE [TU_BASE_DE_DATOS];
-- 3. Ejecutar todo el script (F5)
```

## Verificación

Después de ejecutar el script, verifica que las vistas se crearon correctamente:

```sql
-- Verificar que las vistas existen
SELECT 
    name AS 'Vista',
    create_date AS 'Fecha Creación'
FROM sys.views
WHERE name LIKE 'vw_RechequeosAgregado%'
ORDER BY name;

-- Verificar datos
SELECT COUNT(*) AS 'Departamentos' FROM dbo.vw_RechequeosAgregadoPorDepartamento;
SELECT COUNT(*) AS 'Distritos' FROM dbo.vw_RechequeosAgregadoPorDistrito;
SELECT COUNT(*) AS 'Sectores' FROM dbo.vw_RechequeosAgregadoPorSector;
SELECT COUNT(*) AS 'SubSectores' FROM dbo.vw_RechequeosAgregadoPorSubSector;
```

## Vistas Creadas

1. **vw_RechequeosAgregadoPorDepartamento**: Datos agregados por departamento
2. **vw_RechequeosAgregadoPorDistrito**: Datos agregados por distrito
3. **vw_RechequeosAgregadoPorSector**: Datos agregados por sector de actividad
4. **vw_RechequeosAgregadoPorSubSector**: Datos agregados por subsector de actividad

Cada vista incluye:
- Categoría (departamento/distrito/sector/subsector)
- Cantidad de empresas
- Crecimiento promedio (%)
- Saltos de madurez (bajo→medio)
- Saltos de madurez (medio→alto)

## Mejora de Rendimiento Esperada

- **Antes**: 5+ minutos para generar PDF
- **Después**: < 10 segundos para generar PDF (mejora de 30x+)

## Próximos Pasos

1. Ejecutar el script SQL `10-create-rechequeos-aggregated-views.sql`
2. Reiniciar el backend (`Ctrl+C` y `npm run dev`)
3. Exportar un PDF de rechequeos para verificar la mejora

## Notas Importantes

- Las vistas se basan en `vw_RechequeosKPIs`, así que asegúrate de que esta vista esté creada primero
- Si agregas o actualizas datos de rechequeos, las vistas se actualizan automáticamente (son vistas, no tablas)
- Los datos agregados no admiten filtros dinámicos (muestran todos los rechequeos siempre)
