import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/api-client';

/**
 * Hook simplificado para obtener el token de autenticación
 * NOTA: Para la gestión completa de autenticación, usa useAuth de @/contexts/auth-context
 */
export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const currentToken = getAuthToken();
    setToken(currentToken);
  }, []);

  return {
    token
  };
}
