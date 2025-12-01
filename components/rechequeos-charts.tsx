"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, Target, Loader2, FileSpreadsheet, Image } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"
import { getAuthToken } from "@/lib/api-client"
import { Heatmap, HeatmapData, HeatmapViewMode } from "@/components/rechequeos-heatmap/Heatmap"

interface RechequeosChartsProps {
  filters: any
  dateRange: any
}

interface EvolutionData {
  categoria: string
  periodo: string
  puntajePromedio: number
  empresasUnicas: number
}

interface HeatmapData {
  sector: string
  tecnologia: number
  comunicacion: number
  organizacion: number
  datos: number
  estrategia: number
  procesos: number
  empresasEnSector: number
}

export function RechequeosCharts({ filters, dateRange }: RechequeosChartsProps) {
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([])
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [selectedCategory, setSelectedCategory] = useState('tamano')
  const [heatmapViewMode, setHeatmapViewMode] = useState<'combined' | 'positive' | 'negative'>('combined')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


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

  // Cargar datos de gráficos
  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const token = getAuthToken()
        if (!token) {
          setError("No se pudo obtener el token de autenticación")
          return
        }

        const baseParams = buildApiParams()
        
        // Cargar datos de evolución
        const evolutionParams = new URLSearchParams(baseParams)
        evolutionParams.append('category', selectedCategory)
        const evolutionUrl = `http://localhost:3001/api/rechequeos/series/evolucion?${evolutionParams.toString()}`
        
        console.log('Loading evolution data from:', evolutionUrl)
        
        const evolutionResponse = await fetch(evolutionUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!evolutionResponse.ok) {
          const errorText = await evolutionResponse.text()
          console.error('Evolution API Error:', evolutionResponse.status, errorText)
          throw new Error(`Error ${evolutionResponse.status}: ${evolutionResponse.statusText}`)
        }
        
        const evolutionData = await evolutionResponse.json()
        console.log('Evolution data loaded:', evolutionData)
        setEvolutionData(evolutionData)
        
        // Cargar datos de heatmap
        const heatmapUrl = `http://localhost:3001/api/rechequeos/heatmap/dimensiones?${baseParams.toString()}`
        
        const heatmapResponse = await fetch(heatmapUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!heatmapResponse.ok) {
          throw new Error(`Error ${heatmapResponse.status}: ${heatmapResponse.statusText}`)
        }
        
        const heatmapData = await heatmapResponse.json()
        // Filtrar datos con valores null o undefined y asegurar que todos los valores sean números
        const cleanedHeatmapData = heatmapData
          .filter((item: any) => 
            item.sector && 
            item.sector !== 'Sin sector' && 
            item.sector !== 'N/A' &&
            item.sector !== null &&
            item.sector !== undefined
          )
          .map((item: any) => ({
            sector: item.sector,
            tecnologia: item.tecnologia !== null && item.tecnologia !== undefined ? parseFloat(item.tecnologia) || 0 : null,
            comunicacion: item.comunicacion !== null && item.comunicacion !== undefined ? parseFloat(item.comunicacion) || 0 : null,
            organizacion: item.organizacion !== null && item.organizacion !== undefined ? parseFloat(item.organizacion) || 0 : null,
            datos: item.datos !== null && item.datos !== undefined ? parseFloat(item.datos) || 0 : null,
            estrategia: item.estrategia !== null && item.estrategia !== undefined ? parseFloat(item.estrategia) || 0 : null,
            procesos: item.procesos !== null && item.procesos !== undefined ? parseFloat(item.procesos) || 0 : null,
            empresasEnSector: item.empresasEnSector || 0
          }))
        setHeatmapData(cleanedHeatmapData)
        
      } catch (error) {
        console.error('Error loading chart data:', error)
        setError(`Error cargando datos de gráficos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      } finally {
        setLoading(false)
      }
    }

    loadChartData()
  }, [filters, dateRange, selectedCategory])

  // Función para exportar datos a CSV
  const exportToCSV = (data: any[], filename: string) => {
    console.log('exportToCSV called:', { dataLength: data?.length, filename })
    
    if (!data || data.length === 0) {
      console.error('No data to export')
      alert('No hay datos para exportar.')
      return
    }

    try {
      const headers = Object.keys(data[0])
      console.log('CSV headers:', headers)
      
      // Función para escapar valores CSV
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return ''
        const str = String(value)
        // Si contiene comas, comillas o saltos de línea, envolver en comillas y escapar comillas internas
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...data.map((row, index) => {
          const rowData = headers.map(header => escapeCSV(row[header])).join(',')
          if (index === 0) {
            console.log('First row data:', rowData)
          }
          return rowData
        })
      ].join('\n')

      console.log('CSV content length:', csvContent.length)
      console.log('CSV content preview (first 200 chars):', csvContent.substring(0, 200))

      // Agregar BOM para UTF-8 (ayuda con Excel)
      const BOM = '\uFEFF'
      const csvWithBOM = BOM + csvContent
      
      // Crear blob con tipo correcto
      const blob = new Blob([csvWithBOM], { 
        type: 'text/csv;charset=utf-8;' 
      })
      
      console.log('Blob created:', { size: blob.size, type: blob.type })
      
      // Verificar que el blob tenga contenido
      if (blob.size === 0) {
        throw new Error('El archivo CSV está vacío')
      }
      
      // Crear link y descargar
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.href = url
      link.download = `${filename}.csv`
      link.style.display = 'none'
      link.style.position = 'absolute'
      link.style.left = '-9999px'
      
      console.log('Download link created:', { 
        href: link.href.substring(0, 50) + '...', 
        download: link.download,
        blobSize: blob.size
      })
      
      // Agregar al DOM y disparar el click
      document.body.appendChild(link)
      
      // Usar requestAnimationFrame para asegurar que el DOM esté actualizado
      requestAnimationFrame(() => {
        try {
          link.click()
          console.log('Download link clicked successfully')
          
          // Limpiar después de un delay mayor para asegurar que la descarga se complete
          setTimeout(() => {
            try {
              if (document.body.contains(link)) {
                document.body.removeChild(link)
              }
              URL.revokeObjectURL(url)
              console.log('Download link removed and URL revoked')
            } catch (cleanupError) {
              console.warn('Error during cleanup:', cleanupError)
            }
          }, 1000)
        } catch (clickError) {
          console.error('Error clicking download link:', clickError)
          // Intentar método alternativo
          const event = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true
          })
          link.dispatchEvent(event)
          
          setTimeout(() => {
            try {
              if (document.body.contains(link)) {
                document.body.removeChild(link)
              }
              URL.revokeObjectURL(url)
            } catch (cleanupError) {
              console.warn('Error during cleanup:', cleanupError)
            }
          }, 1000)
        }
      })
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      alert(`Error al exportar CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      throw error
    }
  }

  // Función para exportar gráfico como JPG usando html2canvas
  const exportChartAsJPG = async (chartId: string, filename: string) => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') {
      console.error('html2canvas only works in the browser')
      return
    }

    const chartElement = document.getElementById(chartId)
    if (!chartElement) {
      console.error('Chart element not found:', chartId)
      alert('No se encontró el elemento del gráfico')
      return
    }

    try {
      // Importación dinámica con verificación de existencia
      let html2canvas
      try {
        const html2canvasModule = await import('html2canvas')
        html2canvas = html2canvasModule.default || html2canvasModule
      } catch (importError) {
        console.error('Error importing html2canvas:', importError)
        alert('Error al cargar la librería de exportación de imágenes. Por favor, intenta descargar el CSV en su lugar.')
        return
      }
      
      if (!html2canvas) {
        alert('La librería de exportación de imágenes no está disponible. Por favor, intenta descargar el CSV en su lugar.')
        return
      }

      // Esperar un momento para asegurar que el elemento esté completamente renderizado
      await new Promise(resolve => setTimeout(resolve, 500))

      // Obtener las dimensiones reales del elemento
      const rect = chartElement.getBoundingClientRect()
      const width = Math.max(rect.width || chartElement.scrollWidth || chartElement.offsetWidth || 1200, 1200)
      const height = Math.max(rect.height || chartElement.scrollHeight || chartElement.offsetHeight || 500, 500)

      console.log('Chart element dimensions:', { 
        rect: { width: rect.width, height: rect.height },
        scroll: { width: chartElement.scrollWidth, height: chartElement.scrollHeight },
        offset: { width: chartElement.offsetWidth, height: chartElement.offsetHeight },
        final: { width, height }
      })

      // Verificar si hay SVG en el elemento (heatmap)
      const svgElement = chartElement.querySelector('svg')
      const hasSVG = !!svgElement
      
      console.log('Chart element contains SVG:', hasSVG)
      
      // Para el heatmap (SVG), usar html2canvas con configuración especial
      // html2canvas puede manejar SVG correctamente si se configura bien
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true, // Permitir contenido cross-origin para SVG
        foreignObjectRendering: hasSVG, // Solo para SVG
        removeContainer: false,
        imageTimeout: 30000,
        width: width,
        height: height,
        windowWidth: width,
        windowHeight: height,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element) => {
          // NO ignorar elementos importantes, solo ocultos
          return false
        },
        onclone: (clonedDoc, element) => {
          // Asegurar que los estilos se copien correctamente
          const clonedElement = clonedDoc.getElementById(chartId)
          if (clonedElement) {
            // Estilos para el contenedor
            clonedElement.style.transform = 'none'
            clonedElement.style.position = 'static'
            clonedElement.style.display = 'block'
            clonedElement.style.overflow = 'visible'
            clonedElement.style.width = `${width}px`
            clonedElement.style.height = `${height}px`
            clonedElement.style.backgroundColor = '#ffffff'
            clonedElement.style.minHeight = `${height}px`
            clonedElement.style.minWidth = `${width}px`
            
            // Asegurar que los SVG dentro tengan estilos visibles y dimensiones correctas
            const svgs = clonedElement.querySelectorAll('svg')
            svgs.forEach((svg: any) => {
              svg.style.display = 'block'
              svg.style.visibility = 'visible'
              svg.style.opacity = '1'
              svg.style.position = 'relative'
              svg.style.backgroundColor = '#ffffff'
              
              // Asegurar dimensiones explícitas
              const svgWidth = parseInt(svg.getAttribute('width')) || svg.clientWidth || width
              const svgHeight = parseInt(svg.getAttribute('height')) || svg.clientHeight || height
              svg.setAttribute('width', svgWidth.toString())
              svg.setAttribute('height', svgHeight.toString())
              svg.style.width = `${svgWidth}px`
              svg.style.height = `${svgHeight}px`
              
              // Asegurar que el SVG tenga un viewBox si no lo tiene
              if (!svg.getAttribute('viewBox')) {
                svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
              }
              
              console.log('SVG in clone:', { 
                width: svgWidth, 
                height: svgHeight, 
                viewBox: svg.getAttribute('viewBox'),
                style: svg.style.cssText
              })
            })
            
            // Asegurar que los canvas dentro tengan estilos visibles
            const canvases = clonedElement.querySelectorAll('canvas')
            canvases.forEach((canvas: any) => {
              canvas.style.display = 'block'
              canvas.style.visibility = 'visible'
              canvas.style.opacity = '1'
              canvas.style.position = 'relative'
              canvas.style.backgroundColor = 'transparent'
              
              console.log('Canvas in clone:', { 
                width: canvas.width, 
                height: canvas.height,
                style: canvas.style.cssText
              })
            })
            
            // Asegurar que todos los rectángulos SVG tengan fill visible
            const rects = clonedElement.querySelectorAll('rect')
            rects.forEach((rect: any) => {
              const fill = rect.getAttribute('fill')
              if (!fill || fill === 'none' || fill === 'transparent') {
                console.warn('Rect without fill:', { x: rect.getAttribute('x'), y: rect.getAttribute('y') })
              } else {
                console.log('Rect with fill:', { fill, x: rect.getAttribute('x'), y: rect.getAttribute('y') })
              }
            })
          }
        }
      })

      // Verificar que el canvas tenga el tamaño correcto
      console.log('Canvas dimensions:', { width: canvas.width, height: canvas.height })
      
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('El canvas tiene dimensiones inválidas')
      }

      // Verificar que el canvas tenga contenido (no completamente negro o blanco)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const sampleSize = 50
        const imageData = ctx.getImageData(0, 0, Math.min(canvas.width, sampleSize), Math.min(canvas.height, sampleSize))
        const pixels = imageData.data
        let nonWhitePixels = 0
        let nonBlackPixels = 0
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]
          // Contar píxeles que no son completamente blancos
          if (r < 250 || g < 250 || b < 250) {
            nonWhitePixels++
          }
          // Contar píxeles que no son completamente negros
          if (r > 5 || g > 5 || b > 5) {
            nonBlackPixels++
          }
        }
        
        console.log('Canvas content check:', { 
          totalPixels: pixels.length / 4, 
          nonWhitePixels, 
          nonBlackPixels,
          percentageNonWhite: (nonWhitePixels / (pixels.length / 4)) * 100,
          percentageNonBlack: (nonBlackPixels / (pixels.length / 4)) * 100
        })
        
        // Si todos los píxeles son negros o blancos, podría haber un problema
        if (nonWhitePixels === 0) {
          console.warn('Canvas appears to be all white')
        }
        if (nonBlackPixels === 0) {
          console.warn('Canvas appears to be all black')
        }
      }

      // Convertir a JPG
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('JPG blob created:', { size: blob.size, type: blob.type })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `${filename}.jpg`
          link.href = url
          link.style.display = 'none'
          document.body.appendChild(link)
          link.click()
          console.log('JPG download initiated')
          setTimeout(() => {
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }, 500)
        } else {
          console.error('Failed to create blob from canvas')
          alert('Error al generar la imagen. Por favor, intenta descargar el CSV en su lugar.')
        }
      }, 'image/jpeg', 0.95)
    } catch (error) {
      console.error('Error exporting chart as JPG:', error)
      alert(`Error al exportar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, intenta descargar el CSV en su lugar.`)
    }
  }

  // Exportar datos del heatmap a CSV
  const exportHeatmapData = () => {
    console.log('Exporting heatmap data...', { heatmapDataLength: heatmapData?.length })
    
    if (!heatmapData || heatmapData.length === 0) {
      console.error('No heatmap data to export')
      alert('No hay datos para exportar. Por favor, espera a que se carguen los datos.')
      return
    }

    try {
      const csvData = heatmapData
        .filter(item => item.sector && item.sector.trim() !== '')
        .map(item => ({
          'Sector': String(item.sector || '').trim(),
          'Δ Tecnología': item.tecnologia !== null && item.tecnologia !== undefined && !isNaN(item.tecnologia) ? Number(item.tecnologia).toFixed(2) : '0',
          'Δ Comunicación': item.comunicacion !== null && item.comunicacion !== undefined && !isNaN(item.comunicacion) ? Number(item.comunicacion).toFixed(2) : '0',
          'Δ Organización': item.organizacion !== null && item.organizacion !== undefined && !isNaN(item.organizacion) ? Number(item.organizacion).toFixed(2) : '0',
          'Δ Datos': item.datos !== null && item.datos !== undefined && !isNaN(item.datos) ? Number(item.datos).toFixed(2) : '0',
          'Δ Estrategia': item.estrategia !== null && item.estrategia !== undefined && !isNaN(item.estrategia) ? Number(item.estrategia).toFixed(2) : '0',
          'Δ Procesos': item.procesos !== null && item.procesos !== undefined && !isNaN(item.procesos) ? Number(item.procesos).toFixed(2) : '0',
          'Empresas en Sector': item.empresasEnSector || 0
        }))
      
      console.log('CSV data prepared:', { rowCount: csvData.length, firstRow: csvData[0] })
      
      if (csvData.length === 0) {
        alert('No hay datos válidos para exportar.')
        return
      }
      
      exportToCSV(csvData, `heatmap-dimensiones-sectores-${heatmapViewMode}`)
      console.log('CSV export completed successfully')
    } catch (error) {
      console.error('Error exporting heatmap data:', error)
      alert(`Error al exportar los datos: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, intenta de nuevo.`)
    }
  }

  // Exportar datos de evolución a CSV
  const exportEvolutionData = () => {
    const csvData = evolutionData.map(item => ({
      'Categoría': item.categoria,
      'Período': item.periodo,
      'Puntaje Promedio': item.puntajePromedio.toFixed(2),
      'Empresas Únicas': item.empresasUnicas
    }))
    exportToCSV(csvData, `evolucion-temporal-${selectedCategory}`)
  }

  // Preparar datos para el gráfico de evolución
  const prepareEvolutionChartData = () => {
    const categories = [...new Set(evolutionData.map(item => item.categoria))]
    const periods = [...new Set(evolutionData.map(item => item.periodo))].sort()
    
    return periods.map(period => {
      const data: any = { periodo: period }
      categories.forEach(category => {
        const item = evolutionData.find(d => d.categoria === category && d.periodo === period)
        data[category] = item ? item.puntajePromedio : 0
      })
      return data
    })
  }

  // Preparar datos para el heatmap d3
  const prepareHeatmapData = (): HeatmapData[] => {
    const heatmapDataFormatted: HeatmapData[] = []
    
    heatmapData.forEach(item => {
      // Crear una entrada por cada dimensión, solo si el valor no es null
      if (item.tecnologia !== null && item.tecnologia !== undefined) {
        heatmapDataFormatted.push({ x: 'Tecnología', y: item.sector, value: item.tecnologia })
      }
      if (item.comunicacion !== null && item.comunicacion !== undefined) {
        heatmapDataFormatted.push({ x: 'Comunicación', y: item.sector, value: item.comunicacion })
      }
      if (item.organizacion !== null && item.organizacion !== undefined) {
        heatmapDataFormatted.push({ x: 'Organización', y: item.sector, value: item.organizacion })
      }
      if (item.datos !== null && item.datos !== undefined) {
        heatmapDataFormatted.push({ x: 'Datos', y: item.sector, value: item.datos })
      }
      if (item.estrategia !== null && item.estrategia !== undefined) {
        heatmapDataFormatted.push({ x: 'Estrategia', y: item.sector, value: item.estrategia })
      }
      if (item.procesos !== null && item.procesos !== undefined) {
        heatmapDataFormatted.push({ x: 'Procesos', y: item.sector, value: item.procesos })
      }
    })
    
    return heatmapDataFormatted
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#f5592b]" />
          <p className="text-lg text-gray-600">Cargando gráficos de Rechequeos...</p>
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
    <div className="space-y-6">
      {/* Gráfico de Evolución Temporal */}
      <Card className="border-[#f5592b]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#150773] flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolución Temporal por Categoría
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tamano">Tamaño</SelectItem>
                  <SelectItem value="region">Región</SelectItem>
                  <SelectItem value="sector">Sector</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Formato de descarga</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportEvolutionData}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Descargar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportChartAsJPG('evolution-chart', `evolucion-temporal-${selectedCategory}`)}>
                    <Image className="h-4 w-4 mr-2" />
                    Descargar JPG
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            id="evolution-chart"
            style={{ 
              backgroundColor: '#ffffff',
              width: '100%',
              minHeight: '400px'
            }}
          >
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={prepareEvolutionChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="periodo" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "Puntaje"]}
                  labelFormatter={(label) => `Período: ${label}`}
                />
                <Legend />
                {[...new Set(evolutionData.map(item => item.categoria))].map((category, index) => {
                  const colors = ['#f5592b', '#150773', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                  return (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={category}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                      name={category}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap de Dimensiones vs Sectores */}
      <Card className="border-[#150773]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#150773] flex items-center gap-2">
              <Target className="h-5 w-5" />
              Mapa de Calor: Δ por Dimensión × Sector
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={heatmapViewMode} onValueChange={(value: HeatmapViewMode) => setHeatmapViewMode(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combined">Combinado</SelectItem>
                  <SelectItem value="positive">Solo Positivos</SelectItem>
                  <SelectItem value="negative">Solo Negativos</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Formato de descarga</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportHeatmapData}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Descargar CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportChartAsJPG('heatmap-chart', 'heatmap-dimensiones')}>
                    <Image className="h-4 w-4 mr-2" />
                    Descargar JPG
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Cambio promedio por dimensión de madurez digital en cada sector. 
            {heatmapViewMode === 'combined' && (
              <>
                <span className="font-medium text-green-700">Tonos verdes</span> indican mejora, 
                <span className="font-medium text-red-700">tonos rojos</span> indican retroceso, 
                <span className="font-medium text-gray-600">blanco</span> indica sin cambio.
              </>
            )}
            {heatmapViewMode === 'positive' && (
              <>
                <span className="font-medium text-green-700">Tonos verdes</span> más oscuros indican mayores mejoras.
              </>
            )}
            {heatmapViewMode === 'negative' && (
              <>
                <span className="font-medium text-red-700">Tonos rojos</span> más oscuros indican mayores retrocesos.
              </>
            )}
          </p>
        </CardHeader>
        <CardContent>
          <div 
            id="heatmap-chart" 
            className="flex justify-center"
            style={{ 
              backgroundColor: '#ffffff',
              minHeight: '500px',
              width: '100%',
              overflow: 'visible'
            }}
          >
            {heatmapData.length > 0 ? (
              <Heatmap 
                data={prepareHeatmapData()} 
                width={1200} 
                height={500}
                viewMode={heatmapViewMode}
              />
            ) : (
              <div className="flex items-center justify-center h-96">
                <p className="text-gray-500">No hay datos disponibles para el mapa de calor</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
