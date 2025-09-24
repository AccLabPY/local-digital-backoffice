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

export function SurveyResponsesPage() {
  const { id, surveyId } = useParams()
  const router = useRouter()

  const handleBack = () => {
    router.push(`/empresas/${id}`)
  }

  // Mock data - en producción vendría de una API
  const businessName = "Arte Digital Paraguay"
  const surveyName = "Evaluación Digital 2025"

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

        <SurveyResponses businessId={Number(id)} testId={Number(surveyId)} />
      </div>
    </>
  )
}
