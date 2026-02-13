"use client"

import { useState, useEffect } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RotateCcw, Download, Calendar, TrendingUp, BarChart3, Target, Loader2 } from "lucide-react"
import { FilterPanel } from "@/components/filter-panel"
import { RechequeosKPIs } from "@/components/rechequeos-kpis"
import { RechequeosCharts } from "@/components/rechequeos-charts"
import { RechequeosTable } from "@/components/rechequeos-table"
import { getAuthToken } from "@/lib/api-client"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { useToast } from "@/hooks/use-toast"

export function RechequeosPage() {
  const [filters, setFilters] = useState({
    departamento: [],
    distrito: [],
    nivelInnovacion: [],
    sectorActividad: [],
    subSectorActividad: [],
    tamanoEmpresa: [],
    estadoEncuesta: "completada",
  })
  const [dateRange, setDateRange] = useState({
    fechaIni: null,
    fechaFin: null
  })
  const [activeDateFilter, setActiveDateFilter] = useState('todos')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const { toast } = useToast()
  
  // Lazy loading states
  const [loadKPIs, setLoadKPIs] = useState(true) // KPIs se cargan inmediatamente
  const [loadCharts, setLoadCharts] = useState(false) // Charts con delay
  const [loadTable, setLoadTable] = useState(false) // Tabla con delay mayor
  const [kpisLoadTime, setKpisLoadTime] = useState<number>(0) // Tiempo de carga de KPIs
  const [shouldPrefetch, setShouldPrefetch] = useState(false) // Prefetch si carga rápido

  // Lazy loading dinámico basado en rendimiento de KPIs
  useEffect(() => {
    const kpisStartTime = Date.now()
    
    // Monitorear cuando los KPIs terminan de cargar
    const checkKpisLoaded = setInterval(() => {
      // Verificamos si hay KPIs en pantalla (heurística simple)
      const kpiElements = document.querySelectorAll('[data-kpi-loaded="true"]')
      if (kpiElements.length > 0) {
        const loadTime = Date.now() - kpisStartTime
        setKpisLoadTime(loadTime)
        clearInterval(checkKpisLoaded)
        
        // PREFETCH: Si KPIs cargan rápido (< 10s), pre-cargar todo inmediatamente
        if (loadTime < 10000) {
          console.log('[LAZY LOADING] KPIs cargaron rápido, activando prefetch inmediato')
          setShouldPrefetch(true)
          setLoadCharts(true)
          setLoadTable(true)
        } 
        // NORMAL: Si KPIs tardan moderado (10-20s), delays normales
        else if (loadTime < 20000) {
          console.log('[LAZY LOADING] KPIs carga normal, delays estándar')
          setTimeout(() => setLoadCharts(true), 300)
          setTimeout(() => setLoadTable(true), 600)
        }
        // LENTO: Si KPIs tardan mucho (>20s), priorizar tabla sobre charts
        else {
          console.log('[LAZY LOADING] KPIs tardaron mucho, priorizando tabla')
          setTimeout(() => setLoadTable(true), 200) // Tabla primero
          setTimeout(() => setLoadCharts(true), 800) // Charts después
        }
      }
    }, 500)
    
    // Timeout de seguridad: después de 30s, cargar todo
    const fallbackTimer = setTimeout(() => {
      console.log('[LAZY LOADING] Timeout de seguridad, cargando todo')
      clearInterval(checkKpisLoaded)
      setLoadCharts(true)
      setLoadTable(true)
    }, 30000)
    
    return () => {
      clearInterval(checkKpisLoaded)
      clearTimeout(fallbackTimer)
    }
  }, [])

  // Función para construir parámetros de filtros para la API
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
    
    return params
  }

  // Función para manejar cambios en filtros
  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  // Función para manejar cambios en rango de fechas
  const handleDateRangeChange = (newDateRange: any) => {
    setDateRange(newDateRange)
  }

  // Función para exportar datos CSV
  const handleExportCSV = async () => {
    try {
      console.log('[CSV Export] Starting CSV export...')
      const token = getAuthToken()
      if (!token) {
        console.error('[CSV Export] No token available')
        setError("No se pudo obtener el token de autenticación")
        return
      }

      const params = buildApiParams()
      params.append('format', 'csv')
      params.append('fileName', 'rechequeos')
      
      const url = `http://localhost:3001/api/rechequeos/export?${params.toString()}`
      console.log('[CSV Export] Requesting URL:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      console.log('[CSV Export] Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[CSV Export] Error response:', errorText)
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      // Crear blob y descargar
      const blob = await response.blob()
      console.log('[CSV Export] Blob size:', blob.size, 'type:', blob.type)
      
      if (blob.size === 0) {
        throw new Error('El archivo CSV está vacío')
      }
      
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'rechequeos.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      console.log('[CSV Export] CSV downloaded successfully')
      
    } catch (error) {
      console.error('[CSV Export] Error:', error)
      setError(`Error al exportar CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  // Función para exportar datos PDF
  const handleExportPDF = async () => {
    try {
      setIsGeneratingPDF(true)
      setError(null)
      
      // Mostrar toast de inicio
      toast({
        title: "Generando reporte PDF",
        description: "Por favor espere, esto puede tomar unos momentos...",
        duration: 0, // No se cierra automáticamente
      })
      
      console.log('[PDF Export] Starting PDF export...')
      const token = getAuthToken()
      if (!token) {
        console.error('[PDF Export] No token available')
        setError("No se pudo obtener el token de autenticación")
        setIsGeneratingPDF(false)
        toast({
          title: "Error",
          description: "No se pudo obtener el token de autenticación",
          variant: "destructive",
        })
        return
      }

      const params = buildApiParams()
      params.append('fileName', 'rechequeos-report')
      
      const url = `http://localhost:3001/api/rechequeos/export-pdf?${params.toString()}`
      console.log('[PDF Export] Requesting URL:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      console.log('[PDF Export] Response status:', response.status)
      console.log('[PDF Export] Response headers:', response.headers)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[PDF Export] Error response:', errorText)
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      // Crear blob y descargar
      const blob = await response.blob()
      console.log('[PDF Export] Blob size:', blob.size, 'type:', blob.type)
      
      if (blob.size === 0) {
        throw new Error('El archivo PDF está vacío')
      }
      
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = 'rechequeos-report.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      console.log('[PDF Export] PDF downloaded successfully')
      
      // Mostrar toast de éxito
      toast({
        title: "Reporte generado exitosamente",
        description: "El PDF se ha descargado correctamente",
      })
      
    } catch (error) {
      console.error('[PDF Export] Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(`Error al exportar PDF: ${errorMessage}`)
      toast({
        title: "Error al generar reporte",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Función para aplicar filtros rápidos de fecha
  const applyQuickDateFilter = (period: string) => {
    const now = new Date()
    let fechaIni: string | null = null
    let fechaFin: string | null = null
    
    switch (period) {
      case 'este_mes':
        fechaIni = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        fechaFin = now.toISOString().split('T')[0]
        break
      case 'este_semestre':
        const semesterStart = now.getMonth() < 6 ? 0 : 6
        fechaIni = new Date(now.getFullYear(), semesterStart, 1).toISOString().split('T')[0]
        fechaFin = now.toISOString().split('T')[0]
        break
      case 'este_año':
        fechaIni = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
        fechaFin = now.toISOString().split('T')[0]
        break
      case 'año_pasado':
        fechaIni = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0]
        fechaFin = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0]
        break
      case 'todos':
        fechaIni = null
        fechaFin = null
        break
    }
    
    setActiveDateFilter(period)
    setDateRange({ fechaIni, fechaFin })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#f5592b]" />
          <p className="text-lg text-gray-600">Cargando Rechequeos...</p>
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
    <>
      {/* Service Worker para cache en cliente */}
      <ServiceWorkerRegister />
      
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 bg-white">
        <SidebarTrigger className="-ml-1 text-[#150773]" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[#150773]">Rechequeos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50">
        <div className="space-y-6">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#150773]">Rechequeos</h1>
                <p className="text-gray-600 mt-2">
                  Análisis de evolución temporal y comparabilidad de empresas con múltiples chequeos
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-[#f5592b] text-white px-3 py-1">
                  Empresas con 2+ chequeos
                </Badge>
                <Button
                  onClick={handleExportPDF}
                  disabled={isGeneratingPDF}
                  className="bg-[#f5592b] hover:bg-[#e04a1f] text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleExportCSV}
                  className="bg-[#150773] hover:bg-[#0f0559] text-white border-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Date Filters */}
          <Card className="border-[#f5592b]/20">
            <CardHeader>
              <CardTitle className="text-[#150773] flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Filtros Rápidos de Fecha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                {/* Quick Date Filters */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickDateFilter('todos')}
                    className={activeDateFilter === 'todos' ? 'bg-[#f5592b] text-white hover:bg-[#e04a1f]' : ''}
                  >
                    Todos los tiempos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickDateFilter('este_mes')}
                    className={activeDateFilter === 'este_mes' ? 'bg-[#f5592b] text-white hover:bg-[#e04a1f]' : ''}
                  >
                    Este mes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickDateFilter('este_semestre')}
                    className={activeDateFilter === 'este_semestre' ? 'bg-[#f5592b] text-white hover:bg-[#e04a1f]' : ''}
                  >
                    Este semestre
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickDateFilter('este_año')}
                    className={activeDateFilter === 'este_año' ? 'bg-[#f5592b] text-white hover:bg-[#e04a1f]' : ''}
                  >
                    Este año
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickDateFilter('año_pasado')}
                    className={activeDateFilter === 'año_pasado' ? 'bg-[#f5592b] text-white hover:bg-[#e04a1f]' : ''}
                  >
                    Año pasado
                  </Button>
                </div>
                
                {/* Custom Date Range - Integrated in same row */}
                <div className="flex items-center gap-3 ml-auto">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Desde:</label>
                    <input
                      type="date"
                      value={dateRange.fechaIni || ''}
                      onChange={(e) => {
                        setActiveDateFilter('custom')
                        setDateRange(prev => ({ ...prev, fechaIni: e.target.value || null }))
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm w-40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Hasta:</label>
                    <input
                      type="date"
                      value={dateRange.fechaFin || ''}
                      onChange={(e) => {
                        setActiveDateFilter('custom')
                        setDateRange(prev => ({ ...prev, fechaFin: e.target.value || null }))
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm w-40"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter Panel */}
          <FilterPanel 
            filters={filters} 
            onFiltersChange={handleFiltersChange}
          />

          {/* KPIs Section - Carga inmediata (prioridad 1) */}
          {loadKPIs ? (
            <RechequeosKPIs 
              filters={filters}
              dateRange={dateRange}
            />
          ) : (
            <Card className="border-[#f5592b]/20">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#f5592b]" />
                  <p className="text-sm text-gray-600">Cargando KPIs...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts Section - Carga después de KPIs (prioridad 2) */}
          {loadCharts ? (
            <RechequeosCharts 
              filters={filters}
              dateRange={dateRange}
            />
          ) : (
            <Card className="border-[#f5592b]/20">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#150773]" />
                  <p className="text-sm text-gray-600">Preparando gráficos...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table Section - Carga al final (prioridad 3) */}
          {loadTable ? (
            <RechequeosTable 
              filters={filters}
              dateRange={dateRange}
            />
          ) : (
            <Card className="border-[#f5592b]/20">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#150773]" />
                  <p className="text-sm text-gray-600">Cargando tabla de datos...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
