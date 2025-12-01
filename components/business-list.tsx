"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Building2, MapPin, Calendar, BarChart3, Eye, Search, Users, Award, Target, Loader2, CheckCircle, Clock, Trash2, RefreshCw } from "lucide-react"
import { getAuthToken } from "@/lib/api-client"
import { ReassignChequeoDialog } from "./reassign-chequeo-dialog"

interface BusinessListProps {
  filters: any
  dateRange?: any
}

export function BusinessList({ filters, dateRange }: BusinessListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOnlyFinalized, setShowOnlyFinalized] = useState(true) // Por defecto mostrar solo finalizados
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50) // Por defecto 50 registros
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  
  // Estados para el diálogo de confirmación de eliminación
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null)
  const [deleteType, setDeleteType] = useState<'test' | 'user' | 'complete' | null>(null)
  const [deleteInProgress, setDeleteInProgress] = useState(false)
  
  // Estados para el diálogo de reasignación
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false)
  const [businessToReassign, setBusinessToReassign] = useState<any>(null)
  
  const router = useRouter()

  // Función para convertir puntaje en nivel de madurez
  const getMaturityLevel = (puntaje: number) => {
    if (!puntaje) return "Sin evaluar"
    if (puntaje < 30) return "Inicial"
    if (puntaje < 60) return "Novato"
    if (puntaje < 80) return "Competente"
    return "Avanzado"
  }

  // Cargar datos desde la API
  // Debounce effect para searchTerm
  useEffect(() => {
    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setIsSearching(false)
      // Resetear a la página 1 cuando se busque algo nuevo
      if (searchTerm !== debouncedSearchTerm) {
        setCurrentPage(1)
      }
    }, 1000) // 1 segundo de delay

    return () => {
      clearTimeout(timer)
      setIsSearching(false)
    }
  }, [searchTerm, debouncedSearchTerm])

  // Effect principal que se ejecuta con el término debounced
  useEffect(() => {
    const loadData = async () => {
      // Solo mostrar loading completo en la carga inicial (cuando no hay datos)
      const isInitialLoad = businesses.length === 0
      
      if (isInitialLoad) {
        setLoading(true)
      } else {
        setRefreshing(true) // Para búsquedas, usar refreshing más sutil
      }
      
      try {
        const token = getAuthToken() // Use imported synchronous function
        if (!token) {
          setError("No se pudo obtener el token de autenticación")
          return
        }

        // Construir parámetros comunes para ambas URLs
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(pageSize),
          finalizado: showOnlyFinalized ? '1' : '0',
          searchTerm: debouncedSearchTerm || ''
        });
        
        // Agregar filtros si existen
        if (filters?.departamento && filters.departamento.length > 0) {
          filters.departamento.forEach((dep: string) => params.append('departamento', dep));
        }
        if (filters?.distrito && filters.distrito.length > 0) {
          filters.distrito.forEach((dist: string) => params.append('distrito', dist));
        }
        if (filters?.nivelInnovacion && filters.nivelInnovacion.length > 0) {
          filters.nivelInnovacion.forEach((nivel: string) => params.append('nivelInnovacion', nivel));
        }
        if (filters?.sectorActividad && filters.sectorActividad.length > 0) {
          filters.sectorActividad.forEach((sector: string) => params.append('sectorActividad', sector));
        }
        if (filters?.subSectorActividad && filters.subSectorActividad.length > 0) {
          filters.subSectorActividad.forEach((subsector: string) => params.append('subSectorActividad', subsector));
        }
        if (filters?.tamanoEmpresa && filters.tamanoEmpresa.length > 0) {
          filters.tamanoEmpresa.forEach((tamano: string) => params.append('tamanoEmpresa', tamano));
        }
        
        // Agregar rango de fechas
        if (dateRange?.fechaIni) {
          params.append('fechaIni', dateRange.fechaIni);
        }
        if (dateRange?.fechaFin) {
          params.append('fechaFin', dateRange.fechaFin);
        }

        // Cargar empresas con filtro de finalizados, paginación y búsqueda del servidor
        const empresasUrl = `http://localhost:3001/api/empresas?${params.toString()}`
        const empresasResponse = await fetch(empresasUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!empresasResponse.ok) {
          throw new Error(`Error ${empresasResponse.status}: ${empresasResponse.statusText}`)
        }
        
        const empresasData = await empresasResponse.json()
        
        // Guard adicional: eliminar duplicados por IdTestUsuario (cinturón y tirantes)
        const uniqueByTest = new Map()
        for (const row of empresasData.data || []) {
          if (!uniqueByTest.has(row.IdTestUsuario)) {
            uniqueByTest.set(row.IdTestUsuario, row)
          }
        }
        
        setBusinesses([...uniqueByTest.values()])
        setTotalCount(empresasData.pagination?.total || 0)
        setTotalPages(empresasData.pagination?.totalPages || 0)

        // Cargar KPIs con los mismos filtros
        const kpisUrl = `http://localhost:3001/api/empresas/kpis?${params.toString()}`
        const kpisResponse = await fetch(kpisUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (kpisResponse.ok) {
          const kpisData = await kpisResponse.json()
          setKpis(kpisData)
        }

      } catch (error) {
        console.error('Error loading data:', error)
        setError(`Error cargando datos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    }

    loadData()
  }, [filters, showOnlyFinalized, currentPage, pageSize, debouncedSearchTerm, dateRange]) // Recargar cuando cambien los filtros, estado de finalizados, página, tamaño de página, término de búsqueda debounced o rango de fechas

  // Ya no necesitamos filtrar localmente porque la búsqueda se hace en el servidor
  const filteredBusinesses = businesses

  const handleBusinessSelect = (business: any) => {
    // Pasar IdTestUsuario para identificar el test específico del usuario
    router.push(`/empresas/${business.IdEmpresa}?idTestUsuario=${business.IdTestUsuario}`)
  }

  const handleDashboardView = () => {
    router.push("/dashboard")
  }
  
  // Manejo de eliminación
  const handleOpenDeleteDialog = (business: any) => {
    setSelectedBusiness(business)
    setIsDeleteDialogOpen(true)
    setDeleteType(null) // Resetear el tipo de eliminación
  }

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setSelectedBusiness(null)
    setDeleteType(null)
  }

  // Manejo de reasignación
  const handleOpenReassignDialog = (business: any) => {
    setBusinessToReassign(business)
    setIsReassignDialogOpen(true)
  }

  const handleCloseReassignDialog = () => {
    setIsReassignDialogOpen(false)
    setBusinessToReassign(null)
  }

  const handleReassignSuccess = async () => {
    // Recargar la lista de empresas después de una reasignación exitosa
    try {
      const token = getAuthToken()
      if (!token) {
        setError("No se pudo obtener el token de autenticación")
        return
      }

      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
        finalizado: showOnlyFinalized ? '1' : '0',
        searchTerm: debouncedSearchTerm || ''
      });
      
      if (filters?.departamento && filters.departamento.length > 0) {
        filters.departamento.forEach((dep: string) => params.append('departamento', dep));
      }
      if (filters?.distrito && filters.distrito.length > 0) {
        filters.distrito.forEach((dist: string) => params.append('distrito', dist));
      }
      if (filters?.nivelInnovacion && filters.nivelInnovacion.length > 0) {
        filters.nivelInnovacion.forEach((nivel: string) => params.append('nivelInnovacion', nivel));
      }
      if (filters?.sectorActividad && filters.sectorActividad.length > 0) {
        filters.sectorActividad.forEach((sector: string) => params.append('sectorActividad', sector));
      }
      if (filters?.subSectorActividad && filters.subSectorActividad.length > 0) {
        filters.subSectorActividad.forEach((subsector: string) => params.append('subSectorActividad', subsector));
      }
      if (filters?.tamanoEmpresa && filters.tamanoEmpresa.length > 0) {
        filters.tamanoEmpresa.forEach((tamano: string) => params.append('tamanoEmpresa', tamano));
      }

      const empresasUrl = `http://localhost:3001/api/empresas?${params.toString()}`
      const empresasResponse = await fetch(empresasUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (empresasResponse.ok) {
        const empresasData = await empresasResponse.json()
        const uniqueByTest = new Map()
        for (const row of empresasData.data || []) {
          if (!uniqueByTest.has(row.IdTestUsuario)) {
            uniqueByTest.set(row.IdTestUsuario, row)
          }
        }
        setBusinesses([...uniqueByTest.values()])
        setTotalCount(empresasData.pagination?.total || 0)
        setTotalPages(empresasData.pagination?.totalPages || 0)
      }
    } catch (error) {
      console.error('Error reloading data:', error)
    }
  }

  const handleSetDeleteType = (type: 'test' | 'user' | 'complete') => {
    setDeleteType(type)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedBusiness || !deleteType) return
    
    try {
      setDeleteInProgress(true)
      const token = getAuthToken()
      if (!token) {
        throw new Error("No se pudo obtener el token de autenticación")
      }

      const endpoint = `http://localhost:3001/api/empresas/${selectedBusiness.IdTestUsuario}/delete`
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: deleteType,
          idTestUsuario: selectedBusiness.IdTestUsuario,
          idUsuario: selectedBusiness.IdUsuario,
          idEmpresa: selectedBusiness.IdEmpresa
        })
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      // Éxito - eliminar de la lista local y cerrar el diálogo
      setBusinesses(prevBusinesses => 
        prevBusinesses.filter(b => b.IdTestUsuario !== selectedBusiness.IdTestUsuario)
      )
      
      // Actualizar KPIs
      const kpiParams = new URLSearchParams({
        finalizado: showOnlyFinalized ? '1' : '0'
      })
      
      if (filters?.departamento && filters.departamento.length > 0) {
        filters.departamento.forEach((dep: string) => kpiParams.append('departamento', dep));
      }
      if (filters?.distrito && filters.distrito.length > 0) {
        filters.distrito.forEach((dist: string) => kpiParams.append('distrito', dist));
      }
      if (filters?.nivelInnovacion && filters.nivelInnovacion.length > 0) {
        filters.nivelInnovacion.forEach((nivel: string) => kpiParams.append('nivelInnovacion', nivel));
      }
      if (filters?.sectorActividad && filters.sectorActividad.length > 0) {
        filters.sectorActividad.forEach((sector: string) => kpiParams.append('sectorActividad', sector));
      }
      if (filters?.subSectorActividad && filters.subSectorActividad.length > 0) {
        filters.subSectorActividad.forEach((subsector: string) => kpiParams.append('subSectorActividad', subsector));
      }
      if (filters?.tamanoEmpresa && filters.tamanoEmpresa.length > 0) {
        filters.tamanoEmpresa.forEach((tamano: string) => kpiParams.append('tamanoEmpresa', tamano));
      }

      const kpisUrl = `http://localhost:3001/api/empresas/kpis?${kpiParams.toString()}`
      const kpisResponse = await fetch(kpisUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (kpisResponse.ok) {
        const kpisData = await kpisResponse.json()
        setKpis(kpisData)
      }

      setIsDeleteDialogOpen(false)
      setSelectedBusiness(null)
      setDeleteType(null)
      
    } catch (error) {
      console.error('Error al eliminar:', error)
      setError(`Error al eliminar: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setDeleteInProgress(false)
    }
  }

  // Funciones de paginación
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Resetear a la primera página
  }

  const getCompanySize = (ventasAnuales: string) => {
    if (!ventasAnuales) return "N/A"
    if (ventasAnuales.includes("Micro")) return "Micro"
    if (ventasAnuales.includes("Mediana")) return "Mediana"
    if (ventasAnuales.includes("Pequeña")) return "Pequeña"
    if (ventasAnuales.includes("Grande")) return "Grande"
    return "N/A"
  }

  const getCompanySizeColor = (ventasAnuales: string) => {
    if (!ventasAnuales) return "bg-gray-100 text-gray-600 border-gray-200"
    if (ventasAnuales.includes("Micro")) return "bg-blue-100 text-blue-800 border-blue-200"
    if (ventasAnuales.includes("Pequeña")) return "bg-green-100 text-green-800 border-green-200"
    if (ventasAnuales.includes("Mediana")) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    if (ventasAnuales.includes("Grande")) return "bg-purple-100 text-purple-800 border-purple-200"
    return "bg-gray-100 text-gray-600 border-gray-200"
  }


  // Usar directamente los niveles que vienen del backend
  const colorByNivel: Record<string, string> = {
    'Inicial': 'bg-red-100 text-red-800 border-red-200',
    'Novato': 'bg-amber-100 text-amber-800 border-amber-200',
    'Competente': 'bg-blue-100 text-blue-800 border-blue-200',
    'Avanzado': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Experto': 'bg-purple-100 text-purple-800 border-purple-200'
  }

  const getNivelColor = (nivel: string) => {
    return colorByNivel[nivel] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Cargando empresas...</p>
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
    <div className="space-y-6">
      {/* KPIs Section */}
      {kpis && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-[#f5592b]/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">Total Empresas</CardTitle>
              <Building2 className="h-5 w-5 text-[#f5592b]" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-[#150773]">{kpis.totalEmpresas?.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">Empresas registradas</p>
          </CardContent>
        </Card>

          <Card className="border-[#150773]/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">Nivel General</CardTitle>
              <BarChart3 className="h-5 w-5 text-[#150773]" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-[#f5592b]">{kpis.nivelGeneral}%</div>
              <p className="text-xs font-medium text-[#150773] mt-1">
                Madurez: {getMaturityLevel(kpis.nivelGeneral)}
              </p>
          </CardContent>
        </Card>

          <Card className="border-[#f5592b]/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">Empresas Incipientes</CardTitle>
              <Award className="h-5 w-5 text-[#f5592b]" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-[#150773]">{kpis.empresasIncipientes?.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">Nivel inicial</p>
          </CardContent>
        </Card>

          <Card className="border-[#150773]/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">Total Empleados</CardTitle>
              <Users className="h-5 w-5 text-[#150773]" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-[#f5592b]">{kpis.totalEmpleados?.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">Empleados en total</p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#f5592b] h-4 w-4" />
            <Input
              placeholder="Buscar empresas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-[#f5592b]/30 focus:border-[#f5592b] focus:ring-[#f5592b]/20"
            />
            {/* Overlay de carga mientras se está escribiendo */}
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-[#f5592b] rounded-full animate-pulse"></div>
                  <div className="w-1 h-1 bg-[#f5592b] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-1 h-1 bg-[#f5592b] rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Toggle para filtrar por finalizados */}
          <div className="flex items-center gap-2 bg-white border border-[#f5592b]/30 rounded-lg px-3 py-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">Sin finalizar</span>
            <Switch
              checked={showOnlyFinalized}
              onCheckedChange={(checked) => {
                setShowOnlyFinalized(checked)
                setCurrentPage(1)          // ✅ reset al alternar
              }}
              className="data-[state=checked]:bg-[#f5592b]"
            />
            <CheckCircle className="h-4 w-4 text-[#f5592b]" />
            <span className="text-sm text-gray-700">Finalizados</span>
          </div>
        </div>
        
        <Button 
          onClick={handleDashboardView} 
          className="bg-[#f5592b] hover:bg-[#e04a1f] text-white border-0"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Ver Dashboard
        </Button>
      </div>

      {/* Businesses Table */}
      <Card className="border-[#150773]/20 shadow-sm">
        <CardHeader className="bg-[#150773] text-white">
          <CardTitle className="flex items-center text-lg">
            <Building2 className="h-5 w-5 mr-2" />
            Observatorio de Chequeos
          </CardTitle>
          <p className="text-sm text-blue-100 mt-1">
            Mostrando {businesses.length} de {totalCount} chequeos {showOnlyFinalized ? 'finalizados' : 'sin finalizar'}
          </p>
        </CardHeader>
        <CardContent className="p-0 relative">
          {/* Overlay de refreshing sutil */}
          {refreshing && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white rounded-lg px-4 py-2 shadow-lg border">
                <Loader2 className="h-4 w-4 animate-spin text-[#f5592b]" />
                <span className="text-sm text-gray-600">Actualizando...</span>
              </div>
            </div>
          )}
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-[#150773] font-semibold">Empresa</TableHead>
                <TableHead className="text-[#150773] font-semibold">Tamaño</TableHead>
                <TableHead className="text-[#150773] font-semibold">Ubicación</TableHead>
                <TableHead className="text-[#150773] font-semibold">Sector</TableHead>
                <TableHead className="text-[#150773] font-semibold">Empleados</TableHead>
                <TableHead className="text-[#150773] font-semibold">Fecha Test</TableHead>
                <TableHead className="text-[#150773] font-semibold">Puntaje</TableHead>
                <TableHead className="text-[#150773] font-semibold">Madurez</TableHead>
                <TableHead className="text-[#150773] font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBusinesses.map((business, index) => (
                <TableRow key={business.IdTestUsuario} className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div className="font-semibold text-[#150773]">{business.empresa}</div>
                    <div className="text-sm text-gray-600">{business.nombreCompleto || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getCompanySizeColor(business.ventasAnuales)} font-medium`}>
                      {getCompanySize(business.ventasAnuales)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="text-[#150773] font-medium">{business.departamento}</div>
                      {business.distrito && (
                        <div className="text-xs text-gray-500">{business.distrito}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-700">{business.sectorActividadDescripcion}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-1 text-[#f5592b]" />
                      <span className="font-semibold text-[#150773]">{business.totalEmpleados || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1 text-[#f5592b]" />
                      <span className="text-[#150773] font-medium">{business.fechaTest || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-[#f5592b]">
                        {business.puntajeNivelDeMadurezGeneral !== null && business.puntajeNivelDeMadurezGeneral !== undefined 
                          ? `${Number(business.puntajeNivelDeMadurezGeneral).toFixed(2)}%` 
                          : 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getNivelColor(business.nivelDeMadurezGeneral)} font-medium`}>
                      {business.nivelDeMadurezGeneral}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        className="bg-[#f5592b] hover:bg-[#e04a1f] text-white border-0"
                        size="icon"
                        title="Ver detalles"
                        onClick={() => handleBusinessSelect(business)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        title="Reasignar chequeo"
                        className="border-[#150773]/20 hover:bg-[#150773]/10 hover:text-[#150773]"
                        onClick={() => handleOpenReassignDialog(business)}
                      >
                        <RefreshCw className="h-4 w-4 text-[#150773]" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        title="Eliminar registro"
                        className="border-red-200 hover:bg-red-100 hover:text-red-700"
                        onClick={() => handleOpenDeleteDialog(business)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredBusinesses.length === 0 && !loading && (
            <div className="text-center py-12 bg-gray-50">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No se encontraron empresas</h3>
              <p className="text-gray-600">No hay empresas que coincidan con la búsqueda.</p>
            </div>
          )}
        </CardContent>
        
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Mostrar:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value))}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-700">registros por página</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  ←
                </Button>
                
                {/* Mostrar números de página */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-[#f5592b] text-white' : ''}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  →
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
      
      {/* Diálogo de reasignación */}
      {businessToReassign && (
        <ReassignChequeoDialog
          isOpen={isReassignDialogOpen}
          onClose={handleCloseReassignDialog}
          business={businessToReassign}
          onSuccess={handleReassignSuccess}
        />
      )}
      
      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-[#150773]">
              ¿Eliminar registro de chequeo?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-base">
                {selectedBusiness && (
                  <div className="space-y-4">
                    <p className="font-medium text-gray-800">
                      Está a punto de eliminar el chequeo para: <span className="text-[#f5592b]">{selectedBusiness.empresa}</span>
                    </p>
                    
                    <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-4">
                      <p className="font-semibold text-yellow-800 mb-2 text-sm">Seleccione el tipo de eliminación:</p>
                      <div className="space-y-2">
                        <div 
                          className={`p-2 rounded-md cursor-pointer border ${deleteType === 'test' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                          onClick={() => handleSetDeleteType('test')}
                        >
                          <h4 className="text-xs font-bold text-gray-800">1. Borrar el chequeo</h4>
                          <p className="text-xs text-gray-600">
                            Se eliminará solo el chequeo (IdTestUsuario: {selectedBusiness.IdTestUsuario}) y sus respuestas.
                          </p>
                        </div>
                        
                        <div 
                          className={`p-2 rounded-md cursor-pointer border ${deleteType === 'user' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}
                          onClick={() => handleSetDeleteType('user')}
                        >
                          <h4 className="text-xs font-bold text-gray-800">2. Borrar el chequeo y el usuario</h4>
                          <p className="text-xs text-gray-600">
                            Se eliminará el chequeo (IdTestUsuario: {selectedBusiness.IdTestUsuario}) y el usuario (IdUsuario: {selectedBusiness.IdUsuario}) con todos sus chequeos.
                          </p>
                        </div>
                        
                        <div 
                          className={`p-2 rounded-md cursor-pointer border ${deleteType === 'complete' ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                          onClick={() => handleSetDeleteType('complete')}
                        >
                          <h4 className="text-xs font-bold text-gray-800">3. Borrar todo</h4>
                          <p className="text-xs text-gray-600">
                            Se eliminará el chequeo (IdTestUsuario: {selectedBusiness.IdTestUsuario}), la empresa (IdEmpresa: {selectedBusiness.IdEmpresa}), el usuario (IdUsuario: {selectedBusiness.IdUsuario}) y todos los datos relacionados.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-bold">Importante:</span> Esta acción no se puede deshacer.
                      </p>
                      <p className="text-sm text-gray-700">
                        El borrado se realizará siguiendo los procedimientos de seguridad establecidos.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={deleteInProgress}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
              disabled={!deleteType || deleteInProgress}
              className={`${
                deleteType === 'complete' ? 'bg-red-600 hover:bg-red-700' : 
                deleteType === 'user' ? 'bg-orange-600 hover:bg-orange-700' : 
                deleteType === 'test' ? 'bg-[#f5592b] hover:bg-[#e04a1f]' : 
                'bg-gray-400'
              } text-white`}
            >
              {deleteInProgress ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                'Confirmar eliminación'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
