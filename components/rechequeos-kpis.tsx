"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  BarChart3, 
  Target, 
  Users, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  Info
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { getAuthToken } from "@/lib/api-client"

interface RechequeosKPIsProps {
  filters: any
  dateRange: any
}

interface KPIData {
  cobertura: {
    tasaReincidencia: number
    promChequeosPorEmpresa: number
    tiempoPromEntreChequeosDias: number
    distribucion: {
      "1": number
      "2_3": number
      "gt_3": number
    }
  }
  magnitud: {
    deltaGlobalProm: number
    deltaPorDimension: Record<string, number>
    pctMejoraPositiva: number
    pctRegresion: number
    saltosNivel: {
      bajo_medio: number
      medio_alto: number
    }
  }
  velocidad: {
    tasaMejoraMensual: number
    indiceConsistencia: number
    ratioMejoraTemprana: number
  }
}

export function RechequeosKPIs({ filters, dateRange }: RechequeosKPIsProps) {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRetryDialog, setShowRetryDialog] = useState(false)
  const [retryCount, setRetryCount] = useState(0)


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

  // Cargar KPIs con retry logic
  useEffect(() => {
    let abortController: AbortController | null = null
    let timeoutId: NodeJS.Timeout | null = null
    
    const loadKPIs = async (isRetry = false) => {
      setLoading(true)
      setError(null)
      
      // Reset retry count if not a retry
      if (!isRetry) {
        setRetryCount(0)
      }
      
      try {
        const token = getAuthToken()
        if (!token) {
          setError("No se pudo obtener el token de autenticación")
          return
        }

        const params = buildApiParams()
        const url = `http://localhost:3001/api/rechequeos/kpis?${params.toString()}`
        
        console.log(`Loading KPIs from: ${url}${isRetry ? ' (RETRY)' : ''}`)
        
        // Create abort controller for timeout
        abortController = new AbortController()
        
        // Set timeout of 180 seconds (3 minutes) for initial request
        timeoutId = setTimeout(() => {
          if (abortController) {
            abortController.abort()
          }
        }, 180000) // 180 seconds
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })
        
        // Clear timeout on success
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API Error:', response.status, errorText)
          
          // If timeout (408) or server error (500), try retry
          if ((response.status === 408 || response.status === 500) && !isRetry && retryCount === 0) {
            console.log('Request failed, will retry in 5 seconds...')
            setRetryCount(1)
            setTimeout(() => {
              loadKPIs(true) // Retry once
            }, 5000)
            return
          }
          
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('KPIs loaded:', data)
        setKpis(data)
        setRetryCount(0) // Reset on success
        
      } catch (error: any) {
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        const errorName = typeof error === 'object' && error !== null ? error.name : ''
        const errorMessage = typeof error === 'string' ? error : error?.message
        
        // Handle abort-related scenarios first so we don't log noise
        if (errorName === 'AbortError' || errorMessage === 'Component unmounted') {
          if (errorMessage === 'Component unmounted') {
            console.log('[KPIs] Request cancelled: component unmounted')
            return
          }
          
          // If this was a retry that also timed out, show dialog
          if (isRetry || retryCount > 0) {
            setError("La solicitud está tardando demasiado. Por favor, recarga la página.")
            setShowRetryDialog(true)
          } else {
            // First timeout - retry once with shorter timeout (60s grace period)
            console.log('Request timed out, retrying with 60s grace period...')
            setRetryCount(1)
            setTimeout(() => {
              loadKPIs(true) // Retry once
            }, 2000) // Wait 2 seconds before retry
          }
          return
        }
        
        console.error('Error loading KPIs:', error)
        
        if (errorMessage?.includes('500') || errorMessage?.includes('Timeout')) {
          // Server error or timeout - retry once if not already retried
          if (!isRetry && retryCount === 0) {
            console.log('Server error, will retry in 5 seconds...')
            setRetryCount(1)
            setTimeout(() => {
              loadKPIs(true) // Retry once
            }, 5000)
            return
          } else {
            // Already retried, show error
            setError(`Error cargando KPIs: ${error instanceof Error ? error.message : 'Error desconocido'}`)
            setShowRetryDialog(true)
          }
        } else {
          setError(`Error cargando KPIs: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        }
      } finally {
        setLoading(false)
      }
    }

    loadKPIs()
    
    // Cleanup on unmount or filter change
    return () => {
      if (abortController) {
        abortController.abort('Component unmounted')
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [filters, dateRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#f5592b]" />
          <p className="text-lg text-gray-600">Cargando KPIs de Rechequeos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-100 border border-red-300 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!kpis) {
    return null
  }

  // Helper function to format percentage
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  // Helper function to format number
  const formatNumber = (value: number) => {
    return value.toFixed(1)
  }

  // Helper function to format days
  const formatDays = (days: number) => {
    if (days < 30) {
      return `${days.toFixed(0)} días`
    } else if (days < 365) {
      return `${(days / 30.417).toFixed(1)} meses`
    } else {
      return `${(days / 365).toFixed(1)} años`
    }
  }

  return (
    <>
      <AlertDialog open={showRetryDialog} onOpenChange={setShowRetryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tiempo de espera agotado</AlertDialogTitle>
            <AlertDialogDescription>
              La carga de KPIs está tardando más de lo esperado. Por favor, recarga la página para intentar nuevamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => window.location.reload()}>
              Recargar Página
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="space-y-6" data-kpi-loaded="true">
      {/* Cobertura y Frecuencia */}
      <div>
        <h2 className="text-xl font-semibold text-[#150773] mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Cobertura y Frecuencia
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-[#f5592b]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">Tasa de Reincidencia</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Empresas con ≥2 chequeos / Empresas con ≥1 chequeo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#f5592b]">
                {formatPercentage(kpis.cobertura.tasaReincidencia)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Empresas que repiten</p>
            </CardContent>
          </Card>

          <Card className="border-[#150773]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">Promedio de Chequeos</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total de chequeos / Empresas únicas</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#f5592b]">
                {formatNumber(kpis.cobertura.promChequeosPorEmpresa)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Por empresa</p>
            </CardContent>
          </Card>

          <Card className="border-[#f5592b]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">Tiempo Promedio</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Promedio de tiempo entre chequeos consecutivos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-1">
                <div className="text-2xl font-bold text-[#150773]">
                  {formatDays(kpis.cobertura.tiempoPromEntreChequeosDias)}
                </div>
                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-gray-200">
                  {kpis.cobertura.tiempoPromEntreChequeosDias.toFixed(0)} días
                </Badge>
              </div>
              <p className="text-xs text-gray-600">Entre chequeos</p>
            </CardContent>
          </Card>

          <Card className="border-[#150773]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">Distribución</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Distribución por número de chequeos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>1 chequeo:</span>
                  <span className="font-semibold">{kpis.cobertura.distribucion["1"]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>2-3 chequeos:</span>
                  <span className="font-semibold">{kpis.cobertura.distribucion["2_3"]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>&gt;3 chequeos:</span>
                  <span className="font-semibold">{kpis.cobertura.distribucion["gt_3"]}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Magnitud del Cambio */}
      <div>
        <h2 className="text-xl font-semibold text-[#150773] mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Magnitud del Cambio
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-[#f5592b]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">Δ Global Promedio</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Promedio por empresa de (Puntaje último - Puntaje primero)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center gap-1 ${
                kpis.magnitud.deltaGlobalProm >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {kpis.magnitud.deltaGlobalProm >= 0 ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownRight className="h-5 w-5" />
                )}
                {formatNumber(kpis.magnitud.deltaGlobalProm)}%
              </div>
              <p className="text-xs text-gray-600 mt-1">Cambio promedio</p>
            </CardContent>
          </Card>

          <Card className="border-[#150773]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">% Mejora Positiva</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>% de empresas con Δ Global &gt; 0</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#f5592b]">
                {formatPercentage(kpis.magnitud.pctMejoraPositiva)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Empresas mejorando</p>
            </CardContent>
          </Card>

          <Card className="border-[#150773]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">% Regresión</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>% de empresas con Δ Global &lt; 0</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatPercentage(kpis.magnitud.pctRegresion)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Empresas con bajada</p>
            </CardContent>
          </Card>

          <Card className="border-[#f5592b]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">Escalones de Nivel</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>% de empresas que cambian de nivel de madurez</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bajo→Medio:</span>
                  <span className="text-lg font-bold text-[#150773]">
                    {formatPercentage(kpis.magnitud.saltosNivel.bajo_medio)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Medio→Alto:</span>
                  <span className="text-lg font-bold text-[#f5592b]">
                    {formatPercentage(kpis.magnitud.saltosNivel.medio_alto)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Velocidad y Sostenibilidad */}
      <div>
        <h2 className="text-xl font-semibold text-[#150773] mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Velocidad y Sostenibilidad
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-[#f5592b]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">Tasa Mejora Mensual</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Δ Global / meses entre primer y último chequeo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#f5592b]">
                {formatNumber(kpis.velocidad.tasaMejoraMensual)}%
              </div>
              <p className="text-xs text-gray-600 mt-1">Por mes</p>
            </CardContent>
          </Card>

          <Card className="border-[#150773]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">Índice Consistencia</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>% de empresas que no retroceden en ninguna transición</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#f5592b]">
                {formatPercentage(kpis.velocidad.indiceConsistencia)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Empresas consistentes</p>
            </CardContent>
          </Card>

          <Card className="border-[#f5592b]/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#150773]">Ratio Mejora Temprana</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>(Puntaje 2 - Puntaje 1) / (Puntaje último - Puntaje 1)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#150773]">
                {formatPercentage(kpis.velocidad.ratioMejoraTemprana)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Mejora inicial</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delta por Dimensión */}
      <div>
        <h2 className="text-xl font-semibold text-[#150773] mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Δ por Dimensión
        </h2>
        <Card className="border-[#f5592b]/20">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(kpis.magnitud.deltaPorDimension).map(([dimension, delta]) => (
                <div key={dimension} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 text-sm">{dimension}</span>
                    <span className={`font-bold text-sm flex items-center gap-1 ${
                      delta >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {delta >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {formatNumber(delta)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.abs(delta)}
                    className="h-2"
                    style={
                      {
                        "--progress-background": delta >= 0 ? "#10b981" : "#ef4444",
                      } as React.CSSProperties
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  )
}
