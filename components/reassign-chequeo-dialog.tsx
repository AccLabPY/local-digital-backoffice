"use client"

import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, RefreshCw, Users, AlertTriangle, CheckCircle2, Info, Search, User } from "lucide-react"
import { getAuthToken } from "@/lib/api-client"

interface User {
  IdUsuario: number
  NombreCompleto: string
  Email: string
  CargoEmpresa?: string
  Test?: number
  FechaTest?: string
  NombreEmpresa?: string
  EmpresaAsignada?: number
}

interface Chequeo {
  IdUsuario: number
  NombreCompleto: string
  Test: number
  FechaTest: string
}

interface PreviewData {
  idEmpresa: number
  idEmpresaInfo?: number
  idEmpresaInfo_Reciente?: number
  currentIdUsuario: number
  newIdUsuario: number
  currentTest: number
  newTest: number
}

interface ReassignChequeoDialogProps {
  isOpen: boolean
  onClose: () => void
  business: any
  onSuccess: () => void
}

export function ReassignChequeoDialog({
  isOpen,
  onClose,
  business,
  onSuccess,
}: ReassignChequeoDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [availableChequeos, setAvailableChequeos] = useState<Chequeo[]>([])
  const [selectedFromUserId, setSelectedFromUserId] = useState<string>("")
  const [selectedToUserId, setSelectedToUserId] = useState<string>("")
  const [selectedTestNumber, setSelectedTestNumber] = useState<string>("")
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reassigning, setReassigning] = useState(false)
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [showPreview, setShowPreview] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<User[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchType, setSearchType] = useState<'name' | 'email' | 'idUsuario'>('name')


  // Cargar usuarios y verificar si hay candidatos automáticos
  useEffect(() => {
    if (isOpen && business) {
      loadInitialData()
    } else if (!isOpen) {
      // Limpiar estado al cerrar
      setSelectedFromUserId("")
      setSelectedToUserId("")
      setSelectedTestNumber("")
      setSelectedUser(null)
      setUserSearchTerm("")
      setUserSearchResults([])
      setIsUserSearchOpen(false)
      setShowPreview(false)
      setPreview(null)
      setError(null)
      setSearchType('name')
      setAvailableChequeos([])
    }
  }, [isOpen, business])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = getAuthToken()
      if (!token) {
        setError("No se pudo obtener el token de autenticación")
        return
      }

      // Intentar obtener candidatos automáticos
      const autoResponse = await fetch(
        `http://localhost:3001/api/empresas/${business.IdEmpresa}/reassign`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dryRun: true,
            targetIdUsuario: null
          })
        }
      )

      const autoData = await autoResponse.json()
      
      if (autoData.success && autoData.preview) {
        // Hay candidatos automáticos
        setMode('auto')
        setPreview(autoData.preview)
      } else {
        // No hay candidatos automáticos, usar modo manual
        setMode('manual')
        await loadManualMode(token)
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      // Si falla, intentar modo manual
      try {
        const token = getAuthToken()
        if (token) {
          await loadManualMode(token)
        }
      } catch (e) {
        setError(`Error cargando datos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadManualMode = async (token: string) => {
    setLoadingUsers(true)
    try {
      // Crear el chequeo seleccionado desde el objeto business
      // El business tiene IdUsuario, IdEmpresa, IdTestUsuario
      // Usamos Test=1 por defecto (la mayoría de chequeos son Test=1)
      // Si el usuario necesita otro Test, puede seleccionarlo manualmente
      if (business && business.IdUsuario) {
        const selectedChequeo: Chequeo = {
          IdUsuario: business.IdUsuario,
          NombreCompleto: business.nombreCompleto || business.NombreCompleto || 'Usuario desconocido',
          Test: business.Test || 1, // Por defecto Test=1
          FechaTest: business.fechaTest || business.FechaTest || ''
        }
        setAvailableChequeos([selectedChequeo])
        // Pre-seleccionar el chequeo
        setSelectedFromUserId(selectedChequeo.IdUsuario.toString())
        setSelectedTestNumber(selectedChequeo.Test.toString())
      } else {
        // Fallback: cargar chequeos disponibles si no hay información del business
        const chequeosResponse = await fetch(
          `http://localhost:3001/api/empresas/${business.IdEmpresa}/available-users-reassignment`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (chequeosResponse.ok) {
          const chequeosData = await chequeosResponse.json()
          setAvailableChequeos(chequeosData.users || [])
        }
      }
    } catch (error) {
      console.error('Error loading manual mode data:', error)
      setError('Error cargando datos para reasignación manual')
    } finally {
      setLoadingUsers(false)
    }
  }

  // Búsqueda dinámica de usuarios
  const searchUsers = async (search: string) => {
    // Validación según el tipo de búsqueda
    if (searchType === 'idUsuario') {
      // Para IdUsuario, debe ser un número válido
      const idUsuario = parseInt(search)
      if (isNaN(idUsuario) || search.trim() === '') {
        setUserSearchResults([])
        return
      }
    } else {
      // Para nombre o email, mínimo 3 caracteres
      if (search.length < 3) {
        setUserSearchResults([])
        return
      }
    }

    setSearchingUsers(true)
    try {
      const token = getAuthToken()
      if (!token) {
        setError("No se pudo obtener el token de autenticación")
        return
      }

      const response = await fetch(
        `http://localhost:3001/api/empresas/search/users?search=${encodeURIComponent(search)}&searchType=${searchType}&limit=20`,
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
      setUserSearchResults(data.users || [])
    } catch (error) {
      console.error('Error searching users:', error)
      setError(`Error buscando usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setSearchingUsers(false)
    }
  }

  // Debounce para búsqueda de usuarios
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Validación según el tipo de búsqueda
      if (searchType === 'idUsuario') {
        const idUsuario = parseInt(userSearchTerm)
        if (!isNaN(idUsuario) && userSearchTerm.trim() !== '') {
          searchUsers(userSearchTerm)
        } else {
          setUserSearchResults([])
        }
      } else {
        if (userSearchTerm.length >= 3) {
          searchUsers(userSearchTerm)
        } else {
          setUserSearchResults([])
        }
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [userSearchTerm, searchType])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isUserSearchOpen && !target.closest('.user-search-dropdown')) {
        setIsUserSearchOpen(false)
      }
    }

    if (isUserSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUserSearchOpen])

  const handlePreviewManual = async () => {
    if (!selectedFromUserId || !selectedToUserId || !selectedTestNumber) {
      setError('Por favor selecciona todos los campos requeridos')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const token = getAuthToken()
      if (!token) {
        setError("No se pudo obtener el token de autenticación")
        return
      }

      const response = await fetch(
        `http://localhost:3001/api/empresas/${business.IdEmpresa}/manual-reassign`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fromIdUsuario: parseInt(selectedFromUserId),
            toIdUsuario: parseInt(selectedToUserId),
            testNumber: parseInt(selectedTestNumber),
            dryRun: true
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.preview) {
        setPreview(data.preview)
        setShowPreview(true)
      } else {
        setError(data.message || 'Error al obtener preview')
      }
    } catch (error) {
      console.error('Error getting manual preview:', error)
      setError(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReassign = async () => {
    if (!preview) return

    try {
      setReassigning(true)
      setError(null)
      
      const token = getAuthToken()
      if (!token) {
        setError("No se pudo obtener el token de autenticación")
        return
      }

      let response
      
      if (mode === 'auto') {
        response = await fetch(
          `http://localhost:3001/api/empresas/${business.IdEmpresa}/reassign`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dryRun: false,
              targetIdUsuario: preview.newIdUsuario
            })
          }
        )
      } else {
        response = await fetch(
          `http://localhost:3001/api/empresas/${business.IdEmpresa}/manual-reassign`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fromIdUsuario: preview.currentIdUsuario,
              toIdUsuario: preview.newIdUsuario,
              testNumber: preview.currentTest,
              dryRun: false
            })
          }
        )
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        onSuccess()
        onClose()
      } else {
        setError(data.message || 'Error al reasignar el chequeo')
      }
    } catch (error) {
      console.error('Error reassigning chequeo:', error)
      setError(`Error al reasignar: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setReassigning(false)
    }
  }

  const getUserName = (idUsuario: number) => {
    if (selectedUser && selectedUser.IdUsuario === idUsuario) {
      return selectedUser.NombreCompleto
    }
    const user = allUsers.find(u => u.IdUsuario === idUsuario) || 
                 availableChequeos.find(c => c.IdUsuario === idUsuario) ||
                 userSearchResults.find(u => u.IdUsuario === idUsuario)
    return user ? user.NombreCompleto : `Usuario ${idUsuario}`
  }

  const renderContent = () => {
    if (loading || loadingUsers) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[#f5592b]" />
          <span className="ml-2 text-gray-600">Cargando información...</span>
        </div>
      )
    }

    if (error && !preview && !showPreview) {
      return (
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )
    }

    if (mode === 'auto' && preview && !showPreview) {
      // Modo automático con candidato detectado
      return (
        <>
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <p className="font-medium text-gray-800 mb-2">
              Empresa: <span className="text-[#f5592b]">{business.empresa}</span>
            </p>
            <p className="text-sm text-gray-600">
              Se detectó que esta empresa tiene 2 chequeos marcados como Test=1 con diferentes usuarios. 
              Haz clic en "Ver Preview" para confirmar los cambios antes de aplicarlos.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => setShowPreview(true)}
              className="bg-[#150773] hover:bg-[#150773]/90 text-white"
            >
              <Info className="h-4 w-4 mr-2" />
              Ver Preview
            </Button>
          </div>
        </>
      )
    }

    if (showPreview && preview) {
      // Mostrar preview antes de confirmar
      return (
        <>
          <div className="bg-emerald-50 p-4 rounded-md border border-emerald-200">
            <h4 className="font-semibold text-emerald-800 text-sm mb-2">Vista Previa del Cambio</h4>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Empresa:</strong> {business.empresa}
              </p>
              <p>
                <strong>Usuario Actual:</strong> {getUserName(preview.currentIdUsuario)} (Test {preview.currentTest})
              </p>
              <p>
                <strong>Nuevo Usuario:</strong> {getUserName(preview.newIdUsuario)} (Test {preview.newTest})
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-md border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <p className="text-sm text-yellow-800 font-semibold mb-1">
              ⚠️ Importante:
            </p>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Esta acción actualizará EmpresaInfo, TestUsuario y ResultadoNivelDigital</li>
              <li>Esta acción no se puede deshacer fácilmente</li>
            </ul>
          </div>
        </>
      )
    }

    if (mode === 'manual') {
      // Modo manual - selección manual de chequeo y usuario
      return (
        <>
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
            <p className="font-medium text-gray-800 mb-2">
              Reasignación Manual
            </p>
            <p className="text-sm text-gray-600">
              No se detectaron candidatos automáticos. Selecciona manualmente el chequeo y el usuario destino.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800">
                1. Chequeo Seleccionado:
              </label>
              <Select 
                value={selectedFromUserId} 
                onValueChange={(value) => {
                  setSelectedFromUserId(value)
                  const chequeo = availableChequeos.find(c => c.IdUsuario.toString() === value)
                  if (chequeo) {
                    setSelectedTestNumber(chequeo.Test.toString())
                  }
                }}
                disabled={availableChequeos.length === 1}
              >
                <SelectTrigger className="w-full border-[#f5592b]/30 focus:border-[#f5592b] bg-gray-50">
                  <SelectValue placeholder="Seleccionar chequeo..." />
                </SelectTrigger>
                <SelectContent>
                  {availableChequeos.map((chequeo) => (
                    <SelectItem key={`${chequeo.IdUsuario}-${chequeo.Test}`} value={chequeo.IdUsuario.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{chequeo.NombreCompleto}</span>
                        <span className="text-xs text-gray-500">Test {chequeo.Test} - {chequeo.FechaTest || 'Sin fecha'}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableChequeos.length === 1 && (
                <p className="text-xs text-gray-500">
                  Chequeo seleccionado de la fila presionada
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800">
                2. Reasignar a Usuario:
              </label>
              
              {/* Radio buttons para tipo de búsqueda */}
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <Label className="text-sm font-medium text-gray-700">Buscar por:</Label>
                <RadioGroup 
                  value={searchType} 
                  onValueChange={(value: 'name' | 'email' | 'idUsuario') => {
                    setSearchType(value)
                    setUserSearchTerm("")
                    setUserSearchResults([])
                  }}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="name" id="name" />
                    <Label htmlFor="name" className="text-sm cursor-pointer">Nombre</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="text-sm cursor-pointer">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="idUsuario" id="idUsuario" />
                    <Label htmlFor="idUsuario" className="text-sm cursor-pointer">IdUsuario</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="relative user-search-dropdown">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between border-[#f5592b]/30 focus:border-[#f5592b]"
                  onClick={() => setIsUserSearchOpen(!isUserSearchOpen)}
                >
                  <span className="truncate">
                    {selectedUser ? selectedUser.NombreCompleto : "Seleccionar usuario destino..."}
                  </span>
                  <User className="h-4 w-4 opacity-50" />
                </Button>
                
                {isUserSearchOpen && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg border-[#f5592b]/30 user-search-dropdown">
                    <div className="p-3 space-y-3">
                      {/* Campo de búsqueda */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          type={searchType === 'idUsuario' ? 'number' : 'text'}
                          placeholder={
                            searchType === 'idUsuario' 
                              ? "Ingresar IdUsuario..." 
                              : searchType === 'email'
                              ? "Buscar por email (mínimo 3 caracteres)..."
                              : "Buscar por nombre (mínimo 3 caracteres)..."
                          }
                          className="pl-8 pr-4"
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          autoFocus
                        />
                        {searchingUsers && (
                          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </div>
                      
                      {/* Mensaje de ayuda */}
                      {!userSearchTerm && (
                        <p className="text-sm text-gray-500 text-center">
                          {searchType === 'idUsuario' 
                            ? "Ingresa un IdUsuario numérico"
                            : "Escribe al menos 3 caracteres para buscar usuarios"}
                        </p>
                      )}
                      
                      {/* Lista de resultados */}
                      {((searchType === 'idUsuario' && userSearchTerm.trim() !== '') || 
                        (searchType !== 'idUsuario' && userSearchTerm.length >= 3)) && (
                        <div className="border rounded-md overflow-hidden">
                          {userSearchResults.length === 0 && !searchingUsers ? (
                            <div className="p-4 text-center text-gray-500">
                              No se encontraron usuarios {searchType === 'idUsuario' ? `con IdUsuario "${userSearchTerm}"` : `con "${userSearchTerm}"`}
                            </div>
                          ) : (
                            <div className="max-h-[250px] overflow-y-auto">
                              {userSearchResults.map((user) => (
                                <div
                                  key={user.IdUsuario}
                                  className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setSelectedToUserId(user.IdUsuario.toString())
                                    setUserSearchTerm("")
                                    setIsUserSearchOpen(false)
                                  }}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{user.NombreCompleto}</div>
                                    <div className="text-sm text-gray-500 truncate">{user.Email}</div>
                                    {user.NombreEmpresa && (
                                      <div className="text-xs text-gray-400 truncate">{user.NombreEmpresa}</div>
                                    )}
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-[#150773] ml-2 flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedUser(user)
                                      setSelectedToUserId(user.IdUsuario.toString())
                                      setUserSearchTerm("")
                                      setIsUserSearchOpen(false)
                                    }}
                                  >
                                    <User className="h-4 w-4 mr-1" />
                                    Seleccionar
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Botón cerrar */}
                      <div className="flex justify-end">
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsUserSearchOpen(false)
                            setUserSearchTerm("")
                            setUserSearchResults([])
                          }}
                        >
                          Cerrar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {selectedUser && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <div className="text-sm">
                    <div className="font-medium text-blue-800">{selectedUser.NombreCompleto}</div>
                    <div className="text-blue-600">{selectedUser.Email}</div>
                    {selectedUser.NombreEmpresa && (
                      <div className="text-blue-500 text-xs mt-1">Empresa: {selectedUser.NombreEmpresa}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedFromUserId && selectedToUserId && (
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={handlePreviewManual}
                  disabled={loading}
                  className="bg-[#150773] hover:bg-[#150773]/90 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <Info className="h-4 w-4 mr-2" />
                      Ver Preview
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </>
      )
    }

    return null
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-[600px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-[#150773] flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-[#f5592b]" />
            Reasignar Chequeo
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-base space-y-4">
              {renderContent()}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={reassigning}>Cancelar</AlertDialogCancel>
          {showPreview && preview && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleReassign()
              }}
              disabled={reassigning}
              className="bg-[#f5592b] hover:bg-[#e04a1f] text-white"
            >
              {reassigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Reasignando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Reasignación
                </>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

