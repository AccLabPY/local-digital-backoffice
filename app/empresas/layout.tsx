"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ProtectedRoute } from "@/components/protected-route"

export default function EmpresasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredType="system">
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
