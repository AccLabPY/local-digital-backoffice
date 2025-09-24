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

export default function SurveyResponsesDetailPage() {
  const { id, surveyId } = useParams()
  const router = useRouter()
  const [businessName, setBusinessName] = useState("Empresa")
  const [surveyName, setSurveyName] = useState("Evaluación Digital")
  const [loading, setLoading] = useState(true)

  const handleBack = () => {
    router.push(`/empresas/${id}`)
  }

  // Función para obtener token de autenticación
  const getAuthToken = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: "saquino@mic.gov.py", 
          password: "AXbHxVXNsKK3KYOfmAfezWjwRu7q/ghVofbYUdEk2ak=" 
        }),
      })
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      return data.token
    } catch (error) {
      return null
    }
  }

  // Cargar datos de la empresa y encuesta
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const token = await getAuthToken()
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
        }

        // Obtener datos de la encuesta
        const surveyResponse = await fetch(`http://localhost:3001/api/encuestas/empresas/${id}/surveys`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (surveyResponse.ok) {
          const surveysData = await surveyResponse.json()
          const currentSurvey = surveysData.find(s => s.idTest.toString() === surveyId)
          if (currentSurvey) {
            setSurveyName(currentSurvey.nombreTest || "Evaluación Digital")
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id && surveyId) {
      loadData()
    }
  }, [id, surveyId])

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
          <SurveyResponses businessId={Number(id)} testId={Number(surveyId)} />
        </ClientOnly>
      </div>
    </>
  )
}
