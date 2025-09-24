"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, MapPin, Calendar, BarChart3, Eye, Search, Users, Award, Target, Loader2 } from "lucide-react"
import { authService } from "./services/auth-service"

interface BusinessListProps {
  filters: any
}

export function BusinessList({ filters }: BusinessListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [businesses, setBusinesses] = useState([])
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const token = await getAuthToken()
        if (!token) {
          setError("No se pudo obtener el token de autenticación")
          return
        }

        // Cargar empresas
        const empresasResponse = await fetch('http://localhost:3001/api/empresas?limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!empresasResponse.ok) {
          throw new Error(`Error ${empresasResponse.status}: ${empresasResponse.statusText}`)
        }
        
        const empresasData = await empresasResponse.json()
        setBusinesses(empresasData.data || [])

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

      } catch (error) {
        console.error('Error loading data:', error)
        setError(`Error cargando datos: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [filters])

  // Filtrar empresas basado en searchTerm
  const filteredBusinesses = businesses.filter(business => 
    business.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.departamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.sectorActividadDescripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBusinessSelect = (business: any) => {
    router.push(`/empresas/${business.IdEmpresa}`)
  }

  const handleDashboardView = () => {
    router.push("/dashboard")
  }

  const getBusinessSize = (ventasAnuales: string) => {
    if (!ventasAnuales) return "N/A"
    if (ventasAnuales.includes("646.045.491")) return "Micro"
    if (ventasAnuales.includes("3.000.000.000")) return "Mediana"
    return "Grande"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalEmpresas?.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nivel General</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.nivelGeneral}%</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Empresas Incipientes</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.empresasIncipientes?.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.totalEmpleados?.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar empresas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleDashboardView} variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Ver Dashboard
        </Button>
      </div>

      {/* Businesses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Empleados</TableHead>
                <TableHead>Madurez</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBusinesses.map((business) => (
                <TableRow key={business.IdEmpresa} className="cursor-pointer hover:bg-gray-50">
                  <TableCell>
                    <div className="font-medium">{business.empresa}</div>
                    <div className="text-sm text-gray-500">{business.ventasAnuales}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      {business.departamento}
                      {business.distrito && `, ${business.distrito}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{business.sectorActividadDescripcion}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-1 text-gray-400" />
                      {business.totalEmpleados || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getMaturityColor(business.puntajeNivelDeMadurezGeneral)}>
                      {getMaturityLevel(business.puntajeNivelDeMadurezGeneral)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
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
            <div className="text-center py-8 text-gray-500">
              No se encontraron empresas que coincidan con la búsqueda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
