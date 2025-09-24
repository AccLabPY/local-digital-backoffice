"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, RotateCcw } from "lucide-react"

interface FilterPanelProps {
  filters: {
    departamento: string
    distrito: string
    nivelInnovacion: string
    sectorActividad: string
    estadoEncuesta: string
  }
  onFiltersChange: (filters: any) => void
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const departamentos = [
    "CAPITAL",
    "CENTRAL",
    "ALTO PARANÁ",
    "ITAPÚA",
    "CAAGUAZÚ",
    "PARAGUARÍ",
    "GUAIRÁ",
    "CAAZAPÁ",
    "SAN PEDRO",
    "CORDILLERA",
    "CONCEPCIÓN",
    "AMAMBAY",
    "CANINDEYÚ",
    "PRESIDENTE HAYES",
    "MISIONES",
    "ÑEEMBUCÚ",
    "ALTO PARAGUAY",
    "BOQUERÓN",
  ]

  const distritos = {
    CAPITAL: ["ASUNCIÓN"],
    CENTRAL: ["FERNANDO DE LA MORA", "LAMBARÉ", "LUQUE", "MARIANO ROQUE ALONSO", "ÑEMBY", "SAN LORENZO", "VILLA ELISA"],
    "ALTO PARANÁ": ["CIUDAD DEL ESTE", "HERNANDARIAS", "PRESIDENTE FRANCO", "MINGA GUAZÚ"],
    ITAPÚA: ["ENCARNACIÓN", "CORONEL BOGADO", "BELLA VISTA", "JESÚS"],
    CAAGUAZÚ: ["CORONEL OVIEDO", "CAAGUAZÚ", "J. EULOGIO ESTIGARRIBIA"],
    PARAGUARÍ: ["PARAGUARÍ", "PIRIBEBUY", "CARAPEGUÁ", "YAGUARÓN"],
  }

  const nivelesInnovacion = ["Básico", "Intermedio", "Avanzado", "Experto"]

  const sectoresActividad = [
    "Actividades de alojamiento y de servicio de comidas",
    "Comercio al por mayor y al por menor",
    "Industrias manufactureras",
    "Información y comunicaciones",
    "Actividades profesionales, científicas y técnicas",
    "Construcción",
    "Transporte y almacenamiento",
    "Actividades financieras y de seguros",
    "Agricultura, ganadería, silvicultura y pesca",
    "Actividades inmobiliarias",
  ]

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    if (key === "departamento") {
      newFilters.distrito = "" // Reset distrito when departamento changes
    }
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    onFiltersChange({
      departamento: "",
      distrito: "",
      nivelInnovacion: "",
      sectorActividad: "",
      estadoEncuesta: "completada",
    })
  }

  return (
    <Card className="border-[#f5592b]/20">
      <CardHeader>
        <CardTitle className="text-[#150773] flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Búsqueda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Departamento</label>
            <Select value={filters.departamento} onValueChange={(value) => handleFilterChange("departamento", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {departamentos.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Distrito</label>
            <Select
              value={filters.distrito}
              onValueChange={(value) => handleFilterChange("distrito", value)}
              disabled={!filters.departamento}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {filters.departamento &&
                  distritos[filters.departamento as keyof typeof distritos]?.map((distrito) => (
                    <SelectItem key={distrito} value={distrito}>
                      {distrito}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nivel de Innovación</label>
            <Select
              value={filters.nivelInnovacion}
              onValueChange={(value) => handleFilterChange("nivelInnovacion", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {nivelesInnovacion.map((nivel) => (
                  <SelectItem key={nivel} value={nivel}>
                    {nivel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sector de Actividad</label>
            <Select
              value={filters.sectorActividad}
              onValueChange={(value) => handleFilterChange("sectorActividad", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {sectoresActividad.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full border-[#f5592b] text-[#f5592b] hover:bg-[#f5592b] hover:text-white bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
