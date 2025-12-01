/**
 * API Client para comunicación con el backend
 * Maneja tokens, interceptores y llamadas HTTP
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  // Validar que el token sea string o null
  if (token !== null && typeof token !== 'string') {
    console.error('[API Client] Attempted to set non-string token:', token, typeof token);
    token = null;
  }
  
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token && typeof token === 'string') {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
};

export const getAuthToken = (): string | null => {
  if (!authToken && typeof window !== 'undefined') {
    const stored = localStorage.getItem('auth_token');
    // Asegurar que siempre devolvamos string o null
    authToken = (stored && typeof stored === 'string') ? stored : null;
  }
  // Validación adicional: asegurar que authToken sea string o null
  return (authToken && typeof authToken === 'string') ? authToken : null;
};

export const clearAuthToken = () => {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('permissions');
  }
};

// Helper para crear headers
const getHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token && typeof token === 'string') {
      headers['Authorization'] = `Bearer ${token}`;
      console.log(`[API Client] Adding auth header: Bearer ${token.substring(0, 20)}...`);
    } else {
      console.warn('[API Client] No valid auth token available for request', { token, type: typeof token });
    }
  }

  return headers;
};

// Manejo de errores
class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Función principal para hacer requests
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  includeAuth = true
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = getHeaders(includeAuth);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    // Intentar parsear JSON
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { message: 'Error al procesar respuesta del servidor' };
    }

    if (!response.ok) {
      // Si es 401, limpiar token y redirigir
      if (response.status === 401) {
        clearAuthToken();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      throw new ApiError(
        data.message || 'Error en la petición',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('API Request Error:', error);
    throw new Error('Error de conexión con el servidor');
  }
}

// Métodos HTTP
export const api = {
  get: <T = any>(endpoint: string, includeAuth = true) =>
    apiRequest<T>(endpoint, { method: 'GET' }, includeAuth),

  post: <T = any>(endpoint: string, data?: any, includeAuth = true) =>
    apiRequest<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    ),

  put: <T = any>(endpoint: string, data?: any, includeAuth = true) =>
    apiRequest<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    ),

  patch: <T = any>(endpoint: string, data?: any, includeAuth = true) =>
    apiRequest<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    ),

  delete: <T = any>(endpoint: string, data?: any, includeAuth = true) =>
    apiRequest<T>(
      endpoint,
      {
        method: 'DELETE',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    ),
};

export default api;

