"use client"

import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { BusinessList } from "@/components/business-list"
import { FilterPanel } from "@/components/filter-panel"

export function BusinessListPage() {
  const [filters, setFilters] = useState({
    departamento: "",
    distrito: "",
    nivelInnovacion: "",
    sectorActividad: "",
    estadoEncuesta: "completada",
  })

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 bg-white">
        <SidebarTrigger className="-ml-1 text-[#150773]" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[#150773]">Empresas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 bg-gray-50">
        <div className="space-y-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-[#150773]">Empresas</h1>
            <p className="text-gray-600 mt-2">
              Explora y gestiona el directorio de empresas participantes en el programa de innovación
            </p>
          </div>
          <FilterPanel filters={filters} onFiltersChange={setFilters} />
          <BusinessList filters={filters} />
        </div>
      </div>
    </>
  )
}
