"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Building2, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Eye,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { useRouter } from "next/navigation"
import { getAuthToken } from "@/lib/api-client"

interface RechequeosTableProps {
  filters: any
  dateRange: any
}

interface TableRowData {
  IdEmpresa: number
  EmpresaNombre: string
  NombreUsuario: string
  SectorActividad: string
  TamanoEmpresa: string
  Ubicacion: string
  Departamento: string
  Distrito: string
  TotalChequeos: number
  PrimeraFechaFormatted: string
  UltimaFechaFormatted: string
  PrimerPuntaje: number
  UltimoPuntaje: number
  DeltaGlobal: number
  DeltaTecnologia: number
  DeltaComunicacion: number
  DeltaOrganizacion: number
  DeltaDatos: number
  DeltaEstrategia: number
  DeltaProcesos: number
  PrimerNivel: string
  UltimoNivel: string
  DiasEntreChequeos: number
  TasaMejoraMensual: number
  SaltoBajoMedio: number
  SaltoMedioAlto: number
}

// Helper functions
const getDeltaColor = (delta: number) => {
  if (delta > 0) return "text-green-600"
  if (delta < 0) return "text-red-600"
  return "text-gray-400"
}

const getDeltaIcon = (delta: number) => {
  if (delta > 0) return <TrendingUp className="h-3 w-3 text-green-600" />
  if (delta < 0) return <TrendingDown className="h-3 w-3 text-red-600" />
  return <Minus className="h-3 w-3 text-gray-400" />
}

const getNivelColor = (nivel: string) => {
  const colorByNivel: Record<string, string> = {
    'Inicial': 'bg-red-100 text-red-800 border-red-200',
    'Novato': 'bg-amber-100 text-amber-800 border-amber-200',
    'Competente': 'bg-blue-100 text-blue-800 border-blue-200',
    'Avanzado': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Experto': 'bg-purple-100 text-purple-800 border-purple-200'
  }
  return colorByNivel[nivel] || "bg-gray-100 text-gray-800 border-gray-200"
}

const getNivelOrder = (nivel: string): number => {
  const orderByNivel: Record<string, number> = {
    'Inicial': 1,
    'Novato': 2,
    'Competente': 3,
    'Avanzado': 4,
    'Experto': 5
  }
  return orderByNivel[nivel] || 0
}

const getNivelChange = (primerNivel: string, ultimoNivel: string): string => {
  const primerOrder = getNivelOrder(primerNivel)
  const ultimoOrder = getNivelOrder(ultimoNivel)
  
  if (primerOrder === 0 || ultimoOrder === 0) return 'N/A'
  if (primerOrder === ultimoOrder) return 'Mantuvo'
  if (ultimoOrder > primerOrder) return 'Subió'
  return 'Bajó'
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

export function RechequeosTable({ filters, dateRange }: RechequeosTableProps) {
  const [allData, setAllData] = useState<TableRowData[]>([]) // Todos los datos cargados
  const [loading, setLoading] = useState(true)
  const [processingData, setProcessingData] = useState(false) // Overlay loader
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)
  const router = useRouter()

  // Debounce para búsqueda (espera 500ms después de que el usuario deje de escribir)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Solo buscar si hay 3 o más caracteres, o si está vacío (para limpiar)
      if (searchTerm.length >= 3 || searchTerm.length === 0) {
        setDebouncedSearchTerm(searchTerm)
        setCurrentPage(1) // Reset a la primera página al buscar
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Función para manejar el sorting (solo frontend, no recarga datos)
  const handleSort = (column: string) => {
    setProcessingData(true) // Mostrar overlay
    setTimeout(() => {
      if (sortColumn === column) {
        // Si ya está ordenado por esta columna, cambiar dirección o resetear
        if (sortDirection === 'asc') {
          setSortDirection('desc')
        } else if (sortDirection === 'desc') {
          setSortColumn(null)
          setSortDirection(null)
        }
      } else {
        // Nueva columna, ordenar ascendente
        setSortColumn(column)
        setSortDirection('asc')
      }
      setCurrentPage(1) // Reset a la primera página al ordenar
      setProcessingData(false) // Ocultar overlay
    }, 100) // Pequeño delay para mostrar el loader
  }

  // Función para obtener el ícono de sorting
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1 text-[#f5592b]" />
    }
    return <ArrowDown className="h-4 w-4 ml-1 text-[#f5592b]" />
  }


  // Función para construir parámetros de filtros para la API (solo filtros, sin paginación ni sorting)
  const buildApiParams = () => {
    const params = new URLSearchParams()
    
    // Agregar filtros básicos
    if (filters.departamento && filters.departamento.length > 0) {
      filters.departamento.forEach((dep: string) => params.append('departamento', dep))
    }
    if (filters.distrito && filters.distrito.length > 0) {
      filters.distrito.forEach((dist: string) => params.append('distrito', dist))
    }
    if (filters.nivelInnovacion && filters.nivelInnovacion.length > 0) {
      filters.nivelInnovacion.forEach((nivel: string) => params.append('nivelInnovacion', nivel))
    }
    if (filters.sectorActividad && filters.sectorActividad.length > 0) {
      filters.sectorActividad.forEach((sector: string) => params.append('sectorActividad', sector))
    }
    if (filters.subSectorActividad && filters.subSectorActividad.length > 0) {
      filters.subSectorActividad.forEach((subsector: string) => params.append('subSectorActividad', subsector))
    }
    if (filters.tamanoEmpresa && filters.tamanoEmpresa.length > 0) {
      filters.tamanoEmpresa.forEach((tamano: string) => params.append('tamanoEmpresa', tamano))
    }
    
    // Agregar rango de fechas
    if (dateRange.fechaIni) {
      params.append('fechaIni', dateRange.fechaIni)
    }
    if (dateRange.fechaFin) {
      params.append('fechaFin', dateRange.fechaFin)
    }
    
    // Traer todos los datos de una vez (limit alto)
    params.append('page', '1')
    params.append('limit', '10000') // Limit muy alto para traer todo
    
    return params
  }

  // Cargar TODOS los datos de la tabla (solo cuando cambian filtros o fechas)
  useEffect(() => {
    const loadTableData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const token = getAuthToken() // Use imported synchronous function
        if (!token) {
          setError("No se pudo obtener el token de autenticación")
          return
        }

        const params = buildApiParams()
        const url = `http://localhost:3001/api/rechequeos/tabla?${params.toString()}`
        
        console.log('Loading ALL table data from:', url)
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('Table API Error:', response.status, errorText)
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('ALL table data loaded:', result.data.length, 'records')
        setAllData(result.data) // Guardar TODOS los datos
        setCurrentPage(1) // Reset a primera página
        
      } catch (error) {
        console.error('Error loading table data:', error)
        setError(`Error cargando datos de tabla: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      } finally {
        setLoading(false)
      }
    }

    loadTableData()
    // Solo recargar cuando cambien filtros o fechas, NO cuando cambie search/sort
  }, [filters, dateRange])

  // Procesar datos localmente (búsqueda, sorting y paginación en frontend)
  const getProcessedData = () => {
    let processedData = [...allData]
    
    // 1. Aplicar búsqueda (si hay término de búsqueda)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      processedData = processedData.filter(row => 
        row.EmpresaNombre?.toLowerCase().includes(searchLower) ||
        row.SectorActividad?.toLowerCase().includes(searchLower) ||
        row.NombreUsuario?.toLowerCase().includes(searchLower)
      )
    }
    
    // 2. Aplicar sorting (si hay columna seleccionada)
    if (sortColumn && sortDirection) {
      processedData.sort((a, b) => {
        let aValue: any = a[sortColumn as keyof TableRowData]
        let bValue: any = b[sortColumn as keyof TableRowData]
        
        // Manejar casos especiales de sorting
        if (sortColumn === 'DeltaGlobal') {
          aValue = a.UltimoPuntaje - a.PrimerPuntaje
          bValue = b.UltimoPuntaje - b.PrimerPuntaje
        } else if (sortColumn === 'TasaMejoraMensual') {
          aValue = a.TasaMejoraMensual || 0
          bValue = b.TasaMejoraMensual || 0
        }
        
        // Comparación
        if (aValue == null) return 1
        if (bValue == null) return -1
        
        if (typeof aValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        } else {
          return sortDirection === 'asc'
            ? aValue - bValue
            : bValue - aValue
        }
      })
    }
    
    return processedData
  }
  
  // Obtener datos paginados
  const getPaginatedData = () => {
    const processedData = getProcessedData()
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return processedData.slice(startIndex, endIndex)
  }
  
  // Calcular totales para paginación
  const filteredCount = getProcessedData().length
  const totalPages = Math.ceil(filteredCount / pageSize)

  // Función para manejar cambio de página
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  // Función para manejar cambio de tamaño de página
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Resetear a la primera página
  }
  
  // Datos a mostrar en la tabla
  const tableData = getPaginatedData()

  // Función para exportar datos
  const handleExport = async () => {
    try {
      console.log('[Table CSV Export] Starting table CSV export...')
      const token = getAuthToken()
      if (!token) {
        console.error('[Table CSV Export] No token available')
        setError("No se pudo obtener el token de autenticación")
        return
      }

      const params = buildApiParams()
      params.delete('page') // Remover paginación para exportar todo
      params.delete('limit')
      params.append('format', 'csv')
      params.append('fileName', 'rechequeos-detalle')
      
      const url = `http://localhost:3001/api/rechequeos/export?${params.toString()}`
      console.log('[Table CSV Export] Requesting URL:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      console.log('[Table CSV Export] Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Table CSV Export] Error response:', errorText)
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      // Crear blob y descargar
      const blob = await response.blob()
      console.log('[Table CSV Export] Blob size:', blob.size, 'type:', blob.type)
      
      if (blob.size === 0) {
        throw new Error('El archivo CSV está vacío')
      }
      
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'rechequeos-detalle.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      console.log('[Table CSV Export] CSV downloaded successfully')
      
    } catch (error) {
      console.error('[Table CSV Export] Error:', error)
      setError(`Error al exportar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  // Función para obtener color del nivel
  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'Inicial': return 'bg-red-100 text-red-800 border-red-200'
      case 'Novato': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Competente': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Avanzado': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Función para obtener color del delta
  const getDeltaColor = (delta: number) => {
    if (delta > 0) return 'text-green-600'
    if (delta < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  // Función para obtener icono del delta
  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <ArrowUpRight className="h-3 w-3" />
    if (delta < 0) return <ArrowDownRight className="h-3 w-3" />
    return null
  }

  // Función para navegar a detalles de empresa
  const handleViewDetails = (idEmpresa: number) => {
    router.push(`/empresas/${idEmpresa}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#f5592b]" />
          <p className="text-lg text-gray-600">Cargando tabla de Rechequeos...</p>
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
        </div>
      </div>
    )
  }

  return (
    <Card className="border-[#150773]/20 relative">
      {/* Overlay loader para sorting/búsqueda */}
      {processingData && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg px-4 py-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#f5592b]" />
            <span className="text-sm font-medium text-gray-700">Procesando...</span>
          </div>
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#150773] flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Detalle por Empresa
          </CardTitle>
          <Button
            onClick={handleExport}
            className="bg-[#f5592b] hover:bg-[#e04a1f] text-white border-0"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 pb-3">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por empresa, sector o usuario (mín. 3 caracteres)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-[#150773]/20 focus:border-[#f5592b] focus:ring-[#f5592b]"
          />
          {searchTerm.length > 0 && searchTerm.length < 3 && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-amber-600">
              {3 - searchTerm.length} más
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Mostrando {tableData.length} de {filteredCount} empresas con múltiples chequeos
        </p>
      </CardContent>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-[#150773] font-semibold w-48">
                  <button
                    onClick={() => handleSort('EmpresaNombre')}
                    className="flex items-center hover:text-[#f5592b] transition-colors"
                  >
                    Empresa
                    {getSortIcon('EmpresaNombre')}
                  </button>
                </TableHead>
                <TableHead className="text-[#150773] font-semibold">
                  <button
                    onClick={() => handleSort('TamanoEmpresa')}
                    className="flex items-center hover:text-[#f5592b] transition-colors"
                  >
                    Tamaño
                    {getSortIcon('TamanoEmpresa')}
                  </button>
                </TableHead>
                <TableHead className="text-[#150773] font-semibold w-48">
                  <button
                    onClick={() => handleSort('SectorActividad')}
                    className="flex items-center hover:text-[#f5592b] transition-colors"
                  >
                    Sector
                    {getSortIcon('SectorActividad')}
                  </button>
                </TableHead>
                <TableHead className="text-[#150773] font-semibold w-32">Ubicación</TableHead>
                <TableHead className="text-[#150773] font-semibold">
                  <button
                    onClick={() => handleSort('DiasEntreChequeos')}
                    className="flex items-center hover:text-[#f5592b] transition-colors"
                  >
                    Período
                    {getSortIcon('DiasEntreChequeos')}
                  </button>
                </TableHead>
                <TableHead className="text-[#150773] font-semibold">
                  <button
                    onClick={() => handleSort('DeltaGlobal')}
                    className="flex items-center hover:text-[#f5592b] transition-colors"
                  >
                    Δ Global
                    {getSortIcon('DeltaGlobal')}
                  </button>
                </TableHead>
                <TableHead className="text-[#150773] font-semibold w-32">Niveles</TableHead>
                <TableHead className="text-[#150773] font-semibold">
                  <button
                    onClick={() => handleSort('TasaMejoraMensual')}
                    className="flex items-center hover:text-[#f5592b] transition-colors"
                  >
                    Tasa Mensual
                    {getSortIcon('TasaMejoraMensual')}
                  </button>
                </TableHead>
                <TableHead className="text-[#150773] font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, index) => (
                <TableRow key={`${row.IdEmpresa}-${index}`} className="hover:bg-gray-50">
            <TableCell className="w-48">
              <div className="font-semibold text-[#150773] mb-1">{row.EmpresaNombre}</div>
              <div className="text-xs text-gray-500">
                {row.NombreUsuario || 'N/A'}
              </div>
            </TableCell>
                  <TableCell>
                    {row.TamanoEmpresa && (
                      <Badge className={`${getCompanySizeColor(row.TamanoEmpresa)} text-xs`}>
                        {getCompanySize(row.TamanoEmpresa)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-700">{row.SectorActividad}</div>
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-gray-400" />
                      <div className="text-xs text-gray-700">
                        {(() => {
                          const ubicacion = row.Ubicacion || '';
                          const [distrito, departamento] = ubicacion.includes(',') 
                            ? ubicacion.split(',').map(s => s.trim())
                            : [ubicacion, ''];
                          
                          return (
                            <>
                              <div>{departamento || 'Sin departamento'}</div>
                              <div className="text-gray-500">{distrito || 'Sin distrito'}</div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs">{row.PrimeraFechaFormatted}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs">{row.UltimaFechaFormatted}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const dias = row.DiasEntreChequeos || 0;
                          if (dias < 30) {
                            return `${dias} días`;
                          } else if (dias < 365) {
                            const meses = Math.round(dias / 30.417);
                            return `${meses} meses (${dias} días)`;
                          } else {
                            const años = Math.round(dias / 365);
                            return `${años} años (${dias} días)`;
                          }
                        })()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${getDeltaColor(row.DeltaGlobal)}`}>
                      {getDeltaIcon(row.DeltaGlobal)}
                      <span className="font-semibold">{(row.DeltaGlobal || 0).toFixed(1)}%</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {(row.PrimerPuntaje || 0).toFixed(1)} → {(row.UltimoPuntaje || 0).toFixed(1)}
                    </div>
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-1">
                        <Badge className={`${getNivelColor(row.PrimerNivel)} text-xs px-2 py-0`}>
                          {row.PrimerNivel}
                        </Badge>
                        {(() => {
                          const change = getNivelChange(row.PrimerNivel, row.UltimoNivel)
                          if (change === 'Subió') return <ArrowUpRight className="h-3 w-3 text-green-600" />
                          if (change === 'Bajó') return <ArrowDownRight className="h-3 w-3 text-red-600" />
                          return <Minus className="h-3 w-3 text-gray-400" />
                        })()}
                        <Badge className={`${getNivelColor(row.UltimoNivel)} text-xs px-2 py-0`}>
                          {row.UltimoNivel}
                        </Badge>
                      </div>
                      <div className={`text-xs text-center font-medium ${
                        getNivelChange(row.PrimerNivel, row.UltimoNivel) === 'Subió' ? 'text-green-600' :
                        getNivelChange(row.PrimerNivel, row.UltimoNivel) === 'Bajó' ? 'text-red-600' :
                        'text-gray-500'
                      }`}>
                        {getNivelChange(row.PrimerNivel, row.UltimoNivel)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-1 ${getDeltaColor(row.TasaMejoraMensual)}`}>
                      {row.TasaMejoraMensual > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : row.TasaMejoraMensual < 0 ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      <span className="text-sm font-medium">{(row.TasaMejoraMensual || 0).toFixed(2)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(row.IdEmpresa)}
                      className="border-[#f5592b] text-[#f5592b] hover:bg-[#f5592b] hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {tableData.length === 0 && !loading && (
          <div className="text-center py-12 bg-gray-50">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No se encontraron empresas</h3>
            <p className="text-gray-600">No hay empresas con múltiples chequeos que coincidan con los filtros.</p>
          </div>
        )}
        
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
      </CardContent>
    </Card>
  )
}
