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
import { authService } from "./services/auth-service"

export function LookerDashboard() {
  const [kpis, setKpis] = useState(null)
  const [empresas, setEmpresas] = useState([])
  const [filterOptions, setFilterOptions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Función para obtener token de autenticación usando el servicio singleton
  const getAuthToken = async () => {
    try {
      return await authService.getValidToken()
    } catch (error) {
      console.error('Error getting auth token:', error)
      return null
    }
  }

  // Cargar datos del dashboard
  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
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

      // Cargar empresas (top 10)
      const empresasResponse = await fetch('http://localhost:3001/api/empresas?limit=10', {
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
    if (puntaje < 60) return "Básico"
    if (puntaje < 80) return "Intermedio"
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
      {/* Header */}
      <div className="flex items-center justify-between bg-[#150773] text-white p-6 rounded-lg">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Looker</h1>
          <p className="text-blue-100">Panel de control en tiempo real</p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <p className="text-sm text-blue-100 bg-white/20 px-3 py-1 rounded-full">
              Última actualización: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <Button 
            onClick={handleRefresh} 
            className="bg-white text-[#150773] hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button className="bg-[#f5592b] hover:bg-[#e04a1f] text-white">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-[#f5592b]/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#150773]">Total Empresas</CardTitle>
            <Building2 className="h-5 w-5 text-[#f5592b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#150773]">{kpis?.totalEmpresas?.toLocaleString() || '0'}</div>
            <p className="text-xs text-gray-600 mt-1">Empresas registradas</p>
          </CardContent>
        </Card>
        
        <Card className="border-[#150773]/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#150773]">Nivel General</CardTitle>
            <BarChart3 className="h-5 w-5 text-[#150773]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5592b]">{kpis?.nivelGeneral || '0'}%</div>
            <p className="text-xs text-gray-600 mt-1">Promedio de madurez digital</p>
          </CardContent>
        </Card>
        
        <Card className="border-[#f5592b]/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#150773]">Empresas Incipientes</CardTitle>
            <Award className="h-5 w-5 text-[#f5592b]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#150773]">{kpis?.empresasIncipientes?.toLocaleString() || '0'}</div>
            <p className="text-xs text-gray-600 mt-1">Nivel inicial de madurez</p>
          </CardContent>
        </Card>
        
        <Card className="border-[#150773]/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#150773]">Total Empleados</CardTitle>
            <Users className="h-5 w-5 text-[#150773]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#f5592b]">{kpis?.totalEmpleados?.toLocaleString() || '0'}</div>
            <p className="text-xs text-gray-600 mt-1">Empleados en total</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución por Departamentos */}
      {filterOptions?.departamentos && (
        <Card className="border-[#f5592b]/20 shadow-sm">
          <CardHeader className="bg-[#f5592b] text-white">
            <CardTitle className="flex items-center text-lg">
              <Target className="h-5 w-5 mr-2" />
              Distribución por Departamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filterOptions.departamentos.slice(0, 6).map((dept: string) => (
                <div key={dept} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-[#150773]">{dept}</span>
                  <Badge className="bg-[#f5592b] text-white">
                    {empresas.filter(e => e.departamento === dept).length}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              .slice(0, 5)
              .map((empresa, index) => (
                <div key={empresa.IdEmpresa} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-[#f5592b] text-white rounded-full font-bold">
                      {index + 1}
                    </div>
                    <div>
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
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribución por Sectores */}
      {filterOptions?.sectores && (
        <Card className="border-[#f5592b]/20 shadow-sm">
          <CardHeader className="bg-[#f5592b] text-white">
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="h-5 w-5 mr-2" />
              Distribución por Sectores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filterOptions.sectores.slice(0, 8).map((sector: string) => (
                <div key={sector} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-[#150773] truncate">{sector}</span>
                  <Badge className="bg-[#150773] text-white">
                    {empresas.filter(e => e.sectorActividadDescripcion === sector).length}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
