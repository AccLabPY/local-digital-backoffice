"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { ClientOnly } from "./client-only"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Building2, MapPin, Users, TrendingUp, Mail, Crown, Calendar, Loader2 } from "lucide-react"
import { SurveyHistory } from "@/components/survey-history"
import { BusinessCharts } from "@/components/business-charts"
import { authService } from "./services/auth-service"

interface BusinessDetailProps {
  empresaId: string
  onBack: () => void
}

export function BusinessDetail({ empresaId, onBack }: BusinessDetailProps) {
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Función para obtener token de autenticación usando el servicio singleton
  const getAuthToken = async () => {
    try {
      return await authService.getValidToken()
    } catch (error) {
      console.error('Error getting auth token:', error)
      return null
    }
  }

  // Cargar datos de la empresa
  useEffect(() => {
    const loadBusinessData = async () => {
      setLoading(true)
      try {
        const token = await getAuthToken()
        if (!token) {
          setError("No se pudo obtener el token de autenticación")
          return
        }

        const response = await fetch(`http://localhost:3001/api/empresas/${empresaId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          let errorMessage = `Error ${response.status}: ${response.statusText}`
          try {
            const errorText = await response.text()
            if (errorText) {
              errorMessage += ` - ${errorText}`
            }
          } catch (e) {
            // Ignorar errores al leer el texto de respuesta
          }
          throw new Error(errorMessage)
        }
        
        const data = await response.json()
        setBusiness(data)

      } catch (error) {
        setError(`Error cargando datos: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      } finally {
        setLoading(false)
      }
    }

    if (empresaId) {
      loadBusinessData()
    }
  }, [empresaId])

  const dimensiones = [
    { nombre: "Tecnología", puntaje: business?.puntajeTecnologia || 0, color: "#f5592b" },
    { nombre: "Comunicación", puntaje: business?.puntajeComunicacion || 0, color: "#150773" },
    { nombre: "Organización", puntaje: business?.puntajeOrganizacion || 0, color: "#f5592b" },
    { nombre: "Datos", puntaje: business?.puntajeDatos || 0, color: "#150773" },
    { nombre: "Estrategia", puntaje: business?.puntajeEstrategia || 0, color: "#f5592b" },
    { nombre: "Procesos", puntaje: business?.puntajeProcesos || 0, color: "#150773" },
  ]

  const getNivelColor = (nivel: string) => {
    if (!nivel) return "bg-gray-100 text-gray-800 border-gray-200"
    switch (nivel.toLowerCase()) {
      case "básico":
        return "bg-red-100 text-red-800 border-red-200"
      case "intermedio":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "avanzado":
        return "bg-green-100 text-green-800 border-green-200"
      case "experto":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "inicial":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getMaturityLevel = (puntaje: number) => {
    if (!puntaje) return "Sin evaluar"
    if (puntaje < 30) return "Inicial"
    if (puntaje < 60) return "Básico"
    if (puntaje < 80) return "Intermedio"
    return "Avanzado"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Cargando datos de la empresa...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-red-100 border border-red-300 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Empresas
          </Button>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Empresa no encontrada</h2>
          <p className="text-yellow-700">No se encontraron datos para la empresa con ID: {empresaId}.</p>
          <Button onClick={onBack} className="mt-4 bg-[#f5592b] hover:bg-[#e04a1f] text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Empresas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ClientOnly fallback={
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#f5592b]" />
          <p className="text-lg text-gray-600">Inicializando...</p>
        </div>
      </div>
    }>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="border-[#f5592b] text-[#f5592b] hover:bg-[#f5592b] hover:text-white bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la Lista
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#150773]">{business.empresa}</h1>
            <p className="text-gray-600">Detalle completo de la evaluación de innovación</p>
          </div>
        </div>

        {/* Información General */}
        <Card className="border-[#f5592b]/20">
          <CardHeader>
            <CardTitle className="text-[#150773] flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Empresa</label>
                  <p className="text-lg font-semibold text-[#150773]">{business.empresa}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Sector</label>
                  <p className="text-gray-900">{business.sectorActividadDescripcion || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Subsector</label>
                  <p className="text-gray-900">{business.subSectorActividadDescripcion || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Ubicación</label>
                  <div className="flex items-center gap-1 text-gray-900">
                    <MapPin className="h-4 w-4" />
                    {business.ubicacion || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Año de Creación</label>
                  <p className="text-gray-900">{business.anioCreacion || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total de Empleados</label>
                  <div className="flex items-center gap-1 text-gray-900">
                    <Users className="h-4 w-4" />
                    {business.TotalEmpleados || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Ventas Anuales</label>
                  <p className="text-gray-900">{business.ventasAnuales || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">RUC</label>
                  <p className="text-gray-900">{business.ruc || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Estado</label>
                  <Badge className="bg-green-100 text-green-800">
                    Activo
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liderazgo y Fechas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-[#f5592b]/20">
            <CardHeader>
              <CardTitle className="text-[#150773] flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Liderazgo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-600">Gerente General</label>
                  <p className="text-lg font-semibold text-[#150773]">{business.SexoGerenteGeneral || 'N/A'}</p>
                </div>
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-600">Propietario Principal</label>
                  <p className="text-lg font-semibold text-[#150773]">{business.SexoPropietarioPrincipal || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#150773]/20">
            <CardHeader>
              <CardTitle className="text-[#150773] flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fechas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                <div className="text-center">
                  <label className="text-sm font-medium text-gray-600">Última Evaluación</label>
                  <p className="text-lg font-semibold text-[#150773]">
                    {business.FechaTest ? new Date(business.FechaTest).toLocaleDateString("es-PY") : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Evolución */}
        <BusinessCharts businessId={parseInt(empresaId)} business={business} />

        {/* Resultados de Innovación */}
        <Card className="border-[#150773]/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#150773] flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resultados de Evaluación Actual
              </CardTitle>
              <Badge className={`${getNivelColor(business.nivelMadurez || getMaturityLevel(business.puntajeGeneral))} border text-lg px-4 py-2`}>
                {business.nivelMadurez || getMaturityLevel(business.puntajeGeneral)} - {business.puntajeGeneral ? business.puntajeGeneral.toFixed(1) : '0'}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dimensiones.map((dimension, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{dimension.nombre}</span>
                    <span className="font-bold" style={{ color: dimension.color }}>
                      {dimension.puntaje.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(dimension.puntaje, 100)}
                    className="h-3"
                    style={
                      {
                        "--progress-background": dimension.color,
                      } as React.CSSProperties
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Historial de Encuestas */}
        <Tabs defaultValue="historial" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="historial" className="data-[state=active]:bg-[#f5592b] data-[state=active]:text-white">
              Historial de Encuestas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="historial" className="mt-6">
            <SurveyHistory businessId={parseInt(empresaId)} />
          </TabsContent>
        </Tabs>
      </div>
    </ClientOnly>
  )
}