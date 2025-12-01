"use client"

import { useParams, useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { BusinessDetail } from "@/components/business-detail"

export function BusinessDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const handleBack = () => {
    router.push("/empresas")
  }

  return (
    <SidebarInset className="group/sidebar-wrapper">
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
              <BreadcrumbPage className="text-[#150773]">Detalle de Empresa</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50">
        <BusinessDetail empresaId={id as string} onBack={handleBack} />
      </div>
    </SidebarInset>
  )
}
