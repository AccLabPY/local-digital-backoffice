"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { ClientOnly } from "./client-only"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Building2, MapPin, Users, TrendingUp, Mail, Crown, Calendar, Loader2, Pencil, UserCog, Link2Off, Trash2, Search, FileDown } from "lucide-react"
import { SurveyHistory } from "@/components/survey-history"
import { BusinessCharts } from "@/components/business-charts"
import { getAuthToken } from "@/lib/api-client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface BusinessDetailProps {
  empresaId: string
  onBack: () => void
}

interface Business {
  empresa: string;
  ruc: string;
  distrito: string;
  departamento: string;
  ubicacion: string;
  sectorActividadDescripcion: string;
  subSectorActividadDescripcion: string;
  anioCreacion: number;
  TotalEmpleados: number;
  ventasAnuales: string;
  nombreEncuestado: string;
  emailEncuestado: string;
  SexoGerenteGeneral: string;
  SexoPropietarioPrincipal: string;
  FechaTest: string;
  nivelMadurez: string;
  puntajeGeneral: number;
  puntajeTecnologia: number;
  puntajeComunicacion: number;
  puntajeOrganizacion: number;
  puntajeDatos: number;
  puntajeEstrategia: number;
  puntajeProcesos: number;
  IdUsuario?: number;
}

interface EditFormData {
  empresa?: string;
  ruc?: string;
  idDepartamento?: number;
  idLocalidad?: number;
  idSectorActividad?: number;
  idSubSectorActividad?: number;
  idVentas?: number;
  totalEmpleados?: number;
  anioCreacion?: number;
  sexoGerenteGeneral?: string;
  sexoPropietarioPrincipal?: string;
  idUsuario?: number | string;
}

interface SelectOption {
  value: string | number;
  label: string;
  email?: string;
  empresa?: string;
}

export function BusinessDetail({ empresaId, onBack }: BusinessDetailProps) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUserManagementDialogOpen, setIsUserManagementDialogOpen] = useState(false)
  const [isAssignUserDialogOpen, setIsAssignUserDialogOpen] = useState(false)
  const [formData, setFormData] = useState<EditFormData>({})
  const [updating, setUpdating] = useState(false)
  const [departamentos, setDepartamentos] = useState<SelectOption[]>([])
  const [distritos, setDistritos] = useState<SelectOption[]>([])
  const [sectores, setSectores] = useState<SelectOption[]>([])
  const [subSectores, setSubSectores] = useState<SelectOption[]>([])
  const [ventasOptions, setVentasOptions] = useState<SelectOption[]>([])
  const [usuarios, setUsuarios] = useState<SelectOption[]>([])
  const [companyUsers, setCompanyUsers] = useState<any[]>([])
  const [loadingCompanyUsers, setLoadingCompanyUsers] = useState(false)
  const [openUsuario, setOpenUsuario] = useState(false)
  const [usuarioSearch, setUsuarioSearch] = useState('')
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)
  const [isUnassignConfirmOpen, setIsUnassignConfirmOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedUserForAction, setSelectedUserForAction] = useState<any>(null)
  const [exportingPDF, setExportingPDF] = useState(false)
  const { toast } = useToast()


  // Cargar datos de la empresa
  useEffect(() => {
    const loadBusinessData = async () => {
      setLoading(true)
      try {
        const token = getAuthToken()
        if (!token) {
          setError("No se pudo obtener el token de autenticación")
          return
        }

        // Obtener idTestUsuario de la URL si existe
        const urlParams = new URLSearchParams(window.location.search)
        const idTestUsuario = urlParams.get('idTestUsuario')
        
        // Construir URL con o sin idTestUsuario
        const url = idTestUsuario 
          ? `http://localhost:3001/api/empresas/${empresaId}?idTestUsuario=${idTestUsuario}`
          : `http://localhost:3001/api/empresas/${empresaId}`

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          let errorMessage = `Error ${response.status}: ${response.statusText}`
          try {
            const errorText = await response.text()
            if (errorText) {
              errorMessage += ` - ${errorText}`
            }
          } catch (e) {
            // Ignorar errores al leer el texto de respuesta
          }
          throw new Error(errorMessage)
        }
        
        const data = await response.json()
        setBusiness(data)

      } catch (error) {
        setError(`Error cargando datos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      } finally {
        setLoading(false)
      }
    }

    if (empresaId) {
      loadBusinessData()
    }
  }, [empresaId])
  
  // Cargar opciones para formulario de edición
  const loadFormOptions = async () => {
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
      
      const response = await fetch(`http://localhost:3001/api/empresas/filters/options`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Error cargando opciones: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Convertir arrays a formato de opciones de select
      setDepartamentos(data.departamentos.map((dep: string) => ({ value: dep, label: dep })))
      setDistritos(data.distritos.map((dist: string) => ({ value: dist, label: dist })))
      setSectores(data.sectoresActividad.map((sec: string) => ({ value: sec, label: sec })))
      
      // Cargar subsectores basados en sectores
      if (data.subSectoresPorSector) {
        const allSubSectores: string[] = []
        Object.values(data.subSectoresPorSector).forEach((subsectores: any) => {
          if (Array.isArray(subsectores)) {
            allSubSectores.push(...subsectores)
          }
        })
        setSubSectores(allSubSectores.map((sub: string) => ({ value: sub, label: sub })))
      }
      
      // También necesitamos cargar las opciones de ventas anuales
      const ventasResponse = await fetch(`http://localhost:3001/api/catalogos/ventas-anuales`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => null)
      
      if (ventasResponse && ventasResponse.ok) {
        const ventasData = await ventasResponse.json()
        setVentasOptions(ventasData.map((v: {id: number, nombre: string}) => ({ value: v.id, label: v.nombre })))
      }
      
      // Los usuarios se cargan dinámicamente cuando se busca
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Error cargando opciones: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      })
    }
  }
  
  // Efecto para inicializar el formulario cuando se cargan las opciones
  useEffect(() => {
    if (isEditDialogOpen && business && 
        departamentos.length > 0 && distritos.length > 0 && sectores.length > 0 && 
        ventasOptions.length > 0) {
      
      // Buscar los valores actuales en las opciones disponibles
      const currentDepartamento = departamentos.find(d => d.label === business.departamento)
      const currentDistrito = distritos.find(d => d.label === business.distrito)
      const currentSector = sectores.find(s => s.label === business.sectorActividadDescripcion)
      const currentSubSector = subSectores.find(s => s.label === business.subSectorActividadDescripcion)
      const currentVentas = ventasOptions.find(v => v.label === business.ventasAnuales)
      
      // Inicializar formulario con datos actuales
      const formDataToSet = {
        empresa: business.empresa,
        ruc: business.ruc,
        totalEmpleados: business.TotalEmpleados,
        anioCreacion: business.anioCreacion,
        sexoGerenteGeneral: business.SexoGerenteGeneral,
        sexoPropietarioPrincipal: business.SexoPropietarioPrincipal,
        // Mapear nombres a IDs para los campos de select
        idDepartamento: currentDepartamento?.value as number,
        idLocalidad: currentDistrito?.value as number,
        idSectorActividad: currentSector?.value as number,
        idSubSectorActividad: currentSubSector?.value as number,
        idVentas: currentVentas?.value as number
      }
      
      setFormData(formDataToSet)
    }
  }, [isEditDialogOpen, business, departamentos, distritos, sectores, subSectores, ventasOptions])

  // Manejar apertura del diálogo de edición
  const handleEditClick = async () => {
    if (business) {
      // Cargar opciones de formulario primero
      await loadFormOptions()
      
      // Abrir diálogo
      setIsEditDialogOpen(true)
    }
  }
  
  // Buscar usuarios dinámicamente
  const searchUsuarios = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      // Si no hay término de búsqueda, mostrar solo el usuario actual si existe
      if (business?.emailEncuestado) {
        // Crear un usuario ficticio para el usuario actual
        const currentUser = {
          value: 'current_user' as string | number, // Usar un ID especial para el usuario actual
          label: business.nombreEncuestado || '',
          email: business.emailEncuestado || '',
          empresa: 'Usuario actual'
        }
        setUsuarios([currentUser])
      } else {
        setUsuarios([])
      }
      return
    }
    
    setLoadingUsuarios(true)
    try {
      const token = getAuthToken()
      if (!token) return
      
      const response = await fetch(`http://localhost:3001/api/catalogos/usuarios?search=${encodeURIComponent(searchTerm)}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const usuariosData = await response.json()
        const usuariosFromAPI = usuariosData.map((u: {id: number, nombre: string, email: string, empresa: string}) => ({ 
          value: u.id, 
          label: u.nombre,
          email: u.email,
          empresa: u.empresa || ''
        }))
        
        // Agregar el usuario actual si existe y no está ya en la lista
        if (business?.emailEncuestado) {
          const currentUserExists = usuariosFromAPI.some((u: any) => u.email === business.emailEncuestado)
          if (!currentUserExists) {
            const currentUser = {
              value: 'current_user' as string | number,
              label: business.nombreEncuestado || '',
              email: business.emailEncuestado || '',
              empresa: 'Usuario actual'
            }
            usuariosFromAPI.unshift(currentUser)
          }
        }
        
        setUsuarios(usuariosFromAPI)
      }
    } catch (error) {
      console.error('Error searching usuarios:', error)
    } finally {
      setLoadingUsuarios(false)
    }
  }

  // Función para pre-cargar el usuario actual
  const preloadCurrentUser = async () => {
    if (business?.emailEncuestado) {
      const currentUser = {
        value: 'current_user' as string | number,
        label: `${business.nombreEncuestado} (${business.emailEncuestado}) - Usuario actual`
      }
      setUsuarios([currentUser])
      // Pre-seleccionar el usuario actual
      setFormData(prev => ({
        ...prev,
        idUsuario: 'current_user' as number | string
      }))
    }
  }
  
  // Cargar usuarios asignados a la empresa
  const loadCompanyUsers = async () => {
    if (!empresaId) return;
    
    setLoadingCompanyUsers(true);
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: "Error",
          description: "No se pudo obtener el token de autenticación",
          variant: "destructive"
        });
        return;
      }
      
      // CASO ESPECIAL: Para empresas "NO TENGO", agregar IdUsuario al query
      const esNoTengo = business?.empresa?.toLowerCase().includes('no tengo');
      let url = `http://localhost:3001/api/empresas/${empresaId}/usuarios`;
      
      if (esNoTengo && business?.IdUsuario) {
        url += `?idUsuario=${business.IdUsuario}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCompanyUsers(data.usuarios || []);
    } catch (error) {
      console.error('Error loading company users:', error);
      toast({
        title: "Error",
        description: `Error cargando usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setLoadingCompanyUsers(false);
    }
  }
  
  // Manejar apertura del diálogo de gestión de usuarios
  const handleUserManagementClick = async () => {
    await loadCompanyUsers();
    setIsUserManagementDialogOpen(true);
  }
  
  // Asignar un usuario existente a la empresa
  const handleAssignUser = async (userId: number | string) => {
    if (!empresaId) return;
    
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: "Error",
          description: "No se pudo obtener el token de autenticación",
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/empresas/${empresaId}/usuarios`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idUsuario: userId }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Recargar la lista de usuarios
      await loadCompanyUsers();
      
      toast({
        title: "Éxito",
        description: "Usuario asignado correctamente",
      });
    } catch (error) {
      console.error('Error assigning user:', error);
      toast({
        title: "Error",
        description: `Error asignando usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      });
    }
  }
  
  // Manejar desasignación de usuario
  const handleUnassignUser = (user: any) => {
    setSelectedUserForAction(user);
    setIsUnassignConfirmOpen(true);
  }

  // Manejar eliminación de usuario
  const handleDeleteUser = (user: any) => {
    setSelectedUserForAction(user);
    setIsDeleteConfirmOpen(true);
  }

  // Confirmar desasignación
  const confirmUnassignUser = async () => {
    if (!empresaId || !selectedUserForAction) return;
    
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: "Error",
          description: "No se pudo obtener el token de autenticación",
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/empresas/${empresaId}/usuarios/${selectedUserForAction.IdUsuario}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Recargar la lista de usuarios
      await loadCompanyUsers();
      
      toast({
        title: "Éxito",
        description: "Usuario desasignado correctamente",
      });
    } catch (error) {
      console.error('Error removing user assignment:', error);
      toast({
        title: "Error",
        description: `Error desasignando usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setIsUnassignConfirmOpen(false);
      setSelectedUserForAction(null);
    }
  }

  // Confirmar eliminación de usuario
  const confirmDeleteUser = async () => {
    if (!selectedUserForAction) return;
    
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: "Error",
          description: "No se pudo obtener el token de autenticación",
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch(`http://localhost:3001/api/usuarios/${selectedUserForAction.IdUsuario}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteType: 'partial' })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Recargar la lista de usuarios
      await loadCompanyUsers();
      
      toast({
        title: "Éxito",
        description: "Usuario eliminado correctamente",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: `Error eliminando usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      });
    } finally {
      setIsDeleteConfirmOpen(false);
      setSelectedUserForAction(null);
    }
  }

  // Actualizar campo de formulario
  const handleFormChange = (field: keyof EditFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  // Enviar formulario de actualización
  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar datos
    if (Object.keys(formData).length === 0) {
      toast({
        title: "Error",
        description: "No hay datos para actualizar",
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
      
      const response = await fetch(`http://localhost:3001/api/empresas/${empresaId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
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
      
      const result = await response.json()
      
      // Actualizar datos de empresa en el estado
      setBusiness(result.empresa)
      
      toast({
        title: "Éxito",
        description: "Empresa actualizada correctamente",
      })
      
      // Cerrar diálogo
      setIsEditDialogOpen(false)
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Error actualizando empresa: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  // Función para exportar ficha completa en PDF
  const handleExportPDF = async () => {
    setExportingPDF(true)
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

      // Obtener idTestUsuario de la URL si existe
      const urlParams = new URLSearchParams(window.location.search)
      const idTestUsuario = urlParams.get('idTestUsuario')
      
      // Construir URL con o sin idTestUsuario
      const url = idTestUsuario 
        ? `http://localhost:3001/api/empresas/${empresaId}/export-ficha?idTestUsuario=${idTestUsuario}`
        : `http://localhost:3001/api/empresas/${empresaId}/export-ficha`

      console.log(`[EXPORT] Iniciando exportación de ficha - URL: ${url}`)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorResponse = response.clone()
        let errorMessage = `Error ${response.status}: ${response.statusText}`
        try {
          const errorData = await errorResponse.json()
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          try {
            const text = await errorResponse.text()
            if (text) {
              errorMessage = text
            }
          } catch (e2) {
            console.error(`[EXPORT] No se pudo leer el error:`, e2)
          }
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      
      if (blob.size === 0) {
        throw new Error('El archivo generado está vacío')
      }

      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `ficha-empresa-${empresaId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast({
        title: "Éxito",
        description: "Ficha de empresa descargada correctamente",
      })

    } catch (error) {
      console.error('[EXPORT] Error exporting ficha:', error)
      toast({
        title: "Error",
        description: `Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      })
    } finally {
      setExportingPDF(false)
    }
  }

  const dimensiones = [
    { nombre: "Tecnología", puntaje: business?.puntajeTecnologia || 0, color: "#f5592b" },
    { nombre: "Comunicación", puntaje: business?.puntajeComunicacion || 0, color: "#150773" },
    { nombre: "Organización", puntaje: business?.puntajeOrganizacion || 0, color: "#f5592b" },
    { nombre: "Datos", puntaje: business?.puntajeDatos || 0, color: "#150773" },
    { nombre: "Estrategia", puntaje: business?.puntajeEstrategia || 0, color: "#f5592b" },
    { nombre: "Procesos", puntaje: business?.puntajeProcesos || 0, color: "#150773" },
  ]

  const getNivelColor = (nivel: string) => {
    if (!nivel) return "bg-gray-100 text-gray-800 border-gray-200"
    switch (nivel.toLowerCase()) {
      case "básico":
      case "novato":
        return "bg-red-100 text-red-800 border-red-200"
      case "intermedio":
      case "competente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "avanzado":
        return "bg-green-100 text-green-800 border-green-200"
      case "experto":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "inicial":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getMaturityLevel = (puntaje: number) => {
    if (!puntaje) return "Sin evaluar"
    if (puntaje < 30) return "Inicial"
    if (puntaje < 60) return "Novato"
    if (puntaje < 80) return "Competente"
    return "Avanzado"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Cargando datos de la empresa...</p>
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
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Empresas
          </Button>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Empresa no encontrada</h2>
          <p className="text-yellow-700">No se encontraron datos para la empresa con ID: {empresaId}.</p>
          <Button onClick={onBack} className="mt-4 bg-[#f5592b] hover:bg-[#e04a1f] text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Empresas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ClientOnly fallback={
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#f5592b]" />
          <p className="text-lg text-gray-600">Inicializando...</p>
        </div>
      </div>
    }>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-[#f5592b] text-[#f5592b] hover:bg-[#f5592b] hover:text-white bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la Lista
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#150773]">{business.empresa}</h1>
            <p className="text-gray-600">Detalle completo de la evaluación de innovación</p>
          </div>
          </div>
          <Button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="bg-[#150773] hover:bg-[#0d0552] text-white"
          >
            {exportingPDF ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar Ficha PDF
              </>
            )}
          </Button>
        </div>

        {/* Información General */}
        <Card className="border-[#f5592b]/20">
          <CardHeader>
            <CardTitle className="text-[#150773] flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información General
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleEditClick}
                      className="ml-2 text-gray-500 hover:text-[#f5592b] rounded-full h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Editar información general</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleUserManagementClick}
                      className="text-gray-500 hover:text-[#150773] rounded-full h-8 w-8"
                    >
                      <UserCog className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Gestionar usuarios asignados</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Empresa</label>
                  <p className="text-lg font-semibold text-[#150773]">{business.empresa}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Sector</label>
                  <p className="text-gray-900">{business.sectorActividadDescripcion || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Subsector</label>
                  <p className="text-gray-900">{business.subSectorActividadDescripcion || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Ubicación</label>
                  <div className="flex items-center gap-1 text-gray-900">
                    <MapPin className="h-4 w-4" />
                    {business.ubicacion || 'S/D'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Año de Creación</label>
                  <p className="text-gray-900">{business.anioCreacion || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total de Empleados</label>
                  <div className="flex items-center gap-1 text-gray-900">
                    <Users className="h-4 w-4" />
                    {business.TotalEmpleados || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Estado</label>
                  <Badge className="bg-green-100 text-green-800">
                    Activo
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Ventas Anuales</label>
                  <p className="text-gray-900">{business.ventasAnuales || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">RUC</label>
                  <p className="text-gray-900">{business.ruc || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Nombre del Encuestado</label>
                  <p className="text-gray-900">{business.nombreEncuestado || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Correo Electrónico</label>
                  <p className="text-gray-900">{business.emailEncuestado || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liderazgo y Fechas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-[#f5592b]/20">
            <CardHeader>
              <CardTitle className="text-[#150773] flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Liderazgo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-600">Gerente General</label>
                  <p className="text-lg font-semibold text-[#150773]">{business.SexoGerenteGeneral || 'N/A'}</p>
                </div>
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-600">Propietario Principal</label>
                  <p className="text-lg font-semibold text-[#150773]">{business.SexoPropietarioPrincipal || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#150773]/20">
            <CardHeader>
              <CardTitle className="text-[#150773] flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fechas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-600">Última Evaluación</label>
                  <p className="text-lg font-semibold text-[#150773]">
                    {business.FechaTest ? new Date(business.FechaTest).toLocaleDateString("es-PY") : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Evolución */}
        <BusinessCharts businessId={parseInt(empresaId)} business={business} />

        {/* Resultados de Innovación */}
        <Card className="border-[#150773]/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#150773] flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resultados de Evaluación Actual
              </CardTitle>
              <Badge className={`${getNivelColor(business.nivelMadurez || getMaturityLevel(business.puntajeGeneral))} border text-lg px-4 py-2`}>
                {business.nivelMadurez || getMaturityLevel(business.puntajeGeneral)} - {business.puntajeGeneral ? business.puntajeGeneral.toFixed(1) : '0'}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dimensiones.map((dimension, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{dimension.nombre}</span>
                    <span className="font-bold" style={{ color: dimension.color }}>
                      {dimension.puntaje.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(dimension.puntaje, 100)}
                    className="h-3"
                    style={
                      {
                        "--progress-background": dimension.color,
                      } as React.CSSProperties
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Historial de Encuestas */}
        <Tabs defaultValue="historial" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="historial" className="data-[state=active]:bg-[#f5592b] data-[state=active]:text-white">
              Historial de Encuestas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="historial" className="mt-6">
            <SurveyHistory businessId={parseInt(empresaId)} />
          </TabsContent>
        </Tabs>
        {/* Edit Company Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#150773]">Editar Información de la Empresa</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmitUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre de la empresa */}
                <div className="space-y-2">
                  <Label htmlFor="empresa">Nombre de la Empresa</Label>
                  <Input 
                    id="empresa" 
                    value={formData.empresa || ''}
                    onChange={(e) => handleFormChange('empresa', e.target.value)}
                    placeholder="Nombre de la empresa"
                  />
                </div>
                
                {/* RUC */}
                <div className="space-y-2">
                  <Label htmlFor="ruc">RUC</Label>
                  <Input 
                    id="ruc" 
                    value={formData.ruc || ''}
                    onChange={(e) => handleFormChange('ruc', e.target.value)}
                    placeholder="RUC de la empresa"
                  />
                </div>
                
                {/* Departamento */}
                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento</Label>
                  <Select 
                    value={formData.idDepartamento?.toString() || ''} 
                    onValueChange={(value) => handleFormChange('idDepartamento', parseInt(value))}
                  >
                    <SelectTrigger id="departamento">
                      <SelectValue placeholder="Seleccionar departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map((dep) => (
                        <SelectItem key={dep.value.toString()} value={dep.value.toString()}>
                          {dep.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Distrito */}
                <div className="space-y-2">
                  <Label htmlFor="distrito">Distrito</Label>
                  <Select 
                    value={formData.idLocalidad?.toString() || ''} 
                    onValueChange={(value) => handleFormChange('idLocalidad', parseInt(value))}
                  >
                    <SelectTrigger id="distrito">
                      <SelectValue placeholder="Seleccionar distrito" />
                    </SelectTrigger>
                    <SelectContent>
                      {distritos.map((dist) => (
                        <SelectItem key={dist.value.toString()} value={dist.value.toString()}>
                          {dist.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sector de Actividad */}
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector de Actividad</Label>
                  <Select 
                    value={formData.idSectorActividad?.toString() || ''} 
                    onValueChange={(value) => handleFormChange('idSectorActividad', parseInt(value))}
                  >
                    <SelectTrigger id="sector">
                      <SelectValue placeholder="Seleccionar sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectores.map((sector) => (
                        <SelectItem key={sector.value.toString()} value={sector.value.toString()}>
                          {sector.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sub-Sector de Actividad */}
                <div className="space-y-2">
                  <Label htmlFor="subsector">Sub-Sector de Actividad</Label>
                  <Select 
                    value={formData.idSubSectorActividad?.toString() || ''} 
                    onValueChange={(value) => handleFormChange('idSubSectorActividad', parseInt(value))}
                  >
                    <SelectTrigger id="subsector">
                      <SelectValue placeholder="Seleccionar sub-sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {subSectores.map((subsector) => (
                        <SelectItem key={subsector.value.toString()} value={subsector.value.toString()}>
                          {subsector.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Año de Creación */}
                <div className="space-y-2">
                  <Label htmlFor="anioCreacion">Año de Creación</Label>
                  <Input 
                    id="anioCreacion" 
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.anioCreacion || ''}
                    onChange={(e) => handleFormChange('anioCreacion', parseInt(e.target.value))}
                    placeholder="Año de creación"
                  />
                </div>
                
                {/* Total de Empleados */}
                <div className="space-y-2">
                  <Label htmlFor="totalEmpleados">Total de Empleados</Label>
                  <Input 
                    id="totalEmpleados" 
                    type="number"
                    min="0"
                    value={formData.totalEmpleados || ''}
                    onChange={(e) => handleFormChange('totalEmpleados', parseInt(e.target.value))}
                    placeholder="Total de empleados"
                  />
                </div>
                
                {/* Ventas Anuales */}
                <div className="space-y-2">
                  <Label htmlFor="ventas">Ventas Anuales</Label>
                  <Select 
                    value={formData.idVentas?.toString() || ''} 
                    onValueChange={(value) => handleFormChange('idVentas', parseInt(value))}
                  >
                    <SelectTrigger id="ventas">
                      <SelectValue placeholder="Seleccionar ventas" />
                    </SelectTrigger>
                    <SelectContent>
                      {ventasOptions.map((opt) => (
                        <SelectItem key={opt.value.toString()} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sexo del Gerente General */}
                <div className="space-y-2">
                  <Label htmlFor="sexoGerente">Sexo del Gerente General</Label>
                  <Select 
                    value={formData.sexoGerenteGeneral || ''} 
                    onValueChange={(value) => handleFormChange('sexoGerenteGeneral', value)}
                  >
                    <SelectTrigger id="sexoGerente">
                      <SelectValue placeholder="Seleccionar sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hombre">Hombre</SelectItem>
                      <SelectItem value="Mujer">Mujer</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sexo del Propietario Principal */}
                <div className="space-y-2">
                  <Label htmlFor="sexoPropietario">Sexo del Propietario Principal</Label>
                  <Select 
                    value={formData.sexoPropietarioPrincipal || ''} 
                    onValueChange={(value) => handleFormChange('sexoPropietarioPrincipal', value)}
                  >
                    <SelectTrigger id="sexoPropietario">
                      <SelectValue placeholder="Seleccionar sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hombre">Hombre</SelectItem>
                      <SelectItem value="Mujer">Mujer</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
              </div>
              
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updating}
                  className="bg-[#f5592b] hover:bg-[#e04a1f]"
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </form>
            
          </DialogContent>
        </Dialog>

        {/* User Management Dialog */}
        <Dialog open={isUserManagementDialogOpen} onOpenChange={setIsUserManagementDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-[#150773]">Gestión de Usuarios Asignados</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Usuarios asignados a {business.empresa}</h3>
                <Button 
                  onClick={() => setIsAssignUserDialogOpen(true)}
                  className="bg-[#150773] hover:bg-[#0e0550]"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Asignar Usuario Existente
                </Button>
              </div>
              
              {loadingCompanyUsers ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-[#f5592b]" />
                </div>
              ) : companyUsers.length === 0 ? (
                <div className="text-center py-8 border rounded-md bg-gray-50">
                  <p className="text-gray-500">No hay usuarios asignados a esta empresa.</p>
                  <p className="text-sm text-gray-400 mt-2">Asigna usuarios existentes usando el botón superior.</p>
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyUsers.map((user) => (
                        <TableRow key={user.IdUsuario}>
                          <TableCell className="font-medium">{user.NombreCompleto}</TableCell>
                          <TableCell>{user.Email}</TableCell>
                          <TableCell>{user.CargoEmpresa || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleUnassignUser(user)}
                                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    >
                                      <Link2Off className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Desasignar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteUser(user)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Eliminar</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsUserManagementDialogOpen(false)}
                >
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign User Dialog - Nuevo diseño simplificado */}
        <Dialog open={isAssignUserDialogOpen} onOpenChange={setIsAssignUserDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#150773]">Asignar Usuario Existente</DialogTitle>
              <DialogDescription>
                Busca y selecciona un usuario existente para asignarlo a esta empresa.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Campo de búsqueda simple */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    className="pl-8 pr-4"
                    value={usuarioSearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUsuarioSearch(value);
                      
                      // Debounce search
                      const timeoutId = setTimeout(() => {
                        if (value.length >= 2) {
                          searchUsuarios(value);
                        }
                      }, 300);
                      
                      return () => clearTimeout(timeoutId);
                    }}
                    autoFocus
                  />
                  {loadingUsuarios && (
                    <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-gray-500" />
                  )}
                </div>
                
                {/* Mensaje de ayuda */}
                {!usuarioSearch && (
                  <p className="text-sm text-gray-500 text-center">
                    Escribe al menos 2 caracteres para buscar usuarios
                  </p>
                )}
                
                {/* Lista de resultados */}
                {usuarioSearch.length >= 2 && (
                  <div className="border rounded-md overflow-hidden">
                    {usuarios.length === 0 && !loadingUsuarios ? (
                      <div className="p-4 text-center text-gray-500">
                        No se encontraron usuarios con "{usuarioSearch}"
                      </div>
                    ) : (
                      <div className="max-h-[250px] overflow-y-auto">
                        {usuarios.map((usuario) => (
                          <div
                            key={usuario.value}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              handleAssignUser(usuario.value);
                              setUsuarioSearch('');
                              setIsAssignUserDialogOpen(false);
                            }}
                          >
                            <div>
                              <div className="font-medium">{usuario.label}</div>
                              <div className="text-sm text-gray-500">{usuario.email || ''}</div>
                            </div>
                            <Button size="sm" variant="ghost" className="text-[#150773]">
                              <Users className="h-4 w-4 mr-1" />
                              Asignar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAssignUserDialogOpen(false);
                    setUsuarioSearch('');
                  }}
                >
                  Cancelar
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmación de Desasignación */}
        <Dialog open={isUnassignConfirmOpen} onOpenChange={setIsUnassignConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#150773] flex items-center gap-2">
                <Link2Off className="h-5 w-5 text-orange-600" />
                Confirmar Desasignación
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                ¿Estás seguro de que quieres <strong>desasignar</strong> al usuario <strong>{selectedUserForAction?.NombreCompleto}</strong> de esta empresa?
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                <p className="text-sm text-orange-800">
                  <strong>Esta acción:</strong>
                </p>
                <ul className="text-sm text-orange-700 mt-1 ml-4 list-disc">
                  <li>Romperá la relación entre el usuario y esta empresa</li>
                  <li>Los chequeos del usuario bajo esta empresa serán eliminados</li>
                  <li>El usuario seguirá existiendo en el sistema</li>
                </ul>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUnassignConfirmOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={confirmUnassignUser}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Desasignar Usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmación de Eliminación */}
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#150773] flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Confirmar Eliminación
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                ¿Estás seguro de que quieres <strong>eliminar</strong> completamente al usuario <strong>{selectedUserForAction?.NombreCompleto}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  <strong>Esta acción:</strong>
                </p>
                <ul className="text-sm text-red-700 mt-1 ml-4 list-disc">
                  <li>Eliminará el usuario del sistema</li>
                  <li>Eliminará todos los chequeos asociados al usuario</li>
                  <li>Esta acción NO se puede deshacer</li>
                </ul>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={confirmDeleteUser}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar Usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ClientOnly>
  )
}