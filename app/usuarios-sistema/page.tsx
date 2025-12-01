"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppHeader } from "@/components/app-header"
import { SystemUsersManagementPage } from "@/components/pages/system-users-management-page"

export default function UsuariosSistemaPage() {
  return (
    <ProtectedRoute requiredUserType="system" requiredRole="superadmin">
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <SystemUsersManagementPage />
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}

