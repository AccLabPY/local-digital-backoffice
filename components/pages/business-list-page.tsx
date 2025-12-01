"use client"

import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Download, FileSpreadsheet, FileText } from "lucide-react"
import { BusinessList } from "@/components/business-list"
import { FilterPanel } from "@/components/filter-panel"
import { getAuthToken } from "@/lib/api-client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function BusinessListPage() {
  const [filters, setFilters] = useState({
    departamento: "",
    distrito: "",
    nivelInnovacion: "",
    sectorActividad: "",
    estadoEncuesta: "completada",
  })
  
  const [dateRange, setDateRange] = useState({
    fechaIni: null,
    fechaFin: null
  })
  
  const [activeDateFilter, setActiveDateFilter] = useState('todos')
  
  // Función para construir parámetros de filtros para la API
  const buildApiParams = () => {
    const params = new URLSearchParams()
    
    // Agregar parámetros requeridos
    params.append('finalizado', '1')
    params.append('searchTerm', '')
    
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
  
  // Función para exportar datos
  const handleExport = async (format: 'xlsx' | 'pdf') => {
    try {
      const token = getAuthToken()
      if (!token) {
        console.error("No se pudo obtener el token de autenticación")
        alert("Error: No se pudo obtener el token de autenticación. Por favor, recarga la página.")
        return
      }

      const params = buildApiParams()
      params.append('format', format)
      params.append('fileName', 'reporte-empresas')
      
      const url = `http://localhost:3001/api/empresas/export-comprehensive?${params.toString()}`
      
      console.log(`[EXPORT] Iniciando exportación - formato: ${format}, URL: ${url}`)
      
      // Mostrar indicador de carga
      const loadingMessage = format === 'pdf' ? 'Generando PDF...' : 'Generando Excel...'
      console.log(loadingMessage)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      // Verificar que la respuesta sea OK (verificar antes de leer el body)
      console.log(`[EXPORT] Status: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        // Clonar el response para leer el error sin consumir el original
        const errorResponse = response.clone()
        let errorMessage = `Error ${response.status}: ${response.statusText}`
        try {
          const errorData = await errorResponse.json()
          if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (e) {
          // Si no se puede parsear el JSON, intentar leer como texto
          try {
            const text = await errorResponse.text()
            if (text) {
              errorMessage = text
            }
          } catch (e2) {
            // Si no se puede leer, usar el mensaje por defecto
            console.error(`[EXPORT] No se pudo leer el error:`, e2)
          }
        }
        console.error(`[EXPORT] Error en la respuesta:`, errorMessage)
        alert(`Error al exportar: ${errorMessage}`)
        return
      }
      
      // Verificar que el contenido sea un archivo (leer content-type)
      const contentType = response.headers.get('content-type')
      console.log(`[EXPORT] Content-Type recibido: ${contentType}`)
      
      // Crear blob solo si el status es OK
      const blob = await response.blob()
      console.log(`[EXPORT] Blob creado - tamaño: ${blob.size} bytes`)
      
      // Verificar que el blob no esté vacío
      if (blob.size === 0) {
        alert('Error: El archivo generado está vacío. Por favor, intenta nuevamente.')
        return
      }
      
      // Verificar que el content-type sea un archivo válido
      const isValidFile = contentType && (
        contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || 
        contentType.includes('application/pdf') || 
        contentType.includes('application/octet-stream')
      )
      
      if (!isValidFile) {
        console.error(`[EXPORT] Content-Type no válido: ${contentType}`)
        // Intentar leer como JSON para ver el error
        try {
          const text = await blob.text()
          const errorData = JSON.parse(text)
          console.error(`[EXPORT] Error del servidor:`, errorData)
          alert(`Error al exportar: ${errorData.message || 'Respuesta inesperada del servidor'}`)
        } catch (e) {
          alert(`Error al exportar: El servidor no devolvió un archivo válido (Content-Type: ${contentType})`)
        }
        return
      }
      
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `reporte-empresas.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      console.log(`[EXPORT] Descarga completada: reporte-empresas.${format}`)
      
    } catch (error) {
      console.error('[EXPORT] Error exporting data:', error)
      alert(`Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`)
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
    
    setDateRange({ fechaIni, fechaFin })
    setActiveDateFilter(period)
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 bg-white">
        <SidebarTrigger className="-ml-1 text-[#150773]" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[#150773]">Empresas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50">
        <div className="space-y-6">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
            <h1 className="text-3xl font-bold text-[#150773]">Empresas</h1>
            <p className="text-gray-600 mt-2">
              Explora y gestiona el directorio de empresas participantes en el programa de innovación
            </p>
          </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-[#150773] hover:bg-[#0f0559] text-white border-0">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Reporte
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Formato de exportación</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    <div>
                      <p className="font-medium">Excel (XLSX)</p>
                      <p className="text-xs text-gray-500">Resumen + Listado completo</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="h-4 w-4 mr-2 text-red-600" />
                    <div>
                      <p className="font-medium">PDF</p>
                      <p className="text-xs text-gray-500">Resumen ejecutivo</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                    className={activeDateFilter === 'todos' ? 'bg-[#f5592b] text-white hover:bg-[#f5592b]/90 hover:text-white border-[#f5592b]' : ''}
                  >
                    Todos los tiempos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickDateFilter('este_mes')}
                    className={activeDateFilter === 'este_mes' ? 'bg-[#f5592b] text-white hover:bg-[#f5592b]/90 hover:text-white border-[#f5592b]' : ''}
                  >
                    Este mes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickDateFilter('este_semestre')}
                    className={activeDateFilter === 'este_semestre' ? 'bg-[#f5592b] text-white hover:bg-[#f5592b]/90 hover:text-white border-[#f5592b]' : ''}
                  >
                    Este semestre
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickDateFilter('este_año')}
                    className={activeDateFilter === 'este_año' ? 'bg-[#f5592b] text-white hover:bg-[#f5592b]/90 hover:text-white border-[#f5592b]' : ''}
                  >
                    Este año
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickDateFilter('año_pasado')}
                    className={activeDateFilter === 'año_pasado' ? 'bg-[#f5592b] text-white hover:bg-[#f5592b]/90 hover:text-white border-[#f5592b]' : ''}
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
                        setDateRange(prev => ({ ...prev, fechaIni: e.target.value || null }))
                        setActiveDateFilter('custom')
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
                        setDateRange(prev => ({ ...prev, fechaFin: e.target.value || null }))
                        setActiveDateFilter('custom')
                      }}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm w-40"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <FilterPanel filters={filters} onFiltersChange={setFilters} />
          <BusinessList filters={filters} dateRange={dateRange} />
        </div>
      </div>
    </>
  )
}
