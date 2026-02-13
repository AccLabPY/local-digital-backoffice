# Manual de Usuario: Módulo de Empresas

## Sistema Chequeo Digital - Panel de Control de Innovación Empresarial

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Acceso al Módulo](#acceso-al-módulo)
3. [Filtros de Fecha Rápidos](#filtros-de-fecha-rápidos)
4. [Panel de Filtros Avanzados](#panel-de-filtros-avanzados)
5. [Cards de Resumen (KPIs)](#cards-de-resumen-kpis)
6. [Observatorio de Chequeos](#observatorio-de-chequeos)
7. [Exportación de Datos](#exportación-de-datos)
8. [Acciones por Empresa](#acciones-por-empresa)

---

## Descripción General

El módulo de **Empresas** es el centro de gestión donde puede explorar, buscar, filtrar y exportar información de todas las empresas participantes en el programa de innovación.

### Funcionalidades Principales

- ✅ **Visualizar** el listado completo de empresas con sus últimos resultados
- ✅ **Filtrar** por múltiples criterios (departamento, sector, nivel, etc.)
- ✅ **Buscar** empresas específicas por nombre o características
- ✅ **Exportar** reportes en formato Excel o PDF
- ✅ **Acceder** al detalle individual de cada empresa
- ✅ **Reasignar** chequeos entre empresas (administradores)
- ✅ **Eliminar** registros erróneos (administradores)

---

## Acceso al Módulo

### Desde el Menú Lateral

1. Haga clic en el ícono de **menú** (☰) si está colapsado
2. Seleccione **"Empresas"** en el menú principal
3. La pantalla cargará el listado con los filtros por defecto

### URL Directa

```
http://[SERVIDOR]:3000/empresas
```

---

## Filtros de Fecha Rápidos

### Ubicación

En la parte superior de la pantalla encontrará la tarjeta **"Filtros Rápidos de Fecha"** con un ícono de calendario.

### Opciones Disponibles

| Botón | Rango de Fechas |
|-------|-----------------|
| **Todos los tiempos** | Sin restricción de fecha |
| **Este mes** | Desde el 1° del mes actual hasta hoy |
| **Este semestre** | Desde el inicio del semestre actual |
| **Este año** | Desde el 1° de enero del año actual |
| **Año pasado** | Todo el año anterior completo |

### Filtro de Fecha Personalizado

A la derecha de los botones rápidos encontrará:

- **Desde**: Selector de fecha de inicio
- **Hasta**: Selector de fecha de fin

**Pasos para usar filtro personalizado:**

1. Haga clic en el campo **"Desde"**
2. Seleccione la fecha de inicio
3. Haga clic en el campo **"Hasta"**
4. Seleccione la fecha de fin
5. Los resultados se actualizarán automáticamente

---

## Panel de Filtros Avanzados

### Ubicación

Debajo de los filtros de fecha encontrará el panel de **"Filtros"** expandible.

### Campos de Filtro Disponibles

| Filtro | Descripción | Tipo |
|--------|-------------|------|
| **Departamento** | Ubicación geográfica (Capital, Central, etc.) | Multi-selección |
| **Distrito** | Distrito/localidad específica | Multi-selección |
| **Nivel de Innovación** | Inicial, Novato, Competente, Avanzado | Multi-selección |
| **Sector de Actividad** | Industria, Comercio, Servicios, etc. | Multi-selección |
| **Sub-Sector** | Subsector específico dentro del sector | Multi-selección |
| **Tamaño de Empresa** | Según ventas anuales | Multi-selección |

### Cómo Aplicar Filtros

1. **Expanda** el panel de filtros haciendo clic en él
2. **Seleccione** uno o más valores en cada campo
3. Los filtros se aplican **automáticamente**
4. Puede **combinar** múltiples filtros
5. Para **limpiar** un filtro, deseleccione los valores o haga clic en "Limpiar"

### Filtros Dependientes

- Al seleccionar un **Departamento**, los distritos se filtran
- Al seleccionar un **Sector**, los subsectores se filtran

---

## Cards de Resumen (KPIs)

### Indicadores Visibles

En la parte superior se muestran tarjetas con KPIs agregados:

| Card | Significado |
|------|-------------|
| **Total Empresas** | Cantidad de empresas que cumplen los filtros |
| **Nivel General** | Nivel promedio de innovación |
| **Puntaje Promedio** | Media del puntaje de todas las empresas |
| **Por Nivel** | Distribución de empresas por nivel de madurez |

Estos valores se **actualizan automáticamente** al cambiar los filtros.

---

## Observatorio de Chequeos

### Descripción

La tabla principal muestra el listado de **encuestas/chequeos completados** por empresa.

### Columnas de la Tabla

| Columna | Descripción |
|---------|-------------|
| **Empresa** | Nombre de la empresa evaluada |
| **Usuario** | Nombre del encuestado |
| **Departamento** | Ubicación geográfica |
| **Sector** | Sector de actividad económica |
| **Nivel** | Nivel de madurez digital alcanzado |
| **Puntaje** | Puntaje total obtenido (0-100) |
| **Fecha Término** | Fecha de finalización del chequeo |
| **Acciones** | Botones de acción disponibles |

### Ordenamiento

- Haga clic en el **encabezado de columna** para ordenar
- La flecha indica la dirección (↑ ascendente, ↓ descendente)
- Por defecto ordena por **Fecha Término** (más reciente primero)

### Paginación

En la parte inferior de la tabla:

- Navegue entre páginas con los botones **< >**
- Seleccione el número de página específico
- Visualice "Mostrando X de Y empresas"

---

## Exportación de Datos

### Botón de Exportar

En la esquina superior derecha encontrará el botón **"Exportar Reporte"**.

### Formatos Disponibles

#### Excel (XLSX)

**Contenido**:
- Hoja 1: Resumen ejecutivo con KPIs
- Hoja 2: Listado completo de empresas con todos los campos

**Pasos**:
1. Haga clic en "Exportar Reporte"
2. Seleccione "Excel (XLSX)"
3. Espere mientras se genera el archivo
4. El archivo se descargará automáticamente

#### PDF

**Contenido**:
- Resumen ejecutivo con gráficos
- Estadísticas principales
- Distribución por nivel

**Pasos**:
1. Haga clic en "Exportar Reporte"
2. Seleccione "PDF"
3. Espere mientras se genera el documento
4. El PDF se descargará automáticamente

> **Nota**: Los filtros aplicados afectan qué datos se exportan.

---

## Acciones por Empresa

### Botones de Acción en la Tabla

Para cada fila de empresa hay tres botones de acción:

#### 👁️ Ver Detalle (Naranja)

- **Función**: Navega al detalle completo de la empresa
- **Disponible para**: Todos los roles con acceso al módulo
- **Página destino**: `/empresas/[id]`

#### 🔄 Reasignar Chequeo (Violeta)

- **Función**: Reasigna el chequeo a otro usuario
- **Disponible para**: Superadmin, Contributor
- **Uso**: Corregir errores de asignación

**Modal de Reasignación**:

Al hacer clic en el botón violeta se abre un modal con:

| Sección | Descripción |
|---------|-------------|
| **1. Chequeo Seleccionado** | Muestra el nombre del usuario, test y fecha del chequeo actual |
| **2. Reasignar a Usuario** | Campo de búsqueda para encontrar el usuario destino |

**Opciones de búsqueda**:
- **Por Nombre**: Busca usuarios por nombre completo
- **Por Email**: Busca usuarios por correo electrónico
- **Por IdUsuario**: Busca por identificador numérico

**Pasos para reasignar**:
1. Haga clic en el botón violeta de reasignación
2. Verifique el chequeo seleccionado en la parte superior
3. Seleccione el tipo de búsqueda (Nombre, Email o IdUsuario)
4. Escriba en el campo "Seleccionar usuario destino..."
5. Seleccione el usuario de la lista desplegable
6. Confirme la reasignación
7. El chequeo se moverá al nuevo usuario

#### 🗑️ Eliminar Registro (Rojo)

- **Función**: Elimina el registro de chequeo
- **Disponible para**: Superadmin únicamente
- **Uso**: Eliminar chequeos duplicados o erróneos

**Modal de Eliminación**:

Al hacer clic en el botón rojo se abre un modal con **tres opciones de eliminación**:

| Opción | Descripción | Alcance |
|--------|-------------|---------|
| **1. Borrar el chequeo** | Elimina solo el chequeo seleccionado | Solo el IdTestUsuario y sus respuestas |
| **2. Borrar el chequeo y el usuario** | Elimina el chequeo y el usuario completo | IdTestUsuario + IdUsuario + todos los chequeos del usuario |
| **3. Borrar todo** | Eliminación completa | IdTestUsuario + IdEmpresa + IdUsuario + todos los datos relacionados |

**Pasos para eliminar**:
1. Haga clic en el botón rojo de eliminación
2. Revise la información del registro mostrada
3. **Seleccione el tipo de eliminación** apropiado
4. Lea la advertencia "Esta acción no se puede deshacer"
5. Haga clic en **"Confirmar eliminación"**
6. El registro será eliminado según la opción seleccionada

> ⚠️ **Advertencia**: La eliminación es irreversible. Verifique bien el tipo de eliminación antes de confirmar. El borrado se realiza siguiendo los procedimientos de seguridad establecidos.

---

## Flujo de Trabajo Típico

### Escenario: Revisar empresas de un departamento específico

1. Acceda al módulo de Empresas
2. En filtros, seleccione el **Departamento** deseado
3. Revise las tarjetas de KPIs actualizadas
4. Ordene por **Puntaje** para ver las mejor evaluadas
5. Haga clic en una empresa para ver su detalle
6. Exporte el reporte filtrado si lo necesita

### Escenario: Corregir un chequeo asignado incorrectamente

1. Localice el chequeo en la tabla
2. Verifique que es el registro incorrecto
3. Haga clic en el botón **Reasignar** (violeta)
4. Busque la empresa correcta
5. Complete la reasignación
6. Verifique que el cambio se refleje

---

## Preguntas Frecuentes

### ¿Por qué no veo algunas empresas?

- Verifique que no tiene filtros activos
- Asegúrese de estar en "Todos los tiempos"
- Solo se muestran chequeos **completados**

### ¿Puedo exportar solo las empresas filtradas?

Sí, el reporte exporta únicamente los datos que coinciden con los filtros aplicados.

### ¿Qué significa el nivel de innovación?

| Nivel | Rango de Puntaje | Descripción |
|-------|------------------|-------------|
| Inicial | 0-29 | Digitalización incipiente |
| Novato | 30-59 | Primeros pasos en innovación |
| Competente | 60-79 | Transformación digital en curso |
| Avanzado | 80-100 | Alto nivel de madurez digital |

---

*Documento actualizado: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
