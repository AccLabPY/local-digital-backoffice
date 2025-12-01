'use client';

import { useAuth } from '@/contexts/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Building2,
  Shield,
  Eye,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppHeader({ title, subtitle, actions }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  // Obtener iniciales del usuario
  const getInitials = () => {
    if (user.name && user.lastName) {
      return `${user.name.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.name) {
      return user.name.substring(0, 2).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  // Obtener icono según el rol
  const getRoleIcon = () => {
    switch (user.role) {
      case 'superadmin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'contributor':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <Building2 className="h-4 w-4 text-purple-500" />;
    }
  };

  // Obtener etiqueta del rol
  const getRoleLabel = () => {
    switch (user.role) {
      case 'superadmin':
        return 'Superadministrador';
      case 'contributor':
        return 'Colaborador';
      case 'viewer':
        return 'Visualizador';
      default:
        return user.role;
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleConfiguracion = () => {
    router.push('/configuracion');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Título y subtítulo */}
        <div className="flex-1">
          {title && (
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        {/* Acciones de la vista (botones específicos) */}
        {actions && (
          <div className="flex items-center gap-2 mr-4">
            {actions}
          </div>
        )}

        {/* Usuario dropdown */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 h-auto"
              >
                {/* Avatar */}
                <Avatar className="h-9 w-9 bg-gradient-to-br from-orange-500 to-purple-600">
                  <AvatarFallback className="bg-transparent text-white font-semibold text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>

                {/* Info del usuario */}
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name} {user.lastName || ''}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    {getRoleIcon()}
                    <span>{getRoleLabel()}</span>
                  </div>
                </div>

                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
              {/* Info del usuario */}
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name} {user.lastName || ''}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  {user.organization && (
                    <p className="text-xs leading-none text-muted-foreground flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3" />
                      {user.organization}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Rol badge */}
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-md">
                  {getRoleIcon()}
                  <span className="text-xs font-medium text-gray-700">
                    {getRoleLabel()}
                  </span>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Opciones */}
              <DropdownMenuItem
                onClick={handleConfiguracion}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Mi Perfil / Configuración</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

