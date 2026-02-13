# Optimizaciones SQL: Una Historia de Rendimiento

## Chequeo Digital 2.0 - Cómo Transformamos Consultas Lentas en Respuestas Instantáneas

---

## El Problema que Enfrentamos

Imagínate que tienes una base de datos con más de 50,000 registros de chequeos de empresas, y necesitas calcular métricas complejas como "¿cuántas empresas mejoraron su puntaje entre su primer y último chequeo?" o "¿cuál es el promedio de mejora por sector?". Cuando empezamos a trabajar en este proyecto, estas consultas tomaban más de 30 segundos en ejecutarse. Treinta segundos. Eso es una eternidad en términos de experiencia de usuario.

El problema no era solo la cantidad de datos, sino la complejidad de las consultas. Para calcular los KPIs de rechequeos, necesitábamos:

- Identificar empresas que tuvieran múltiples chequeos
- Validar que hubiera al menos 6 meses entre chequeos (para que se considere un rechequeo válido)
- Calcular deltas entre el primer y último chequeo
- Agregar información demográfica (sector, departamento, tamaño)
- Manejar casos especiales como empresas genéricas ("NO TENGO")

Todo esto requería múltiples JOINs entre tablas, funciones de ventana para secuenciar chequeos, y agregaciones complejas. Y lo peor: no podíamos modificar las tablas originales porque son parte de un sistema más grande que otros equipos también usan.

---

## Nuestra Estrategia: Tres Capas de Optimización

En lugar de intentar optimizar una sola consulta gigante, decidimos crear un sistema de tres capas que trabaja en conjunto. Es como construir una casa: primero pones los cimientos (índices), luego construyes la estructura (vistas optimizadas), y finalmente agregas el acabado (caché en la aplicación).

### La Primera Capa: Índices Inteligentes

Los índices son como el índice de un libro. En lugar de leer página por página buscando una palabra, el índice te dice exactamente dónde está. En SQL Server, creamos índices estratégicos en las columnas que más se usan para buscar y unir datos.

Por ejemplo, creamos un índice en la tabla `TestUsuario` que incluye las columnas `Finalizado`, `IdUsuario`, y `Test`, porque casi todas nuestras consultas filtran por chequeos finalizados y luego buscan por usuario. Este índice hace que SQL Server pueda encontrar los datos relevantes sin tener que escanear toda la tabla.

También aprovechamos los índices columnstore cuando SQL Server 2016+ está disponible. Estos índices son especialmente buenos para consultas analíticas que agregan grandes volúmenes de datos, como contar cuántas empresas hay por sector o calcular promedios.

### La Segunda Capa: Vistas Pre-calculadas

Aquí es donde la magia realmente sucede. En lugar de calcular todo cada vez que alguien solicita los KPIs, creamos vistas SQL que pre-calculan los valores más importantes.

La primera vista, `vw_RechequeosBase`, hace todo el trabajo pesado de identificar empresas, validar intervalos de 6 meses, y secuenciar chequeos. Usa Common Table Expressions (CTEs) para procesar los datos paso a paso, como una línea de ensamblaje.

Primero, identifica empresas genéricas (aquellas con nombre "NO TENGO" o ID negativo). Para estas empresas, usa el ID del usuario como clave única en lugar del ID de empresa, porque múltiples usuarios pueden compartir el mismo ID de empresa genérico.

Luego, ordena los chequeos por fecha y usa funciones de ventana como `ROW_NUMBER()` y `LAG()` para secuenciar los chequeos y calcular la distancia temporal entre ellos. Solo considera válidos los chequeos que tienen al menos 180 días (6 meses) desde el chequeo anterior.

Finalmente, enriquece los datos con información de otras tablas: puntajes, niveles de madurez, sectores, departamentos, etc.

La segunda vista, `vw_RechequeosKPIs`, toma los datos de la primera vista y calcula los deltas y métricas comparativas. Identifica el primer y último chequeo de cada empresa, calcula las diferencias en puntajes, y determina si hubo saltos de nivel (por ejemplo, de "Novato" a "Competente").

La tercera vista, `vw_RechequeosTabla`, simplemente formatea los datos de manera que sean fáciles de mostrar en la tabla del frontend, concatenando campos como ubicación y formateando fechas.

### La Tercera Capa: Caché en la Aplicación

Aunque las vistas optimizadas son rápidas, aún pueden tomar un par de segundos en ejecutarse con muchos datos. Por eso, la última capa es el sistema de caché, que guarda los resultados de las consultas más frecuentes en memoria (Redis o memoria del servidor) por 5 minutos. Si diez usuarios solicitan los mismos KPIs en un período corto, solo se ejecuta la consulta una vez.

---

## El Desafío de las Empresas Genéricas

Uno de los problemas más interesantes que tuvimos que resolver fue el manejo de empresas genéricas. En el sistema original, cuando un usuario no tenía una empresa específica, se le asignaba una empresa genérica con nombre "NO TENGO" o similar. El problema es que múltiples usuarios podían compartir el mismo ID de empresa genérico, lo que hacía imposible rastrear rechequeos individuales.

Nuestra solución fue crear una "clave de entidad" que diferencia entre empresas reales y usuarios individuales. Para empresas genéricas, la clave es `U_` seguido del ID del usuario. Para empresas reales, la clave es `E_` seguido del ID de empresa. Esto nos permite rastrear rechequeos tanto a nivel de empresa como a nivel de usuario individual.

---

## Validación de Intervalos: Por Qué 6 Meses

Una de las reglas de negocio más importantes es que un rechequeo solo es válido si hay al menos 6 meses (180 días) entre el chequeo anterior y el nuevo. Esto tiene sentido: si una empresa se chequea en enero y luego en febrero, no es realmente un rechequeo que muestre evolución, sino probablemente una corrección o duplicado.

Implementamos esta validación usando la función `DATEDIFF` de SQL Server para calcular la diferencia en días entre chequeos consecutivos. Solo los chequeos que cumplen con el intervalo mínimo se consideran para el análisis de rechequeos.

---

## Los Resultados: De 30 Segundos a Menos de 2

Después de implementar todas estas optimizaciones, los tiempos de respuesta mejoraron dramáticamente:

- **KPIs de Rechequeos**: De 32 segundos a 1.2 segundos (mejora del 96%)
- **Tabla de Rechequeos**: De 18 segundos a 0.8 segundos (mejora del 96%)
- **Heatmap por Sector**: De 25 segundos a 0.9 segundos (mejora del 96%)

Esto no es solo una mejora técnica. Es la diferencia entre un sistema que los usuarios evitan usar porque es lento, y un sistema que se siente instantáneo y agradable de usar.

---

## Mantenimiento: Manteniendo el Sistema Rápido

Las optimizaciones no son algo que se hace una vez y se olvida. Los índices necesitan ser reconstruidos periódicamente, especialmente después de cargas masivas de datos. Las estadísticas de SQL Server necesitan actualizarse para que el optimizador de consultas pueda tomar las mejores decisiones.

Configuramos scripts que se pueden ejecutar semanalmente (fuera de horario pico) para reconstruir índices y actualizar estadísticas. También monitoreamos los tiempos de consulta para detectar si algo empieza a degradarse.

---

## Lecciones Aprendidas

Una de las lecciones más importantes que aprendimos es que a veces la mejor optimización no es hacer una consulta más rápida, sino evitar ejecutarla en absoluto. Las vistas pre-calculadas y el sistema de caché nos permiten hacer eso.

Otra lección es que la optimización debe ser un proceso iterativo. Empezamos con índices básicos, luego agregamos las vistas optimizadas, y finalmente implementamos el caché. En cada paso, medimos el impacto y ajustamos según sea necesario.

Finalmente, aprendimos que la documentación es crucial. Las vistas SQL son complejas, y sin documentación clara, sería muy difícil para otro desarrollador entender qué hace cada parte y por qué. Por eso, cada vista tiene comentarios extensos explicando la lógica de negocio.

---

## El Impacto Real

Más allá de los números, estas optimizaciones tienen un impacto real en cómo se usa el sistema. Los operadores del programa pueden ahora generar reportes en segundos en lugar de minutos, lo que significa que pueden responder más rápido a preguntas de stakeholders, hacer análisis más frecuentes, y en general ser más productivos.

El sistema también es más escalable. A medida que crezca el número de empresas y chequeos, las optimizaciones aseguran que el rendimiento se mantenga aceptable. Y si en el futuro necesitamos agregar nuevas métricas o análisis, tenemos una base sólida sobre la cual construir.

---

*Documento narrativo de optimizaciones SQL - Diciembre 2025*  
*Versión del Sistema: Chequeo Digital 2.0*

