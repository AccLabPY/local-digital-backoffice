"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function EmpresasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        {children}
      </div>
    </SidebarProvider>
  )
}
