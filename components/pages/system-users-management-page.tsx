"use client"

import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Pencil, Trash2, Key, Shield, UserCog } from "lucide-react"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface SystemUser {
  IdUsuarioSistema: number
  Email: string
  Nombre: string
  Apellido: string
  Organizacion?: string
  Telefono?: string
  RoleId: number
  RolNombre: string
  Activo: boolean
  FechaCreacion: string
}

interface Role {
  IdRol: number
  Nombre: string
  Descripcion: string
}

export function SystemUsersManagementPage() {
  const [users, setUsers] = useState<SystemUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const { toast } = useToast()

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    apellido: "",
    organizacion: "",
    telefono: "",
    roleId: ""
  })
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/usuarios-sistema'),
        api.get('/roles')
      ])
      setUsers(usersRes.data)
      setRoles(rolesRes.data)
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

  const handleCreate = () => {
    setFormData({
      email: "",
      password: "",
      nombre: "",
      apellido: "",
      organizacion: "",
      telefono: "",
      roleId: ""
    })
    setIsCreateOpen(true)
  }

  const handleEdit = (user: SystemUser) => {
    setSelectedUser(user)
    setFormData({
      email: user.Email,
      password: "",
      nombre: user.Nombre,
      apellido: user.Apellido,
      organizacion: user.Organizacion || "",
      telefono: user.Telefono || "",
      roleId: user.RoleId.toString()
    })
    setIsEditOpen(true)
  }

  const handlePasswordReset = (user: SystemUser) => {
    setSelectedUser(user)
    setNewPassword("")
    setIsPasswordOpen(true)
  }

  const handleDelete = (user: SystemUser) => {
    setSelectedUser(user)
    setIsDeleteOpen(true)
  }

  const submitCreate = async () => {
    try {
      setFormLoading(true)
      await api.post('/usuarios-sistema', formData)
      toast({
        title: "Éxito",
        description: "Usuario creado exitosamente"
      })
      setIsCreateOpen(false)
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear usuario",
        variant: "destructive"
      })
    } finally {
      setFormLoading(false)
    }
  }

  const submitEdit = async () => {
    if (!selectedUser) return
    try {
      setFormLoading(true)
      await api.put(`/usuarios-sistema/${selectedUser.IdUsuarioSistema}`, {
        email: formData.email,
        nombre: formData.nombre,
        apellido: formData.apellido,
        organizacion: formData.organizacion,
        telefono: formData.telefono,
        roleId: parseInt(formData.roleId)
      })
      toast({
        title: "Éxito",
        description: "Usuario actualizado exitosamente"
      })
      setIsEditOpen(false)
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar usuario",
        variant: "destructive"
      })
    } finally {
      setFormLoading(false)
    }
  }

  const submitPasswordReset = async () => {
    if (!selectedUser) return
    try {
      setFormLoading(true)
      await api.put(`/usuarios-sistema/${selectedUser.IdUsuarioSistema}/password`, {
        newPassword
      })
      toast({
        title: "Éxito",
        description: "Contraseña actualizada exitosamente"
      })
      setIsPasswordOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar contraseña",
        variant: "destructive"
      })
    } finally {
      setFormLoading(false)
    }
  }

  const submitDelete = async () => {
    if (!selectedUser) return
    try {
      setFormLoading(true)
      await api.delete(`/usuarios-sistema/${selectedUser.IdUsuarioSistema}`)
      toast({
        title: "Éxito",
        description: "Usuario desactivado exitosamente"
      })
      setIsDeleteOpen(false)
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al desactivar usuario",
        variant: "destructive"
      })
    } finally {
      setFormLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-PY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
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
          <p className="text-lg text-gray-600">Cargando Usuarios del Sistema...</p>
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
              <BreadcrumbPage className="text-[#150773]">Usuarios del Sistema</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50">
        <div className="space-y-6">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#150773]">Usuarios del Sistema</h1>
                <p className="text-gray-600 mt-2">
                  Gestiona los usuarios con acceso al backoffice
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#f5592b] text-white px-3 py-1">
                  <UserCog className="h-4 w-4 mr-1" />
                  {users.length} usuarios
                </Badge>
                <Button
                  onClick={handleCreate}
                  className="bg-[#150773] hover:bg-[#0f0559] text-white border-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </div>
            </div>
          </div>

          <Card className="border-[#f5592b]/20">
            <CardHeader>
              <CardTitle className="text-[#150773]">Lista de Usuarios del Sistema</CardTitle>
              <CardDescription>
                Usuarios con acceso al backoffice según su rol asignado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-gray-50">
                  <p className="text-gray-500">No hay usuarios del sistema.</p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Organización</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha Creación</TableHead>
                        <TableHead className="text-right w-32">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.IdUsuarioSistema}>
                          <TableCell className="font-medium">
                            {user.Nombre} {user.Apellido}
                          </TableCell>
                          <TableCell>{user.Email}</TableCell>
                          <TableCell>{user.Organizacion || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.RolNombre)}>
                              <Shield className="h-3 w-3 mr-1" />
                              {user.RolNombre}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.Activo ? 'default' : 'outline'}
                              className={user.Activo ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}
                            >
                              {user.Activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.FechaCreacion)}</TableCell>
                          <TableCell className="text-right w-32">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(user)}
                                title="Editar usuario"
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePasswordReset(user)}
                                title="Resetear contraseña"
                                className="h-8 w-8 p-0 text-blue-600"
                              >
                                <Key className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(user)}
                                title="Desactivar usuario"
                                className="h-8 w-8 p-0 text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Crear Usuario */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario del Sistema</DialogTitle>
            <DialogDescription>
              Ingresa los datos del nuevo usuario. La contraseña debe tener al menos 8 caracteres.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Juan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  placeholder="Pérez"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="juan@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleId">Rol *</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.IdRol} value={role.IdRol.toString()}>
                      {role.Nombre} - {role.Descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizacion">Organización</Label>
              <Input
                id="organizacion"
                value={formData.organizacion}
                onChange={(e) => setFormData({ ...formData, organizacion: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={formLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={submitCreate} 
              disabled={formLoading || !formData.email || !formData.password || !formData.nombre || !formData.apellido || !formData.roleId}
              className="bg-[#150773] hover:bg-[#0f0559]"
            >
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Usuario */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuario del Sistema</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-apellido">Apellido *</Label>
                <Input
                  id="edit-apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-roleId">Rol *</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => setFormData({ ...formData, roleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.IdRol} value={role.IdRol.toString()}>
                      {role.Nombre} - {role.Descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-organizacion">Organización</Label>
              <Input
                id="edit-organizacion"
                value={formData.organizacion}
                onChange={(e) => setFormData({ ...formData, organizacion: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <Input
                id="edit-telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={formLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={submitEdit} 
              disabled={formLoading || !formData.email || !formData.nombre || !formData.apellido || !formData.roleId}
              className="bg-[#150773] hover:bg-[#0f0559]"
            >
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Resetear Contraseña */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetear Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa una nueva contraseña para {selectedUser?.Nombre} {selectedUser?.Apellido}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordOpen(false)} disabled={formLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={submitPasswordReset} 
              disabled={formLoading || newPassword.length < 8}
              className="bg-[#150773] hover:bg-[#0f0559]"
            >
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resetear Contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Eliminar (Desactivar) Usuario */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas desactivar al usuario {selectedUser?.Nombre} {selectedUser?.Apellido}?
              El usuario no podrá acceder al sistema pero sus datos se conservarán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={formLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={submitDelete} 
              disabled={formLoading}
              variant="destructive"
            >
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Desactivar Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

