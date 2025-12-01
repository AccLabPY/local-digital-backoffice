import { Metadata } from 'next'
import EmpresaDetailClientPage from './client-page'

interface PageProps {
  params: {
    id: string
  }
}

// Función para generar metadata dinámica
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  
  try {
    // Primero obtener un token de autenticación
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: "saquino@mic.gov.py",
        password: "AXbHxVXNsKK3KYOfmAfezWjwRu7q/ghVofbYUdEk2ak="
      }),
      cache: 'no-store'
    })
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json()
      const token = loginData.token
      
      // Ahora hacer la llamada al backend para obtener los datos de la empresa
      const response = await fetch(`http://localhost:3001/api/empresas/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // No cachear para obtener datos frescos
      })
      
      if (response.ok) {
        const empresa = await response.json()
        const nombreEmpresa = empresa.empresa || 'Empresa'
        return {
          title: `Chequeo Digital - ${nombreEmpresa} (Id: ${id})`,
          description: `Detalles del chequeo digital para ${nombreEmpresa}`,
          icons: {
            icon: [
              { url: '/favicon.ico' },
              { url: '/favicon.png', type: 'image/png' }
            ],
            shortcut: '/favicon.ico',
            apple: '/favicon.png',
          },
        }
      }
    }
  } catch (error) {
    console.error('Error fetching empresa data for metadata:', error)
  }
  
  // Fallback si no se puede obtener la información
  return {
    title: `Chequeo Digital - Empresa (Id: ${id})`,
    description: `Detalles del chequeo digital para la empresa con ID ${id}`,
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/favicon.png', type: 'image/png' }
      ],
      shortcut: '/favicon.ico',
      apple: '/favicon.png',
    },
  }
}

export default async function EmpresaDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  return <EmpresaDetailClientPage params={resolvedParams} />
}