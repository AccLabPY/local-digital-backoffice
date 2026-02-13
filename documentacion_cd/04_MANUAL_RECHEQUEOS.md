# Manual de Usuario: Módulo de Rechequeos

## Sistema Chequeo Digital - Panel de Control de Innovación Empresarial

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Acceso al Módulo](#acceso-al-módulo)
3. [KPIs de Rechequeos](#kpis-de-rechequeos)
4. [Filtros de Fecha](#filtros-de-fecha)
5. [Panel de Filtros](#panel-de-filtros)
6. [Gráficos Analíticos](#gráficos-analíticos)
7. [Tabla de Rechequeos](#tabla-de-rechequeos)
8. [Exportación de Datos](#exportación-de-datos)
9. [Interpretación de Métricas](#interpretación-de-métricas)

---

## Descripción General

El módulo de **Rechequeos** permite analizar la evolución temporal de las empresas que han realizado **dos o más chequeos de innovación**. Este módulo es fundamental para medir el impacto del programa y la mejora de las empresas a lo largo del tiempo.

### ¿Qué es un Rechequeo?

Un **rechequeo** se produce cuando una empresa completa una nueva encuesta de innovación después de haber completado una anterior, con un intervalo mínimo de **6 meses** entre ambas.

### Funcionalidades Principales

- ✅ **Visualizar** KPIs de cobertura, magnitud y velocidad de mejora
- ✅ **Analizar** gráficos de evolución por sector, tamaño y dimensión
- ✅ **Filtrar** por múltiples criterios demográficos y temporales
- ✅ **Consultar** tabla detallada de empresas con rechequeos
- ✅ **Exportar** datos en formato CSV y PDF

---

## Acceso al Módulo

### Desde el Menú Lateral

1. Haga clic en el ícono de **menú** (☰) si está colapsado
2. Seleccione **"Rechequeos"** (ícono de flecha circular 🔄)
3. La página cargará los KPIs y gráficos automáticamente

### URL Directa

```
http://[SERVIDOR]:3000/rechequeos
```

---

## KPIs de Rechequeos

### Ubicación

Primera sección de la página, mostrando tarjetas con indicadores clave.

### Categorías de KPIs

#### 📊 KPIs de Cobertura

| Indicador | Descripción |
|-----------|-------------|
| **Tasa de Reincidencia** | % de empresas que volvieron a chequearse |
| **Promedio de Chequeos por Empresa** | Cantidad media de chequeos realizados |
| **Tiempo Promedio Entre Chequeos** | Días promedio entre un chequeo y otro |
| **Distribución** | Empresas con 1, 2-3, o más de 3 chequeos |

#### 📈 KPIs de Magnitud

| Indicador | Descripción |
|-----------|-------------|
| **Delta Global Promedio** | Cambio promedio en el puntaje total |
| **Delta por Dimensión** | Cambio por cada dimensión de innovación |
| **% con Mejora Positiva** | Empresas que mejoraron su puntaje |
| **% con Regresión** | Empresas que bajaron su puntaje |
| **Saltos de Nivel** | Empresas que subieron de categoría |

#### ⚡ KPIs de Velocidad

| Indicador | Descripción |
|-----------|-------------|
| **Tasa de Mejora Mensual** | Puntos de mejora por mes |
| **Índice de Consistencia** | % de empresas con mejora sostenida |

### Interpretación de Colores

- 🟢 **Verde**: Indicador positivo (mejora, crecimiento)
- 🔴 **Rojo**: Indicador negativo (regresión, retroceso)
- 🟡 **Amarillo/Naranja**: Indicador neutral o en transición

---

## Filtros de Fecha

### Botones de Filtro Rápido

| Botón | Período |
|-------|---------|
| **Todos los tiempos** | Sin restricción temporal |
| **Este mes** | Mes actual |
| **Este semestre** | Semestre en curso |
| **Este año** | Año calendario actual |
| **Año pasado** | Año anterior completo |

### Filtro de Fecha Personalizado

**Campos disponibles**:
- **Desde**: Fecha de inicio del período
- **Hasta**: Fecha de fin del período

**Comportamiento**:
- Al cambiar las fechas, los KPIs se recalculan
- Los gráficos se actualizan automáticamente
- La tabla muestra solo rechequeos del período

---

## Panel de Filtros

### Filtros Disponibles

| Filtro | Descripción | Tipo |
|--------|-------------|------|
| **Departamento** | Ubicación geográfica | Multi-selección |
| **Distrito** | Localidad específica | Multi-selección |
| **Nivel de Innovación** | Nivel actual alcanzado | Multi-selección |
| **Sector de Actividad** | Industria, Comercio, etc. | Multi-selección |
| **Sub-Sector** | Categoría específica | Multi-selección |
| **Tamaño de Empresa** | Por ventas anuales | Multi-selección |

### Cómo Aplicar Filtros

1. Expanda el panel de filtros
2. Seleccione los valores deseados
3. Los datos se actualizarán automáticamente
4. Los KPIs mostrarán valores filtrados

---

## Gráficos Analíticos

### Heatmap de Mejora por Sector y Dimensión

#### Descripción
Matriz de calor que muestra el **promedio de mejora (delta)** para cada combinación de sector económico y dimensión de innovación.

#### Cómo Leer el Heatmap
- **Filas**: Sectores de actividad
- **Columnas**: Dimensiones de innovación
- **Color**: Intensidad de mejora
  - 🔴 Rojo: Retroceso (delta negativo)
  - ⚪ Blanco: Sin cambio (delta cercano a 0)
  - 🟢 Verde: Mejora (delta positivo)

#### Utilidad
- Identificar qué sectores mejoran más en cada dimensión
- Detectar dimensiones problemáticas por sector
- Priorizar intervenciones del programa

### Gráfico de Evolución Temporal

#### Descripción
Línea de tiempo que muestra la evolución del puntaje promedio por categoría (sector, tamaño o departamento).

#### Controles
- **Selector de categoría**: Cambiar entre Tamaño, Sector, Departamento
- **Período**: Definido por los filtros de fecha activos

#### Interpretación
- Líneas ascendentes indican mejora
- Líneas descendentes indican retroceso
- Comparar múltiples categorías simultáneamente

### Distribución de Chequeos

#### Descripción
Gráfico de pastel/barras mostrando la distribución de empresas según cantidad de chequeos.

#### Categorías
- **1 chequeo**: Empresas con solo evaluación inicial
- **2-3 chequeos**: Empresas con seguimiento moderado
- **>3 chequeos**: Empresas con seguimiento intensivo

---

## Tabla de Rechequeos

### Ubicación

Sección inferior de la página, debajo de los gráficos.

### Columnas Disponibles

| Columna | Descripción |
|---------|-------------|
| **Empresa** | Nombre de la empresa |
| **Usuario** | Encuestado principal |
| **Sector** | Sector de actividad |
| **Tamaño** | Clasificación por ventas |
| **Departamento** | Ubicación |
| **Total Chequeos** | Cantidad de evaluaciones |
| **Primer Puntaje** | Resultado del primer chequeo |
| **Último Puntaje** | Resultado del último chequeo |
| **Delta Global** | Diferencia entre primero y último |
| **Días Entre Chequeos** | Tiempo transcurrido |
| **Fecha Primer Chequeo** | Fecha inicial |
| **Fecha Último Chequeo** | Fecha final |

### Funcionalidades de la Tabla

#### Ordenamiento
- Haga clic en cualquier encabezado de columna
- La flecha indica dirección (↑ asc, ↓ desc)
- Por defecto: ordenado por fecha del último chequeo

#### Paginación
- Navegue con los botones de página
- Seleccione número de registros por página
- Visualice el total de registros

#### Búsqueda
- Use el campo de búsqueda general
- Busca en nombre de empresa, usuario, sector

---

## Exportación de Datos

### Botón Exportar PDF

**Ubicación**: Esquina superior derecha (botón naranja)

**Contenido del PDF**:
- Resumen ejecutivo de KPIs
- Gráficos principales
- Tabla resumida de rechequeos
- Fecha y filtros aplicados

**Pasos**:
1. Haga clic en "Exportar PDF"
2. Espere la generación
3. El archivo se descargará automáticamente

### Botón Exportar CSV

**Ubicación**: Esquina superior derecha (botón azul)

**Contenido del CSV**:
- Todas las columnas de la tabla
- Todos los registros (respetando filtros)
- Formato compatible con Excel

**Pasos**:
1. Haga clic en "Exportar CSV"
2. Espere la generación
3. El archivo se descargará automáticamente

---

## Interpretación de Métricas

### Delta Global

| Valor | Interpretación |
|-------|----------------|
| **> 10** | Mejora significativa |
| **5 a 10** | Mejora moderada |
| **0 a 5** | Mejora leve |
| **0** | Sin cambio |
| **< 0** | Regresión |

### Tasa de Reincidencia

| Valor | Interpretación |
|-------|----------------|
| **> 30%** | Alta participación en seguimiento |
| **15-30%** | Participación moderada |
| **< 15%** | Baja reincidencia |

### Tiempo Entre Chequeos

| Valor | Interpretación |
|-------|----------------|
| **< 180 días** | No se cuenta como rechequeo válido |
| **180-365 días** | Seguimiento semestral/anual |
| **> 365 días** | Seguimiento de largo plazo |

### Saltos de Nivel

Los "saltos de nivel" ocurren cuando una empresa cambia de categoría:

| Tipo de Salto | Descripción |
|---------------|-------------|
| **Bajo → Medio** | De Inicial/Novato a Competente/Avanzado |
| **Medio → Alto** | De Competente a Avanzado |

Estos saltos indican transformaciones significativas en la madurez digital.

---

## Casos de Uso Típicos

### Escenario: Evaluar impacto del programa

1. Seleccione "Todos los tiempos" en filtros de fecha
2. Revise el **% de Mejora Positiva** en KPIs
3. Analice el **Delta Global Promedio**
4. Observe los **Saltos de Nivel** conseguidos
5. Exporte el PDF para reportar resultados

### Escenario: Análisis sectorial

1. En el heatmap, identifique sectores con más mejora
2. Filtre por un sector específico
3. Revise los KPIs para ese sector
4. Compare con el promedio general
5. Identifique dimensiones fuertes/débiles

### Escenario: Seguimiento de cohorte

1. Defina el período con filtros de fecha
2. Identifique empresas del período en la tabla
3. Ordene por Delta Global
4. Analice las empresas con mejor/peor desempeño
5. Exporte CSV para análisis detallado

---

## Preguntas Frecuentes

### ¿Por qué una empresa no aparece en rechequeos?

Para aparecer en el módulo de rechequeos, una empresa debe:
- Tener **al menos 2 chequeos completados**
- Tener un intervalo **mínimo de 6 meses** entre chequeos
- Ambos chequeos deben estar en estado **Finalizado**

### ¿Qué significa un Delta negativo?

Un delta negativo indica que el puntaje del último chequeo es **menor** que el del primero. Esto puede deberse a:
- Cambios en la operación de la empresa
- Contexto económico adverso
- Mayor exigencia en la autoevaluación
- Cambio de encuestado

### ¿Cómo se calcula la Tasa de Mejora Mensual?

```
Tasa Mejora Mensual = Delta Global / (Días Entre Chequeos / 30)
```

Ejemplo: Si una empresa mejoró 15 puntos en 360 días:
```
Tasa = 15 / (360/30) = 15 / 12 = 1.25 puntos/mes
```

### ¿Por qué los KPIs tardan en cargar?

El módulo de rechequeos realiza cálculos complejos sobre toda la base de datos. El sistema usa **vistas SQL optimizadas** y **caché** para acelerar las consultas, pero con muchos filtros puede tomar algunos segundos.

---

*Documento actualizado: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
