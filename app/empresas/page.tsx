"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { MainContent } from "@/components/main-content"

export default function EmpresasPage() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <MainContent />
    </SidebarProvider>
  )
}
