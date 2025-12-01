"use client"

import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination"
import { Loader2, Search, Plus, Pencil, Trash2, Key, Users, Mail } from "lucide-react"
import { getAuthToken } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { CreateUserDialog } from "@/components/user-create-dialog"
import { EditUserDialog } from "@/components/user-edit-dialog"
import { DeleteUserDialog } from "@/components/user-delete-dialog"
import { PasswordDialog } from "@/components/user-password-dialog"
import { UserEmailDialog } from "@/components/user-email-dialog"

interface User {
  IdUsuario: number
  NombreCompleto: string
  Email: string
  EmpresaNombre: string
  FechaRegistro: string
  IsConnected: string
  UltimaActividad: string
}

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const { toast } = useToast()


  // Cargar usuarios
  const loadUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setError("No se pudo obtener el token de autenticación")
        return
      }

      const response = await fetch(
        `http://localhost:3001/api/usuarios?page=${page}&limit=10${debouncedSearchTerm ? `&searchTerm=${encodeURIComponent(debouncedSearchTerm)}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setUsers(data.data)
      setTotalPages(data.pagination.totalPages)
      setTotalUsers(data.pagination.total)
    } catch (error) {
      setError(`Error cargando usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Debounce search term
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true)
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setIsSearching(false)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [searchTerm, debouncedSearchTerm])

  // Cargar usuarios cuando cambia la página o el término de búsqueda con debounce
  useEffect(() => {
    loadUsers()
  }, [page, debouncedSearchTerm])

  // Manejar cambio de página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
    }
  }

  // Manejar búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Resetear a la primera página
    setDebouncedSearchTerm(searchTerm) // Aplicar búsqueda inmediatamente
  }

  // Manejar creación de usuario
  const handleCreateUser = () => {
    setIsCreateDialogOpen(true)
  }

  // Manejar edición de usuario
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsEditDialogOpen(true)
  }

  // Manejar eliminación de usuario
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setIsDeleteDialogOpen(true)
  }

  // Manejar cambio de contraseña
  const handlePasswordChange = (user: User) => {
    setSelectedUser(user)
    setIsPasswordDialogOpen(true)
  }

  // Manejar cambio de email
  const handleEmailChange = (user: User) => {
    setSelectedUser(user)
    setIsEmailDialogOpen(true)
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-PY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Renderizar páginas de paginación
  const renderPaginationItems = () => {
    const items = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={page === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }
    } else {
      // Mostrar primera página
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={page === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      )

      // Mostrar elipsis si la página actual está lejos del inicio
      if (page > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }

      // Mostrar páginas alrededor de la página actual
      const startPage = Math.max(2, page - 1)
      const endPage = Math.min(totalPages - 1, page + 1)

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={page === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }

      // Mostrar elipsis si la página actual está lejos del final
      if (page < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }

      // Mostrar última página
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#f5592b]" />
          <p className="text-lg text-gray-600">Cargando Usuarios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-red-100 border border-red-300 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reintentar
          </button>
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
              <BreadcrumbPage className="text-[#150773]">Usuarios</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50">
        <div className="space-y-6">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#150773]">Gestión de Usuarios</h1>
                <p className="text-gray-600 mt-2">
                  Administra los usuarios de la plataforma
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#f5592b] text-white px-3 py-1">
                  <Users className="h-4 w-4 mr-1" />
                  {totalUsers} usuarios
                </Badge>
                <Button
                  onClick={handleCreateUser}
                  className="bg-[#150773] hover:bg-[#0f0559] text-white border-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <Card className="border-[#f5592b]/20">
            <CardHeader>
              <CardTitle className="text-[#150773] flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Buscar por nombre, email o empresa..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-[#f5592b]" />
                  )}
                </div>
                <Button type="submit" variant="outline">
                  Buscar
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="border-[#f5592b]/20">
            <CardHeader>
              <CardTitle className="text-[#150773]">Lista de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-gray-50">
                  <p className="text-gray-500">No se encontraron usuarios.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Fecha Registro</TableHead>
                          <TableHead>Conectado</TableHead>
                          <TableHead className="w-24">Última vez</TableHead>
                          <TableHead className="text-right w-40">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.IdUsuario}>
                            <TableCell className="font-medium">{user.NombreCompleto}</TableCell>
                            <TableCell>{user.Email}</TableCell>
                            <TableCell>{user.EmpresaNombre || 'N/A'}</TableCell>
                            <TableCell>{formatDate(user.FechaRegistro)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={user.IsConnected === 'Si' ? 'default' : 'outline'}
                                className={user.IsConnected === 'Si' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                              >
                                {user.IsConnected === 'Si' ? 'Sí' : 'No'}
                              </Badge>
                            </TableCell>
                            <TableCell className="w-24 text-xs">{formatDate(user.UltimaActividad)}</TableCell>
                            <TableCell className="text-right w-40">
                              <div className="flex items-center justify-end gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                  title="Editar usuario"
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEmailChange(user)}
                                  title="Actualizar email"
                                  className="h-8 w-8 p-0 text-green-600"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePasswordChange(user)}
                                  title="Cambiar contraseña"
                                  className="h-8 w-8 p-0 text-blue-600"
                                >
                                  <Key className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user)}
                                  title="Eliminar usuario"
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

                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Mostrando {users.length} de {totalUsers} usuarios
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(page - 1)}
                            className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                        
                        {renderPaginationItems()}
                        
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(page + 1)}
                            className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogos para CRUD de usuarios */}
      <CreateUserDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
        onSuccess={loadUsers} 
      />
      
      {selectedUser && (
        <>
          <EditUserDialog 
            open={isEditDialogOpen} 
            onOpenChange={setIsEditDialogOpen} 
            user={selectedUser} 
            onSuccess={loadUsers} 
          />
          
          <DeleteUserDialog 
            open={isDeleteDialogOpen} 
            onOpenChange={setIsDeleteDialogOpen} 
            user={selectedUser} 
            onSuccess={loadUsers} 
          />
          
          <PasswordDialog 
            open={isPasswordDialogOpen} 
            onOpenChange={setIsPasswordDialogOpen} 
            user={selectedUser} 
            onSuccess={() => {
              toast({
                title: "Éxito",
                description: "Contraseña actualizada correctamente",
              })
            }} 
          />
          
          <UserEmailDialog 
            open={isEmailDialogOpen} 
            onOpenChange={setIsEmailDialogOpen} 
            user={selectedUser} 
            onSuccess={() => {
              toast({
                title: "Éxito",
                description: "Email actualizado correctamente",
              })
              loadUsers()
            }} 
          />
        </>
      )}
    </>
  )
}
