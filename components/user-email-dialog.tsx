"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAuthToken } from "@/lib/api-client"

interface User {
  IdUsuario: number
  NombreCompleto: string
  Email: string
  EmpresaNombre: string
  FechaRegistro: string
  IsConnected: string
  UltimaActividad: string
}

interface UserEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onSuccess: () => void
}

export function UserEmailDialog({ open, onOpenChange, user, onSuccess }: UserEmailDialogProps) {
  const [email, setEmail] = useState("")
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open && user) {
      setEmail(user.Email || "")
    } else {
      setEmail("")
    }
  }, [open, user])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    // Validar email
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "El email es requerido",
        variant: "destructive"
      })
      return
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      })
      return
    }
    
    setUpdating(true)
    
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
      
      const response = await fetch(`http://localhost:3001/api/usuarios/${user.IdUsuario}/email`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
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
        description: "Email actualizado correctamente",
      })
      
      onSuccess()
      onOpenChange(false)
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Error actualizando email: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#150773] flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Actualizar Email
          </DialogTitle>
          <DialogDescription>
            Actualiza el email del usuario <strong>{user.NombreCompleto}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updating}
              className="bg-[#150773] hover:bg-[#0f0559]"
            >
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
