"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAuthToken } from "@/lib/api-client"
import { 
  FileText, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  ArrowLeft,
  Loader2,
  Building2,
  BarChart3
} from "lucide-react"

export function SurveyResponses() {
  const { id } = useParams()
  const router = useRouter()
  const [responses, setResponses] = useState([])
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)


  // Cargar datos de respuestas
  useEffect(() => {
    const loadSurveyData = async () => {
      setLoading(true)
      try {
        const token = getAuthToken()
        if (!token) {
          setError("No se pudo obtener el token de autenticación")
          return
        }

        // Cargar respuestas de encuestas
        const responsesResponse = await fetch(`http://localhost:3001/api/encuestas?empresaId=${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (responsesResponse.ok) {
          const responsesData = await responsesResponse.json()
          setResponses(responsesData.data || [])
        }

        // Cargar información de la empresa
        const businessResponse = await fetch(`http://localhost:3001/api/empresas/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (businessResponse.ok) {
          const businessData = await businessResponse.json()
          setBusiness(businessData)
        }

      } catch (error) {
        console.error('Error loading survey data:', error)
        setError(`Error cargando datos: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadSurveyData()
    }
  }, [id])

  const handleBack = () => {
    router.push("/empresas")
  }

  const getStatusBadge = (finalizado: boolean) => {
    if (finalizado) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completado
        </Badge>
      )
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <Clock className="h-3 w-3 mr-1" />
        En Progreso
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-PY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Cargando respuestas de encuestas...</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Respuestas de Encuestas</h1>
            {business && (
              <p className="text-gray-600">{business.empresa}</p>
            )}
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {responses.length} respuesta{responses.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Respuestas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responses.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {responses.filter(r => r.finalizado).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {responses.filter(r => !r.finalizado).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Respuestas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Historial de Evaluaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evaluador</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Tipo de Evaluación</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Puntaje</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((response) => (
                  <TableRow key={response.idTestUsuario}>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <div>
                          <div className="font-medium">{response.nombreCompleto}</div>
                          <div className="text-sm text-gray-500">{response.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{response.cargoEmpresa}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{response.test}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(response.fechaInicio)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(response.fechaTermino)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(response.finalizado)}
                    </TableCell>
                    <TableCell>
                      {response.puntajeNivelDeMadurezGeneral ? (
                        <Badge variant="outline">
                          {response.puntajeNivelDeMadurezGeneral.toFixed(1)}%
                        </Badge>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No hay respuestas disponibles
              </h3>
              <p className="text-gray-600 mb-4">
                Esta empresa aún no ha completado ninguna evaluación.
              </p>
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Nueva Evaluación
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
