"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { ClientOnly } from "./client-only"
import { authService } from "./services/auth-service"

interface SurveyResponsesProps {
  businessId: number
  testId: number
}

interface Response {
  IdPregunta: number
  textoPregunta: string
  respuesta: string
  puntajePregunta: number
  dimension: string
  indicadorColor: string
  orden: number
  TipoDePregunta: number
}

export function SurveyResponses({ businessId, testId }: SurveyResponsesProps) {
  const [responses, setResponses] = useState<Response[]>([])
  const [allResponses, setAllResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDimension, setSelectedDimension] = useState("todas")
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  // Función para obtener token de autenticación usando el servicio singleton
  const getAuthToken = async () => {
    try {
      return await authService.getValidToken()
    } catch (error) {
      console.error('Error getting auth token:', error)
      return null
    }
  }

  // Cargar todas las respuestas de la encuesta una sola vez
  useEffect(() => {
    const loadAllResponses = async () => {
      setLoading(true)
      try {
        const token = await getAuthToken()
        if (!token) {
          setError("No se pudo obtener el token de autenticación")
          return
        }

        const response = await fetch(`http://localhost:3001/api/encuestas/empresas/${businessId}/tests/${testId}/responses?dimension=Todas`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(60000) // 60 seconds timeout
        })
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Ordenar por orden de pregunta
        const sortedResponses = data.sort((a, b) => a.orden - b.orden)
        
        setAllResponses(sortedResponses)
        setResponses(sortedResponses)
        setInitialLoadDone(true)
      } catch (error) {
        console.error('Error loading survey responses:', error)
        setError('Error cargando respuestas de la encuesta')
      } finally {
        setLoading(false)
      }
    }

    if (businessId && testId && !initialLoadDone) {
      loadAllResponses()
    }
  }, [businessId, testId, initialLoadDone])
  
  // Filtrar respuestas cuando cambia la dimensión seleccionada
  useEffect(() => {
    if (!initialLoadDone) return;
    
    if (selectedDimension === "todas") {
      setResponses(allResponses);
    } else {
      const filteredResponses = allResponses.filter(
        response => response.dimension.toLowerCase() === selectedDimension.toLowerCase()
      );
      setResponses(filteredResponses);
    }
  }, [selectedDimension, allResponses, initialLoadDone])

  // Obtener dimensiones únicas de todas las respuestas
  const dimensiones = [...new Set(allResponses.map(response => response.dimension))]
    .filter(dimension => dimension !== 'Otra')
    .sort()

  const getResponseIcon = (puntaje: number) => {
    if (puntaje === 0) return <XCircle className="h-4 w-4 text-red-500" />
    if (puntaje < 0.5) return <AlertCircle className="h-4 w-4 text-yellow-500" />
    return <CheckCircle className="h-4 w-4 text-green-500" />
  }

  const getDimensionColor = (dimension: string) => {
    const colors: { [key: string]: string } = {
      Tecnología: "bg-blue-100 text-blue-800",
      Comunicación: "bg-green-100 text-green-800",
      Organización: "bg-purple-100 text-purple-800",
      Datos: "bg-orange-100 text-orange-800",
      Estrategia: "bg-red-100 text-red-800",
      Procesos: "bg-indigo-100 text-indigo-800",
    }
    return colors[dimension] || "bg-gray-100 text-gray-800"
  }

  // Función para limpiar el texto HTML de las preguntas
  const cleanHtml = (text: string) => {
    if (!text) return ''
    return text
      .replace(/<br>/g, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[#150773]">Respuestas por Dimensión</CardTitle>
          <p className="text-gray-600">Análisis detallado de las respuestas organizadas por dimensión de innovación</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#f5592b]" />
              <p className="text-gray-600">Cargando respuestas...</p>
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
          <CardTitle className="text-[#150773]">Respuestas por Dimensión</CardTitle>
          <p className="text-gray-600">Análisis detallado de las respuestas organizadas por dimensión de innovación</p>
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

  if (responses.length === 0) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#150773]">Respuestas por Dimensión</CardTitle>
        <p className="text-gray-600">Análisis detallado de las respuestas organizadas por dimensión de innovación</p>
      </CardHeader>
      <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <p className="text-gray-600">No se encontraron respuestas para esta encuesta</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <ClientOnly fallback={
      <Card>
        <CardHeader>
          <CardTitle className="text-[#150773]">Respuestas por Dimensión</CardTitle>
          <p className="text-gray-600">Cargando respuestas...</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#f5592b]" />
              <p className="text-gray-600">Inicializando...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    }>
      <Card>
        <CardHeader>
          <CardTitle className="text-[#150773]">Respuestas por Dimensión</CardTitle>
          <p className="text-gray-600">Análisis detallado de las respuestas organizadas por dimensión de innovación</p>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedDimension} onValueChange={setSelectedDimension} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="todas">Todas</TabsTrigger>
            {dimensiones.map((dim) => (
              <TabsTrigger key={dim} value={dim.toLowerCase()}>
                {dim}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="todas" className="mt-6">
            <div className="space-y-4">
                {responses.map((response) => (
                  <div key={`${response.IdPregunta}-${response.respuesta}`} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getDimensionColor(response.dimension)}>{response.dimension}</Badge>
                        <span className="text-sm text-gray-500">Pregunta {response.orden}</span>
                      </div>
                        <h3 className="font-medium text-[#150773] mb-2">{cleanHtml(response.textoPregunta)}</h3>
                      <p className="text-gray-700 bg-gray-50 p-2 rounded border-l-4 border-[#f5592b]">
                        {response.respuesta}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        {getResponseIcon(response.puntajePregunta || 0)}
                        <span className="font-bold text-[#f5592b]">{response.puntajePregunta ? response.puntajePregunta.toFixed(3) : '0.000'}</span>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {dimensiones.map((dimension) => (
            <TabsContent key={dimension} value={dimension.toLowerCase()} className="mt-6">
              <div className="space-y-4">
                {responses
                  .filter((response) => response.dimension === dimension)
                    .map((response) => (
                      <div key={`${response.IdPregunta}-${response.respuesta}-${dimension}`} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-500">Pregunta {response.orden}</span>
                          </div>
                            <h3 className="font-medium text-[#150773] mb-2">{cleanHtml(response.textoPregunta)}</h3>
                          <p className="text-gray-700 bg-gray-50 p-2 rounded border-l-4 border-[#f5592b]">
                            {response.respuesta}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            {getResponseIcon(response.puntajePregunta || 0)}
                            <span className="font-bold text-[#f5592b]">{response.puntajePregunta ? response.puntajePregunta.toFixed(3) : '0.000'}</span>
                          </div>
                      </div>
                    </div>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
    </ClientOnly>
  )
}