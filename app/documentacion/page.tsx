"use client"

import { DocumentationPage } from "@/components/pages/documentation-page"
import { ProtectedRoute } from "@/components/protected-route"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function DocumentacionRoute() {
  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset className="group/sidebar-wrapper">
          <DocumentationPage />
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
