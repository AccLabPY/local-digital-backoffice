# 📚 Documentación de Chequeo Digital 2.0

**Panel de Control de Innovación Empresarial**

---

## 📋 Índice de Documentación

### 📘 Manuales de Usuario

Guías paso a paso para utilizar cada funcionalidad del sistema:

| Archivo | Descripción |
|---------|-------------|
| [01_MANUAL_INICIO_SESION.md](./01_MANUAL_INICIO_SESION.md) | Acceso al sistema, roles y cierre de sesión |
| [02_MANUAL_EMPRESAS.md](./02_MANUAL_EMPRESAS.md) | Listado de empresas, filtros y exportación |
| [03_MANUAL_DETALLE_EMPRESA.md](./03_MANUAL_DETALLE_EMPRESA.md) | Vista detallada, edición y gestión de usuarios |
| [03B_MANUAL_DETALLE_ENCUESTA.md](./03B_MANUAL_DETALLE_ENCUESTA.md) | Respuestas de encuesta, tipos de preguntas |
| [04_MANUAL_RECHEQUEOS.md](./04_MANUAL_RECHEQUEOS.md) | Análisis de evolución temporal, KPIs y heatmaps |
| [05_MANUAL_DASHBOARD.md](./05_MANUAL_DASHBOARD.md) | Dashboard ejecutivo Looker |
| [06_MANUAL_USUARIOS_SISTEMA.md](./06_MANUAL_USUARIOS_SISTEMA.md) | Gestión de operadores del backoffice |
| [07_MANUAL_USUARIOS_EMPRESAS.md](./07_MANUAL_USUARIOS_EMPRESAS.md) | Gestión de encuestados |
| [08_MANUAL_ROLES_PERMISOS.md](./08_MANUAL_ROLES_PERMISOS.md) | Control de acceso RBAC |

### 📗 Documentación Técnica

Especificaciones técnicas para desarrolladores y administradores:

| Archivo | Descripción |
|---------|-------------|
| [TECNICO_01_ARQUITECTURA_SISTEMA.md](./TECNICO_01_ARQUITECTURA_SISTEMA.md) | Stack tecnológico, patrones y estructura |
| [TECNICO_02_OPTIMIZACIONES_SQL.md](./TECNICO_02_OPTIMIZACIONES_SQL.md) | Vistas, índices y queries optimizadas |
| [TECNICO_03_API_RESTFUL.md](./TECNICO_03_API_RESTFUL.md) | Especificación de endpoints de la API |
| [TECNICO_04_SISTEMA_CACHE.md](./TECNICO_04_SISTEMA_CACHE.md) | Redis, caché en memoria y estrategias |
| [TECNICO_05_INSTALACION.md](./TECNICO_05_INSTALACION.md) | Guía de instalación y despliegue |

### 📄 Resumen Ejecutivo

| Archivo | Descripción |
|---------|-------------|
| [RESUMEN_EJECUTIVO.md](./RESUMEN_EJECUTIVO.md) | Visión general del producto para stakeholders |

---

## 🚀 Acceso Rápido

### Documentación en el Sistema

La documentación también está disponible directamente en el sistema web:

```
http://[SERVIDOR]:3000/documentacion
```

Acceda desde el menú lateral → **Documentación** (ícono de libro 📖)

### Credenciales de Acceso Iniciales

- **Email**: `admin@chequeo.gov.py`
- **Password**: `password123`

⚠️ **Importante**: Cambie la contraseña después del primer inicio de sesión.

---

## 📂 Estructura del Proyecto

```
chequeo/
├── app/                    # Next.js App Router
├── backend/               # Express.js API
│   ├── src/              # Código fuente
│   └── sql-scripts/      # Scripts de BD
├── components/           # Componentes React
├── documentacion_cd/     # ← Esta documentación
├── lib/                  # Utilidades
└── public/               # Assets estáticos
```

---

## 🛠️ Soporte

Para asistencia técnica o consultas:

1. Revise esta documentación
2. Consulte la sección correspondiente en el sistema
3. Contacte al administrador del sistema

---

*Documentación generada: Diciembre 2025*  
*Versión del Sistema: Chequeo Digital 2.0*
