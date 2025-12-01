"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle } from "lucide-react"
import { getAuthToken } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface User {
  IdUsuario: number
  NombreCompleto: string
  Email: string
}

interface DeleteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
  onSuccess: () => void
}

export function DeleteUserDialog({ open, onOpenChange, user, onSuccess }: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [deleteType, setDeleteType] = useState<'partial' | 'complete'>('partial')
  const { toast } = useToast()


  // Manejar eliminación de usuario
  const handleDelete = async () => {
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

      const response = await fetch(`http://localhost:3001/api/usuarios/${user.IdUsuario}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteType })
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
        description: `Usuario eliminado correctamente (${deleteType === 'partial' ? 'borrado parcial' : 'borrado completo'})`,
      })

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: `Error eliminando usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
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
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Usuario
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Por favor seleccione el tipo de eliminación.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="border-t border-b py-4">
            <p className="font-medium mb-2">Usuario a eliminar:</p>
            <p><span className="font-semibold">{user.NombreCompleto}</span> ({user.Email})</p>
          </div>
          
          <RadioGroup value={deleteType} onValueChange={(value: 'partial' | 'complete') => setDeleteType(value)}>
            <div className="flex items-start space-x-2 mb-4">
              <RadioGroupItem value="partial" id="partial" />
              <div className="grid gap-1.5">
                <Label htmlFor="partial" className="font-medium">Borrado Parcial</Label>
                <p className="text-sm text-muted-foreground">
                  Elimina el usuario y todos sus chequeos asociados, pero mantiene las empresas intactas.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="complete" id="complete" />
              <div className="grid gap-1.5">
                <Label htmlFor="complete" className="font-medium">Borrado Completo</Label>
                <p className="text-sm text-muted-foreground">
                  Elimina el usuario, todos sus chequeos y las empresas asociadas a este usuario.
                </p>
              </div>
            </div>
          </RadioGroup>
          
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
            <p className="font-semibold">Advertencia:</p>
            <p>El borrado completo eliminará permanentemente todas las empresas asociadas a este usuario y todos sus datos relacionados.</p>
          </div>
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
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar Usuario'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
