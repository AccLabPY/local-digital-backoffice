'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredType?: 'system' | 'empresa';
  requiredRoles?: string[];
  redirectTo?: string;
}

/**
 * Componente para proteger rutas completas
 * Verifica autenticación y opcionalmente tipo de usuario y roles
 */
export function ProtectedRoute({
  children,
  requiredType,
  requiredRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // No autenticado
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // Verificar tipo de usuario
      if (requiredType && user?.type !== requiredType) {
        router.push('/unauthorized');
        return;
      }

      // Verificar roles
      if (requiredRoles && user && !requiredRoles.includes(user.role)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, isLoading, isAuthenticated, requiredType, requiredRoles, redirectTo, router]);

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // No mostrar nada si no está autenticado (se redirigirá)
  if (!isAuthenticated) {
    return null;
  }

  // Verificar tipo y rol antes de renderizar
  if (requiredType && user?.type !== requiredType) {
    return null;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

