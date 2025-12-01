"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, CheckCircle, Eye, Loader2 } from "lucide-react"
import { getAuthToken } from "@/lib/api-client"

interface SurveyHistoryProps {
  businessId: number
}

export function SurveyHistory({ businessId }: SurveyHistoryProps) {
  const router = useRouter()
  const [surveyHistory, setSurveyHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)


  // Cargar historial de encuestas
  useEffect(() => {
    const loadSurveyHistory = async () => {
      setLoading(true)
      try {
        const token = getAuthToken()
        if (!token) {
          setError("No se pudo obtener el token de autenticación")
          return
        }

        const response = await fetch(`http://localhost:3001/api/encuestas/empresas/${businessId}/surveys`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setSurveyHistory(data)
      } catch (error) {
        console.error('Error loading survey history:', error)
        setError('Error cargando historial de encuestas')
      } finally {
        setLoading(false)
      }
    }

    if (businessId) {
      loadSurveyHistory()
    }
  }, [businessId])

  const getNivelColor = (nivel: string | null | undefined) => {
    if (!nivel) return "bg-gray-100 text-gray-800 border-gray-200"
    
    switch (nivel.toLowerCase()) {
      case "básico":
        return "bg-red-100 text-red-800 border-red-200"
      case "intermedio":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "avanzado":
        return "bg-green-100 text-green-800 border-green-200"
      case "experto":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleViewResponses = (idTestUsuario: number) => {
    router.push(`/empresas/${businessId}/encuesta/${idTestUsuario}`)
  }

  const formatDuration = (minutes: number) => {
    if (!minutes) return "N/A"
    if (minutes < 60) return `${minutes} minutos`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[#150773]">Historial de Evaluaciones</CardTitle>
          <p className="text-gray-600">Registro completo de todas las evaluaciones realizadas por esta empresa</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#f5592b]" />
              <p className="text-gray-600">Cargando historial...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[#150773]">Historial de Evaluaciones</CardTitle>
          <p className="text-gray-600">Registro completo de todas las evaluaciones realizadas por esta empresa</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-center text-red-600">
              <p>{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#150773]">Historial de Evaluaciones</CardTitle>
        <p className="text-gray-600">Registro completo de todas las evaluaciones realizadas por esta empresa</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {surveyHistory.map((survey, index) => (
            <div key={survey.idTestUsuario} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-[#150773] mb-1">{survey.nombreTest}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(survey.fechaInicio).toLocaleDateString("es-PY")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(survey.duracionMinutos)}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {survey.estado}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#f5592b]">{survey.puntajeGeneral ? survey.puntajeGeneral.toFixed(1) : 'N/A'}%</div>
                    <Badge className={`${getNivelColor(survey.nivelMadurez)} border text-xs`}>
                      {survey.nivelMadurez || 'Sin evaluar'}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleViewResponses(survey.idTestUsuario)}
                    className="bg-[#150773] hover:bg-[#150773]/90 text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Respuestas
                  </Button>
                </div>
              </div>

              {index === 0 && surveyHistory.length > 1 && new Date(survey.fechaTermino) >= new Date(surveyHistory[1]?.fechaTermino || 0) && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800 font-medium">
                    📈 Evaluación más reciente - Última evaluación completada
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
