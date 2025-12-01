"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell
} from "recharts"
import { TrendingUp, BarChart3, Target, Loader2 } from "lucide-react"
import { getAuthToken } from "@/lib/api-client"

// Helper function to get maturity level
const getMaturityLevel = (score: number): string => {
  if (score >= 4) return 'Avanzado'
  if (score >= 3) return 'Competente'
  if (score >= 2) return 'Novato'
  return 'Inicial'
}

// Helper function to get maturity level color
const getNivelColor = (nivel: string): string => {
  switch (nivel) {
    case 'Avanzado': return 'bg-green-100 text-green-800 border-green-200'
    case 'Competente': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Novato': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'Inicial': return 'bg-red-100 text-red-800 border-red-200'
    // Legacy support for old names
    case 'Intermedio': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Básico': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

interface BusinessChartsProps {
  businessId: number
  business?: any
}

interface DimensionData {
  dimension: string
  puntaje: number
  color?: string
  testId?: number
  testDate?: string
}

interface RadarTestData {
  dimension: string
  test1?: number
  test2?: number
  [key: string]: string | number | undefined
}

interface EvolutionData {
  fecha: string
  puntajeGeneral: number
  puntajeTecnologia: number
  puntajeComunicacion: number
  puntajeOrganizacion: number
  puntajeDatos: number
  puntajeEstrategia: number
  puntajeProcesos: number
}

export function BusinessCharts({ businessId, business }: BusinessChartsProps) {
  const [loading, setLoading] = useState(true)
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([])
  const [currentDimensionsData, setCurrentDimensionsData] = useState<DimensionData[]>([])
  const [radarData, setRadarData] = useState<{[key: string]: DimensionData[]}>({})
  const [combinedRadarData, setCombinedRadarData] = useState<RadarTestData[]>([])
  const [summaryData, setSummaryData] = useState<{
    leadingDimension: { name: string; score: number }
    opportunityDimension: { name: string; score: number }
    average: number
  } | null>(null)
  const [improvementData, setImprovementData] = useState<{
    percentage: number
    isPositive: boolean
    timeSpan: string
    firstScore: number
    lastScore: number
  } | null>(null)
  const [dimensionChanges, setDimensionChanges] = useState<{
    bestGrowth: { name: string; percentage: number; isPositive: boolean }
    worstDecline: { name: string; percentage: number; isPositive: boolean }
    hasHistoricalData: boolean
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Obtener idTestUsuario de la URL o del objeto business
  const getIdTestUsuario = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const idTestUsuarioFromUrl = urlParams.get('idTestUsuario')
    return idTestUsuarioFromUrl || (business?.IdTestUsuario) || null
  }


  // Cargar datos de evolución y dimensiones
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = getAuthToken()
        if (!token) {
          setError("No se pudo obtener el token de autenticación")
          return
        }

        // Fetch evolution data
        const idTestUsuario = getIdTestUsuario()
        const evolutionUrl = idTestUsuario 
          ? `http://localhost:3001/api/encuestas/empresas/${businessId}/evolution?idTestUsuario=${idTestUsuario}`
          : `http://localhost:3001/api/encuestas/empresas/${businessId}/evolution`
        
        const evolutionResponse = await fetch(evolutionUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!evolutionResponse.ok) {
          throw new Error(`Error ${evolutionResponse.status}: ${evolutionResponse.statusText}`)
        }
        
        const evolutionData = await evolutionResponse.json()
        
        // Si no hay datos históricos, usar datos actuales simulados para evolución
        if (evolutionData.length === 0 && business) {
          const currentYear = new Date().getFullYear()
          const mockEvolution = [
            {
              fecha: (currentYear - 2).toString(),
              puntajeGeneral: Math.max(0, (business.puntajeGeneral || 0) * 0.7),
              puntajeTecnologia: Math.max(0, (business.puntajeTecnologia || 0) * 0.6),
              puntajeComunicacion: Math.max(0, (business.puntajeComunicacion || 0) * 0.8),
              puntajeOrganizacion: Math.max(0, (business.puntajeOrganizacion || 0) * 0.7),
              puntajeDatos: Math.max(0, (business.puntajeDatos || 0) * 0.6),
              puntajeEstrategia: Math.max(0, (business.puntajeEstrategia || 0) * 0.5),
              puntajeProcesos: Math.max(0, (business.puntajeProcesos || 0) * 0.4),
            },
            {
              fecha: (currentYear - 1).toString(),
              puntajeGeneral: Math.max(0, (business.puntajeGeneral || 0) * 0.85),
              puntajeTecnologia: Math.max(0, (business.puntajeTecnologia || 0) * 0.8),
              puntajeComunicacion: Math.max(0, (business.puntajeComunicacion || 0) * 0.9),
              puntajeOrganizacion: Math.max(0, (business.puntajeOrganizacion || 0) * 0.85),
              puntajeDatos: Math.max(0, (business.puntajeDatos || 0) * 0.8),
              puntajeEstrategia: Math.max(0, (business.puntajeEstrategia || 0) * 0.7),
              puntajeProcesos: Math.max(0, (business.puntajeProcesos || 0) * 0.6),
            },
            {
              fecha: currentYear.toString(),
              puntajeGeneral: business.puntajeGeneral || 0,
              puntajeTecnologia: business.puntajeTecnologia || 0,
              puntajeComunicacion: business.puntajeComunicacion || 0,
              puntajeOrganizacion: business.puntajeOrganizacion || 0,
              puntajeDatos: business.puntajeDatos || 0,
              puntajeEstrategia: business.puntajeEstrategia || 0,
              puntajeProcesos: business.puntajeProcesos || 0,
            },
          ]
          setEvolutionData(mockEvolution)
        } else {
          setEvolutionData(evolutionData)
        }
        
        // Calculate improvement data from evolution data
        if (evolutionData.length > 1) {
          const firstTest = evolutionData[0]
          const lastTest = evolutionData[evolutionData.length - 1]
          const firstScore = firstTest.puntajeGeneral
          const lastScore = lastTest.puntajeGeneral
          
          const percentage = ((lastScore - firstScore) / firstScore) * 100
          const isPositive = percentage >= 0
          
          // Calculate time span - improved calculation
          const firstDate = new Date(firstTest.fecha)
          const lastDate = new Date(lastTest.fecha)
          
          // Calculate total days between dates
          const timeDifference = lastDate.getTime() - firstDate.getTime()
          const totalDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24))
          
          // Convert days to months (more accurate calculation)
          const totalMonths = Math.round(totalDays / 30.44) // Average days per month
          
          let timeSpan = ""
          if (totalMonths >= 24) {
            timeSpan = `${Math.floor(totalMonths / 12)} años`
          } else if (totalMonths >= 12) {
            timeSpan = `${Math.floor(totalMonths / 12)} año${Math.floor(totalMonths / 12) > 1 ? 's' : ''}`
          } else if (totalMonths > 0) {
            timeSpan = `${totalMonths} mes${totalMonths > 1 ? 'es' : ''}`
          } else {
            timeSpan = "1 mes" // Default to 1 month if calculation results in 0
          }
          
          setImprovementData({
            percentage: Math.abs(percentage),
            isPositive,
            timeSpan,
            firstScore,
            lastScore
          })

          // Calculate dimension changes
          const dimensionNames = [
            { key: 'puntajeTecnologia', name: 'Tecnología' },
            { key: 'puntajeComunicacion', name: 'Comunicación' },
            { key: 'puntajeOrganizacion', name: 'Organización' },
            { key: 'puntajeDatos', name: 'Datos' },
            { key: 'puntajeEstrategia', name: 'Estrategia' },
            { key: 'puntajeProcesos', name: 'Procesos' }
          ]

          const dimensionChanges = dimensionNames.map(dim => {
            const firstScore = firstTest[dim.key] || 0
            const lastScore = lastTest[dim.key] || 0
            const percentage = firstScore > 0 ? ((lastScore - firstScore) / firstScore) * 100 : 0
            
            return {
              name: dim.name,
              percentage,
              isPositive: percentage >= 0
            }
          })

          // Find best growth and worst decline
          const positiveChanges = dimensionChanges.filter(d => d.isPositive && d.percentage > 0)
          const negativeChanges = dimensionChanges.filter(d => !d.isPositive)

          const bestGrowth = positiveChanges.length > 0 
            ? positiveChanges.reduce((max, current) => current.percentage > max.percentage ? current : max)
            : { name: 'N/A', percentage: 0, isPositive: true }

          const worstDecline = negativeChanges.length > 0
            ? negativeChanges.reduce((min, current) => current.percentage < min.percentage ? current : min)
            : { name: 'N/A', percentage: 0, isPositive: false }

          setDimensionChanges({
            bestGrowth,
            worstDecline,
            hasHistoricalData: true
          })
        } else {
          // If only one test or no evolution data, set default values
          setImprovementData({
            percentage: 0,
            isPositive: true,
            timeSpan: "Aún sin datos históricos para medir el crecimiento.",
            firstScore: 0,
            lastScore: 0
          })

          setDimensionChanges({
            bestGrowth: { name: 'N/A', percentage: 0, isPositive: true },
            worstDecline: { name: 'N/A', percentage: 0, isPositive: false },
            hasHistoricalData: false
          })
        }

        // Fetch dimension evolution data for all tests
        const dimensionUrl = idTestUsuario
          ? `http://localhost:3001/api/graficos/empresas/${businessId}/dimension-evolution?idTestUsuario=${idTestUsuario}`
          : `http://localhost:3001/api/graficos/empresas/${businessId}/dimension-evolution`
        
        const dimensionResponse = await fetch(dimensionUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!dimensionResponse.ok) {
          throw new Error(`Error ${dimensionResponse.status}: ${dimensionResponse.statusText}`)
        }
        
        const dimensionData = await dimensionResponse.json()
        
        // Get data from all finalized tests
        if (dimensionData.length > 0) {
          // Get the most recent test (last in the array)
          const latestData = dimensionData[dimensionData.length - 1]
          
          // Format data for bar chart - most recent test only
          const barData = [
            { dimension: "Tecnología", puntaje: latestData.tecnologia || 0, color: "#f5592b" },
            { dimension: "Comunicación", puntaje: latestData.comunicacion || 0, color: "#150773" },
            { dimension: "Organización", puntaje: latestData.organizacion || 0, color: "#10b981" },
            { dimension: "Datos", puntaje: latestData.datos || 0, color: "#f59e0b" },
            { dimension: "Estrategia", puntaje: latestData.estrategia || 0, color: "#ef4444" },
            { dimension: "Procesos", puntaje: latestData.procesos || 0, color: "#8b5cf6" },
          ]
          setCurrentDimensionsData(barData)
          
          // Calculate summary statistics from the most recent test
          const summaryDimensions = [
            { name: "Tecnología", score: latestData.tecnologia || 0 },
            { name: "Comunicación", score: latestData.comunicacion || 0 },
            { name: "Organización", score: latestData.organizacion || 0 },
            { name: "Datos", score: latestData.datos || 0 },
            { name: "Estrategia", score: latestData.estrategia || 0 },
            { name: "Procesos", score: latestData.procesos || 0 },
          ]
          
          // Find leading dimension (highest score)
          const leadingDimension = summaryDimensions.reduce((max, current) => 
            current.score > max.score ? current : max
          )
          
          // Find opportunity dimension (lowest score)
          const opportunityDimension = summaryDimensions.reduce((min, current) => 
            current.score < min.score ? current : min
          )
          
          // Calculate average
          const average = summaryDimensions.reduce((sum, dim) => sum + dim.score, 0) / summaryDimensions.length
          
          setSummaryData({
            leadingDimension,
            opportunityDimension,
            average
          })
          
          // Prepare radar data for all tests
          const radarDataTests: {[key: string]: DimensionData[]} = {}
          
          // Filter out simulated data and sort by date (since test number is not available)
          const realTestsData = dimensionData
            .filter((test: any) => !test.isSimulated)
            .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()) // Sort by date
          
          // We want to show at most the 5 most recent tests
          const testsToShow = realTestsData.slice(-5)
          
          // Process each test result
          testsToShow.forEach((testData: any, index: number) => {
            // Since the backend doesn't provide test number, use index + 1
            const testNumber = index + 1
            const testId = `Test ${testNumber}`
            radarDataTests[testId] = [
              { dimension: "Tecnología", puntaje: testData.tecnologia || 0, testId: testNumber },
              { dimension: "Comunicación", puntaje: testData.comunicacion || 0, testId: testNumber },
              { dimension: "Organización", puntaje: testData.organizacion || 0, testId: testNumber },
              { dimension: "Datos", puntaje: testData.datos || 0, testId: testNumber },
              { dimension: "Estrategia", puntaje: testData.estrategia || 0, testId: testNumber },
              { dimension: "Procesos", puntaje: testData.procesos || 0, testId: testNumber },
            ]
          })
          
          setRadarData(radarDataTests)
          
          // Create combined data for the radar chart
          const radarDimensions = ["Tecnología", "Comunicación", "Organización", "Datos", "Estrategia", "Procesos"]
          
          const combinedData = radarDimensions.map(dimension => {
            const result: RadarTestData = { dimension }
            
            testsToShow.forEach((testData: any, idx: number) => {
              const testNumber = idx + 1 // Use index + 1 since backend doesn't provide test number
              const testKey = `test${testNumber}`
              switch(dimension) {
                case "Tecnología":
                  result[testKey] = testData.tecnologia || 0
                  break
                case "Comunicación":
                  result[testKey] = testData.comunicacion || 0
                  break
                case "Organización":
                  result[testKey] = testData.organizacion || 0
                  break
                case "Datos":
                  result[testKey] = testData.datos || 0
                  break
                case "Estrategia":
                  result[testKey] = testData.estrategia || 0
                  break
                case "Procesos":
                  result[testKey] = testData.procesos || 0
                  break
              }
            })
            
            return result
          })
          
          setCombinedRadarData(combinedData)
        } else if (business) {
          // If no dimension data, use current business data (fallback)
          setCurrentDimensionsData([
            { dimension: "Tecnología", puntaje: business.puntajeTecnologia || 0, color: "#f5592b" },
            { dimension: "Comunicación", puntaje: business.puntajeComunicacion || 0, color: "#150773" },
            { dimension: "Organización", puntaje: business.puntajeOrganizacion || 0, color: "#10b981" },
            { dimension: "Datos", puntaje: business.puntajeDatos || 0, color: "#f59e0b" },
            { dimension: "Estrategia", puntaje: business.puntajeEstrategia || 0, color: "#ef4444" },
            { dimension: "Procesos", puntaje: business.puntajeProcesos || 0, color: "#8b5cf6" },
          ])
          
          // Fallback radar data - use business.Test if available, otherwise default to 1
          const fallbackTestNumber = business.Test || 1
          setRadarData({
            [`Test ${fallbackTestNumber}`]: [
              { dimension: "Tecnología", puntaje: business.puntajeTecnologia || 0, testId: fallbackTestNumber },
              { dimension: "Comunicación", puntaje: business.puntajeComunicacion || 0, testId: fallbackTestNumber },
              { dimension: "Organización", puntaje: business.puntajeOrganizacion || 0, testId: fallbackTestNumber },
              { dimension: "Datos", puntaje: business.puntajeDatos || 0, testId: fallbackTestNumber },
              { dimension: "Estrategia", puntaje: business.puntajeEstrategia || 0, testId: fallbackTestNumber },
              { dimension: "Procesos", puntaje: business.puntajeProcesos || 0, testId: fallbackTestNumber },
            ]
          })
          
          // Fallback combined radar data
          setCombinedRadarData([
            { dimension: "Tecnología", [`test${fallbackTestNumber}`]: business.puntajeTecnologia || 0 },
            { dimension: "Comunicación", [`test${fallbackTestNumber}`]: business.puntajeComunicacion || 0 },
            { dimension: "Organización", [`test${fallbackTestNumber}`]: business.puntajeOrganizacion || 0 },
            { dimension: "Datos", [`test${fallbackTestNumber}`]: business.puntajeDatos || 0 },
            { dimension: "Estrategia", [`test${fallbackTestNumber}`]: business.puntajeEstrategia || 0 },
            { dimension: "Procesos", [`test${fallbackTestNumber}`]: business.puntajeProcesos || 0 },
          ])
          
          // Calculate fallback summary statistics
          const fallbackDimensions = [
            { name: "Tecnología", score: business.puntajeTecnologia || 0 },
            { name: "Comunicación", score: business.puntajeComunicacion || 0 },
            { name: "Organización", score: business.puntajeOrganizacion || 0 },
            { name: "Datos", score: business.puntajeDatos || 0 },
            { name: "Estrategia", score: business.puntajeEstrategia || 0 },
            { name: "Procesos", score: business.puntajeProcesos || 0 },
          ]
          
          const fallbackLeading = fallbackDimensions.reduce((max, current) => 
            current.score > max.score ? current : max
          )
          const fallbackOpportunity = fallbackDimensions.reduce((min, current) => 
            current.score < min.score ? current : min
          )
          const fallbackAverage = fallbackDimensions.reduce((sum, dim) => sum + dim.score, 0) / fallbackDimensions.length
          
          setSummaryData({
            leadingDimension: fallbackLeading,
            opportunityDimension: fallbackOpportunity,
            average: fallbackAverage
          })
        }
        
      } catch (error) {
        console.error('Error loading chart data:', error)
        setError('Error cargando datos de gráficos')
      } finally {
        setLoading(false)
      }
    }

    if (businessId) {
      loadData()
    }
  }, [businessId, business])

  // Los datos para gráficos ahora se manejan con useState

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#f5592b]" />
          <p className="text-lg text-gray-600">Cargando gráficos...</p>
        </div>
      </div>
    )
  }

  // Function to format date to MM/YYYY
  const formatDateToMMYYYY = (dateString: string) => {
    const date = new Date(dateString)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${year}`
  }

  // Function to get dimension color
  const getDimensionColor = (dimensionName: string) => {
    const colors: { [key: string]: string } = {
      'Tecnología': '#f5592b',
      'Comunicación': '#150773',
      'Organización': '#10b981',
      'Datos': '#f59e0b',
      'Estrategia': '#ef4444',
      'Procesos': '#8b5cf6'
    }
    return colors[dimensionName] || '#6b7280'
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{formatDateToMMYYYY(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toFixed(3)}%`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Primera fila: Resultados de Evaluación Actual y Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resultados de Evaluación Actual - Versión Compacta */}
        <Card className="border-[#150773]/20">
          <CardHeader>
            <div className="flex justify-between items-center">
            <CardTitle className="text-[#150773] flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resultados de Evaluación Actual
            </CardTitle>
              {business && (
                <Badge className={`${getNivelColor(business.nivelMadurez || getMaturityLevel(business.puntajeGeneral))} border text-sm px-3 py-1`}>
                  {business.nivelMadurez || getMaturityLevel(business.puntajeGeneral)} - {business.puntajeGeneral ? business.puntajeGeneral.toFixed(1) : '0'}%
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {currentDimensionsData.map((dimension, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 text-sm">{dimension.dimension}</span>
                    <span className="font-bold text-sm" style={{ color: dimension.color }}>
                      {dimension.puntaje.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(dimension.puntaje, 100)}
                    className="h-2"
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

        {/* Gráfico de Radar */}
        <Card className="border-[#150773]/20">
          <CardHeader>
            <CardTitle className="text-[#150773] flex items-center gap-2">
              <Target className="h-5 w-5" />
              Radar por Dimensiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={combinedRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 12]} 
                />
                
                {/* Generate Radar components dynamically based on available test data */}
                {Object.keys(radarData).map((testKey, index) => {
                  const testNumber = testKey.replace('Test ', '')
                  const colors = ['#f5592b', '#150773', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
                  const color = colors[index % colors.length]
                  
                  return (
                    <Radar
                      key={testKey}
                      name={testKey}
                      dataKey={`test${testNumber}`}
                      stroke={color}
                      fill={color}
                      fillOpacity={0.3}
                      strokeWidth={2}
                      isAnimationActive={true}
                    />
                  )
                })}
                
                <Legend />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    // Extract test number from the actual dataKey in props
                    const dataKey = props.dataKey || name
                    const testNumber = dataKey.replace('test', '')
                    return [`${value.toFixed(3)}%`, `Puntaje Test ${testNumber}:`]
                  }}
                  labelFormatter={(label) => `Dimensión: ${label}`}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Resumen de insights - Movido entre primera y segunda fila */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="text-sm text-gray-600">Dimensión Líder</div>
          <div className="font-bold text-[#150773]">
            {summaryData ? `${summaryData.leadingDimension.name} (${summaryData.leadingDimension.score.toFixed(2)}%)` : 'Cargando...'}
          </div>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded">
          <div className="text-sm text-gray-600">Mayor Oportunidad</div>
          <div className="font-bold text-[#f5592b]">
            {summaryData ? `${summaryData.opportunityDimension.name} (${summaryData.opportunityDimension.score.toFixed(2)}%)` : 'Cargando...'}
          </div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="text-sm text-gray-600">Promedio</div>
          <div className="font-bold text-green-700">
            {summaryData ? `${summaryData.average.toFixed(2)}%` : 'Cargando...'}
          </div>
        </div>
      </div>

      {/* Segunda fila: Evolución Temporal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Evolución Temporal */}
        <Card className="border-[#f5592b]/20">
          <CardHeader>
            <CardTitle className="text-[#150773] flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolución del Puntaje General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={formatDateToMMYYYY}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "Puntaje"]}
                  labelFormatter={(label) => formatDateToMMYYYY(label)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="puntajeGeneral"
                  stroke="#f5592b"
                  strokeWidth={3}
                  dot={{ fill: "#f5592b", strokeWidth: 2, r: 6 }}
                  name="Puntaje General"
                />
              </LineChart>
            </ResponsiveContainer>
            {improvementData && (
              <div className={`mt-4 p-3 rounded-lg border-l-4 ${
                improvementData.timeSpan.includes("Aún sin datos históricos") 
                  ? 'bg-blue-50 border-blue-400'
                  : improvementData.isPositive 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-red-50 border-red-400'
              }`}>
                <p className={`text-sm font-medium ${
                  improvementData.timeSpan.includes("Aún sin datos históricos")
                    ? 'text-blue-800'
                    : improvementData.isPositive 
                      ? 'text-green-800' 
                      : 'text-red-800'
                }`}>
                  {improvementData.timeSpan.includes("Aún sin datos históricos") 
                    ? '📈 Aún sin datos históricos para medir el crecimiento.'
                    : `${improvementData.isPositive ? '📈' : '📉'} ${improvementData.isPositive ? 'Mejora continua' : 'Decrecimiento'}: ${improvementData.isPositive ? '+' : '-'}${improvementData.percentage.toFixed(1)}% de ${improvementData.isPositive ? 'crecimiento' : 'retroceso'} en madurez general en ${improvementData.timeSpan}`
                  }
              </p>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Dimensiones por Año */}
        <Card className="border-[#150773]/20">
          <CardHeader>
            <CardTitle className="text-[#150773] flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Evolución por Dimensiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="fecha" 
                  tickFormatter={formatDateToMMYYYY}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="puntajeTecnologia" stroke="#f5592b" name="Tecnología" />
                <Line type="monotone" dataKey="puntajeComunicacion" stroke="#150773" name="Comunicación" />
                <Line type="monotone" dataKey="puntajeOrganizacion" stroke="#10b981" name="Organización" />
                <Line type="monotone" dataKey="puntajeDatos" stroke="#f59e0b" name="Datos" />
                <Line type="monotone" dataKey="puntajeEstrategia" stroke="#ef4444" name="Estrategia" />
                <Line type="monotone" dataKey="puntajeProcesos" stroke="#8b5cf6" name="Procesos" />
              </LineChart>
            </ResponsiveContainer>
            {dimensionChanges && (
              <div className={`mt-4 p-3 rounded-lg border-l-4 ${
                !dimensionChanges.hasHistoricalData 
                  ? 'bg-blue-50 border-blue-400'
                  : 'bg-purple-50 border-purple-400'
              }`}>
                {!dimensionChanges.hasHistoricalData ? (
                  <p className="text-sm font-medium text-blue-800">
                    📈 Aún sin datos históricos para medir el crecimiento.
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    {/* Mayor crecimiento */}
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">📈 Mayor crecimiento:</span>
                      <span 
                        className="text-sm font-semibold"
                        style={{ color: getDimensionColor(dimensionChanges.bestGrowth.name) }}
                      >
                        {dimensionChanges.bestGrowth.name}
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        (+{dimensionChanges.bestGrowth.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    
                    {/* Mayor retroceso */}
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">📉 Mayor retroceso:</span>
                      <span 
                        className="text-sm font-semibold"
                        style={{ color: getDimensionColor(dimensionChanges.worstDecline.name) }}
                      >
                        {dimensionChanges.worstDecline.name}
                      </span>
                      <span className="text-sm font-bold text-red-600">
                        ({dimensionChanges.worstDecline.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
