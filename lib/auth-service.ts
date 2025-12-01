/**
 * Servicio de autenticación
 * Maneja login, logout y operaciones relacionadas con auth
 */

import { api, setAuthToken, clearAuthToken } from './api-client';

export interface User {
  id: number;
  email: string;
  name: string;
  lastName?: string;
  fullName: string;
  organization?: string;
  phone?: string;
  role: string;
  roleId?: number;
  type: 'system' | 'empresa';
}

export interface Permission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  description: string;
  category: string;
}

export type Permissions = Record<string, Permission>;

export interface LoginResponse {
  status: string;
  data: {
    user: User;
    token: string;
    permissions?: Permissions;
  };
}

export interface AuthData {
  user: User;
  permissions: Permissions;
}

/**
 * Login de usuarios del sistema (backoffice)
 */
export async function loginSystem(email: string, password: string): Promise<AuthData> {
  console.log('[Auth Service] Attempting login...');
  const response = await api.post<LoginResponse>(
    '/auth/login',
    { email, password },
    false
  );

  console.log('[Auth Service] Login response:', response);
  console.log('[Auth Service] Response data:', response.data);

  const { user, token, permissions } = response.data;

  console.log('[Auth Service] Extracted - user:', user, 'token:', token?.substring(0, 20) + '...', 'permissions:', permissions);

  // Validar que el token sea string antes de guardarlo
  if (!token || typeof token !== 'string') {
    console.error('[Auth Service] Invalid token received:', token, typeof token);
    throw new Error('Token inválido recibido del servidor');
  }

  // Guardar token
  setAuthToken(token);
  console.log('[Auth Service] Token saved to localStorage');

  // Guardar datos en localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_data', JSON.stringify(user));
    if (permissions) {
      localStorage.setItem('permissions', JSON.stringify(permissions));
    }
  }

  return {
    user,
    permissions: permissions || {},
  };
}

/**
 * Login de empresas
 */
export async function loginEmpresa(email: string, password: string): Promise<AuthData> {
  const response = await api.post<LoginResponse>(
    '/auth/loginempresa',
    { email, password },
    false
  );

  const { user, token } = response.data;

  // Validar que el token sea string antes de guardarlo
  if (!token || typeof token !== 'string') {
    console.error('[Auth Service] Invalid token received:', token, typeof token);
    throw new Error('Token inválido recibido del servidor');
  }

  // Guardar token
  setAuthToken(token);

  // Guardar datos en localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  return {
    user,
    permissions: {},
  };
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    clearAuthToken();
  }
}

/**
 * Obtener datos del usuario actual
 */
export async function getCurrentUser(): Promise<AuthData> {
  const response = await api.get<{
    status: string;
    data: User & { permissions?: Permissions };
  }>('/auth/me');

  const { permissions, ...user } = response.data;

  // Actualizar localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_data', JSON.stringify(user));
    if (permissions) {
      localStorage.setItem('permissions', JSON.stringify(permissions));
    }
  }

  return {
    user: user as User,
    permissions: permissions || {},
  };
}

/**
 * Obtener datos del usuario desde localStorage (sin llamada al servidor)
 */
export function getCachedAuthData(): AuthData | null {
  if (typeof window === 'undefined') return null;

  const userData = localStorage.getItem('user_data');
  const permissionsData = localStorage.getItem('permissions');

  if (!userData) return null;

  try {
    const user = JSON.parse(userData);
    const permissions = permissionsData ? JSON.parse(permissionsData) : {};

    return { user, permissions };
  } catch (error) {
    return null;
  }
}

/**
 * Verificar si hay una sesión activa
 */
export function hasActiveSession(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
}

/**
 * Obtener token válido (alias para getAuthToken de api-client)
 */
export function getValidToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

