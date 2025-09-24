/**
 * Singleton Auth Service para el Frontend
 * Evita múltiples llamadas al endpoint de login
 */

interface AuthToken {
  token: string;
  expiresAt: Date;
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string> | null = null;

  // Credenciales por defecto
  private readonly defaultCredentials = {
    username: "saquino@mic.gov.py",
    password: "AXbHxVXNsKK3KYOfmAfezWjwRu7q/ghVofbYUdEk2ak="
  };

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Obtiene un token válido, renovándolo si es necesario
   */
  public async getValidToken(): Promise<string> {
    // Si tenemos un token válido, lo devolvemos
    if (this.isTokenValid()) {
      console.log('Using cached valid token');
      return this.token!;
    }

    // Si ya estamos refrescando, esperamos a que termine
    if (this.isRefreshing && this.refreshPromise) {
      console.log('Token refresh in progress, waiting...');
      return this.refreshPromise;
    }

    // Iniciamos el proceso de renovación
    return this.refreshToken();
  }

  /**
   * Verifica si el token actual es válido
   */
  private isTokenValid(): boolean {
    if (!this.token || !this.tokenExpiry) {
      return false;
    }

    // Verificamos si el token expira en los próximos 5 minutos
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    return this.tokenExpiry > fiveMinutesFromNow;
  }

  /**
   * Renueva el token haciendo login
   */
  private async refreshToken(): Promise<string> {
    this.isRefreshing = true;
    
    try {
      console.log('Refreshing authentication token...');
      
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.defaultCredentials),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Actualizamos el token y su expiración
      this.token = data.token;
      this.tokenExpiry = this.calculateTokenExpiry(data.token);
      
      console.log(`Token refreshed successfully, expires at: ${this.tokenExpiry.toLocaleString()}`);
      
      return this.token;
      
    } catch (error) {
      console.error(`Error refreshing token: ${error}`);
      this.token = null;
      this.tokenExpiry = null;
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Calcula la fecha de expiración del token
   */
  private calculateTokenExpiry(token: string): Date {
    try {
      // Decodificar el JWT para obtener la expiración
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload && payload.exp) {
        return new Date(payload.exp * 1000);
      }
    } catch (error) {
      console.warn('Could not decode token for expiry calculation');
    }
    
    // Fallback: asumimos 2 horas de vida
    return new Date(Date.now() + 2 * 60 * 60 * 1000);
  }

  /**
   * Invalida el token actual
   */
  public invalidateToken(): void {
    console.log('Invalidating current token');
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Obtiene información del token actual
   */
  public getTokenInfo() {
    return {
      hasToken: !!this.token,
      isValid: this.isTokenValid(),
      expiresAt: this.tokenExpiry,
      isRefreshing: this.isRefreshing
    };
  }
}

// Exportamos una instancia singleton
export const authService = AuthService.getInstance();
