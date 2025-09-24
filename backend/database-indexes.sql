-- ===== ÍNDICES CRÍTICOS PARA OPTIMIZAR RENDIMIENTO DE EMPRESAS =====
-- ⚠️ EJECUTAR ESTOS ÍNDICES PARA ELIMINAR LOS 20-45 SEGUNDOS DE CARGA ⚠️

-- TestUsuario: escaneo rápido por finalizado + (usuario,test)
CREATE INDEX IX_TestUsuario_Finalizado_Usuario_Test
  ON dbo.TestUsuario (Finalizado, IdUsuario, Test)
  INCLUDE (FechaTest, IdTestUsuario);

-- Respuesta: para el EXISTS (usuario,test)
CREATE INDEX IX_Respuesta_Usuario_Test
  ON dbo.Respuesta (IdUsuario, Test)
  INCLUDE (IdRespuesta);

-- EmpresaInfo: buscamos por (usuario,test) y luego leemos varias columnas
CREATE INDEX IX_EmpresaInfo_Usuario_Test
  ON dbo.EmpresaInfo (IdUsuario, Test)
  INCLUDE (IdEmpresa, IdDepartamento, IdLocalidad, IdSectorActividad, IdVentas,
           AnnoCreacion, TotalEmpleados, SexoGerenteGeneral, SexoPropietarioPrincipal);

-- ResultadoNivelDigital: (usuario,test) y columnas usadas
CREATE INDEX IX_RND_Usuario_Test
  ON dbo.ResultadoNivelDigital (IdUsuario, Test)
  INCLUDE (IdResultadoNivelDigital, IdNivelMadurez, ptjeTotalUsuario);

-- Tablas de catálogo (resuelven OUTER APPLY y EXISTS de búsqueda y filtros)
CREATE INDEX IX_Empresa_Id ON dbo.Empresa (IdEmpresa) INCLUDE (Nombre);
CREATE INDEX IX_Departamentos_Id ON dbo.Departamentos (IdDepartamento) INCLUDE (Nombre);
CREATE INDEX IX_SubRegion_Id ON dbo.SubRegion (IdSubRegion) INCLUDE (Nombre);
CREATE INDEX IX_SectorActividad_Id ON dbo.SectorActividad (IdSectorActividad) INCLUDE (Descripcion);
CREATE INDEX IX_VentasAnuales_Id ON dbo.VentasAnuales (IdVentasAnuales) INCLUDE (Nombre);

-- Índice filtrado para tests finalizados (patrón más común: Finalizado = 1)
CREATE INDEX IX_TestUsuario_Finalizados
  ON dbo.TestUsuario (IdUsuario, Test)
  WHERE Finalizado = 1;

-- ===== VERIFICAR ÍNDICES EXISTENTES =====
-- Ejecutar esto primero para ver qué índices ya existen:
/*
SELECT 
    i.name AS IndexName,
    t.name AS TableName,
    i.type_desc AS IndexType,
    i.is_unique,
    i.is_primary_key
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('TestUsuario', 'Respuesta', 'EmpresaInfo', 'ResultadoNivelDigital', 
                 'Empresa', 'Departamentos', 'SubRegion', 'SectorActividad', 'VentasAnuales')
ORDER BY t.name, i.name;
*/
