"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Users, 
  TrendingUp, 
  Award, 
  Target, 
  BarChart3,
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  User
} from "lucide-react"
import { getAuthToken } from "@/lib/api-client"

export function BusinessDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)


  // Cargar datos de la empresa
  useEffect(() => {
    const loadBusinessData = async () => {
      setLoading(true)
      try {
        const token = getAuthToken()
        if (!token) {
          setError("No se pudo obtener el token de autenticación")
          return
        }

        const response = await fetch(`http://localhost:3001/api/empresas/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setBusiness(data)

      } catch (error) {
        console.error('Error loading business data:', error)
        setError(`Error cargando datos: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadBusinessData()
    }
  }, [id])

  const handleBack = () => {
    router.push("/empresas")
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
          <p className="text-lg text-gray-600">Cargando datos de la empresa...</p>
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
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Empresas
          </Button>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Empresa no encontrada</h2>
          <p className="text-gray-600 mb-4">No se pudo encontrar la empresa solicitada.</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Empresas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="border-[#f5592b] text-[#f5592b] hover:bg-[#f5592b] hover:text-white bg-transparent shadow-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            ← Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#150773]">{business.empresa}</h1>
            <p className="text-gray-600 text-lg">{business.ruc}</p>
          </div>
        </div>
        <Badge className={`${getMaturityColor(business.puntajeGeneral)} text-lg px-4 py-2 shadow-lg`}>
          🏆 {getMaturityLevel(business.puntajeGeneral)}
        </Badge>
      </div>

      {/* Información General */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información de la Empresa */}
        <Card className="border-[#f5592b]/20 bg-gradient-to-br from-white to-orange-50/30 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#f5592b] to-[#e04a1f] text-white">
            <CardTitle className="flex items-center text-xl">
              <Building2 className="h-6 w-6 mr-3" />
              🏢 Información General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center text-sm">
              <MapPin className="h-5 w-5 mr-3 text-[#f5592b]" />
              <span className="text-[#150773] font-semibold">{business.ubicacion}</span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="h-5 w-5 mr-3 text-[#f5592b]" />
              <span className="text-[#150773] font-semibold">Año de creación: {business.anioCreacion || 'N/A'}</span>
            </div>
            <div className="flex items-center text-sm">
              <Users className="h-5 w-5 mr-3 text-[#f5592b]" />
              <span className="text-[#150773] font-semibold">Empleados: {business.TotalEmpleados || 'N/A'}</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-[#150773]">🏭 Sector:</span> 
              <span className="text-gray-700 ml-2">{business.sectorActividadDescripcion || 'N/A'}</span>
            </div>
            {business.subSectorActividadDescripcion && (
              <div className="text-sm">
                <span className="font-bold text-[#150773]">🔧 Sub-sector:</span> 
                <span className="text-gray-700 ml-2">{business.subSectorActividadDescripcion}</span>
              </div>
            )}
            <div className="text-sm">
              <span className="font-bold text-[#150773]">💰 Ventas anuales:</span> 
              <span className="text-gray-700 ml-2">{business.ventasAnuales || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card className="border-[#150773]/20 bg-gradient-to-br from-white to-blue-50/30 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#150773] to-[#1e0a8c] text-white">
            <CardTitle className="flex items-center text-xl">
              <User className="h-6 w-6 mr-3" />
              👤 Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center text-sm">
              <User className="h-5 w-5 mr-3 text-[#150773]" />
              <span className="text-[#f5592b] font-semibold">{business.contactoPrincipal || 'N/A'}</span>
            </div>
            <div className="flex items-center text-sm">
              <Mail className="h-5 w-5 mr-3 text-[#150773]" />
              <span className="text-[#f5592b] font-semibold">{business.Email || 'N/A'}</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-[#150773]">💼 Cargo:</span> 
              <span className="text-gray-700 ml-2">{business.Cargo || 'N/A'}</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-[#150773]">👑 Liderazgo:</span> 
              <span className="text-gray-700 ml-2">{business.Liderazgo || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Evaluación General */}
        <Card className="border-[#f5592b]/20 bg-gradient-to-br from-white to-orange-50/30 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#f5592b] to-[#e04a1f] text-white">
            <CardTitle className="flex items-center text-xl">
              <BarChart3 className="h-6 w-6 mr-3" />
              📊 Evaluación General
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#150773] mb-2">
                {business.puntajeGeneral ? `${business.puntajeGeneral.toFixed(1)}%` : 'N/A'}
              </div>
              <Badge className={`${getMaturityColor(business.puntajeGeneral)} text-lg px-4 py-2 shadow-lg`}>
                🏆 {getMaturityLevel(business.puntajeGeneral)}
              </Badge>
            </div>
            {business.puntajeGeneral && (
              <Progress value={business.puntajeGeneral} className="w-full h-3" />
            )}
            <div className="text-sm text-gray-600 text-center">
              📅 Última evaluación: {business.FechaTest ? new Date(business.FechaTest).toLocaleDateString() : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dimensiones de Evaluación */}
      <Card className="border-[#150773]/20 bg-gradient-to-br from-white to-blue-50/30 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-[#150773] to-[#1e0a8c] text-white">
          <CardTitle className="flex items-center text-xl">
            <Target className="h-6 w-6 mr-3" />
            🎯 Dimensiones de Evaluación
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Tecnología', value: business.puntajeTecnologia, icon: '💻', color: '#f5592b' },
              { name: 'Comunicación', value: business.puntajeComunicacion, icon: '📱', color: '#150773' },
              { name: 'Organización', value: business.puntajeOrganizacion, icon: '🏢', color: '#f5592b' },
              { name: 'Datos', value: business.puntajeDatos, icon: '📊', color: '#150773' },
              { name: 'Estrategia', value: business.puntajeEstrategia, icon: '🎯', color: '#f5592b' },
              { name: 'Procesos', value: business.puntajeProcesos, icon: '⚙️', color: '#150773' }
            ].map((dimension) => (
              <div key={dimension.name} className="space-y-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{dimension.icon}</span>
                    <span className="font-bold text-[#150773]">{dimension.name}</span>
                  </div>
                  <span className="text-lg font-bold" style={{ color: dimension.color }}>
                    {dimension.value ? `${dimension.value.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                {dimension.value && (
                  <Progress value={dimension.value} className="w-full h-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline"
          className="border-[#150773] text-[#150773] hover:bg-[#150773] hover:text-white bg-transparent shadow-md"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          📈 Ver Historial
        </Button>
        <Button className="bg-gradient-to-r from-[#f5592b] to-[#e04a1f] hover:from-[#e04a1f] hover:to-[#c73e1a] text-white border-0 shadow-lg">
          <Award className="h-4 w-4 mr-2" />
          🏆 Nueva Evaluación
        </Button>
      </div>
    </div>
  )
}
