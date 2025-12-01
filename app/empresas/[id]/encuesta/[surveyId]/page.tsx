"use client"

import { useParams, useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { SurveyResponses } from "@/components/survey-responses"
import { useState, useEffect } from "react"
import { ClientOnly } from "@/components/client-only"
import { getAuthToken } from "@/lib/api-client"

export default function SurveyResponsesDetailPage() {
  const { id, surveyId } = useParams()
  const router = useRouter()
  const [businessName, setBusinessName] = useState("Empresa")
  const [surveyName, setSurveyName] = useState("Evaluación Digital")
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [testUsuarioId, setTestUsuarioId] = useState<number | null>(null)

  const handleBack = () => {
    router.push(`/empresas/${id}`)
  }


  // Cargar datos de la empresa y encuesta
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const token = getAuthToken()
        if (!token) {
          return
        }

        // Obtener datos de la empresa
        const empresaResponse = await fetch(`http://localhost:3001/api/empresas/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (empresaResponse.ok) {
          const empresaData = await empresaResponse.json()
          setBusinessName(empresaData.empresa || "Empresa")
        } else {
          // Si no existe la empresa, mostrar 404
          setNotFound(true)
          return
        }

        // Obtener información básica del TestUsuario
        const testUsuarioResponse = await fetch(`http://localhost:3001/api/encuestas/empresas/${id}/testUsuarios/${surveyId}/info`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (testUsuarioResponse.ok) {
          const testUsuarioData = await testUsuarioResponse.json()
          setTestUsuarioId(Number(surveyId))
          setSurveyName(testUsuarioData.nombreTest || "Evaluación Digital")
        } else if (testUsuarioResponse.status === 404) {
          // TestUsuario no encontrado o no pertenece a la empresa
          setNotFound(true)
          return
        } else {
          // Otro error
          setNotFound(true)
          return
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    if (id && surveyId) {
      loadData()
    }
  }, [id, surveyId])

  // Mostrar 404 si la empresa o encuesta no existen
  if (notFound) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Encuesta no encontrada</h2>
          <p className="text-gray-600 mb-6">La encuesta solicitada no existe para esta empresa o ha sido eliminada.</p>
          <Button 
            onClick={handleBack}
            className="bg-[#150773] hover:bg-[#150773]/90 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la empresa
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 bg-white">
        <SidebarTrigger className="-ml-1 text-[#150773]" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/empresas" className="text-[#f5592b] hover:text-[#150773]">
                Empresas
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/empresas/${id}`} className="text-[#f5592b] hover:text-[#150773]">
                {businessName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[#150773]">Respuestas - {surveyName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleBack}
            variant="outline"
            className="border-[#f5592b] text-[#f5592b] hover:bg-[#f5592b] hover:text-white bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Historial
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#150773]">Respuestas Detalladas</h1>
            <p className="text-gray-600">
              {businessName} - {surveyName}
            </p>
          </div>
        </div>

        <ClientOnly>
          {testUsuarioId && (
            <SurveyResponses businessId={Number(id)} testUsuarioId={testUsuarioId} />
          )}
        </ClientOnly>
      </div>
    </>
  )
}
