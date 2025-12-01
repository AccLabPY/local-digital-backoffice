"use client"

import { BusinessDetailPage } from "@/components/pages/business-detail-page"

interface ClientPageProps {
  params: {
    id: string
  }
}

export default function EmpresaDetailClientPage({ params }: ClientPageProps) {
  return <BusinessDetailPage />
}