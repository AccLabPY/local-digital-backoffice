# El Sistema de Caché: Acelerando el Sistema

## Chequeo Digital 2.0 - Cómo Hicimos que las Consultas Costosas se Sientan Instantáneas

---

## El Problema: Consultas que Tomaban una Eternidad

Cuando empezamos a trabajar en Chequeo Digital 2.0, nos enfrentamos a un problema serio de rendimiento. Las consultas de KPIs de rechequeos tomaban más de 30 segundos en ejecutarse. Treinta segundos. Eso es suficiente tiempo para que un usuario se pregunte si el sistema se congeló, cierre la pestaña, y nunca vuelva.

El problema no era solo que las consultas eran lentas, sino que eran consultas que se repetían constantemente. Cada vez que alguien abría la página de rechequeos, el sistema tenía que recalcular todo desde cero: identificar empresas con múltiples chequeos, validar intervalos de 6 meses, calcular deltas, agregar por sector y departamento, etc.

Y lo peor: si diez usuarios abrían la página al mismo tiempo, el sistema ejecutaba la misma consulta costosa diez veces, sobrecargando la base de datos y haciendo que todo fuera aún más lento.

---

## La Solución: Caché Inteligente

La solución fue implementar un sistema de caché multinivel. La idea es simple: si alguien ya calculó estos KPIs hace 2 minutos, y los datos no han cambiado, ¿por qué recalcularlos? Simplemente devolvemos los resultados que ya calculamos.

Pero no es tan simple como parece. Necesitamos:

1. **Decidir qué cachear**: No todo debe ser cacheado. Datos que cambian constantemente no deberían cachearse, o deberían tener un TTL (Time To Live) muy corto.

2. **Decidir cuánto tiempo cachear**: Si cacheamos por demasiado tiempo, los usuarios ven datos desactualizados. Si cacheamos por muy poco tiempo, no obtenemos los beneficios de rendimiento.

3. **Invalidar el caché cuando sea necesario**: Si alguien edita una empresa, necesitamos invalidar el caché relacionado para que los cambios se reflejen.

4. **Manejar fallos gracefully**: Si Redis (nuestro sistema de caché principal) no está disponible, el sistema debe seguir funcionando, aunque sea más lento.

---

## La Arquitectura: Tres Niveles de Caché

Implementamos un sistema de tres niveles que trabaja en conjunto:

### Nivel 1: Caché en el Navegador (Service Worker)

El primer nivel es el más cercano al usuario: el navegador. Usamos un Service Worker para cachear recursos estáticos como imágenes, CSS, y JavaScript. Esto significa que cuando un usuario vuelve a visitar el sitio, estos recursos se cargan instantáneamente desde el caché del navegador en lugar de descargarlos nuevamente del servidor.

Sin embargo, no cacheamos las llamadas a la API en el navegador porque los datos cambian frecuentemente y queremos asegurarnos de que los usuarios siempre vean información actualizada.

### Nivel 2: Caché en el Servidor (Redis + Memoria)

Este es el nivel más importante. Cuando el backend necesita datos, primero verifica si están en caché. Si están, los devuelve inmediatamente sin tocar la base de datos. Si no están, consulta la base de datos, guarda los resultados en caché, y luego los devuelve.

Usamos **Redis** como sistema de caché principal porque es extremadamente rápido (está en memoria) y puede ser compartido entre múltiples instancias del servidor. Pero también implementamos un fallback a caché en memoria del servidor, así que si Redis no está disponible, el sistema sigue funcionando, solo que el caché no se comparte entre instancias.

### Nivel 3: Vistas Optimizadas en SQL Server

Aunque técnicamente no es "caché" en el sentido tradicional, las vistas SQL optimizadas actúan como una forma de caché a nivel de base de datos. Pre-calculan valores complejos para que las consultas sean más rápidas.

---

## Cómo Funciona el Flujo de Caché

Déjame explicarte qué sucede cuando un usuario solicita los KPIs de rechequeos:

1. El frontend envía una petición `GET /api/rechequeos/kpis?departamento=Capital`
2. El backend recibe la petición y genera una clave de caché única basada en los parámetros: `rechequeos:kpis:{"departamento":"Capital"}`
3. El backend verifica si hay datos en caché con esa clave
4. **Si hay caché (HIT)**: Devuelve los datos inmediatamente (menos de 100ms)
5. **Si no hay caché (MISS)**:
   - Consulta la base de datos usando las vistas optimizadas (1-2 segundos)
   - Guarda los resultados en caché con un TTL de 5 minutos
   - Devuelve los datos al frontend

La próxima vez que alguien (o incluso la misma persona) solicite los mismos KPIs con los mismos filtros dentro de los próximos 5 minutos, obtendrá una respuesta casi instantánea desde el caché.

---

## Generación de Claves: La Ciencia de Identificar Datos Únicos

Una parte crucial del sistema de caché es cómo generamos las claves. Necesitamos que cada combinación única de parámetros tenga su propia clave, pero también necesitamos que la misma combinación siempre genere la misma clave.

Por ejemplo, si alguien solicita KPIs con `departamento=Capital&sector=Comercio`, y luego otra persona solicita con `sector=Comercio&departamento=Capital` (mismos parámetros, diferente orden), ambas peticiones deberían usar la misma clave de caché.

Nuestra solución es ordenar los parámetros alfabéticamente antes de generar la clave. También normalizamos arrays (los ordenamos) y filtramos valores vacíos o nulos. Esto asegura consistencia.

---

## TTL: Cuánto Tiempo Cachear

No todos los datos deben cachearse por el mismo tiempo. Algunos datos cambian frecuentemente, otros son más estables:

- **KPIs de Rechequeos**: 5 minutos. Son cálculos costosos pero los datos subyacentes no cambian constantemente.
- **Listado de Empresas**: 2 minutos. Las empresas se crean y editan más frecuentemente.
- **Detalle de Empresa**: 5 minutos. Los detalles de una empresa específica son relativamente estables.
- **Opciones de Filtros**: 10 minutos. Los catálogos (departamentos, sectores, etc.) son muy estables.

Estos TTLs son un balance entre rendimiento y actualidad de datos. Si un usuario edita una empresa, invalidamos el caché relacionado inmediatamente, así que no tiene que esperar a que expire el TTL.

---

## Invalidación: Cuando los Datos Cambian

Una de las partes más importantes del sistema de caché es la invalidación. Cuando alguien edita una empresa, no queremos que los usuarios sigan viendo los datos antiguos en caché. Necesitamos invalidar (eliminar) las entradas de caché relacionadas.

Implementamos invalidación por patrones. Por ejemplo, cuando se edita una empresa, invalidamos todas las claves que empiezan con `empresas:*` y `rechequeos:*` (porque los rechequeos dependen de datos de empresas).

La invalidación funciona tanto en Redis como en el caché de memoria. Buscamos todas las claves que coinciden con el patrón y las eliminamos.

---

## Fallback a Memoria: Nunca Fallar

Una de las decisiones de diseño más importantes fue hacer que el sistema funcione incluso si Redis no está disponible. Esto es crucial porque:

1. No todos los entornos tienen Redis instalado
2. Redis puede fallar o no estar disponible temporalmente
3. Queremos que el sistema sea fácil de instalar y usar

Entonces, el sistema siempre intenta usar Redis primero. Si Redis está disponible y conectado, lo usa. Si no está disponible, automáticamente cambia a caché en memoria sin que el usuario note la diferencia.

El único downside es que con caché en memoria, cada instancia del servidor tiene su propio caché (no se comparte entre instancias), pero para la mayoría de los casos de uso, esto es aceptable.

---

## Monitoreo: Saber Qué Está Pasando

Es importante saber cómo está funcionando el sistema de caché. ¿Cuántas veces encontramos datos en caché (HIT) vs. cuántas veces tuvimos que consultar la base de datos (MISS)? ¿Redis está funcionando correctamente? ¿Cuántas entradas hay en caché?

Implementamos logging detallado que muestra:
- `✅ Redis HIT: [clave]` - Encontramos datos en Redis
- `✅ Memory HIT: [clave]` - Encontramos datos en memoria
- `❌ Cache MISS: [clave]` - No encontramos datos, consultamos BD
- `🗑️ Deleted X keys matching: [patrón]` - Invalidación de caché

También tenemos un endpoint de salud (`/health`) que muestra el estado del caché: si Redis está disponible, cuántas entradas hay en memoria, etc.

---

## Limpieza Automática: Manteniendo el Caché Limpio

El caché en memoria necesita limpieza periódica. Si no eliminamos entradas expiradas, la memoria del servidor se llenaría eventualmente.

Implementamos un proceso que se ejecuta cada minuto y elimina todas las entradas cuyo TTL ha expirado. Esto mantiene el caché de memoria limpio y eficiente.

---

## El Impacto Real

Después de implementar el sistema de caché, los tiempos de respuesta mejoraron dramáticamente:

- **Primera carga**: 1.2 segundos (consultando BD)
- **Cargas subsecuentes**: Menos de 100ms (desde caché)

Esto significa que si diez usuarios abren la página de rechequeos en un período de 5 minutos, solo la primera petición consulta la base de datos. Las otras nueve obtienen datos desde caché casi instantáneamente.

Pero el impacto va más allá de los números. Los usuarios ahora tienen una experiencia fluida. No hay esperas largas. El sistema se siente rápido y responsivo. Y eso hace que los usuarios quieran usarlo más.

---

## Configuración: Haciendo que Funcione en Cualquier Entorno

El sistema está diseñado para funcionar en cualquier entorno, con o sin Redis:

**Con Redis (Recomendado)**:
- Instalar Memurai (para Windows) o Redis
- Configurar variables de entorno
- El sistema detecta Redis automáticamente y lo usa

**Sin Redis**:
- No hacer nada especial
- El sistema detecta que Redis no está disponible
- Automáticamente usa caché en memoria
- Funciona perfectamente, solo que el caché no se comparte entre instancias

Esta flexibilidad hace que el sistema sea fácil de instalar y usar, incluso para personas que no están familiarizadas con Redis.

---

## Lecciones Aprendidas

Una de las lecciones más importantes que aprendimos es que el caché no es solo una optimización técnica, es una característica de experiencia de usuario. Los usuarios no saben (ni les importa) que estamos usando Redis o caché en memoria. Solo saben que el sistema es rápido.

Otra lección es que la invalidación es tan importante como el almacenamiento. Un caché con datos desactualizados es peor que no tener caché en absoluto, porque los usuarios toman decisiones basadas en información incorrecta.

Finalmente, aprendimos que la simplicidad es clave. El sistema de caché es robusto y funcional, pero también es simple de entender y mantener. No sobre-ingeniamos la solución.

---

## El Futuro del Caché

A medida que el sistema crece, podemos optimizar aún más el caché. Por ejemplo, podríamos implementar caché de segundo nivel para datos que cambian muy raramente (como catálogos). Podríamos usar técnicas de pre-caching para anticipar qué datos los usuarios van a necesitar.

Pero por ahora, el sistema de caché actual es más que suficiente. Hace que el sistema sea rápido, responsivo, y agradable de usar. Y eso es lo más importante.

---

*Documento narrativo del sistema de caché - Diciembre 2025*  
*Versión del Sistema: Chequeo Digital 2.0*

