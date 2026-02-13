# Arquitectura del Sistema: Descripción Narrativa

## Chequeo Digital 2.0 - Panel de Control de Innovación Empresarial

---

## Una Visión General del Sistema

Imagínate que necesitas construir un sistema que permita a los operadores del Ministerio de Industria y Comercio gestionar y analizar miles de evaluaciones de innovación empresarial. El desafío no es solo mostrar datos, sino hacerlo de manera rápida, segura y escalable. Eso es exactamente lo que hace Chequeo Digital 2.0.

El sistema está diseñado como una aplicación web moderna que sigue una arquitectura de tres capas bien definida: el cliente que el usuario ve y con el que interactúa, el servidor que procesa las peticiones y coordina la lógica de negocio, y la base de datos que almacena toda la información. Cada capa tiene su propósito específico y se comunica con las demás de manera ordenada y eficiente.

---

## El Cliente: La Interfaz que Ve el Usuario

Cuando un operador abre su navegador y accede al sistema, lo que está viendo es nuestra capa de presentación, construida con **Next.js 15** y **React 19**. Elegimos estas tecnologías porque nos permiten crear una experiencia de usuario fluida y moderna, donde las páginas se cargan rápidamente y la interacción se siente instantánea.

El frontend está organizado de manera que cada funcionalidad tiene su propia ruta. Por ejemplo, cuando alguien quiere ver el listado de empresas, navega a `/empresas`, y cuando necesita analizar rechequeos, va a `/rechequeos`. Esta organización hace que el código sea mantenible y que sea fácil agregar nuevas funcionalidades en el futuro.

Los componentes están diseñados para ser reutilizables. Por ejemplo, tenemos un panel de filtros que se usa tanto en el módulo de empresas como en el de rechequeos, pero adaptado a las necesidades específicas de cada uno. Esto no solo ahorra código, sino que también garantiza consistencia en la experiencia del usuario.

Para las visualizaciones, utilizamos **Recharts** y **D3.js**, que nos permiten crear gráficos interactivos y dashboards que realmente ayudan a los usuarios a entender los datos. Los estilos están manejados con **Tailwind CSS**, lo que nos da flexibilidad para crear una interfaz moderna sin tener que escribir CSS personalizado para cada elemento.

El estado de autenticación se maneja a través de un contexto de React, lo que significa que toda la aplicación sabe si el usuario está logueado o no, y qué permisos tiene. Esto nos permite mostrar u ocultar funcionalidades según el rol del usuario, sin tener que hacer consultas adicionales al servidor.

---

## El Servidor: El Cerebro que Procesa Todo

Detrás de escena, tenemos un servidor construido con **Node.js** y **Express.js**. Este servidor actúa como el intermediario entre el cliente y la base de datos, procesando todas las peticiones, validando permisos, y asegurándose de que los datos se manejen correctamente.

El servidor está organizado siguiendo el patrón MVC (Model-View-Controller). Los **controladores** reciben las peticiones HTTP y deciden qué hacer con ellas. Los **modelos** encapsulan toda la lógica de acceso a datos, de manera que si necesitamos cambiar cómo consultamos la base de datos, solo tenemos que modificar el modelo, no todo el código que lo usa. Y las **vistas** en este caso son las respuestas JSON que enviamos al cliente.

Una de las características más importantes del servidor es su sistema de middlewares. Imagínate una cadena de procesamiento: cuando llega una petición, primero pasa por un middleware que verifica si el usuario está autenticado, luego por otro que verifica si tiene permisos para acceder a ese recurso, después por uno que verifica si hay datos en caché, y finalmente llega al controlador que ejecuta la lógica de negocio. Esta arquitectura nos permite agregar funcionalidades como logging, compresión, o validación de manera centralizada.

El sistema de autenticación funciona con tokens JWT (JSON Web Tokens). Cuando un usuario inicia sesión, el servidor genera un token que contiene información sobre el usuario, su rol, y sus permisos. Este token se envía al cliente y se incluye en cada petición posterior. El servidor puede verificar el token sin tener que consultar la base de datos cada vez, lo que hace que el sistema sea más rápido.

Para el control de acceso, implementamos un sistema RBAC (Role-Based Access Control) granular. No solo verificamos si el usuario tiene un rol específico, sino que también verificamos si tiene permiso para realizar una acción específica sobre un recurso específico. Por ejemplo, un usuario con rol "contributor" puede ver y editar empresas, pero no puede eliminar registros ni gestionar usuarios del sistema.

---

## El Sistema de Caché: Acelerando las Consultas

Uno de los mayores desafíos que enfrentamos fue el rendimiento. Las consultas a la base de datos, especialmente las que calculan KPIs de rechequeos, pueden ser muy costosas computacionalmente. Para resolver esto, implementamos un sistema de caché inteligente.

El sistema intenta usar **Redis** si está disponible, que es una base de datos en memoria extremadamente rápida. Pero también tiene un fallback a caché en memoria del servidor, así que incluso si Redis no está disponible, el sistema sigue funcionando de manera optimizada.

Cuando un usuario solicita los KPIs de rechequeos, el servidor primero verifica si esos datos ya están en caché. Si están y no han expirado, los devuelve inmediatamente sin tocar la base de datos. Si no están, consulta la base de datos, calcula los KPIs, los guarda en caché por 5 minutos, y luego los devuelve al usuario. Esto significa que si diez usuarios solicitan los mismos KPIs en un período corto, solo se ejecuta la consulta costosa una vez.

El sistema también implementa invalidación selectiva de caché. Por ejemplo, si alguien edita una empresa, el sistema invalida automáticamente el caché relacionado con esa empresa, pero mantiene el caché de otras consultas que no fueron afectadas.

---

## La Base de Datos: El Almacén de Toda la Información

En el corazón del sistema está **SQL Server 2012+**, que almacena toda la información sobre empresas, usuarios, encuestas, y resultados. El desafío aquí fue que no podíamos modificar las tablas existentes, ya que son parte de un sistema más grande. En su lugar, creamos nuevas tablas para la autenticación y permisos, y nuevas vistas optimizadas para las consultas más complejas.

Las vistas optimizadas son especialmente importantes para el módulo de rechequeos. En lugar de calcular los deltas de mejora y los KPIs cada vez que alguien los solicita, pre-calculamos estos valores usando Common Table Expressions (CTEs) y los almacenamos en vistas materializadas. Esto reduce drásticamente el tiempo de consulta.

También creamos índices estratégicos, incluyendo índices columnstore donde es posible (en SQL Server 2016+), que son especialmente eficientes para consultas analíticas que agregan grandes volúmenes de datos.

---

## El Flujo de Datos: Cómo Todo Funciona Juntos

Déjame explicarte cómo funciona todo esto cuando un usuario solicita información. Supongamos que un operador quiere ver los KPIs de rechequeos filtrados por un departamento específico.

Primero, el usuario hace clic en el módulo de rechequeos y aplica un filtro. El frontend construye una petición HTTP con los parámetros de filtro y la envía al servidor, incluyendo el token JWT en el header de autorización.

El servidor recibe la petición y pasa por la cadena de middlewares. El middleware de autenticación verifica que el token sea válido y extrae la información del usuario. El middleware RBAC verifica que el usuario tenga permiso para ver rechequeos. Si todo está bien, la petición llega al controlador.

El controlador genera una clave de caché basada en los filtros aplicados. Luego le pide al servicio de caché que busque datos con esa clave. Si encuentra datos válidos, los devuelve inmediatamente al cliente. Si no, el controlador llama al modelo de rechequeos.

El modelo construye una consulta SQL optimizada que utiliza las vistas pre-calculadas. Esta consulta se ejecuta en SQL Server, que devuelve los resultados. El modelo procesa estos resultados y los formatea. El controlador guarda estos resultados en caché y los devuelve al cliente.

El frontend recibe los datos, los procesa, y los muestra en las tarjetas de KPIs y en los gráficos. Todo esto sucede en menos de dos segundos, incluso con miles de registros en la base de datos.

---

## Patrones de Diseño: La Estructura que Hace Todo Funcionar

Para mantener el código organizado y mantenible, utilizamos varios patrones de diseño establecidos. El patrón MVC separa las responsabilidades: los controladores manejan las peticiones HTTP, los modelos manejan el acceso a datos, y las vistas (en este caso, componentes React) manejan la presentación.

El patrón Repository encapsula toda la lógica de acceso a datos dentro de los modelos. Esto significa que si necesitamos cambiar cómo consultamos la base de datos, solo modificamos el modelo, no todos los lugares donde se usa.

El patrón Singleton nos asegura que servicios como el de caché o el de autenticación solo tengan una instancia en toda la aplicación, lo que es más eficiente y evita problemas de sincronización.

El patrón Factory se usa para generar claves de caché de manera consistente, y el patrón Observer se usa en React para que los componentes se actualicen automáticamente cuando cambia el estado de autenticación.

---

## Seguridad: Protegiendo los Datos

La seguridad es una preocupación constante. Todas las contraseñas se almacenan usando bcrypt, que es un algoritmo de hash diseñado específicamente para contraseñas. Esto significa que incluso si alguien accede a la base de datos, no puede ver las contraseñas en texto plano.

Los tokens JWT tienen una expiración configurable, y el sistema mantiene un registro de tokens revocados para que si un usuario cierra sesión o su cuenta es desactivada, sus tokens dejen de funcionar inmediatamente.

El servidor usa Helmet.js para agregar headers de seguridad HTTP que protegen contra ataques comunes como XSS (Cross-Site Scripting) y clickjacking. También implementamos CORS (Cross-Origin Resource Sharing) para controlar qué dominios pueden hacer peticiones al servidor.

---

## Escalabilidad y Mantenibilidad

La arquitectura está diseñada pensando en el futuro. Si necesitamos agregar una nueva funcionalidad, solo tenemos que crear un nuevo controlador, un nuevo modelo si es necesario, y una nueva ruta. El sistema de middlewares nos permite agregar funcionalidades transversales como logging o monitoreo sin modificar el código existente.

El código está organizado de manera modular, con cada módulo siendo relativamente independiente. Esto hace que sea fácil para un nuevo desarrollador entender el sistema y comenzar a trabajar en él.

La documentación está integrada en el código usando Swagger, lo que significa que siempre está actualizada. Cualquier desarrollador puede acceder a `/api-docs` y ver exactamente qué endpoints están disponibles, qué parámetros aceptan, y qué respuestas devuelven.

---

## Conclusión

En resumen, Chequeo Digital 2.0 es un sistema moderno, seguro y eficiente que resuelve un problema real de manera elegante. La arquitectura de tres capas, combinada con sistemas de caché inteligente, vistas SQL optimizadas, y un control de acceso granular, permite que el sistema maneje grandes volúmenes de datos mientras mantiene tiempos de respuesta rápidos.

La separación de responsabilidades, el uso de patrones de diseño establecidos, y la organización modular del código hacen que el sistema sea fácil de mantener y extender. Y todo esto mientras garantizamos la seguridad de los datos y la experiencia del usuario.

Es un sistema que no solo funciona bien hoy, sino que está preparado para crecer y adaptarse a las necesidades futuras del programa de innovación empresarial.

---

*Documento narrativo de arquitectura - Diciembre 2025*  
*Versión del Sistema: Chequeo Digital 2.0*
