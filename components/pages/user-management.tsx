"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Plus, Pencil, Trash2, Key } from "lucide-react"
import { getAuthToken } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { CreateUserDialog } from "@/components/user-create-dialog"
import { EditUserDialog } from "@/components/user-edit-dialog"
import { DeleteUserDialog } from "@/components/user-delete-dialog"
import { PasswordDialog } from "@/components/user-password-dialog"

interface User {
  IdUsuario: number
  NombreCompleto: string
  Email: string
  EmpresaNombre: string
  FechaRegistro: string
  IsConnected: string
  UltimaActividad: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
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
        `http://localhost:3001/api/usuarios?page=${page}&limit=10${searchTerm ? `&searchTerm=${encodeURIComponent(searchTerm)}` : ''}`,
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

  // Cargar usuarios cuando cambia la página o el término de búsqueda
  useEffect(() => {
    loadUsers()
  }, [page, searchTerm])

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
    loadUsers()
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Gestión de Usuarios</CardTitle>
            <CardDescription>
              Administra los usuarios de la plataforma
            </CardDescription>
          </div>
          <Button onClick={handleCreateUser} className="bg-[#150773] hover:bg-[#0e0550]">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
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
              </div>
              <Button type="submit" variant="outline">
                Buscar
              </Button>
            </form>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-[#f5592b]" />
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800">
              <p>{error}</p>
            </div>
          ) : users.length === 0 ? (
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
                      <TableHead>Última Actividad</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
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
                        <TableCell>{formatDate(user.UltimaActividad)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                            title="Editar usuario"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePasswordChange(user)}
                            title="Cambiar contraseña"
                            className="text-blue-600"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user)}
                            title="Eliminar usuario"
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
        </>
      )}
    </div>
  )
}
