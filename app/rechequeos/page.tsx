"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MainContent } from "@/components/main-content"
import { ProtectedRoute } from "@/components/protected-route"
import { AppHeader } from "@/components/app-header"

export default function RechequeosPage() {
  return (
    <ProtectedRoute requiredType="system">
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <AppHeader title="Rechequeos" subtitle="Gestión y análisis de rechequeos" />
          <MainContent />
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
