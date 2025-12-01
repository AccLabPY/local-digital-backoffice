'use client';

import { useAuth } from '@/contexts/auth-context';
import { ReactNode } from 'react';

interface ProtectedResourceProps {
  resourceCode: string;
  action?: 'view' | 'create' | 'edit' | 'delete';
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que protege contenido basado en permisos de recursos
 * Solo renderiza los children si el usuario tiene el permiso necesario
 */
export function ProtectedResource({
  resourceCode,
  action = 'view',
  children,
  fallback = null,
}: ProtectedResourceProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(resourceCode, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook personalizado para verificar permisos en componentes
 */
export function usePermission(resourceCode: string, action: 'view' | 'create' | 'edit' | 'delete' = 'view') {
  const { hasPermission } = useAuth();
  return hasPermission(resourceCode, action);
}

/**
 * Componente para botones protegidos por permisos
 */
interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  resourceCode: string;
  action?: 'view' | 'create' | 'edit' | 'delete';
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedButton({
  resourceCode,
  action = 'view',
  children,
  fallback = null,
  ...buttonProps
}: ProtectedButtonProps) {
  const { hasPermission } = useAuth();

  if (!hasPermission(resourceCode, action)) {
    return <>{fallback}</>;
  }

  return <button {...buttonProps}>{children}</button>;
}

