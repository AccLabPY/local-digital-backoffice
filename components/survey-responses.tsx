"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle, XCircle, AlertCircle, Loader2, Eye, ChevronDown, ChevronRight } from "lucide-react"
import { ClientOnly } from "./client-only"
import { getAuthToken } from "@/lib/api-client"

interface SurveyResponsesProps {
  businessId: number
  testUsuarioId: number
}

interface Response {
  IdPregunta: number
  textoPregunta: string
  respuesta: string
  valorRespuesta?: string
  puntajePregunta: number
  dimension: string
  indicadorColor: string
  orden: number
  TipoDePregunta: number
}

interface PossibleAnswer {
  idRespuestaPosible: number
  textoRespuesta: string
  valorRespuesta: string
  valorVisible: number
  idPreguntaRespuesta: number
}

interface PossibleSubAnswer {
  idSubPregunta: number
  descripcionSubPregunta: string
  tituloSubPregunta: string
  idRespuestaPosible: number
  textoRespuesta: string
  valorRespuesta: string
  valorVisible: number
  idSubPreguntaRespuesta: number
}

interface GroupedResponse {
  IdPregunta: number
  textoPregunta: string
  dimension: string
  indicadorColor: string
  orden: number
  TipoDePregunta: number
  responses: Response[]
  isSubResponse: boolean
}

// Tipos de pregunta basados en el esquema real
enum QuestionType {
  BINARY = 1,           // Pregunta binaria (Sí/No)
  MULTIPLE_CHOICE = 2,  // Selección múltiple
  SINGLE_CHOICE = 1,    // Selección única
  RANKING = 6,          // Ranking
  FILL_IN = 4,          // Completar (porcentajes)
  BIDIMENSIONAL = 3     // Bidimensional
}

export function SurveyResponses({ businessId, testUsuarioId }: SurveyResponsesProps) {
  const [responses, setResponses] = useState<Response[]>([])
  const [allResponses, setAllResponses] = useState<Response[]>([])
  const [groupedResponses, setGroupedResponses] = useState<GroupedResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDimension, setSelectedDimension] = useState("todas")
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())
  const [possibleAnswers, setPossibleAnswers] = useState<Map<number, PossibleAnswer[]>>(new Map())
  const [possibleSubAnswers, setPossibleSubAnswers] = useState<Map<number, PossibleSubAnswer[]>>(new Map())
  const [loadingPossibleAnswers, setLoadingPossibleAnswers] = useState<Set<number>>(new Set())


  // Función para determinar el tipo de pregunta basado en TipoDePregunta
  const getQuestionType = (tipoPregunta: number): QuestionType => {
    switch (tipoPregunta) {
      case 1: return QuestionType.BINARY
      case 2: return QuestionType.MULTIPLE_CHOICE
      case 3: return QuestionType.BIDIMENSIONAL
      case 4: return QuestionType.FILL_IN
      case 6: return QuestionType.RANKING
      default: return QuestionType.SINGLE_CHOICE
    }
  }

  // Función para agrupar respuestas por pregunta
  const groupResponsesByQuestion = (responses: Response[]): GroupedResponse[] => {
    const grouped = new Map<number, GroupedResponse>()
    
    responses.forEach(response => {
      const isSubResponse = response.textoPregunta.includes(' - ')
      
      if (!grouped.has(response.IdPregunta)) {
        grouped.set(response.IdPregunta, {
          IdPregunta: response.IdPregunta,
          textoPregunta: isSubResponse ? response.textoPregunta.split(' - ')[0] : response.textoPregunta,
          dimension: response.dimension,
          indicadorColor: response.indicadorColor,
          orden: response.orden,
          TipoDePregunta: response.TipoDePregunta,
          responses: [],
          isSubResponse: false
        })
      }
      
      const group = grouped.get(response.IdPregunta)!
      group.responses.push(response)
      
      if (isSubResponse) {
        group.isSubResponse = true
      }
    })
    
    return Array.from(grouped.values()).sort((a, b) => a.orden - b.orden)
  }

  // Función para determinar si una pregunta tiene subrespuestas reales
  const hasRealSubResponses = (group: GroupedResponse): boolean => {
    const questionType = getQuestionType(group.TipoDePregunta)
    
    // Para preguntas de selección múltiple (Tipo 2), las múltiples respuestas son opciones seleccionadas, no subrespuestas
    if (questionType === QuestionType.MULTIPLE_CHOICE) return false
    
    // Para preguntas de ranking (Tipo 6), las múltiples respuestas son opciones ordenadas, no subrespuestas
    if (questionType === QuestionType.RANKING) return false
    
    // Para preguntas bidimensionales (Tipo 3), las múltiples respuestas son subpreguntas reales
    if (questionType === QuestionType.BIDIMENSIONAL) return true
    
    // Para preguntas de completar (Tipo 4), las múltiples respuestas son subpreguntas reales
    if (questionType === QuestionType.FILL_IN) return true
    
    // Para otros tipos, verificar si realmente hay subrespuestas (con ' - ')
    // o si está marcado como subrespuesta y tiene múltiples respuestas
    return group.isSubResponse && group.responses.some(response => response.textoPregunta.includes(' - '))
  }

  // Función para cargar respuestas posibles
  const loadPossibleAnswers = async (preguntaId: number) => {
    if (possibleAnswers.has(preguntaId) || loadingPossibleAnswers.has(preguntaId)) {
      return
    }

    setLoadingPossibleAnswers(prev => new Set(prev).add(preguntaId))

    try {
      const token = getAuthToken()
      if (!token) return

      const [mainResponse, subResponse] = await Promise.all([
        fetch(`http://localhost:3001/api/encuestas/preguntas/${preguntaId}/respuestas-posibles`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`http://localhost:3001/api/encuestas/preguntas/${preguntaId}/subrespuestas-posibles`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ])

      if (mainResponse.ok) {
        const mainAnswers = await mainResponse.json()
        setPossibleAnswers(prev => new Map(prev).set(preguntaId, mainAnswers))
      }

      if (subResponse.ok) {
        const subAnswers = await subResponse.json()
        setPossibleSubAnswers(prev => new Map(prev).set(preguntaId, subAnswers))
      }
    } catch (error) {
      console.error('Error loading possible answers:', error)
    } finally {
      setLoadingPossibleAnswers(prev => {
        const newSet = new Set(prev)
        newSet.delete(preguntaId)
        return newSet
      })
    }
  }

  // Cargar todas las respuestas
  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()
    
    const loadAllResponses = async () => {
      setLoading(true)
      try {
        const token = getAuthToken()
        if (!token) {
          if (isMounted) {
          setError("No se pudo obtener el token de autenticación")
            setLoading(false)
          }
          return
        }

        const response = await fetch(`http://localhost:3001/api/encuestas/empresas/${businessId}/testUsuarios/${testUsuarioId}/responses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        })
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (!isMounted) return
        
        const sortedResponses = data.sort((a: Response, b: Response) => a.orden - b.orden)
        
        setTimeout(() => {
          if (!isMounted) return
        
        setAllResponses(sortedResponses)
        setResponses(sortedResponses)
          
          const grouped = groupResponsesByQuestion(sortedResponses)
          setGroupedResponses(grouped)
          
        setInitialLoadDone(true)
          setLoading(false)
        }, 0)
      } catch (error) {
        if (!isMounted) return
        
        if ((error as Error).name === 'AbortError') {
          console.log('Request was aborted')
          return
        }
        
        console.error('Error loading survey responses:', error)
        setError('Error cargando respuestas de la encuesta')
        setLoading(false)
      }
    }

    if (businessId && testUsuarioId && !initialLoadDone) {
      loadAllResponses()
    }
    
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [businessId, testUsuarioId, initialLoadDone])
  
  // Filtrar respuestas por dimensión
  useEffect(() => {
    if (!initialLoadDone) return;
    
    if (selectedDimension === "todas") {
      setResponses(allResponses);
      setGroupedResponses(groupResponsesByQuestion(allResponses));
    } else {
      const filteredResponses = allResponses.filter(
        response => response.dimension.toLowerCase() === selectedDimension.toLowerCase()
      );
      setResponses(filteredResponses);
      setGroupedResponses(groupResponsesByQuestion(filteredResponses));
    }
  }, [selectedDimension, allResponses, initialLoadDone])

  // Obtener dimensiones únicas
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

  // Función para limpiar HTML
  const cleanHtml = (text: string) => {
    if (!text) return ''
    return text
      .replace(/<br>/g, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
  }

  // Función para alternar expansión
  const toggleQuestionExpansion = (preguntaId: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(preguntaId)) {
        newSet.delete(preguntaId)
      } else {
        newSet.add(preguntaId)
        loadPossibleAnswers(preguntaId)
      }
      return newSet
    })
  }

  // Función para extraer TextoSubPregunta del texto concatenado
  const extractSubQuestionText = (textoPregunta: string): string => {
    if (textoPregunta.includes(' - ')) {
      return textoPregunta.split(' - ')[1]
    }
    return textoPregunta
  }

  // Función para extraer el texto específico de la subpregunta desde la respuesta
  const extractSpecificSubQuestionText = (response: Response): string => {
    // Si es una subrespuesta (contiene ' - '), extraer la parte específica
    if (response.textoPregunta.includes(' - ')) {
      return response.textoPregunta.split(' - ')[1]
    }
    // Para respuestas principales, usar el campo respuesta que contiene el texto específico
    return response.respuesta || response.textoPregunta
  }

  // Función para obtener el valor de respuesta correcto según el tipo de pregunta
  const getResponseValue = (response: Response, tipoPregunta: number): string => {
    const questionType = getQuestionType(tipoPregunta)
    
    switch (questionType) {
      case QuestionType.FILL_IN:
        // Para preguntas de completar, mostrar valorRespuesta con %
        return `${response.valorRespuesta || response.respuesta}%`
      case QuestionType.BIDIMENSIONAL:
        // Para preguntas bidimensionales, mostrar respuesta (texto del rango)
        return response.respuesta
      default:
        // Para otras preguntas, mostrar respuesta
        return response.respuesta
    }
  }

  // Función para renderizar respuestas según el tipo de pregunta
  const renderQuestionResponse = (group: GroupedResponse) => {
    const questionType = getQuestionType(group.TipoDePregunta)
    
    switch (questionType) {
      case QuestionType.FILL_IN:
        return renderFillInQuestion(group)
      case QuestionType.MULTIPLE_CHOICE:
        return renderMultipleChoiceQuestion(group)
      case QuestionType.RANKING:
        return renderRankingQuestion(group)
      case QuestionType.BIDIMENSIONAL:
        return renderBidimensionalQuestion(group)
      default:
        return renderDefaultQuestion(group)
    }
  }

  // Renderizar pregunta de completar (Tipo 4)
  const renderFillInQuestion = (group: GroupedResponse) => {
    // Para la primera respuesta, extraer el texto específico de la subpregunta
    const mainResponse = group.responses[0]
    const mainSubQuestionText = extractSpecificSubQuestionText(mainResponse)

    return (
      <div className="bg-gray-50 p-3 rounded border-l-4 border-[#f5592b]">
        <p className="text-sm text-gray-600 mb-2">
          {mainSubQuestionText}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#150773]">
            {mainResponse?.valorRespuesta || mainResponse?.respuesta}
          </span>
          <span className="text-lg font-bold text-[#150773]">%</span>
          {getResponseIcon(mainResponse?.puntajePregunta || 0)}
          <span className="font-bold text-[#f5592b]">
            {mainResponse?.puntajePregunta ? mainResponse.puntajePregunta.toFixed(3) : '0.000'}
          </span>
        </div>
      </div>
    )
  }

  // Renderizar pregunta de selección múltiple (Tipo 2)
  const renderMultipleChoiceQuestion = (group: GroupedResponse) => (
    <div className="bg-gray-50 p-3 rounded border-l-4 border-[#f5592b]">
      <h4 className="font-medium text-sm text-gray-700 mb-2">Opciones seleccionadas:</h4>
      <div className="space-y-2">
        {group.responses.map((response, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-gray-700 flex-1">
              {response.respuesta}
            </span>
            <span className="font-bold text-[#f5592b]">
              {response.puntajePregunta ? response.puntajePregunta.toFixed(3) : '0.000'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  // Renderizar pregunta de ranking (Tipo 6)
  const renderRankingQuestion = (group: GroupedResponse) => {
    // Ordenar respuestas por ranking (1, 2, 3...)
    const sortedResponses = [...group.responses].sort((a, b) => {
      const rankA = parseInt(a.valorRespuesta || a.respuesta) || 0
      const rankB = parseInt(b.valorRespuesta || b.respuesta) || 0
      return rankA - rankB
    })

    return (
      <div className="bg-gray-50 p-3 rounded border-l-4 border-[#f5592b]">
        <h4 className="font-medium text-sm text-gray-700 mb-2">Ranking asignado:</h4>
        <div className="space-y-2">
          {sortedResponses.map((response, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
              <span className="text-sm font-bold text-[#150773] w-8">
                #{response.valorRespuesta || response.respuesta}
              </span>
              <span className="text-sm text-gray-700 flex-1">
                {response.respuesta}
              </span>
              <span className="font-bold text-[#f5592b]">
                {response.puntajePregunta ? response.puntajePregunta.toFixed(3) : '0.000'}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Renderizar pregunta bidimensional (Tipo 3)
  const renderBidimensionalQuestion = (group: GroupedResponse) => (
    <div className="bg-gray-50 p-3 rounded border-l-4 border-[#f5592b]">
      <h4 className="font-medium text-sm text-gray-700 mb-2">
        {group.orden === 10 ? "Canales digitales y su uso:" : "Frecuencias de capacitación:"}
      </h4>
      <div className="space-y-2">
        {group.responses.map((response, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border">
            <span className="text-sm font-medium text-[#150773] w-48">
              {extractSubQuestionText(response.textoPregunta)}
            </span>
            <span className="text-sm text-gray-600 flex-1">
              {response.respuesta}
            </span>
            <span className="font-bold text-[#f5592b]">
              {response.puntajePregunta ? response.puntajePregunta.toFixed(3) : '0.000'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  // Renderizar pregunta por defecto
  const renderDefaultQuestion = (group: GroupedResponse) => (
    <div>
      <p className="text-gray-700 bg-gray-50 p-2 rounded border-l-4 border-[#f5592b]">
        {group.responses[0]?.respuesta}
      </p>
      <div className="flex items-center gap-2 mt-2">
        {getResponseIcon(group.responses[0]?.puntajePregunta || 0)}
        <span className="font-bold text-[#f5592b]">
          {group.responses[0]?.puntajePregunta ? group.responses[0].puntajePregunta.toFixed(3) : '0.000'}
        </span>
      </div>
    </div>
  )

  // Función para renderizar modal de opciones
  const renderPossibleAnswersModal = (preguntaId: number, selectedResponse: string, tipoPregunta: number, userResponses: Response[] = []) => {
    const mainAnswers = possibleAnswers.get(preguntaId) || []
    const subAnswers = possibleSubAnswers.get(preguntaId) || []
    const isLoading = loadingPossibleAnswers.has(preguntaId)
    const questionType = getQuestionType(tipoPregunta)
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-gray-500">Cargando opciones...</span>
        </div>
      )
    }

    switch (questionType) {
      case QuestionType.FILL_IN:
        return renderFillInModal(selectedResponse)
      case QuestionType.MULTIPLE_CHOICE:
        return renderMultipleChoiceModal(mainAnswers, userResponses)
      case QuestionType.RANKING:
        return renderRankingModal(mainAnswers, userResponses)
      case QuestionType.BIDIMENSIONAL:
        return renderBidimensionalModal(subAnswers, tipoPregunta, userResponses)
      default:
        return renderDefaultModal(mainAnswers, subAnswers, selectedResponse, tipoPregunta, userResponses)
    }
  }

  const renderFillInModal = (selectedResponse: string) => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
        <h4 className="font-medium text-sm text-blue-800 mb-1">Valor ingresado:</h4>
        <div className="flex items-center gap-2">
          <span className="font-medium text-blue-900 text-lg">{selectedResponse}%</span>
          <CheckCircle className="h-4 w-4 text-blue-600" />
        </div>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded p-3">
        <h4 className="font-medium text-sm text-gray-700 mb-2">Tipo de pregunta:</h4>
        <p className="text-sm text-gray-600">
          Esta es una pregunta de <strong>completar</strong> donde debes ingresar un porcentaje numérico.
        </p>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
        <h4 className="font-medium text-sm text-yellow-800 mb-2">Ejemplos de valores:</h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-center p-2 bg-white rounded border">0%</div>
          <div className="text-center p-2 bg-white rounded border">50%</div>
          <div className="text-center p-2 bg-white rounded border">100%</div>
        </div>
      </div>
    </div>
  )

  const renderMultipleChoiceModal = (mainAnswers: PossibleAnswer[], userResponses: Response[]) => {
    // Crear un set de respuestas seleccionadas para comparación rápida
    const selectedResponses = new Set(userResponses.map(r => r.respuesta))
    
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <h4 className="font-medium text-sm text-blue-800 mb-2">Tipo de pregunta:</h4>
          <p className="text-sm text-blue-700">
            Esta es una pregunta de <strong>selección múltiple</strong> donde puedes marcar todas las opciones que apliquen.
          </p>
        </div>
        
        {/* Mostrar opciones seleccionadas */}
        {userResponses.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-blue-800 mb-2">Opciones seleccionadas:</h4>
            <div className="space-y-2">
              {userResponses.map((response, index) => (
                <div key={index} className="p-3 rounded border bg-green-50 border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-800 font-medium flex-1">{response.respuesta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {mainAnswers.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Todas las opciones disponibles:</h4>
            <div className="space-y-2">
              {mainAnswers.map((answer) => {
                const isSelected = selectedResponses.has(answer.textoRespuesta)
                return (
                  <div 
                    key={answer.idRespuestaPosible} 
                    className={`p-3 rounded border ${
                      isSelected 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 border-2 rounded mt-0.5 flex items-center justify-center ${
                        isSelected 
                          ? 'border-green-500 bg-green-500' 
                          : 'border-gray-400'
                      }`}>
                        {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                      <span className={`text-sm flex-1 ${
                        isSelected ? 'text-green-800 font-medium' : 'text-gray-700'
                      }`}>
                        {answer.textoRespuesta}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderRankingModal = (mainAnswers: PossibleAnswer[], userResponses: Response[]) => {
    // Crear un mapa de respuestas con sus rankings
    const responseRankings = new Map<string, string>()
    userResponses.forEach(response => {
      responseRankings.set(response.respuesta, response.valorRespuesta || response.respuesta)
    })
    
    return (
      <div className="space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded p-3">
          <h4 className="font-medium text-sm text-purple-800 mb-2">Tipo de pregunta:</h4>
          <p className="text-sm text-purple-700">
            Esta es una pregunta de <strong>ranking</strong> donde debes asignar un orden (1, 2, 3...) a cada opción.
          </p>
        </div>
        
        {/* Mostrar rankings asignados */}
        {userResponses.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-purple-800 mb-2">Rankings asignados:</h4>
            <div className="space-y-2">
              {userResponses
                .sort((a, b) => {
                  const rankA = parseInt(a.valorRespuesta || a.respuesta) || 0
                  const rankB = parseInt(b.valorRespuesta || b.respuesta) || 0
                  return rankA - rankB
                })
                .map((response, index) => (
                <div key={index} className="p-3 rounded border bg-purple-50 border-purple-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded flex items-center justify-center text-sm font-bold">
                      #{response.valorRespuesta || response.respuesta}
                    </div>
                    <span className="text-sm text-purple-800 font-medium flex-1">{response.respuesta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {mainAnswers.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Opciones para ordenar:</h4>
            <div className="space-y-2">
              {mainAnswers.map((answer) => {
                const assignedRank = responseRankings.get(answer.textoRespuesta)
                const isRanked = assignedRank !== undefined
                
                return (
                  <div 
                    key={answer.idRespuestaPosible} 
                    className={`p-3 rounded border ${
                      isRanked 
                        ? 'bg-purple-50 border-purple-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 border-2 rounded flex items-center justify-center text-xs font-bold ${
                        isRanked 
                          ? 'bg-purple-600 text-white border-purple-600' 
                          : 'border-gray-400 text-gray-600'
                      }`}>
                        {isRanked ? `#${assignedRank}` : '#'}
                      </div>
                      <span className={`text-sm flex-1 ${
                        isRanked ? 'text-purple-800 font-medium' : 'text-gray-700'
                      }`}>
                        {answer.textoRespuesta}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderBidimensionalModal = (subAnswers: PossibleSubAnswer[], tipoPregunta: number, userResponses: Response[]) => {
    // Crear un mapa de respuestas del usuario por subpregunta
    const userResponseMap = new Map<string, string>()
    userResponses.forEach(response => {
      const subQuestionText = extractSubQuestionText(response.textoPregunta)
      userResponseMap.set(subQuestionText, response.respuesta)
    })

    return (
      <div className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded p-3">
          <h4 className="font-medium text-sm text-orange-800 mb-2">Tipo de pregunta:</h4>
          <p className="text-sm text-orange-700">
            {tipoPregunta === 10 
              ? "Esta es una pregunta bidimensional donde debes seleccionar el uso de cada canal digital."
              : "Esta es una pregunta bidimensional donde debes seleccionar la frecuencia de capacitación para cada tema."
            }
          </p>
        </div>
        
        {/* Mostrar respuestas seleccionadas */}
        {userResponses.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-orange-800 mb-2">Respuestas seleccionadas:</h4>
            <div className="space-y-2">
              {userResponses.map((response, index) => (
                <div key={index} className="p-3 rounded border bg-orange-50 border-orange-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-orange-800 mb-1">
                        {extractSubQuestionText(response.textoPregunta)}
                      </div>
                      <div className="text-sm text-orange-700">
                        {response.respuesta}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {subAnswers.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Estructura bidimensional:</h4>
            <div className="text-xs text-gray-600 mb-3">
              <strong>Eje Y:</strong> {tipoPregunta === 10 ? "Canales digitales" : "Temas de capacitación"}<br/>
              <strong>Eje X:</strong> {tipoPregunta === 10 ? "Opciones de uso" : "Frecuencias"}
            </div>
            
            {subAnswers.reduce((acc: any[], answer) => {
              const existingGroup = acc.find(group => group.descripcion === answer.descripcionSubPregunta)
              if (existingGroup) {
                existingGroup.answers.push(answer)
              } else {
                acc.push({
                  descripcion: answer.descripcionSubPregunta,
                  titulo: answer.tituloSubPregunta,
                  answers: [answer]
                })
              }
              return acc
            }, []).map((group) => {
              const userSelectedAnswer = userResponseMap.get(group.titulo || group.descripcion)
              
              return (
                <div key={group.descripcion} className="mb-4 p-3 border rounded bg-gray-50">
                  <h5 className="font-medium text-sm text-[#150773] mb-2">
                    {group.titulo || group.descripcion}
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {group.answers.map((answer: any) => {
                      const isSelected = userSelectedAnswer === answer.textoRespuesta
                      
                      return (
                        <div 
                          key={answer.idRespuestaPosible} 
                          className={`p-2 rounded border text-xs ${
                            isSelected 
                              ? 'bg-orange-50 border-orange-200' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <div className={`w-3 h-3 border rounded flex items-center justify-center ${
                              isSelected 
                                ? 'border-orange-500 bg-orange-500' 
                                : 'border-gray-400'
                            }`}>
                              {isSelected && <CheckCircle className="h-2 w-2 text-white" />}
                            </div>
                            <span className={`text-gray-700 ${
                              isSelected ? 'font-medium text-orange-800' : ''
                            }`}>
                              {answer.textoRespuesta}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderDefaultModal = (mainAnswers: PossibleAnswer[], subAnswers: PossibleSubAnswer[], selectedResponse: string, tipoPregunta: number, userResponses: Response[]) => {
    if (mainAnswers.length === 0 && subAnswers.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          <span className="text-sm">No hay opciones disponibles para esta pregunta</span>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <h4 className="font-medium text-sm text-blue-800 mb-1">Respuesta actual:</h4>
          <div className="flex items-center gap-2">
            <span className="font-medium text-blue-900">{selectedResponse}</span>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </div>
        </div>

        {mainAnswers.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Opciones principales:</h4>
            <div className="space-y-2">
              {mainAnswers.map((answer) => (
                <div
                  key={answer.idRespuestaPosible}
                  className={`p-2 rounded border ${
                    answer.textoRespuesta === selectedResponse
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{answer.textoRespuesta}</span>
                    {answer.textoRespuesta === selectedResponse && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subAnswers.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Sub-opciones:</h4>
            <div className="space-y-3">
              {subAnswers.reduce((acc: any[], answer) => {
                const existingGroup = acc.find(group => group.idSubPregunta === answer.idSubPregunta)
                if (existingGroup) {
                  existingGroup.answers.push(answer)
                } else {
                  acc.push({
                    idSubPregunta: answer.idSubPregunta,
                    descripcion: answer.descripcionSubPregunta,
                    titulo: answer.tituloSubPregunta,
                    answers: [answer]
                  })
                }
                return acc
              }, []).map((group) => (
                <div key={group.idSubPregunta} className="border-l-2 border-gray-200 pl-3">
                  <h5 className="font-medium text-xs text-gray-600 mb-1">
                    {group.titulo || group.descripcion}
                  </h5>
                  <div className="space-y-1">
                    {group.answers.map((answer: any) => (
                      <div
                        key={answer.idRespuestaPosible}
                        className={`p-2 rounded border ${
                          answer.textoRespuesta === selectedResponse
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{answer.textoRespuesta}</span>
                          {answer.textoRespuesta === selectedResponse && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
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
                {groupedResponses.map((group) => (
                  <div key={group.IdPregunta} className="border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                            <Badge className={getDimensionColor(group.dimension)}>{group.dimension}</Badge>
                            <span className="text-sm text-gray-500">Pregunta {group.orden}</span>
                            {hasRealSubResponses(group) && (
                              <Badge variant="outline" className="text-xs">Con subrespuestas</Badge>
                            )}
                          </div>
                          <h3 className="font-medium text-[#150773] mb-2">
                            {cleanHtml(group.textoPregunta)}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadPossibleAnswers(group.IdPregunta)}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver opciones
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-lg font-semibold">
                                  Opciones disponibles - Pregunta {group.orden}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="mt-4">
                                <p className="text-sm text-gray-600 mb-4">{cleanHtml(group.textoPregunta)}</p>
                                {renderPossibleAnswersModal(
                                  group.IdPregunta, 
                                  group.responses[0]?.respuesta || '', 
                                  group.TipoDePregunta,
                                  group.responses
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {hasRealSubResponses(group) && group.responses.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleQuestionExpansion(group.IdPregunta)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              {expandedQuestions.has(group.IdPregunta) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Renderizar respuesta según el tipo de pregunta */}
                      <div className="mb-3">
                        {renderQuestionResponse(group)}
                      </div>

                      {/* Subrespuestas expandibles */}
                      {hasRealSubResponses(group) && group.responses.length > 1 && expandedQuestions.has(group.IdPregunta) && (
                        <div className="mt-4 space-y-3">
                          <h4 className="font-medium text-sm text-gray-700">Subrespuestas:</h4>
                          {group.responses.slice(1).map((response, index) => (
                            <div key={`${response.IdPregunta}-${index}`} className="border-l-2 border-gray-200 pl-3">
                              <div className="bg-gray-50 p-2 rounded">
                                <p className="text-sm text-gray-600 mb-1">
                                  {extractSpecificSubQuestionText(response)}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-700 font-bold">
                                    {getResponseValue(response, group.TipoDePregunta)}
                                  </span>
                                  {getResponseIcon(response.puntajePregunta || 0)}
                                  <span className="text-xs font-medium text-[#f5592b]">
                                    {response.puntajePregunta ? response.puntajePregunta.toFixed(3) : '0.000'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Indicador de múltiples respuestas */}
                      {hasRealSubResponses(group) && group.responses.length > 1 && !expandedQuestions.has(group.IdPregunta) && (
                        <div className="text-xs text-gray-500 mt-2">
                          +{group.responses.length - 1} respuesta(s) adicional(es) - Haz clic para expandir
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {dimensiones.map((dimension) => (
            <TabsContent key={dimension} value={dimension.toLowerCase()} className="mt-6">
              <div className="space-y-4">
                  {groupedResponses
                    .filter((group) => group.dimension === dimension)
                    .map((group) => (
                      <div key={group.IdPregunta} className="border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-gray-500">Pregunta {group.orden}</span>
                                {hasRealSubResponses(group) && (
                                  <Badge variant="outline" className="text-xs">Con subrespuestas</Badge>
                                )}
                              </div>
                              <h3 className="font-medium text-[#150773] mb-2">{cleanHtml(group.textoPregunta)}</h3>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadPossibleAnswers(group.IdPregunta)}
                                    className="text-gray-600 hover:text-gray-800"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver opciones
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle className="text-lg font-semibold">
                                      Opciones disponibles - Pregunta {group.orden}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="mt-4">
                                    <p className="text-sm text-gray-600 mb-4">{cleanHtml(group.textoPregunta)}</p>
                                    {renderPossibleAnswersModal(
                                      group.IdPregunta, 
                                      group.responses[0]?.respuesta || '', 
                                      group.TipoDePregunta,
                                      group.responses
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              {hasRealSubResponses(group) && group.responses.length > 1 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleQuestionExpansion(group.IdPregunta)}
                                  className="text-gray-600 hover:text-gray-800"
                                >
                                  {expandedQuestions.has(group.IdPregunta) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Renderizar respuesta según el tipo de pregunta */}
                          <div className="mb-3">
                            {renderQuestionResponse(group)}
                          </div>

                          {/* Subrespuestas expandibles */}
                          {hasRealSubResponses(group) && group.responses.length > 1 && expandedQuestions.has(group.IdPregunta) && (
                            <div className="mt-4 space-y-3">
                              <h4 className="font-medium text-sm text-gray-700">Subrespuestas:</h4>
                              {group.responses.slice(1).map((response, index) => (
                                <div key={`${response.IdPregunta}-${index}`} className="border-l-2 border-gray-200 pl-3">
                                  <div className="bg-gray-50 p-2 rounded">
                                    <p className="text-sm text-gray-600 mb-1">
                                      {extractSpecificSubQuestionText(response)}
                                    </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-700 font-bold">
                                    {getResponseValue(response, group.TipoDePregunta)}
                                  </span>
                                  {getResponseIcon(response.puntajePregunta || 0)}
                                  <span className="text-xs font-medium text-[#f5592b]">
                                    {response.puntajePregunta ? response.puntajePregunta.toFixed(3) : '0.000'}
                                  </span>
                                </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Indicador de múltiples respuestas */}
                          {hasRealSubResponses(group) && group.responses.length > 1 && !expandedQuestions.has(group.IdPregunta) && (
                            <div className="text-xs text-gray-500 mt-2">
                              +{group.responses.length - 1} respuesta(s) adicional(es) - Haz clic para expandir
                            </div>
                          )}
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