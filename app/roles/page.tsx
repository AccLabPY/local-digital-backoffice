"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppHeader } from "@/components/app-header"
import { RolesPermissionsManagementPage } from "@/components/pages/roles-permissions-management-page"

export default function RolesPage() {
  return (
    <ProtectedRoute requiredUserType="system" requiredRole="superadmin">
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <RolesPermissionsManagementPage />
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
