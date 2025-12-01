'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, Building2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginEmpresaPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  // Si ya está autenticado, redirigir
  if (isAuthenticated) {
    router.push('/empresa/dashboard');
    return null;
  }

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
      await login(email, password, 'empresa');
      // La redirección se maneja en el contexto
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas. Por favor, verifique sus datos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-6">
            <Image 
              src="/logoMIC.png" 
              alt="MIC" 
              width={80} 
              height={80}
              className="object-contain"
            />
            <Image 
              src="/logoBID.png" 
              alt="BID" 
              width={80} 
              height={80}
              className="object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Acceso Empresas
            </h1>
          </div>
          <p className="text-gray-600">
            Portal de Resultados - Mi Empresa
          </p>
        </div>

        {/* Card de login */}
        <Card className="shadow-xl border-t-4 border-t-purple-500">
          <CardHeader>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Acceda para ver los resultados de su empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            {/* Footer info */}
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>¿Usuario del sistema?</p>
              <a
                href="/login"
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Iniciar sesión como administrador
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          © 2025 Chequeo Digital - MIC & PNUD
        </p>
      </div>
    </div>
  );
}

