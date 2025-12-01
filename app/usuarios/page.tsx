"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MainContent } from "@/components/main-content"
import { ProtectedRoute } from "@/components/protected-route"
import { AppHeader } from "@/components/app-header"

export default function UsuariosPage() {
  return (
    <ProtectedRoute 
      requiredType="system"
      requiredRoles={['superadmin']}
      redirectTo="/dashboard"
    >
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <AppHeader title="Usuarios" subtitle="Gestión de usuarios del sistema" />
          <MainContent />
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
