"use client"

import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Shield, Info, Edit, Save, X } from "lucide-react"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface Role {
  IdRol: number
  Nombre: string
  Descripcion: string
}

interface Resource {
  IdRecurso: number
  Codigo: string
  Descripcion: string
  Categoria: string
}

interface Permission {
  IdRol: number
  IdRecurso: number
  CanView: boolean
  CanCreate: boolean
  CanEdit: boolean
  CanDelete: boolean
  ResourceCode: string
  ResourceDescription: string
  ResourceCategory: string
}

export function RolesPermissionsManagementPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([])
  const [editedPermissions, setEditedPermissions] = useState<Record<number, any>>({})
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [rolesRes, resourcesRes] = await Promise.all([
        api.get('/roles'),
        api.get('/resources')
      ])
      setRoles(rolesRes.data)
      setResources(resourcesRes.data)
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: error.message || "Error al cargar datos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditRole = async (role: Role) => {
    try {
      setSelectedRole(role)
      const res = await api.get(`/roles/${role.IdRol}/permissions`)
      setRolePermissions(res.data)
      setEditedPermissions({})
      setIsEditOpen(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar permisos",
        variant: "destructive"
      })
    }
  }

  const togglePermission = (resourceId: number, permissionType: string, currentValue: boolean) => {
    setEditedPermissions(prev => ({
      ...prev,
      [resourceId]: {
        ...prev[resourceId],
        [permissionType]: !currentValue
      }
    }))
  }

  const getPermissionValue = (resourceId: number, permissionType: string) => {
    const perm = rolePermissions.find(p => p.IdRecurso === resourceId)
    if (!perm) return false
    
    if (editedPermissions[resourceId] && editedPermissions[resourceId][permissionType] !== undefined) {
      return editedPermissions[resourceId][permissionType]
    }
    
    return perm[permissionType as keyof Permission]
  }

  const savePermissions = async () => {
    if (!selectedRole) return
    
    try {
      setSaving(true)
      
      // Guardar solo los permisos editados
      for (const [resourceIdStr, perms] of Object.entries(editedPermissions)) {
        const resourceId = parseInt(resourceIdStr)
        const currentPerm = rolePermissions.find(p => p.IdRecurso === resourceId)
        
        if (currentPerm) {
          const newPerms = {
            canView: perms.CanView !== undefined ? perms.CanView : currentPerm.CanView,
            canCreate: perms.CanCreate !== undefined ? perms.CanCreate : currentPerm.CanCreate,
            canEdit: perms.CanEdit !== undefined ? perms.CanEdit : currentPerm.CanEdit,
            canDelete: perms.CanDelete !== undefined ? perms.CanDelete : currentPerm.CanDelete
          }
          
          await api.put(`/roles/${selectedRole.IdRol}/resources/${resourceId}/permissions`, newPerms)
        }
      }
      
      toast({
        title: "Éxito",
        description: "Permisos actualizados exitosamente"
      })
      
      setIsEditOpen(false)
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar permisos",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'superadmin':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100'
      case 'contributor':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#f5592b]" />
          <p className="text-lg text-gray-600">Cargando Roles y Permisos...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 bg-white">
        <SidebarTrigger className="-ml-1 text-[#150773]" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[#150773]">Roles y Permisos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50">
        <div className="space-y-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-[#150773]">Roles y Permisos</h1>
            <p className="text-gray-600 mt-2">
              Gestiona los roles del sistema y sus permisos sobre cada recurso
            </p>
          </div>

          {/* Roles Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map((role) => {
              const permCount = rolePermissions.filter(p => p.IdRol === role.IdRol).length
              return (
                <Card key={role.IdRol} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Shield className="h-5 w-5 text-[#150773]" />
                      <Badge className={getRoleBadgeColor(role.Nombre)}>
                        {role.Nombre}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{role.Nombre}</CardTitle>
                    <CardDescription className="text-sm">
                      {role.Descripcion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleEditRole(role)}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Permisos
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Resources */}
          <Card className="border-[#f5592b]/20">
            <CardHeader>
              <CardTitle className="text-[#150773]">Recursos del Sistema</CardTitle>
              <CardDescription>
                Recursos sobre los que se aplican los permisos de cada rol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resources.map((recurso) => (
                  <div key={recurso.IdRecurso} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-[#150773]">{recurso.Codigo}</p>
                      <p className="text-sm text-gray-600">{recurso.Descripcion}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {recurso.Categoria}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Info Note */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    Información sobre Roles y Permisos
                  </p>
                  <p className="text-sm text-blue-700">
                    Los roles y permisos están almacenados en las tablas <code className="bg-white px-1 py-0.5 rounded">RolesSistema</code>, 
                    <code className="bg-white px-1 py-0.5 rounded ml-1">Resources</code> y 
                    <code className="bg-white px-1 py-0.5 rounded ml-1">RoleResourcePermissions</code> de la base de datos.
                    Puedes editar los permisos de cada rol usando los botones "Editar Permisos" arriba.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Editar Permisos */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Permisos - {selectedRole?.Nombre}</DialogTitle>
            <DialogDescription>
              Activa o desactiva los permisos para cada recurso. Los cambios se guardan al hacer clic en "Guardar".
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {resources.map((resource) => {
              const perm = rolePermissions.find(p => p.IdRecurso === resource.IdRecurso)
              
              return (
                <div key={resource.IdRecurso} className="border rounded-lg p-4">
                  <div className="mb-3">
                    <p className="font-semibold text-[#150773]">{resource.Codigo}</p>
                    <p className="text-sm text-gray-600">{resource.Descripcion}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${resource.IdRecurso}-view`}
                        checked={getPermissionValue(resource.IdRecurso, 'CanView') as boolean}
                        onCheckedChange={() => togglePermission(resource.IdRecurso, 'CanView', getPermissionValue(resource.IdRecurso, 'CanView') as boolean)}
                      />
                      <Label htmlFor={`${resource.IdRecurso}-view`} className="text-sm">
                        Ver
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${resource.IdRecurso}-create`}
                        checked={getPermissionValue(resource.IdRecurso, 'CanCreate') as boolean}
                        onCheckedChange={() => togglePermission(resource.IdRecurso, 'CanCreate', getPermissionValue(resource.IdRecurso, 'CanCreate') as boolean)}
                      />
                      <Label htmlFor={`${resource.IdRecurso}-create`} className="text-sm">
                        Crear
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${resource.IdRecurso}-edit`}
                        checked={getPermissionValue(resource.IdRecurso, 'CanEdit') as boolean}
                        onCheckedChange={() => togglePermission(resource.IdRecurso, 'CanEdit', getPermissionValue(resource.IdRecurso, 'CanEdit') as boolean)}
                      />
                      <Label htmlFor={`${resource.IdRecurso}-edit`} className="text-sm">
                        Editar
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${resource.IdRecurso}-delete`}
                        checked={getPermissionValue(resource.IdRecurso, 'CanDelete') as boolean}
                        onCheckedChange={() => togglePermission(resource.IdRecurso, 'CanDelete', getPermissionValue(resource.IdRecurso, 'CanDelete') as boolean)}
                      />
                      <Label htmlFor={`${resource.IdRecurso}-delete`} className="text-sm">
                        Eliminar
                      </Label>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditOpen(false)} 
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={savePermissions} 
              disabled={saving || Object.keys(editedPermissions).length === 0}
              className="bg-[#150773] hover:bg-[#0f0559]"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!saving && <Save className="h-4 w-4 mr-2" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

