# Ejemplos de Implementación de Permisos en Vistas

Este documento contiene ejemplos prácticos de cómo adaptar las vistas existentes de Chequeo Digital para usar el sistema de permisos basado en recursos (RBAC).

---

## 📋 Índice

1. [Proteger Rutas Completas](#proteger-rutas-completas)
2. [Proteger Componentes y Secciones](#proteger-componentes-y-secciones)
3. [Proteger Botones y Acciones](#proteger-botones-y-acciones)
4. [Adaptar Página de Empresas](#adaptar-página-de-empresas)
5. [Adaptar Página de Rechequeos](#adaptar-página-de-rechequeos)
6. [Sidebar con Permisos](#sidebar-con-permisos)
7. [Header con Permisos](#header-con-permisos)

---

## 🔒 Proteger Rutas Completas

### Ejemplo 1: Página de Usuarios (Solo Superadmin)

```tsx
'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';

export default function UsuariosPage() {
  return (
    <ProtectedRoute 
      requiredType="system"
      requiredRoles={['superadmin']}
      redirectTo="/dashboard"
    >
      <div>
        <AppHeader title="Usuarios Internos" />
        {/* Contenido de la página */}
      </div>
    </ProtectedRoute>
  );
}
```

### Ejemplo 2: Página de Testing (Solo Superadmin)

```tsx
'use client';

import { ProtectedRoute } from '@/components/protected-route';

export default function TestingPage() {
  return (
    <ProtectedRoute 
      requiredType="system"
      requiredRoles={['superadmin']}
      redirectTo="/dashboard"
    >
      {/* Contenido de testing */}
    </ProtectedRoute>
  );
}
```

### Ejemplo 3: Página de Dashboard (Cualquier Usuario Autenticado)

```tsx
'use client';

import { ProtectedRoute } from '@/components/protected-route';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredType="system">
      {/* Dashboard Looker */}
    </ProtectedRoute>
  );
}
```

---

## 🧩 Proteger Componentes y Secciones

### Ejemplo 1: Secciones Condicionales

```tsx
'use client';

import { ProtectedResource } from '@/components/protected-resource';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function EmpresaDetailPage({ empresaId }: { empresaId: number }) {
  return (
    <div className="space-y-6">
      {/* Sección de resultados - visible para todos */}
      <ProtectedResource resourceCode="EMPRESA_DETAIL_RESULTS_SECTION" action="view">
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Evaluación</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Gráficos y resultados */}
          </CardContent>
        </Card>
      </ProtectedResource>

      {/* Sección de historial - visible para todos */}
      <ProtectedResource resourceCode="EMPRESA_DETAIL_HISTORY_SECTION" action="view">
        <Card>
          <CardHeader>
            <CardTitle>Historial de Evaluaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tabla de historial */}
          </CardContent>
        </Card>
      </ProtectedResource>
    </div>
  );
}
```

### Ejemplo 2: Filtros con Permisos

```tsx
import { ProtectedResource } from '@/components/protected-resource';
import { FilterPanel } from '@/components/filter-panel';

export function EmpresasFilters() {
  return (
    <div className="space-y-4">
      {/* Filtros de tiempo */}
      <ProtectedResource resourceCode="EMPRESAS_FILTERS_TIME" action="view">
        <FilterPanel title="Filtros de Fecha">
          {/* Controles de fecha */}
        </FilterPanel>
      </ProtectedResource>

      {/* Filtros de búsqueda */}
      <ProtectedResource resourceCode="EMPRESAS_FILTERS_SEARCH" action="view">
        <FilterPanel title="Búsqueda Avanzada">
          {/* Controles de búsqueda */}
        </FilterPanel>
      </ProtectedResource>
    </div>
  );
}
```

---

## 🔘 Proteger Botones y Acciones

### Ejemplo 1: Botones de Acción en Tabla

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { ProtectedResource } from '@/components/protected-resource';
import { Eye, RefreshCw, Trash2 } from 'lucide-react';

interface EmpresaActionsProps {
  empresaId: number;
  onView: () => void;
  onReassign: () => void;
  onDelete: () => void;
}

export function EmpresaActions({ 
  empresaId, 
  onView, 
  onReassign, 
  onDelete 
}: EmpresaActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Botón Ver - disponible para todos con acceso a empresas */}
      <ProtectedResource 
        resourceCode="EMPRESAS_OBSERVATORIO_ACTION_VIEW" 
        action="view"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onView}
          className="text-orange-600 hover:text-orange-700"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </ProtectedResource>

      {/* Botón Reasignar - solo contributor y superadmin */}
      <ProtectedResource 
        resourceCode="EMPRESAS_OBSERVATORIO_ACTION_REASSIGN" 
        action="create"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onReassign}
          className="text-purple-600 hover:text-purple-700"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </ProtectedResource>

      {/* Botón Eliminar - solo superadmin */}
      <ProtectedResource 
        resourceCode="EMPRESAS_OBSERVATORIO_ACTION_DELETE" 
        action="delete"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </ProtectedResource>
    </div>
  );
}
```

### Ejemplo 2: Botones de Exportación

```tsx
import { Button } from '@/components/ui/button';
import { ProtectedResource } from '@/components/protected-resource';
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';

export function RechequeosExportButtons() {
  return (
    <div className="flex items-center gap-2">
      <ProtectedResource 
        resourceCode="RECHEQUEOS_EXPORT_PDF" 
        action="view"
      >
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
      </ProtectedResource>

      <ProtectedResource 
        resourceCode="RECHEQUEOS_EXPORT_CSV" 
        action="view"
      >
        <Button variant="outline">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </ProtectedResource>

      <ProtectedResource 
        resourceCode="RECHEQUEOS_EXPORT_CSV_DETAIL_PER_EMPRESA" 
        action="view"
      >
        <Button variant="outline">
          <FileDown className="h-4 w-4 mr-2" />
          Detalle por Empresa
        </Button>
      </ProtectedResource>
    </div>
  );
}
```

---

## 📊 Adaptar Página de Empresas

### Archivo: `app/empresas/page.tsx`

```tsx
'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { ProtectedResource } from '@/components/protected-resource';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

export default function EmpresasPage() {
  const handleExport = () => {
    // Lógica de exportación
  };

  return (
    <ProtectedRoute requiredType="system">
      <div className="min-h-screen bg-gray-50">
        <AppHeader 
          title="Empresas" 
          subtitle="Observatorio de Chequeos"
          actions={
            <ProtectedResource 
              resourceCode="EMPRESAS_EXPORT_REPORT" 
              action="view"
            >
              <Button 
                onClick={handleExport}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Exportar Reporte
              </Button>
            </ProtectedResource>
          }
        />

        <div className="container mx-auto p-6">
          {/* Filtros */}
          <ProtectedResource 
            resourceCode="EMPRESAS_FILTERS_TIME" 
            action="view"
          >
            <EmpresasTimeFilters />
          </ProtectedResource>

          <ProtectedResource 
            resourceCode="EMPRESAS_FILTERS_SEARCH" 
            action="view"
          >
            <EmpresasSearchFilters />
          </ProtectedResource>

          {/* Stats Cards */}
          <ProtectedResource 
            resourceCode="EMPRESAS_STATS_CARDS" 
            action="view"
          >
            <EmpresasStatsCards />
          </ProtectedResource>

          {/* Tabla */}
          <ProtectedResource 
            resourceCode="EMPRESAS_OBSERVATORIO_TABLE" 
            action="view"
          >
            <EmpresasTable />
          </ProtectedResource>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 📈 Adaptar Página de Rechequeos

### Archivo: `app/rechequeos/page.tsx`

```tsx
'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { ProtectedResource } from '@/components/protected-resource';
import { AppHeader } from '@/components/app-header';
import { RechequeosExportButtons } from '@/components/rechequeos-export-buttons';

export default function RechequeosPage() {
  return (
    <ProtectedRoute 
      requiredType="system"
      requiredRoles={['superadmin', 'contributor']}
      redirectTo="/dashboard"
    >
      <div className="min-h-screen bg-gray-50">
        <AppHeader 
          title="Rechequeos" 
          subtitle="Gestión de Rechequeos"
          actions={<RechequeosExportButtons />}
        />

        <div className="container mx-auto p-6">
          <ProtectedResource 
            resourceCode="RECHEQUEOS_FILTERS_TIME" 
            action="view"
          >
            <RechequeosTimeFilters />
          </ProtectedResource>

          <ProtectedResource 
            resourceCode="RECHEQUEOS_FILTERS_SEARCH" 
            action="view"
          >
            <RechequeosSearchFilters />
          </ProtectedResource>

          <ProtectedResource 
            resourceCode="RECHEQUEOS_LIST_VIEW" 
            action="view"
          >
            <RechequeosTable />
          </ProtectedResource>
        </div>
      </div>
    </ProtectedRoute>
  );
}
```

---

## 🧭 Sidebar con Permisos

### Archivo: `components/app-sidebar.tsx`

```tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePermission } from '@/components/protected-resource';
import { 
  Home, 
  Building2, 
  RefreshCw, 
  Users, 
  TestTube2,
  Settings
} from 'lucide-react';

export function AppSidebar() {
  const { user } = useAuth();
  const canViewEmpresas = usePermission('PAGE_EMPRESAS', 'view');
  const canViewRechequeos = usePermission('PAGE_RECHEQUEOS', 'view');
  const canViewUsuarios = usePermission('PAGE_USUARIOS', 'view');
  const canViewTesting = usePermission('PAGE_TESTING', 'view');

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      visible: true, // Siempre visible para autenticados
    },
    {
      title: 'Empresas',
      href: '/empresas',
      icon: Building2,
      visible: canViewEmpresas,
    },
    {
      title: 'Rechequeos',
      href: '/rechequeos',
      icon: RefreshCw,
      visible: canViewRechequeos,
    },
    {
      title: 'Usuarios Internos',
      href: '/usuarios',
      icon: Users,
      visible: canViewUsuarios,
    },
    {
      title: 'Testing',
      href: '/testing',
      icon: TestTube2,
      visible: canViewTesting,
    },
    {
      title: 'Configuración',
      href: '/configuracion',
      icon: Settings,
      visible: true, // Todos pueden ver su perfil
    },
  ];

  return (
    <aside className="sidebar">
      <nav>
        {menuItems
          .filter(item => item.visible)
          .map(item => (
            <a key={item.href} href={item.href}>
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </a>
          ))}
      </nav>
    </aside>
  );
}
```

---

## 📑 Header con Permisos

El header ya incluye los permisos automáticamente mediante el componente `AppHeader` que acepta `actions`:

```tsx
import { AppHeader } from '@/components/app-header';
import { ProtectedResource } from '@/components/protected-resource';
import { Button } from '@/components/ui/button';

export function MyPage() {
  return (
    <div>
      <AppHeader 
        title="Mi Página"
        subtitle="Subtítulo"
        actions={
          <>
            <ProtectedResource 
              resourceCode="MI_RECURSO_1" 
              action="create"
            >
              <Button>Acción 1</Button>
            </ProtectedResource>

            <ProtectedResource 
              resourceCode="MI_RECURSO_2" 
              action="edit"
            >
              <Button>Acción 2</Button>
            </ProtectedResource>
          </>
        }
      />
      {/* Contenido */}
    </div>
  );
}
```

---

## 💡 Uso con Hooks

Para lógica más compleja, usa el hook `usePermission`:

```tsx
'use client';

import { usePermission } from '@/components/protected-resource';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';

export function ComplexComponent() {
  const { user, hasPermission } = useAuth();
  const canEdit = usePermission('EMPRESA_DETAIL_EDIT_GENERAL_INFO', 'edit');
  const canDelete = usePermission('EMPRESAS_OBSERVATORIO_ACTION_DELETE', 'delete');
  
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  useEffect(() => {
    // Lógica basada en permisos
    if (canEdit) {
      // Habilitar funciones de edición
    }
  }, [canEdit]);

  const handleAction = () => {
    if (hasPermission('MI_RECURSO', 'create')) {
      // Realizar acción
    } else {
      // Mostrar mensaje de error
      alert('No tienes permisos para esta acción');
    }
  };

  return (
    <div>
      {/* UI basada en permisos */}
      {canEdit && (
        <button onClick={() => setMode('edit')}>
          Editar
        </button>
      )}
      
      {canDelete && (
        <button onClick={handleAction}>
          Eliminar
        </button>
      )}
    </div>
  );
}
```

---

## 🔄 Checklist de Migración

Para adaptar una vista existente:

- [ ] Envolver la página con `<ProtectedRoute>` si requiere autenticación
- [ ] Reemplazar `<MainContent>` con `<AppHeader>` donde aplique
- [ ] Envolver secciones con `<ProtectedResource>` según el resourceCode
- [ ] Envolver botones de acción con `<ProtectedResource>` según la acción
- [ ] Actualizar el sidebar para ocultar/mostrar opciones según permisos
- [ ] Verificar que los endpoints del backend estén protegidos con los middlewares correspondientes
- [ ] Probar con los 3 tipos de usuarios (superadmin, contributor, viewer)

---

## 📝 Notas

1. **Cascada de Permisos**: Si un usuario no tiene permiso para ver una página completa (`PAGE_*`), no necesita verificar permisos de recursos internos.
2. **Superadmin Siempre Pasa**: El role `superadmin` tiene acceso a todos los recursos automáticamente.
3. **Fallback**: Usa `fallback` en `<ProtectedResource>` para mostrar mensajes alternativos cuando no hay permiso.
4. **Performance**: Los permisos se cargan una vez al login y se cachean en el contexto.

---

**Última actualización**: Noviembre 2025

