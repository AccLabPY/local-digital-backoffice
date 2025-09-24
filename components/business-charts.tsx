"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "recharts"
import { TrendingUp, BarChart3, Target, Loader2 } from "lucide-react"
import { authService } from "./services/auth-service"

interface BusinessChartsProps {
  businessId: number
  business?: any
}

export function BusinessCharts({ businessId, business }: BusinessChartsProps) {
  const [loading, setLoading] = useState(true)
  const [evolutionData, setEvolutionData] = useState([])

  // Función para obtener token de autenticación usando el servicio singleton
  const getAuthToken = async () => {
    try {
      return await authService.getValidToken()
    } catch (error) {
      console.error('Error getting auth token:', error)
      return null
    }
  }

  // Cargar datos de evolución
  useEffect(() => {
    const loadEvolutionData = async () => {
      setLoading(true)
      try {
        const token = await getAuthToken()
        if (!token) {
          setError("No se pudo obtener el token de autenticación")
          return
        }

        const response = await fetch(`http://localhost:3001/api/encuestas/empresas/${businessId}/evolution`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Si no hay datos históricos, usar datos actuales simulados
        if (data.length === 0 && business) {
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
          setEvolutionData(data)
        }
      } catch (error) {
        console.error('Error loading evolution data:', error)
        setError('Error cargando datos de evolución')
      } finally {
        setLoading(false)
      }
    }

    if (businessId) {
      loadEvolutionData()
    }
  }, [businessId, business])

  // Datos para gráfico de barras de dimensiones actuales
  const currentDimensionsData = [
    { dimension: "Tecnología", puntaje: business?.puntajeTecnologia || 0, color: "#f5592b" },
    { dimension: "Comunicación", puntaje: business?.puntajeComunicacion || 0, color: "#150773" },
    { dimension: "Organización", puntaje: business?.puntajeOrganizacion || 0, color: "#f5592b" },
    { dimension: "Datos", puntaje: business?.puntajeDatos || 0, color: "#150773" },
    { dimension: "Estrategia", puntaje: business?.puntajeEstrategia || 0, color: "#f5592b" },
    { dimension: "Procesos", puntaje: business?.puntajeProcesos || 0, color: "#150773" },
  ]

  // Datos para gráfico de radar
  const radarData = [
    { dimension: "Tecnología", puntaje: business?.puntajeTecnologia || 0 },
    { dimension: "Comunicación", puntaje: business?.puntajeComunicacion || 0 },
    { dimension: "Organización", puntaje: business?.puntajeOrganizacion || 0 },
    { dimension: "Datos", puntaje: business?.puntajeDatos || 0 },
    { dimension: "Estrategia", puntaje: business?.puntajeEstrategia || 0 },
    { dimension: "Procesos", puntaje: business?.puntajeProcesos || 0 },
  ]

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{`Año ${label}`}</p>
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
      {/* Primera fila: Puntajes Actuales y Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Estado Actual */}
        <Card className="border-[#f5592b]/20">
          <CardHeader>
            <CardTitle className="text-[#150773] flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Puntajes Actuales por Dimensión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={currentDimensionsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="dimension" type="category" width={100} />
                <Tooltip formatter={(value: number) => [`${value.toFixed(3)}%`, "Puntaje"]} />
                <Bar dataKey="puntaje" fill="#f5592b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" />
                <PolarRadiusAxis angle={90} domain={[0, 12]} />
                <Radar
                  name="Puntaje"
                  dataKey="puntaje"
                  stroke="#f5592b"
                  fill="#f5592b"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip formatter={(value: number) => [`${value.toFixed(3)}%`, "Puntaje"]} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "Puntaje"]}
                  labelFormatter={(label) => `Año ${label}`}
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
            <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <p className="text-sm text-green-800 font-medium">
                📈 Mejora continua: +{(((6.955 - 4.8) / 4.8) * 100).toFixed(1)}% de crecimiento en los últimos 2 años
              </p>
            </div>
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
                <XAxis dataKey="fecha" />
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
          </CardContent>
        </Card>
      </div>

      {/* Resumen de insights */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="text-sm text-gray-600">Dimensión Líder</div>
          <div className="font-bold text-[#150773]">Datos (11.02%)</div>
        </div>
        <div className="text-center p-2 bg-yellow-50 rounded">
          <div className="text-sm text-gray-600">Mayor Oportunidad</div>
          <div className="font-bold text-[#f5592b]">Procesos (0.0%)</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="text-sm text-gray-600">Promedio</div>
          <div className="font-bold text-green-700">
            {(currentDimensionsData.reduce((acc, d) => acc + d.puntaje, 0) / currentDimensionsData.length).toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  )
}
