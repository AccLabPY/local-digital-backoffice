# Manual de Usuario: Detalle de Encuesta

## Sistema Chequeo Digital - Panel de Control de Innovación Empresarial

---

## 📋 Índice

1. [Acceso al Detalle](#acceso-al-detalle)
2. [Navegación por Dimensiones](#navegación-por-dimensiones)
3. [Tipos de Preguntas](#tipos-de-preguntas)
4. [Ver Opciones Disponibles](#ver-opciones-disponibles)
5. [Preguntas con Subrespuestas](#preguntas-con-subrespuestas)
6. [Interpretación de Puntajes](#interpretación-de-puntajes)

---

## Acceso al Detalle

### Desde el Historial de Evaluaciones

1. Acceda al **Detalle de Empresa**
2. Localice la sección **"Historial de Evaluaciones"**
3. Cada evaluación muestra: fecha, duración, estado y puntaje
4. Haga clic en el botón **"Ver Respuestas"** (azul)

### URL Directa

```
http://[SERVIDOR]:3000/empresas/[ID_EMPRESA]/encuesta/[ID_ENCUESTA]
```

### Información del Encabezado

La página muestra:
- Nombre de la empresa
- Nombre de la evaluación (ej: "Evaluación Digital 2025")
- Breadcrumb de navegación: Empresas > [Empresa] > Respuestas

---

## Navegación por Dimensiones

### Pestañas Disponibles

Las respuestas están organizadas en pestañas:

| Pestaña | Contenido |
|---------|-----------|
| **Todas** | Todas las preguntas de la encuesta |
| **Comunicación** | Preguntas sobre canales digitales |
| **Datos** | Preguntas sobre gestión de datos |
| **Estrategia** | Preguntas sobre planificación digital |
| **Organización** | Preguntas sobre estructura organizacional |
| **Tecnología** | Preguntas sobre adopción tecnológica |

### Cómo Navegar

1. Haga clic en la pestaña de la dimensión deseada
2. Las preguntas se filtran automáticamente
3. Cada pregunta muestra un badge con su dimensión de origen

---

## Tipos de Preguntas

### Selección Única

**Descripción**: Una sola opción seleccionable.

**Visualización**: Muestra la opción seleccionada con checkmark verde.

**Ejemplos**:
- Preguntas Sí/No
- Opciones excluyentes (A, B, C, D)

### Selección Múltiple

**Descripción**: Varias opciones pueden ser seleccionadas.

**Visualización**: Lista de checkboxes con las opciones marcadas.

**Identificador**: Muestra todas las opciones seleccionadas con ícono ✓.

### Ranking

**Descripción**: Ordenar opciones por preferencia o frecuencia.

**Visualización**: Lista numerada (#1, #2, #3...) con opciones ordenadas.

**Uso típico**: Medios de pago preferidos, canales más utilizados.

### Completar (Porcentaje)

**Descripción**: Ingresar un valor numérico porcentual.

**Visualización**: Valor ingresado con formato "X%".

**Rango**: 0% a 100%

**Ejemplo**: "El porcentaje de empleados que usan dispositivos... es aproximadamente: **50%**"

### Bidimensional (Matriz)

**Descripción**: Seleccionar frecuencia/opción para múltiples items.

**Visualización**: Tabla con filas (items) y columnas (frecuencias).

**Uso típico**: 
- Frecuencia de capacitación por tema
- Uso de canales digitales

**Estructura**:
- Eje Y: Temas/Items a evaluar
- Eje X: Opciones de frecuencia/uso

---

## Ver Opciones Disponibles

### Botón "Ver opciones"

Para cada pregunta existe un botón a la derecha.

### Pasos

1. Haga clic en **"Ver opciones"** (ícono de ojo)
2. Se abre un modal con:
   - Texto completo de la pregunta
   - Tipo de pregunta
   - Respuesta actual (resaltada)
   - Todas las opciones disponibles

### Contenido del Modal según Tipo

| Tipo | Contenido |
|------|-----------|
| **Selección Única** | Opciones con checkmark en la seleccionada |
| **Selección Múltiple** | Lista de opciones con checkbox activos |
| **Ranking** | Opciones con número de ranking asignado |
| **Completar** | Valor ingresado con ejemplos de rango |
| **Bidimensional** | Matriz de items × opciones con selecciones |

---

## Preguntas con Subrespuestas

### Identificación

Las preguntas con subrespuestas muestran:
- Badge **"Con subrespuestas"**
- Texto: "+X respuesta(s) adicional(es)"

### Expansión

1. Haga clic en el botón **expandir (›)** a la derecha
2. Se despliegan todas las subrespuestas
3. Cada una muestra:
   - Texto de la subpregunta
   - Valor de la respuesta
   - Puntaje individual

### Colapsar

- Haga clic nuevamente en el botón para colapsar
- El ícono cambia de › a ˅ cuando está expandido

---

## Interpretación de Puntajes

### Indicadores de Color

| Color | Significado | Rango |
|-------|-------------|-------|
| 🟢 **Verde** | Puntaje alto | > 0.5 |
| 🟡 **Amarillo** | Puntaje medio | 0.001 - 0.5 |
| 🔴 **Rojo** | Sin puntaje | 0 |

### Formato de Puntaje

Los puntajes se muestran con 3 decimales:
- **0.000**: Sin puntaje
- **1.500**: Puntaje parcial
- **2.000**: Puntaje completo por respuesta

### Puntaje Total

El puntaje total de la encuesta es la suma de los puntajes individuales, normalizado a porcentaje (0-100%).

---

## Flujo de Trabajo Típico

### Escenario: Revisar respuestas de una empresa

1. Navegue a **Empresas** y busque la empresa
2. Haga clic en **Ver Detalle**
3. En **Historial de Evaluaciones**, seleccione la encuesta
4. Haga clic en **"Ver Respuestas"**
5. Use las pestañas para navegar por dimensiones
6. Para preguntas específicas, use **"Ver opciones"**
7. Expanda subrespuestas si es necesario
8. Use **"Volver al Historial"** para regresar

### Escenario: Comparar respuestas entre encuestas

1. Revise las respuestas de la primera encuesta
2. Tome nota de las respuestas clave
3. Vuelva al historial
4. Abra la segunda encuesta
5. Compare las respuestas en las mismas dimensiones

---

## Preguntas Frecuentes

### ¿Por qué algunas preguntas muestran 0.000 de puntaje?

El puntaje 0 indica que la respuesta seleccionada no aporta puntos al nivel de madurez digital. Esto es normal para opciones como "No" o "Ninguno de los anteriores".

### ¿Puedo editar las respuestas?

No, las respuestas de encuestas completadas son inmutables. Solo se pueden visualizar.

### ¿Qué significa "Con subrespuestas"?

Indica que la pregunta tiene múltiples partes o subpreguntas que fueron contestadas individualmente.

### ¿Por qué no veo algunas dimensiones?

Si una dimensión no tiene preguntas contestadas, la pestaña puede no aparecer o mostrar "No hay respuestas".

---

*Documento actualizado: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
