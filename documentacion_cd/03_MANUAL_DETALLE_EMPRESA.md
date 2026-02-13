# Manual de Usuario: Detalle de Empresa

## Sistema Chequeo Digital - Panel de Control de Innovación Empresarial

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Acceso a la Vista](#acceso-a-la-vista)
3. [Información General](#información-general)
4. [Edición de Datos](#edición-de-datos)
5. [Gestión de Usuarios Asignados](#gestión-de-usuarios-asignados)
6. [Sección de Liderazgo](#sección-de-liderazgo)
7. [Gráficos de Evolución](#gráficos-de-evolución)
8. [Resultados de Evaluación](#resultados-de-evaluación)
9. [Historial de Encuestas](#historial-de-encuestas)
10. [Exportar Ficha PDF](#exportar-ficha-pdf)

---

## Descripción General

La vista de **Detalle de Empresa** proporciona información completa sobre una empresa específica, incluyendo:

- Datos demográficos y de contacto
- Resultados de la última evaluación de innovación
- Historial completo de todas las evaluaciones
- Gráficos de evolución en el tiempo
- Gestión de usuarios asignados

### Funcionalidades Principales

- ✅ **Visualizar** información completa de la empresa
- ✅ **Editar** datos demográficos y de contacto
- ✅ **Gestionar** usuarios asignados a la empresa
- ✅ **Ver** gráficos de evolución temporal
- ✅ **Consultar** historial de todas las encuestas
- ✅ **Acceder** a respuestas detalladas de cada encuesta
- ✅ **Exportar** ficha completa en formato PDF

---

## Acceso a la Vista

### Desde el Listado de Empresas

1. Vaya al módulo de **Empresas**
2. Localice la empresa deseada en la tabla
3. Haga clic en el botón **Ver Detalle** (👁️ naranja)
4. Se cargará la vista de detalle

### URL Directa

```
http://[SERVIDOR]:3000/empresas/[ID_EMPRESA]
```

Donde `[ID_EMPRESA]` es el identificador único de la empresa.

### Navegación

- Utilice el botón **"Volver a la Lista"** para regresar al listado
- La navegación mantiene los filtros aplicados previamente

---

## Información General

### Ubicación

Primera tarjeta en la vista, identificada con el ícono de edificio (🏢).

### Campos Mostrados

| Campo | Descripción |
|-------|-------------|
| **Empresa** | Nombre oficial de la empresa |
| **RUC** | Registro Único del Contribuyente |
| **Sector** | Sector de actividad económica |
| **Subsector** | Categoría específica dentro del sector |
| **Ubicación** | Distrito y Departamento |
| **Año de Creación** | Año de fundación |
| **Total de Empleados** | Cantidad de empleados |
| **Ventas Anuales** | Rango de ventas |
| **Nombre del Encuestado** | Persona que completó la encuesta |
| **Correo Electrónico** | Email del encuestado |

### Botones de Acción

En el encabezado de la tarjeta encontrará dos íconos:

#### ✏️ Editar Información General

- Abre el formulario de edición
- Disponible para: Superadmin, Contributor

#### 👥 Gestionar Usuarios Asignados

- Abre el panel de gestión de usuarios
- Disponible para: Superadmin, Contributor

---

## Edición de Datos

### Cómo Editar Información

1. Haga clic en el ícono de **lápiz** (✏️)
2. Se abrirá el modal **"Editar Información de la Empresa"**
3. Modifique los campos necesarios
4. Haga clic en **"Guardar Cambios"**
5. Los datos se actualizarán en tiempo real

### Modal de Edición

El modal presenta un formulario organizado en dos columnas con los siguientes campos:

| Columna Izquierda | Columna Derecha |
|-------------------|-----------------|
| Nombre de la Empresa | RUC |
| Departamento (desplegable) | Distrito (desplegable) |
| Sector de Actividad (desplegable) | Sub-Sector de Actividad (desplegable) |
| Año de Creación | Total de Empleados |
| Ventas Anuales (desplegable) | Sexo del Gerente General (desplegable) |
| Sexo del Propietario Principal (desplegable) | |

### Campos Editables

| Campo | Tipo de Campo | Descripción |
|-------|---------------|-------------|
| **Nombre de la Empresa** | Texto libre | Nombre comercial o razón social |
| **RUC** | Texto | Registro Único del Contribuyente |
| **Departamento** | Selector desplegable | Ubicación geográfica principal |
| **Distrito** | Selector desplegable | Se filtra según el departamento seleccionado |
| **Sector de Actividad** | Selector desplegable | Sector económico principal |
| **Sub-Sector** | Selector desplegable | Se filtra según el sector seleccionado |
| **Año de Creación** | Numérico | Año de fundación de la empresa |
| **Total de Empleados** | Numérico | Cantidad de empleados actuales |
| **Ventas Anuales** | Selector desplegable | Rango de ventas (Micro, Pequeña, Mediana, Grande) |
| **Sexo del Gerente General** | Selector | Hombre/Mujer |
| **Sexo del Propietario Principal** | Selector | Hombre/Mujer |

### Botones del Modal

- **Cancelar**: Cierra el modal sin guardar cambios
- **Guardar Cambios**: Aplica las modificaciones a la base de datos

### Validaciones

- Los campos con **asterisco (*)** son obligatorios
- El **año de creación** debe estar entre 1900 y el año actual
- El **total de empleados** debe ser mayor a 0

---

## Gestión de Usuarios Asignados

### Acceder a la Gestión

1. Haga clic en el ícono de **usuarios** (👥)
2. Se abrirá el modal **"Gestión de Usuarios Asignados"**

### Vista del Modal

El modal muestra:
- **Encabezado**: "Usuarios asignados a [NOMBRE_EMPRESA]"
- **Botón**: "Asignar Usuario Existente" (azul, esquina superior derecha)
- **Tabla**: Lista de usuarios actualmente vinculados

### Ver Usuarios Actuales

La tabla muestra todos los usuarios vinculados a la empresa:

| Columna | Descripción |
|---------|-------------|
| **Nombre** | Nombre completo del usuario |
| **Email** | Correo electrónico |
| **Cargo** | Cargo en la empresa (ej: Propietario) |
| **Acciones** | Dos botones: Desasignar (🔗) y Eliminar (🗑️) |

---

### ➕ Asignar Usuario Existente

**Pasos**:
1. Haga clic en el botón **"Asignar Usuario Existente"** (azul)
2. Se abrirá un modal secundario con un campo de búsqueda
3. Escriba al menos **2 caracteres** del nombre o email
4. Seleccione el usuario de la lista de resultados
5. El usuario se vinculará automáticamente a la empresa
6. Aparecerá en la tabla de usuarios asignados

**Campo de búsqueda**: "Buscar por nombre o email..."

---

### 🔗 Desasignar Usuario

**Función**: Rompe la relación entre el usuario y la empresa sin eliminar al usuario del sistema.

**Modal de Confirmación "Confirmar Desasignación"**:

| Elemento | Descripción |
|----------|-------------|
| **Pregunta** | ¿Estás seguro de que quieres desasignar al usuario [NOMBRE]? |
| **Advertencia** | Cuadro naranja con las consecuencias de la acción |

**Esta acción**:
- ✅ Romperá la relación entre el usuario y esta empresa
- ⚠️ Los chequeos del usuario **bajo esta empresa** serán eliminados
- ✅ El usuario **seguirá existiendo** en el sistema

**Botones**:
- **Cancelar**: Cierra sin hacer cambios
- **Desasignar Usuario** (naranja): Confirma la desasignación

---

### 🗑️ Eliminar Usuario

**Función**: Elimina completamente al usuario del sistema junto con todos sus datos.

**Modal de Confirmación "Confirmar Eliminación"**:

| Elemento | Descripción |
|----------|-------------|
| **Pregunta** | ¿Estás seguro de que quieres eliminar completamente al usuario [NOMBRE]? |
| **Advertencia** | Cuadro rojo con las consecuencias de la acción |

**Esta acción**:
- ❌ Eliminará el usuario del sistema
- ❌ Eliminará **todos los chequeos** asociados al usuario
- ⚠️ Esta acción **NO se puede deshacer**

**Botones**:
- **Cancelar**: Cierra sin hacer cambios
- **Eliminar Usuario** (rojo): Confirma la eliminación permanente

> ⚠️ **Advertencia**: La eliminación es irreversible. Todos los chequeos realizados por este usuario en cualquier empresa serán eliminados permanentemente.

---

## Sección de Liderazgo

### Ubicación

Tarjeta con ícono de corona (👑), junto a "Fechas Importantes".

### Información Mostrada

| Campo | Descripción |
|-------|-------------|
| **Gerente General** | Género del gerente general |
| **Propietario Principal** | Género del propietario principal |

Esta información es útil para análisis de diversidad e inclusión.

---

## Gráficos de Evolución

### Ubicación

Sección debajo de la información general con gráficos interactivos.

### Gráficos Disponibles

#### Evolución del Puntaje Global

- **Tipo**: Gráfico de líneas
- **Eje X**: Fecha de cada chequeo
- **Eje Y**: Puntaje total (0-100)
- **Utilidad**: Ver la tendencia de mejora o retroceso

#### Evolución por Dimensión

- **Tipo**: Gráfico de barras agrupadas
- **Dimensiones**: Tecnología, Comunicación, Organización, Datos, Estrategia, Procesos
- **Utilidad**: Identificar áreas de mejora/retroceso

### Interactividad

- **Hover**: Pase el mouse sobre puntos para ver valores exactos
- **Tooltips**: Información detallada al posicionar el cursor
- **Leyenda**: Haga clic en elementos para ocultar/mostrar series

---

## Resultados de Evaluación

### Ubicación

Tarjeta "Resultados de Evaluación Actual" con ícono de tendencia (📈).

### Información Mostrada

#### Badge de Nivel

En la esquina superior derecha se muestra:
- **Nivel de madurez** (Inicial/Novato/Competente/Avanzado)
- **Puntaje total** (porcentaje)

Colores según nivel:
| Nivel | Color |
|-------|-------|
| Inicial | Rojo |
| Novato | Amarillo |
| Competente | Verde claro |
| Avanzado | Verde/Azul |

### Barras de Progreso por Dimensión

Se muestran 6 barras de progreso, una por cada dimensión:

| Dimensión | Descripción |
|-----------|-------------|
| **Tecnología** | Adopción de herramientas tecnológicas |
| **Comunicación** | Canales digitales de comunicación |
| **Organización** | Estructura organizacional digital |
| **Datos** | Gestión y uso de datos |
| **Estrategia** | Planificación de transformación digital |
| **Procesos** | Automatización de procesos |

Cada barra muestra:
- Nombre de la dimensión
- Puntaje obtenido (%)
- Barra visual de progreso con color indicativo

---

## Historial de Encuestas

### Ubicación

Pestaña "Historial de Encuestas" en la parte inferior de la página.

### Tabla de Historial

| Columna | Descripción |
|---------|-------------|
| **Test** | Número/código del test |
| **Fecha Inicio** | Cuándo comenzó la encuesta |
| **Fecha Término** | Cuándo se completó |
| **Puntaje** | Resultado obtenido |
| **Nivel** | Nivel de madurez alcanzado |
| **Acciones** | Botón para ver respuestas |

### Ver Respuestas de una Encuesta

1. Localice la encuesta en el historial
2. Haga clic en **"Ver Respuestas"**
3. Se abrirá una nueva página con todas las respuestas
4. Puede navegar entre dimensiones
5. Cada pregunta muestra la respuesta seleccionada

### Página de Respuestas

La página de respuestas muestra:
- **Encabezado**: Información de la empresa y fecha
- **Pestañas**: Una por cada dimensión
- **Preguntas**: Listado con las respuestas marcadas
- **Navegación**: Botón para volver al detalle

---

## Exportar Ficha PDF

### Ubicación

Botón **"Exportar Ficha PDF"** en la esquina superior derecha.

### Contenido del PDF

El PDF generado incluye:

1. **Encabezado institucional** con logos
2. **Datos generales** de la empresa
3. **Resumen de resultados** actuales
4. **Gráfico radar** de dimensiones
5. **Historial** de evaluaciones
6. **Fecha de generación** y firma digital

### Cómo Exportar

1. Haga clic en **"Exportar Ficha PDF"**
2. Aparecerá "Generando PDF..." en el botón
3. Espere mientras se procesa
4. El archivo se descargará automáticamente
5. El nombre será `ficha-empresa-[ID].pdf`

### Usos Comunes del PDF

- Presentaciones a la gerencia de la empresa
- Informes de avance del programa
- Documentación de caso de éxito
- Comparativas pre/post intervención

---

## Flujos de Trabajo Típicos

### Escenario: Actualizar datos de contacto

1. Acceda al detalle de la empresa
2. Haga clic en el ícono de edición (✏️)
3. Actualice los campos necesarios
4. Guarde los cambios
5. Verifique que la información se actualizó

### Escenario: Agregar un nuevo representante

1. Abra la gestión de usuarios (👥)
2. Haga clic en "Asignar Usuario Existente"
3. Busque el usuario por email
4. Asígnelo a la empresa
5. El usuario podrá completar nuevas encuestas

### Escenario: Generar reporte para presentación

1. Revise los datos de la empresa
2. Verifique que los gráficos muestran la evolución
3. Exporte la ficha en PDF
4. Use el PDF para su presentación

---

## Preguntas Frecuentes

### ¿Por qué no veo el historial de encuestas?

- La empresa debe tener al menos un chequeo completado
- Verifique que está viendo la empresa correcta

### ¿Puedo editar los resultados de una encuesta?

No, los resultados de las encuestas son inmutables por integridad de datos. Solo se pueden editar datos demográficos de la empresa.

### ¿Qué pasa si elimino un usuario?

Se eliminarán:
- La cuenta del usuario
- Todos los chequeos realizados por ese usuario
- Las respuestas asociadas

Esta acción es **irreversible**.

### ¿Por qué el gráfico de evolución está vacío?

El gráfico requiere al menos **dos chequeos** para mostrar evolución. Con un solo chequeo no hay tendencia que graficar.

---

*Documento actualizado: Diciembre 2025*
*Versión del Sistema: Chequeo Digital 2.0*
