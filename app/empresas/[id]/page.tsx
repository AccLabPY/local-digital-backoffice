"use client"

import dynamic from "next/dynamic"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

// Importar MainContent dinámicamente para evitar problemas de hidratación
const MainContent = dynamic(() => import("@/components/main-content").then(mod => ({ default: mod.MainContent })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5592b] mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  )
})

export default function EmpresaDetailPage() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <MainContent />
    </SidebarProvider>
  )
}