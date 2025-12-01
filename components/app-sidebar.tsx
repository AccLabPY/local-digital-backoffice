"use client"

import { Building2, BarChart3, Settings, Home, TestTube, RotateCcw, Users, Shield, UserCog } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Inicio",
    path: "/",
    icon: Home,
  },
  {
    title: "Empresas",
    path: "/empresas",
    icon: Building2,
  },
  {
    title: "Rechequeos",
    path: "/rechequeos",
    icon: RotateCcw,
  },
  {
    title: "Dashboard Looker",
    path: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Testing",
    path: "/testing",
    icon: TestTube,
  },
]

const adminMenuItems = [
  {
    title: "Usuarios Sistema",
    path: "/usuarios-sistema",
    icon: UserCog,
    description: "Gestionar usuarios del sistema"
  },
  {
    title: "Usuarios Empresas",
    path: "/usuarios",
    icon: Users,
    description: "Gestionar usuarios de empresas"
  },
  {
    title: "Roles y Permisos",
    path: "/roles",
    icon: Shield,
    description: "Gestionar roles y recursos"
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const isSuperadmin = user?.role === 'superadmin'

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#f5592b] text-white">
                <BarChart3 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-[#150773]">Innovación Empresarial</span>
                <span className="truncate text-xs text-gray-600">Panel de Control</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Menú principal */}
        <SidebarGroup>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={pathname === item.path}
                  className="hover:bg-[#f5592b]/10 data-[active=true]:bg-[#f5592b] data-[active=true]:text-white cursor-pointer"
                  asChild
                >
                  <Link href={item.path}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Menú de administración (solo superadmin) */}
        {isSuperadmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-gray-500">
                Administración
              </SidebarGroupLabel>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.description}
                      isActive={pathname === item.path}
                      className="hover:bg-blue-50 data-[active=true]:bg-[#150773] data-[active=true]:text-white cursor-pointer"
                      asChild
                    >
                      <Link href={item.path}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Configuración" className="hover:bg-gray-100">
              <Settings />
              <span>Configuración</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
