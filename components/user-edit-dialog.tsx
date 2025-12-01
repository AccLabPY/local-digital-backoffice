"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { getAuthToken } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { CompanySearchSelect } from "@/components/company-search-select"

interface User {
  IdUsuario: number
  NombreCompleto: string
  Email: string
  IdEmpresa?: number
  EmpresaNombre?: string
  CargoEmpresa?: string
  IsConnected?: string
}

interface Company {
  id: number
  nombre: string
  rut: string
}

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onSuccess: () => void
}

export function EditUserDialog({ open, onOpenChange, user, onSuccess }: EditUserDialogProps) {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    idEmpresa: '',
    cargoEmpresa: '',
    isConnected: ''
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Inicializar formulario con datos del usuario
  useEffect(() => {
    if (user && open) {
      setFormData({
        nombreCompleto: user.NombreCompleto || '',
        email: user.Email || '',
        idEmpresa: user.IdEmpresa?.toString() || '',
        cargoEmpresa: user.CargoEmpresa || '',
        isConnected: user.IsConnected || 'No'
      })
    }
  }, [user, open])


  // Manejar cambios en el formulario
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Manejar selección de empresa
  const handleCompanySelect = (company: Company) => {
    setFormData(prev => ({
      ...prev,
      idEmpresa: company.id.toString()
    }))
  }

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = getAuthToken()
      if (!token) {
        toast({
          title: "Error",
          description: "No se pudo obtener el token de autenticación",
          variant: "destructive"
        })
        return
      }

      // Convertir idEmpresa a número si existe
      const userData: any = { ...formData }
      if (userData.idEmpresa) {
        userData.idEmpresa = parseInt(userData.idEmpresa)
      }

      const response = await fetch(`http://localhost:3001/api/usuarios/${user.IdUsuario}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData && errorData.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          // Ignorar errores al parsear respuesta
        }
        throw new Error(errorMessage)
      }

      toast({
        title: "Éxito",
        description: "Usuario actualizado correctamente",
      })

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: `Error actualizando usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#150773]">Editar Usuario</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombreCompleto">Nombre Completo</Label>
            <Input
              id="nombreCompleto"
              value={formData.nombreCompleto}
              onChange={(e) => handleChange('nombreCompleto', e.target.value)}
              placeholder="Ingrese nombre completo"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="ejemplo@correo.com"
              required
            />
          </div>
          
          <CompanySearchSelect
            id="idEmpresa"
            value={formData.idEmpresa}
            onValueChange={(value) => handleChange('idEmpresa', value)}
            onCompanySelect={handleCompanySelect}
            placeholder="Seleccionar empresa"
            required
          />
          
          <div className="space-y-2">
            <Label htmlFor="cargoEmpresa">Cargo en la Empresa</Label>
            <Input
              id="cargoEmpresa"
              value={formData.cargoEmpresa}
              onChange={(e) => handleChange('cargoEmpresa', e.target.value)}
              placeholder="Ej: Gerente, Analista, etc."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="isConnected">Estado de Conexión</Label>
            <Select
              value={formData.isConnected}
              onValueChange={(value) => handleChange('isConnected', value)}
              required
            >
              <SelectTrigger id="isConnected">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Si">Conectado</SelectItem>
                <SelectItem value="No">Desconectado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#150773] hover:bg-[#0e0550]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
