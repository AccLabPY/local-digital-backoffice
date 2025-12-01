'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Eye, EyeOff, Shield, User as UserIcon, Database, Trash2, RefreshCw, Info, Activity } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { ProtectedResource } from '@/components/protected-resource';

function ConfiguracionContent() {
  const { user, checkAuth } = useAuth();
  const { toast } = useToast();

  // Estado para datos generales
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    lastName: '',
    organization: '',
    phone: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Estado para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Estado para panel de administración
  const [adminLoading, setAdminLoading] = useState<Record<string, boolean>>({});
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [viewsStatus, setViewsStatus] = useState<any>(null);

  // Cargar datos del usuario
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        name: user.name || '',
        lastName: user.lastName || '',
        organization: user.organization || '',
        phone: user.phone || '',
      });
      
      // Si es superadmin, cargar stats del cache
      if (user.role === 'superadmin') {
        loadCacheStats();
        loadViewsStatus();
      }
    }
  }, [user]);

  // Cargar estadísticas del cache
  const loadCacheStats = async () => {
    try {
      const response = await api.get('/admin/cache/stats');
      // El response de axios ya es data, no data.data
      setCacheStats(response.stats || response.data?.stats);
    } catch (error) {
      console.error('Error loading cache stats:', error);
    }
  };

  // Cargar estado de vistas
  const loadViewsStatus = async () => {
    try {
      const response = await api.get('/admin/views/status');
      setViewsStatus(response.data);
    } catch (error) {
      console.error('Error loading views status:', error);
    }
  };

  // Invalidar cache
  const handleInvalidateCache = async () => {
    setAdminLoading({ ...adminLoading, invalidate: true });
    try {
      await api.post('/admin/cache/invalidate');
      toast({
        title: 'Cache invalidado',
        description: 'El cache ha sido invalidado exitosamente.',
      });
      await loadCacheStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo invalidar el cache',
        variant: 'destructive',
      });
    } finally {
      setAdminLoading({ ...adminLoading, invalidate: false });
    }
  };

  // Purgar cache completo
  const handleFlushCache = async () => {
    if (!confirm('¿Estás seguro de purgar COMPLETAMENTE el cache? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setAdminLoading({ ...adminLoading, flush: true });
    try {
      await api.post('/admin/cache/flush');
      toast({
        title: 'Cache purgado',
        description: 'El cache ha sido eliminado completamente.',
      });
      await loadCacheStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo purgar el cache',
        variant: 'destructive',
      });
    } finally {
      setAdminLoading({ ...adminLoading, flush: false });
    }
  };

  // Actualizar vistas SQL
  const handleRefreshViews = async () => {
    setAdminLoading({ ...adminLoading, refresh: true });
    try {
      await api.post('/admin/views/refresh');
      toast({
        title: 'Vistas actualizadas',
        description: 'Las estadísticas de las vistas SQL han sido actualizadas.',
      });
      await loadViewsStatus();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron actualizar las vistas',
        variant: 'destructive',
      });
    } finally {
      setAdminLoading({ ...adminLoading, refresh: false });
    }
  };

  // Actualizar datos generales
  const handleSaveProfile = async () => {
    setFormError('');
    setIsSaving(true);

    try {
      // Validaciones
      if (!formData.email || !formData.name || !formData.lastName) {
        setFormError('Email, nombre y apellido son requeridos');
        setIsSaving(false);
        return;
      }

      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setFormError('Por favor, ingrese un email válido');
        setIsSaving(false);
        return;
      }

      await api.put('/account/me', formData);

      toast({
        title: 'Perfil actualizado',
        description: 'Tus datos han sido actualizados exitosamente.',
      });

      // Recargar datos del usuario
      await checkAuth();
    } catch (error: any) {
      setFormError(error.message || 'Error al actualizar el perfil');
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async () => {
    setPasswordError('');
    setIsChangingPassword(true);

    try {
      const { currentPassword, newPassword, confirmPassword } = passwordData;

      // Validaciones
      if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordError('Todos los campos son requeridos');
        setIsChangingPassword(false);
        return;
      }

      if (newPassword.length < 8) {
        setPasswordError('La nueva contraseña debe tener al menos 8 caracteres');
        setIsChangingPassword(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError('Las contraseñas no coinciden');
        setIsChangingPassword(false);
        return;
      }

      await api.put('/account/me/password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido cambiada exitosamente.',
      });

      // Limpiar campos
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      setPasswordError(error.message || 'Error al cambiar la contraseña');
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cambiar la contraseña',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col w-full">
      <div className="container max-w-4xl mx-auto p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
            <ProtectedResource requiredRole="superadmin">
              <TabsTrigger value="admin">Administración</TabsTrigger>
            </ProtectedResource>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
          {/* Card de información del usuario */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <UserIcon className="h-6 w-6 text-orange-600" />
                <div>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>
                    Actualiza tus datos personales y de contacto
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {formError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Rol (solo lectura) */}
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Rol en el sistema:</span>
                  </div>
                  <p className="text-lg font-semibold capitalize">
                    {user.role === 'superadmin' && 'Superadministrador'}
                    {user.role === 'contributor' && 'Colaborador'}
                    {user.role === 'viewer' && 'Visualizador'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    (Este campo no puede ser modificado)
                  </p>
                </div>

                <Separator />

                {/* Formulario en dos columnas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organización</Label>
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) =>
                        setFormData({ ...formData, organization: e.target.value })
                      }
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de cambio de contraseña */}
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Actualiza tu contraseña para mantener tu cuenta segura
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* Contraseña actual */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña Actual *</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      disabled={isChangingPassword}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswords({
                          ...showPasswords,
                          current: !showPasswords.current,
                        })
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nueva contraseña */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        disabled={isChangingPassword}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            new: !showPasswords.new,
                          })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Mínimo 8 caracteres
                    </p>
                  </div>

                  {/* Confirmar contraseña */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        disabled={isChangingPassword}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({
                            ...showPasswords,
                            confirm: !showPasswords.confirm,
                          })
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    variant="outline"
                  >
                    {isChangingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                        Cambiando...
                      </>
                    ) : (
                      'Cambiar Contraseña'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          {/* Panel de Administración (Solo Superadmin) */}
          <ProtectedResource requiredRole="superadmin">
            <TabsContent value="admin" className="space-y-6">
              {/* Card de gestión de cache */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 text-blue-600" />
                    <div>
                      <CardTitle>Gestión de Cache</CardTitle>
                      <CardDescription>
                        Administra el cache del sistema (Redis/Memoria)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Estadísticas del cache */}
                  {cacheStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Redis</p>
                        <p className="text-lg">
                          {cacheStats.redis.available ? (
                            <span className="text-green-600 flex items-center gap-2">
                              <Activity className="h-4 w-4" />
                              Conectado
                            </span>
                          ) : (
                            <span className="text-amber-600">Usando memoria</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Entradas en cache</p>
                        <p className="text-lg font-semibold">{cacheStats.memory.entries}</p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Acciones */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      onClick={handleInvalidateCache}
                      disabled={adminLoading.invalidate}
                      variant="outline"
                      className="w-full"
                    >
                      {adminLoading.invalidate ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                          Invalidando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Invalidar Cache
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleFlushCache}
                      disabled={adminLoading.flush}
                      variant="destructive"
                      className="w-full"
                    >
                      {adminLoading.flush ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Purgando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Purgar Cache Completo
                        </>
                      )}
                    </Button>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Invalidar cache:</strong> Limpia entradas relacionadas con rechequeos y empresas.<br />
                      <strong>Purgar cache:</strong> Elimina TODAS las entradas del cache (usar con precaución).
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Card de vistas SQL */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 text-purple-600" />
                    <div>
                      <CardTitle>Vistas SQL Optimizadas</CardTitle>
                      <CardDescription>
                        Estado y mantenimiento de vistas de base de datos
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Estado de vistas */}
                  {viewsStatus && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Estado</p>
                        <p className="text-lg font-semibold">
                          {viewsStatus.status === 'optimized' ? (
                            <span className="text-green-600">Optimizado</span>
                          ) : (
                            <span className="text-amber-600">Estándar</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Vistas</p>
                        <p className="text-lg font-semibold">
                          {viewsStatus.views.total} / {viewsStatus.views.expected}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Índices</p>
                        <p className="text-lg font-semibold">
                          {viewsStatus.indexes.total} / {viewsStatus.indexes.expected}
                        </p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Acción */}
                  <Button
                    onClick={handleRefreshViews}
                    disabled={adminLoading.refresh}
                    variant="outline"
                    className="w-full"
                  >
                    {adminLoading.refresh ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mr-2"></div>
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualizar Estadísticas de Vistas
                      </>
                    )}
                  </Button>

                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Esta operación actualiza las estadísticas de SQL Server para las vistas optimizadas, 
                      mejorando el rendimiento de las consultas. Se ejecuta automáticamente cada semana.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Card de información */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-2 text-sm text-blue-900">
                      <p><strong>Gestión de Usuarios del Sistema:</strong> Usa la sección "Usuarios Sistema" en el menú lateral para administrar usuarios, roles y permisos.</p>
                      <p><strong>Documentación técnica:</strong> Consulta los archivos .md en <code className="bg-blue-100 px-1 py-0.5 rounded">/backend</code> para más detalles sobre la arquitectura y optimizaciones.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ProtectedResource>
        </Tabs>
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <ProtectedRoute requiredType="system">
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <AppHeader title="Mi Perfil" subtitle="Configuración de cuenta" />
          <ConfiguracionContent />
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}

