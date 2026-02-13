# Manual de Usuario: Dashboard Looker

## Sistema Chequeo Digital - Panel de Control de Innovación Empresarial

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Acceso al Dashboard](#acceso-al-dashboard)
3. [Componentes del Dashboard](#componentes-del-dashboard)
4. [Métricas Principales](#métricas-principales)
5. [Interpretación de Gráficos](#interpretación-de-gráficos)
6. [Roles y Permisos](#roles-y-permisos)

---

## Descripción General

El **Dashboard Looker** es el panel de control central que proporciona una vista general del estado del programa de innovación empresarial. Muestra métricas agregadas, gráficos y visualizaciones que permiten entender rápidamente el progreso del programa.

### Propósito

- Proporcionar una **visión ejecutiva** del programa
- Mostrar **indicadores clave** de rendimiento
- Permitir **monitoreo** del progreso general
- Facilitar la **toma de decisiones** basada en datos

### Audiencia

Este dashboard está diseñado para:
- Gerentes de programa
- Directivos del MIC
- Personal del BID
- Analistas de datos
- Todos los roles del sistema

---

## Acceso al Dashboard

### Desde el Menú Lateral

1. Haga clic en **"Dashboard Looker"** en el menú
2. El icono es un gráfico de barras (📊)
3. La página cargará automáticamente las visualizaciones

### URL Directa

```
http://[SERVIDOR]:3000/dashboard
```

### Permisos Requeridos

| Rol | Acceso |
|-----|--------|
| Superadmin | ✅ Completo |
| Contributor | ✅ Completo |
| Viewer | ✅ Solo lectura |

---

## Componentes del Dashboard

### Estructura de la Página

El dashboard se organiza en secciones:

1. **Encabezado**: Título y descripción
2. **KPIs Principales**: Tarjetas con métricas clave
3. **Gráficos**: Visualizaciones interactivas
4. **Distribuciones**: Análisis por categorías

### Tarjetas de KPIs

Cada tarjeta muestra:
- **Título**: Nombre del indicador
- **Valor principal**: Métrica destacada
- **Subtítulo/Contexto**: Información adicional
- **Ícono**: Representación visual del tipo de dato

---

## Métricas Principales

### Total de Empresas Evaluadas

| Aspecto | Detalle |
|---------|---------|
| **Descripción** | Cantidad total de empresas con al menos un chequeo |
| **Cálculo** | COUNT DISTINCT de empresas con chequeos finalizados |
| **Utilidad** | Medir alcance del programa |

### Nivel de Innovación Promedio

| Aspecto | Detalle |
|---------|---------|
| **Descripción** | Puntaje promedio general de todas las empresas |
| **Cálculo** | AVG(puntaje_total) de último chequeo por empresa |
| **Rango** | 0 a 100 puntos |
| **Utilidad** | Evaluar madurez digital general |

### Distribución por Nivel

| Nivel | Rango | Color |
|-------|-------|-------|
| **Inicial** | 0-29 | Rojo |
| **Novato** | 30-59 | Amarillo |
| **Competente** | 60-79 | Verde claro |
| **Avanzado** | 80-100 | Verde/Azul |

### Empresas por Departamento

- Distribución geográfica de las empresas evaluadas
- Permite identificar concentración/dispersión territorial
- Útil para planificación de recursos

### Empresas por Sector

- Distribución por actividad económica
- Identifica sectores más/menos participativos
- Orienta estrategias de captación

---

## Interpretación de Gráficos

### Gráfico de Barras - Distribución por Nivel

**Lectura**:
- Eje X: Niveles de madurez
- Eje Y: Cantidad de empresas
- Barra más alta: Nivel más frecuente

**Análisis**:
- Distribución normal indica programa balanceado
- Sesgo a la izquierda: Mayoría en niveles bajos
- Sesgo a la derecha: Éxito del programa

### Gráfico de Pastel - Distribución Sectorial

**Lectura**:
- Cada sector tiene un color/porción
- El tamaño representa proporción
- Leyenda identifica cada sector

**Análisis**:
- Sectores dominantes vs. subrepresentados
- Oportunidades de expansión
- Foco de intervención

### Gráfico de Mapa - Distribución Geográfica

**Lectura**:
- Puntos/Áreas representan ubicaciones
- Intensidad indica concentración
- Hover para detalles

**Análisis**:
- Cobertura territorial
- Zonas sin atención
- Densidad por región

---

## Roles y Permisos

### Viewer

- ✅ Puede ver todo el dashboard
- ❌ No puede exportar datos
- ❌ No puede acceder a detalles

### Contributor

- ✅ Puede ver todo el dashboard
- ✅ Puede acceder a detalles desde gráficos
- ❌ No puede modificar configuraciones

### Superadmin

- ✅ Acceso completo
- ✅ Puede configurar métricas
- ✅ Puede exportar todo

---

## Mejores Prácticas

### Para Presentaciones

1. Capture pantalla de KPIs principales
2. Destaque tendencias positivas
3. Identifique áreas de oportunidad
4. Compare con períodos anteriores

### Para Análisis

1. Combine con datos de rechequeos
2. Segmente por características demográficas
3. Identifique patrones estacionales
4. Correlacione con intervenciones del programa

### Para Monitoreo

1. Revise semanalmente los KPIs
2. Configure alertas si aplica
3. Documente cambios significativos
4. Reporte anomalías al equipo

---

## Preguntas Frecuentes

### ¿Con qué frecuencia se actualizan los datos?

Los datos se actualizan en **tiempo real** cada vez que se carga el dashboard. Las métricas reflejan el estado actual de la base de datos.

### ¿Puedo filtrar los datos del dashboard?

El Dashboard Looker muestra datos agregados sin filtros. Para análisis filtrado, use los módulos de:
- **Empresas**: Filtros completos
- **Rechequeos**: Análisis de evolución

### ¿Por qué los números difieren de otros módulos?

Pueden existir diferencias por:
- **Rechequeos**: Solo muestra empresas con 2+ chequeos
- **Empresas**: Puede tener filtros activos
- **Dashboard**: Muestra totales sin filtrar

### ¿Qué significa cada nivel de innovación?

| Nivel | Características |
|-------|-----------------|
| **Inicial** | Sin uso de herramientas digitales, procesos manuales |
| **Novato** | Uso básico de tecnología, primeros pasos |
| **Competente** | Digitalización intermedia, algunos procesos automatizados |
| **Avanzado** | Alta madurez digital, transformación consolidada |

---

*Documento actualizado: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
