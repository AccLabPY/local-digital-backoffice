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
import { Building2, MapPin, Calendar, BarChart3, Eye, Search, Users, Award, Target, Loader2, CheckCircle, Clock } from "lucide-react"
import { authService } from "./services/auth-service"

interface BusinessListProps {
  filters: any
}

export function BusinessList({ filters }: BusinessListProps) {
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
  const router = useRouter()

  // Función para obtener token de autenticación usando el servicio singleton
  const getAuthToken = async () => {
    try {
      return await authService.getValidToken()
    } catch (error) {
      console.error('Error getting auth token:', error)
      return null
    }
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
        const token = await getAuthToken()
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
        if (filters?.departamento)    params.set('departamento',    filters.departamento);
        if (filters?.distrito)        params.set('distrito',        filters.distrito);
        if (filters?.nivelInnovacion) params.set('nivelInnovacion', filters.nivelInnovacion);
        if (filters?.sectorActividad) params.set('sectorActividad', filters.sectorActividad);

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
  }, [filters, showOnlyFinalized, currentPage, pageSize, debouncedSearchTerm]) // Recargar cuando cambien los filtros, estado de finalizados, página, tamaño de página o término de búsqueda debounced

  // Ya no necesitamos filtrar localmente porque la búsqueda se hace en el servidor
  const filteredBusinesses = businesses

  const handleBusinessSelect = (business: any) => {
    router.push(`/empresas/${business.IdEmpresa}`)
  }

  const handleDashboardView = () => {
    router.push("/dashboard")
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


  const getMaturityLevel = (puntaje: number) => {
    if (!puntaje) return "Sin evaluar"
    if (puntaje < 30) return "Inicial"
    if (puntaje < 60) return "Básico"
    if (puntaje < 80) return "Intermedio"
    return "Avanzado"
  }

  const getMaturityLevelFromPercentage = (percentage: number) => {
    if (!percentage) return "Sin evaluar"
    if (percentage < 30) return "Inicial"
    if (percentage < 60) return "Básico"
    if (percentage < 80) return "Competente"
    if (percentage < 100) return "Avanzado"
    return "Experto"
  }

  const getMaturityColor = (puntaje: number) => {
    if (!puntaje) return "bg-gray-100 text-gray-800 border-gray-200"
    if (puntaje < 30) return "bg-red-100 text-red-800 border-red-200"
    if (puntaje < 60) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    if (puntaje < 80) return "bg-blue-100 text-blue-800 border-blue-200"
    return "bg-green-100 text-green-800 border-green-200"
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
              <p className="text-xs text-gray-600 mt-1">Promedio de madurez</p>
              <p className="text-xs font-medium text-[#150773] mt-1">
                Nivel: {getMaturityLevelFromPercentage(parseFloat(kpis.nivelGeneral || '0'))}
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
                    <Badge className={`${getMaturityColor(business.puntajeNivelDeMadurezGeneral)} font-medium`}>
                      {getMaturityLevel(business.puntajeNivelDeMadurezGeneral)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      className="bg-[#f5592b] hover:bg-[#e04a1f] text-white border-0"
                      size="sm"
                      onClick={() => handleBusinessSelect(business)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
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
    </div>
  )
}
