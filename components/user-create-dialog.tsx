"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { getAuthToken } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { CompanySearchSelect } from "@/components/company-search-select"

interface Company {
  id: number
  nombre: string
  rut: string
}

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    contraseña: '',
    idEmpresa: '',
    cargoEmpresa: ''
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()


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
      idEmpresa: company.id.toString(),
      nombreEmpresa: company.nombre,
      rutEmpresa: company.rut
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

      // Convertir idEmpresa a número
      const userData = {
        ...formData,
        idEmpresa: parseInt(formData.idEmpresa)
      }

      const response = await fetch('http://localhost:3001/api/usuarios', {
        method: 'POST',
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
        description: "Usuario creado correctamente",
      })

      // Resetear formulario y cerrar diálogo
      setFormData({
        nombreCompleto: '',
        email: '',
        contraseña: '',
        idEmpresa: '',
        cargoEmpresa: ''
      })
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: `Error creando usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
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
          <DialogTitle className="text-[#150773]">Crear Nuevo Usuario</DialogTitle>
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
          
          <div className="space-y-2">
            <Label htmlFor="contraseña">Contraseña</Label>
            <Input
              id="contraseña"
              type="password"
              value={formData.contraseña}
              onChange={(e) => handleChange('contraseña', e.target.value)}
              placeholder="Contraseña (mínimo 6 caracteres)"
              minLength={6}
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
                  Creando...
                </>
              ) : (
                'Crear Usuario'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
