"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Key } from "lucide-react"
import { getAuthToken } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface User {
  IdUsuario: number
  NombreCompleto: string
  Email: string
}

interface PasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onSuccess: () => void
}

export function PasswordDialog({ open, onOpenChange, user, onSuccess }: PasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const { toast } = useToast()


  // Validar contraseña
  const validatePassword = () => {
    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden')
      return false
    }
    
    setPasswordError(null)
    return true
  }

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePassword()) {
      return
    }
    
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

      const response = await fetch(`http://localhost:3001/api/usuarios/${user.IdUsuario}/password`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword })
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
        description: "Contraseña actualizada correctamente",
      })

      // Resetear formulario y cerrar diálogo
      setNewPassword('')
      setConfirmPassword('')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: `Error actualizando contraseña: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Resetear estado al cerrar diálogo
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNewPassword('')
      setConfirmPassword('')
      setPasswordError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#150773] flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cambiar Contraseña
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-t border-b py-4">
            <p className="font-medium mb-2">Usuario:</p>
            <p><span className="font-semibold">{user.NombreCompleto}</span> ({user.Email})</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita la contraseña"
              required
            />
          </div>
          
          {passwordError && (
            <div className="text-red-500 text-sm">{passwordError}</div>
          )}
          
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
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Actualizar Contraseña'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
