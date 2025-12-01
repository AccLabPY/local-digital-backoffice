"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2, 
  Award, 
  Target,
  Loader2,
  RefreshCw,
  Download
} from "lucide-react"
import { getAuthToken } from "@/lib/api-client"

export function LookerDashboard() {
  const [kpis, setKpis] = useState(null)
  const [empresas, setEmpresas] = useState([])
  const [filterOptions, setFilterOptions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Cargar datos del dashboard
  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const token = getAuthToken()
      if (!token) {
        setError("No se pudo obtener el token de autenticación")
        return
      }

      // Cargar KPIs
      const kpisResponse = await fetch('http://localhost:3001/api/empresas/kpis', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (kpisResponse.ok) {
        const kpisData = await kpisResponse.json()
        setKpis(kpisData)
      }

      // Cargar empresas (top 50 para tener más opciones)
      const empresasResponse = await fetch('http://localhost:3001/api/empresas?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (empresasResponse.ok) {
        const empresasData = await empresasResponse.json()
        setEmpresas(empresasData.data || [])
      }

      // Cargar opciones de filtro
      const filtersResponse = await fetch('http://localhost:3001/api/empresas/filters/options', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (filtersResponse.ok) {
        const filtersData = await filtersResponse.json()
        setFilterOptions(filtersData)
      }

      setLastUpdated(new Date())

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError(`Error cargando datos: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleRefresh = () => {
    loadDashboardData()
  }

  const getMaturityLevel = (puntaje: number) => {
    if (!puntaje) return "Sin evaluar"
    if (puntaje < 30) return "Inicial"
    if (puntaje < 60) return "Novato"
    if (puntaje < 80) return "Competente"
    return "Avanzado"
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
          <p className="text-lg text-gray-600">Cargando dashboard...</p>
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
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Embebido de Looker Studio */}
      <Card className="border-[#f5592b]/20 shadow-sm">
        <CardContent className="p-0">
          <div className="w-full" style={{ height: '1000px' }}>
            <iframe 
              src="https://lookerstudio.google.com/embed/reporting/4b188df0-8581-48c9-bfb7-92563039236a/page/p_0deh8bzymd" 
              frameBorder="0" 
              style={{ 
                border: 0,
                width: '100%',
                height: '100%',
                minHeight: '1000px'
              }} 
              allowFullScreen 
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads"
            />
          </div>
        </CardContent>
      </Card>

      {/* Top Empresas por Madurez */}
      <Card className="border-[#150773]/20 shadow-sm">
        <CardHeader className="bg-[#150773] text-white">
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="h-5 w-5 mr-2" />
            Top Empresas por Madurez Digital
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {empresas
              .filter(e => e.puntajeNivelDeMadurezGeneral)
              .sort((a, b) => (b.puntajeNivelDeMadurezGeneral || 0) - (a.puntajeNivelDeMadurezGeneral || 0))
              .slice(0, 10)
              .map((empresa, index) => (
                <div key={`${empresa.IdEmpresa}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#f5592b] text-white rounded-full font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[#150773]">{empresa.empresa}</div>
                      <div className="text-sm text-gray-600">{empresa.departamento}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-bold text-lg text-[#f5592b]">
                        {empresa.puntajeNivelDeMadurezGeneral?.toFixed(1)}%
                      </div>
                      <Badge className={`${getMaturityColor(empresa.puntajeNivelDeMadurezGeneral)} text-xs`}>
                        {getMaturityLevel(empresa.puntajeNivelDeMadurezGeneral)}
                      </Badge>
                    </div>
                    <div className="w-24">
                      <Progress value={empresa.puntajeNivelDeMadurezGeneral || 0} className="w-full h-2" />
                    </div>
                    <Button
                      onClick={() => window.location.href = `/empresas/${empresa.IdEmpresa}`}
                      size="sm"
                      className="bg-[#150773] hover:bg-[#0f0559] text-white"
                    >
                      Ver detalle
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
