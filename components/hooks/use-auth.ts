import { useState, useEffect } from 'react';
import { authService } from '../services/auth-service';

/**
 * Hook personalizado para usar el servicio de autenticación singleton
 */
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getToken = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const validToken = await authService.getValidToken();
        setToken(validToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error getting token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    getToken();
  }, []);

  const refreshToken = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const validToken = await authService.getValidToken();
      setToken(validToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error refreshing token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const invalidateToken = () => {
    authService.invalidateToken();
    setToken(null);
  };

  return {
    token,
    loading,
    error,
    refreshToken,
    invalidateToken,
    tokenInfo: authService.getTokenInfo()
  };
}
