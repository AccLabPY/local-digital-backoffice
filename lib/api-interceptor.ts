/**
 * Interceptor para debugging de llamadas API
 */

if (typeof window !== 'undefined') {
  // Log de todas las llamadas fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('[API Call]', args[0], args[1]);
    return originalFetch.apply(this, args)
      .then((response) => {
        console.log('[API Response]', args[0], response.status);
        return response;
      })
      .catch((error) => {
        console.error('[API Error]', args[0], error);
        throw error;
      });
  };
}

export {};

