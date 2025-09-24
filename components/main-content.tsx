"use client"

import { usePathname } from "next/navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { HomePage } from "@/components/pages/home-page"
import { BusinessListPage } from "@/components/pages/business-list-page"
import { BusinessDetailPage } from "@/components/pages/business-detail-page"
import { SurveyResponsesPage } from "@/components/pages/survey-responses-page"
import { LookerDashboardPage } from "@/components/pages/looker-dashboard-page"
import { TestingPage } from "@/components/pages/testing-page"

export function MainContent() {
  const pathname = usePathname()

  const renderPage = () => {
    switch (pathname) {
      case "/":
        return <HomePage />
      case "/empresas":
        return <BusinessListPage />
      case "/dashboard":
        return <LookerDashboardPage />
      case "/testing":
        return <TestingPage />
      default:
        // Handle dynamic routes like /empresas/:id
        if (pathname.startsWith("/empresas/")) {
          const parts = pathname.split("/")
          if (parts.length === 3) {
            // /empresas/:id
            return <BusinessDetailPage />
          } else if (parts.length === 5 && parts[3] === "encuesta") {
            // /empresas/:id/encuesta/:surveyId
            return <SurveyResponsesPage />
          }
        }
        return <HomePage />
    }
  }

  return (
    <SidebarInset>
      {renderPage()}
    </SidebarInset>
  )
}
