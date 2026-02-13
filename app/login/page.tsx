'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, TrendingUp, BarChart3, Users, Shield } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  // Si ya está autenticado, redirigir (usando useEffect para evitar setState durante render)
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/empresas');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validaciones
    if (!email || !password) {
      setError('Por favor, complete todos los campos');
      setIsLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Por favor, ingrese un email válido');
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password, 'system');
      // La redirección se maneja en el contexto
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas. Por favor, verifique sus datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel Izquierdo - Naranja Prominente */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-2/5 relative overflow-hidden">
        {/* Imagen de fondo con overlay naranja */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://www.mic.gov.py/wp-content/uploads/2025/06/54551975736_aeee0c7afc_b.jpg)'
          }}
        />
        {/* Overlay negro para mejorar contraste del texto */}
        <div className="absolute inset-0 bg-black/70"></div>
        {/* Overlay naranja sutil para mantener el color prominente */}
        {/* <div className="absolute inset-0 bg-gradient-to-br from-primary-500/40 via-primary-400/35 to-orange-400/40"></div> */}
        
        {/* Patrones decorativos de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-300 rounded-full blur-3xl"></div>
        </div>

        {/* Contenido del panel izquierdo */}
        <div className="relative z-10 flex flex-col p-12 text-white h-full">
          {/* Logos en la parte superior - Simétricos */}
          <div className="flex justify-center items-center gap-8 mb-6">
            <div className="relative">
              <Image 
                src="/logoMIC.png" 
                alt="Ministerio de Industria y Comercio" 
                width={120} 
                height={120}
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>
            <div className="relative">
              <Image 
                src="/logoBID.png" 
                alt="Banco Interamericano de Desarrollo" 
                width={120} 
                height={120}
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>
          </div>

          <div className="space-y-6 flex-1 mt-16">
            <div className="space-y-4">
              <h2 className="text-4xl xl:text-5xl font-bold leading-tight">
                Panel de Control de Chequeo Digital
              </h2>
              <p className="text-xl text-orange-50 leading-relaxed">
                Gestione y analice los resultados de las evaluaciones de madurez digital de empresas paraguayas
              </p>
            </div>

            {/* Características destacadas */}
            <div className="grid grid-cols-1 gap-6 mt-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Análisis Avanzado</h3>
                  <p className="text-orange-50 text-sm">Visualice métricas e indicadores de innovación en tiempo real</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Seguimiento de Evolución</h3>
                  <p className="text-orange-50 text-sm">Mida el progreso de empresas con análisis de rechequeos</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Filtros Avanzados</h3>
                  <p className="text-orange-50 text-sm">Filtre los resultados de las encuestas en diferentes niveles</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer del panel izquierdo */}
          <div className="text-orange-50 text-sm mt-auto">
            <p>Desarrollado para el Ministerio de Industria y Comercio</p>
            <p className="mt-1">en colaboración con el Banco Interamericano de Desarrollo</p>
          </div>
        </div>
      </div>

      {/* Panel Derecho - Formulario de Login */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Título de bienvenida */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Bienvenido de nuevo
            </h1>
            <p className="text-gray-600">
              Ingrese sus credenciales para acceder al sistema
            </p>
          </div>

          {/* Formulario de Login */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error alert */}
              {error && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500 transition-colors"
                    disabled={isLoading}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 border-gray-300 focus:border-primary-500 focus:ring-primary-500 transition-colors"
                    disabled={isLoading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Iniciando sesión...
                  </span>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            {/* Footer info */}
            <div className="pt-6 border-t border-gray-200">
              <div className="text-center text-sm text-gray-600">
                <p className="mb-2">¿Usuario de empresa?</p>
                <a
                  href="/empresa/login"
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors inline-flex items-center gap-1"
                >
                  Iniciar sesión como empresa
                </a>
              </div>
            </div>
          </div>

          {/* Footer copyright */}
          <p className="text-center text-xs text-gray-500 mt-8">
            © 2025 Chequeo Digital 2.0 - MIC & BID
          </p>
        </div>
      </div>
    </div>
  );
}

