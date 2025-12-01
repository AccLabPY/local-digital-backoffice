'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  loginSystem,
  loginEmpresa,
  logout as logoutService,
  getCurrentUser,
  getCachedAuthData,
  hasActiveSession,
  type User,
  type Permissions,
  type AuthData,
} from '@/lib/auth-service';

interface AuthContextType {
  user: User | null;
  permissions: Permissions;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, type?: 'system' | 'empresa') => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasPermission: (resourceCode: string, action?: 'view' | 'create' | 'edit' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  /**
   * Verificar autenticación al cargar
   */
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      // Verificar si hay token activo
      if (!hasActiveSession()) {
        setUser(null);
        setPermissions({});
        setIsLoading(false);
        return;
      }

      // Primero intentar con datos cacheados
      const cachedData = getCachedAuthData();
      
      if (cachedData) {
        setUser(cachedData.user);
        setPermissions(cachedData.permissions);

        // Luego actualizar desde el servidor
        try {
          const freshData = await getCurrentUser();
          setUser(freshData.user);
          setPermissions(freshData.permissions);
        } catch (error) {
          console.error('Error refreshing user data:', error);
          // Si falla, limpiar y pedir login de nuevo
          setUser(null);
          setPermissions({});
        }
      } else {
        setUser(null);
        setPermissions({});
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
      setPermissions({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login
   */
  const login = useCallback(
    async (email: string, password: string, type: 'system' | 'empresa' = 'system') => {
      try {
        const authData: AuthData =
          type === 'system'
            ? await loginSystem(email, password)
            : await loginEmpresa(email, password);

        setUser(authData.user);
        setPermissions(authData.permissions);

        // Redirigir según el tipo - al inicio/home en lugar de dashboard
        if (type === 'system') {
          router.push('/empresas');
        } else {
          router.push('/empresa/dashboard');
        }
      } catch (error: any) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Error al iniciar sesión');
      }
    },
    [router]
  );

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      await logoutService();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setPermissions({});
      
      // Redirigir según el tipo de usuario
      const userType = user?.type || 'system';
      if (userType === 'system') {
        router.push('/login');
      } else {
        router.push('/empresa/login');
      }
    }
  }, [router, user]);

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  const hasPermission = useCallback(
    (resourceCode: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view'): boolean => {
      // Superadmin tiene todos los permisos
      if (user?.role === 'superadmin') {
        return true;
      }

      const permission = permissions[resourceCode];
      if (!permission) {
        return false;
      }

      switch (action) {
        case 'view':
          return permission.canView;
        case 'create':
          return permission.canCreate;
        case 'edit':
          return permission.canEdit;
        case 'delete':
          return permission.canDelete;
        default:
          return false;
      }
    },
    [user, permissions]
  );

  /**
   * Verificar auth al montar (solo una vez)
   */
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextType = {
    user,
    permissions,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para usar el contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

/**
 * HOC para proteger rutas
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredType?: 'system' | 'empresa';
    requiredRole?: string[];
    redirectTo?: string;
  }
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!user) {
          // No autenticado
          router.push(options?.redirectTo || '/login');
          return;
        }

        // Verificar tipo de usuario
        if (options?.requiredType && user.type !== options.requiredType) {
          router.push('/unauthorized');
          return;
        }

        // Verificar rol
        if (options?.requiredRole && !options.requiredRole.includes(user.role)) {
          router.push('/unauthorized');
          return;
        }
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };
}

