# La API RESTful: El Lenguaje del Sistema

## Chequeo Digital 2.0 - Cómo el Frontend y Backend se Comunican

---

## ¿Qué es una API y Por Qué la Necesitamos?

Imagínate que el frontend (lo que el usuario ve en el navegador) y el backend (el servidor que procesa datos) son dos personas que hablan idiomas diferentes. El frontend habla JavaScript y React, mientras que el backend habla Node.js y SQL. Necesitan una forma de comunicarse, y esa forma es la API RESTful.

REST significa "Representational State Transfer", y es básicamente un conjunto de reglas sobre cómo hacer peticiones y recibir respuestas. Es como un protocolo de comunicación que ambos lados entienden.

Cuando un usuario hace clic en "Ver Empresas" en el frontend, el frontend no va directamente a la base de datos. En su lugar, envía una petición HTTP al backend diciendo "dame la lista de empresas". El backend procesa esa petición, consulta la base de datos, y devuelve los datos en formato JSON. El frontend recibe esos datos y los muestra en la pantalla.

---

## La Estructura de Nuestras Peticiones

Todas nuestras peticiones siguen un patrón consistente. La URL base es `http://localhost:3001/api`, y luego agregamos el recurso específico que queremos. Por ejemplo:

- `/api/empresas` - para trabajar con empresas
- `/api/rechequeos` - para trabajar con rechequeos
- `/api/auth/login` - para autenticarse

Cada recurso tiene diferentes "verbos" HTTP que indican qué queremos hacer:

- **GET**: "Dame información" (como leer un libro)
- **POST**: "Crea algo nuevo" (como escribir un nuevo capítulo)
- **PUT/PATCH**: "Actualiza algo existente" (como editar un capítulo)
- **DELETE**: "Elimina algo" (como borrar un capítulo)

Por ejemplo, `GET /api/empresas` significa "dame la lista de empresas", mientras que `POST /api/empresas` significa "crea una nueva empresa".

---

## Autenticación: Cómo Sabemos Quién Eres

Antes de que puedas hacer cualquier cosa en el sistema, necesitas autenticarte. Es como mostrar tu identificación antes de entrar a un edificio seguro.

El proceso funciona así: envías tu email y contraseña a `/api/auth/login`. El backend verifica tus credenciales contra la base de datos. Si son correctas, te devuelve un "token JWT" (JSON Web Token), que es como un pase temporal que dice "esta persona está autenticada y tiene estos permisos".

Este token es importante porque no quieres tener que enviar tu contraseña con cada petición. En su lugar, envías el token en el header `Authorization` de cada petición. El backend verifica el token y sabe quién eres y qué puedes hacer.

El token tiene una expiración (por defecto, 24 horas), después de la cual necesitas iniciar sesión de nuevo. Esto es por seguridad: si alguien obtiene tu token, solo puede usarlo por un tiempo limitado.

---

## Endpoints de Empresas: El Corazón del Sistema

El módulo de empresas es probablemente el más usado del sistema, así que tiene muchos endpoints diferentes.

### Obtener la Lista de Empresas

Cuando un usuario va a la página de empresas, el frontend hace una petición `GET /api/empresas`. Pero no queremos cargar todas las empresas de una vez (podrían ser miles), así que usamos paginación. La petición incluye parámetros como `page=1&limit=50`, que significa "dame la primera página con 50 empresas".

También puedes agregar filtros. Por ejemplo, `GET /api/empresas?departamento=Capital&sector=Comercio` te da solo las empresas del departamento Capital que están en el sector Comercio. El backend construye una consulta SQL dinámica basada en estos filtros.

La respuesta incluye tanto los datos como información de paginación:

```json
{
  "data": [/* array de empresas */],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "totalPages": 25
  }
}
```

Esto le dice al frontend "aquí están las 50 empresas de la página 1, y en total hay 1234 empresas distribuidas en 25 páginas".

### Ver el Detalle de una Empresa

Cuando haces clic en una empresa para ver sus detalles, el frontend hace `GET /api/empresas/123` (donde 123 es el ID de la empresa). El backend consulta la base de datos y devuelve toda la información de esa empresa: nombre, RUC, ubicación, sector, puntajes, historial de chequeos, etc.

### Editar una Empresa

Para editar, usas `PATCH /api/empresas/123` con un body JSON que contiene solo los campos que quieres cambiar:

```json
{
  "empresa": "Nuevo Nombre",
  "totalEmpleados": 60
}
```

El backend actualiza solo esos campos en la base de datos y devuelve la empresa actualizada.

---

## Endpoints de Rechequeos: Análisis Complejo

El módulo de rechequeos es más complejo porque necesita calcular métricas agregadas sobre grandes volúmenes de datos.

### KPIs de Rechequeos

Cuando cargas la página de rechequeos, el frontend hace `GET /api/rechequeos/kpis`. Esta es una de las consultas más costosas del sistema porque necesita:

- Identificar empresas con múltiples chequeos
- Calcular deltas entre primer y último chequeo
- Agregar por sector, departamento, etc.
- Calcular porcentajes y promedios

Por eso, este endpoint usa el sistema de caché agresivamente. Si los datos ya están cacheados, la respuesta es casi instantánea.

La respuesta está organizada en tres categorías:

- **Cobertura**: ¿Cuántas empresas tienen rechequeos? ¿Cuál es la tasa de reincidencia?
- **Magnitud**: ¿Cuánto mejoraron en promedio? ¿Qué porcentaje mejoró vs. empeoró?
- **Velocidad**: ¿A qué ritmo están mejorando? ¿Es consistente la mejora?

### Tabla de Rechequeos

El endpoint `GET /api/rechequeos/table` devuelve los datos formateados para mostrar en la tabla del frontend. Incluye paginación y ordenamiento, así que puedes ordenar por delta global, fecha, sector, etc.

### Heatmap y Evolución

Los endpoints `GET /api/rechequeos/heatmap` y `GET /api/rechequeos/evolution` devuelven datos específicos para visualizaciones. El heatmap muestra el promedio de mejora por combinación de sector y dimensión, mientras que evolution muestra series temporales de evolución.

---

## Endpoints de Usuarios: Gestión de Accesos

Hay dos tipos de usuarios en el sistema: usuarios del sistema (operadores del backoffice) y usuarios de empresas (encuestados).

### Usuarios del Sistema

Estos son los operadores que usan el panel de control. Solo los superadmins pueden gestionarlos. Los endpoints incluyen:

- `GET /api/usuarios-sistema` - Listar todos los usuarios
- `POST /api/usuarios-sistema` - Crear un nuevo usuario
- `PUT /api/usuarios-sistema/:id` - Editar un usuario
- `PUT /api/usuarios-sistema/:id/password` - Resetear contraseña
- `DELETE /api/usuarios-sistema/:id` - Desactivar usuario

### Usuarios de Empresas

Estos son los encuestados que completan las encuestas. Los endpoints son similares pero trabajan con la tabla `Usuario` en lugar de `UsuariosSistema`.

---

## Roles y Permisos: Control Granular

El sistema implementa RBAC (Role-Based Access Control), que significa que cada rol tiene permisos específicos sobre recursos específicos.

Hay tres roles principales:

- **Superadmin**: Acceso total a todo
- **Contributor**: Puede ver y editar empresas y rechequeos, pero no puede gestionar usuarios
- **Viewer**: Solo puede ver el dashboard, sin permisos de edición

Los endpoints de roles permiten:

- `GET /api/roles` - Ver todos los roles
- `GET /api/roles/:id/permissions` - Ver permisos de un rol
- `PUT /api/roles/:roleId/resources/:resourceId/permissions` - Actualizar permisos

Esto permite un control muy granular. Por ejemplo, puedes configurar que un rol pueda ver empresas pero no editarlas, o que pueda exportar datos pero no eliminarlos.

---

## Códigos de Respuesta: El Lenguaje de los Errores

No todas las peticiones son exitosas. A veces algo sale mal, y el backend usa códigos HTTP estándar para comunicar qué pasó:

- **200 OK**: Todo salió bien, aquí están tus datos
- **201 Created**: Se creó exitosamente un nuevo recurso
- **400 Bad Request**: La petición está mal formada (faltan parámetros, formato incorrecto)
- **401 Unauthorized**: No estás autenticado (no enviaste token o el token es inválido)
- **403 Forbidden**: Estás autenticado pero no tienes permisos para esta acción
- **404 Not Found**: El recurso que buscas no existe
- **409 Conflict**: Hay un conflicto (por ejemplo, intentas crear un usuario con un email que ya existe)
- **500 Internal Server Error**: Algo salió mal en el servidor (error de código, problema de base de datos, etc.)

Cuando hay un error, la respuesta incluye un mensaje descriptivo:

```json
{
  "message": "No tienes permisos para realizar esta acción"
}
```

En desarrollo, también incluye detalles técnicos del error para ayudar con el debugging.

---

## Documentación Interactiva con Swagger

Una de las mejores características de nuestra API es que tiene documentación interactiva usando Swagger. Puedes ir a `http://localhost:3001/api-docs` y ver todos los endpoints disponibles, qué parámetros aceptan, qué respuestas devuelven, e incluso probarlos directamente desde el navegador.

Esto es increíblemente útil tanto para desarrolladores que trabajan en el proyecto como para cualquier persona que quiera integrarse con la API. No necesitas leer documentación estática; puedes experimentar con la API en tiempo real.

---

## Ejemplos Prácticos

### Iniciar Sesión

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@chequeo.gov.py","password":"password123"}'
```

Esto devuelve un token que puedes usar en peticiones posteriores.

### Obtener Empresas con Filtros

```bash
curl -X GET "http://localhost:3001/api/empresas?page=1&limit=10&departamento=Capital" \
  -H "Authorization: Bearer [TU_TOKEN_AQUI]"
```

### Desde JavaScript

```javascript
const response = await fetch('http://localhost:3001/api/rechequeos/kpis?departamento=Capital', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.cobertura.tasaReincidencia);
```

---

## El Flujo Completo: De Click a Pantalla

Déjame explicarte qué sucede cuando un usuario hace clic en "Ver Rechequeos":

1. El frontend construye una petición `GET /api/rechequeos/kpis` con los filtros activos
2. Agrega el token JWT en el header `Authorization`
3. Envía la petición al backend
4. El backend recibe la petición y pasa por middlewares:
   - Verifica que el token sea válido
   - Verifica que el usuario tenga permisos para ver rechequeos
   - Verifica si hay datos en caché
5. Si hay caché, devuelve los datos inmediatamente
6. Si no hay caché, consulta la base de datos usando las vistas optimizadas
7. Guarda los resultados en caché para próximas peticiones
8. Devuelve los datos al frontend
9. El frontend recibe los datos y los muestra en las tarjetas de KPIs y gráficos

Todo esto sucede en menos de 2 segundos, incluso con miles de registros.

---

## Buenas Prácticas que Seguimos

### Consistencia

Todos los endpoints siguen el mismo patrón. Si sabes cómo funciona uno, puedes entender cómo funcionan los demás. Esto hace que el código sea más mantenible y que sea más fácil para nuevos desarrolladores entender el sistema.

### Validación

El backend valida todos los datos antes de procesarlos. Si alguien intenta crear un usuario sin email, o con un email inválido, el backend rechaza la petición con un mensaje claro de error.

### Seguridad

Nunca exponemos información sensible en las respuestas. Las contraseñas nunca se devuelven, incluso en formato hasheado. Los tokens tienen expiración. Los permisos se verifican en cada petición.

### Performance

Usamos paginación para evitar cargar demasiados datos de una vez. Usamos caché para evitar consultas repetitivas. Usamos índices en la base de datos para hacer las consultas rápidas.

---

## El Futuro de la API

A medida que el sistema crece, podemos agregar nuevos endpoints sin romper los existentes. Por ejemplo, si en el futuro queremos agregar un módulo de reportes personalizados, solo necesitamos crear nuevos endpoints como `/api/reportes` sin afectar los endpoints existentes.

La arquitectura RESTful nos da esta flexibilidad. Es como construir con bloques: puedes agregar nuevos bloques sin tener que reconstruir todo desde cero.

---

*Documento narrativo de API RESTful - Diciembre 2025*  
*Versión del Sistema: Chequeo Digital 2.0*

