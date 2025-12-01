"use client"

import { BusinessListPage } from "@/components/pages/business-list-page"
import { AppHeader } from "@/components/app-header"

export default function EmpresasPage() {
  return (
    <>
      <AppHeader title="Empresas" subtitle="Explora y gestiona el directorio de empresas" />
      <BusinessListPage />
    </>
  )
}