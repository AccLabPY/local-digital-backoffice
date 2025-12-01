"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, RotateCcw, Eraser, Search } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState, useEffect, useRef } from "react"
import { getAuthToken } from "@/lib/api-client"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface FilterPanelProps {
  filters: {
    departamento: string[]
    distrito: string[]
    nivelInnovacion: string[]
    sectorActividad: string[]
    subSectorActividad: string[]
    tamanoEmpresa: string[]
    estadoEncuesta: string
  }
  onFiltersChange: (filters: any) => void
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  interface FilterOptions {
    departamentos: string[];
    distritos: string[];
    nivelesInnovacion: string[];
    sectoresActividad: string[];
    subSectoresActividad: string[];
    tamanosEmpresa: string[];
    subSectoresPorSector: Record<string, string[]>;
  }

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    departamentos: [],
    distritos: [],
    nivelesInnovacion: [],
    sectoresActividad: [],
    subSectoresActividad: [],
    tamanosEmpresa: [],
    subSectoresPorSector: {}
  })
  const [loading, setLoading] = useState(true)

  // Cargar opciones de filtros desde la API
  const loadFilterOptions = async () => {
    try {
      setLoading(true)
      const token = getAuthToken() // Use imported synchronous function
      if (!token) {
        console.error('No se pudo obtener el token de autenticación')
        return
      }

      const url = new URL('http://localhost:3001/api/empresas/filters/options')
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setFilterOptions(data)
    } catch (error) {
      console.error('Error loading filter options:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar opciones filtradas cuando se selecciona distrito
  const loadFilterOptionsWithDistrito = async (distritosSeleccionados: string[]): Promise<void> => {
    try {
      const token = getAuthToken() // Use imported synchronous function
      if (!token) return

      // Construir URL con filtro de distrito
      const url = new URL('http://localhost:3001/api/empresas/filters/options')
      distritosSeleccionados.forEach(distrito => {
        url.searchParams.append('distrito', distrito)
      })

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Actualizar solo las opciones que se ven afectadas por el filtro de distrito
      setFilterOptions(prevOptions => ({
        ...prevOptions,
        departamentos: data.departamentos,
        nivelesInnovacion: data.nivelesInnovacion,
        sectoresActividad: data.sectoresActividad,
        subSectoresActividad: data.subSectoresActividad,
        subSectoresPorSector: data.subSectoresPorSector
      }))
      
      return Promise.resolve()
    } catch (error) {
      console.error('Error loading filtered options:', error)
      return Promise.reject(error)
    }
  }

  // Cargar opciones filtradas cuando se selecciona departamento
  const loadFilterOptionsWithDepartamento = async (departamentosSeleccionados: string[]): Promise<void> => {
    try {
      const token = getAuthToken() // Use imported synchronous function
      if (!token) return

      // Construir URL con filtro de departamento
      const url = new URL('http://localhost:3001/api/empresas/filters/options')
      departamentosSeleccionados.forEach(departamento => {
        url.searchParams.append('departamento', departamento)
      })

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Actualizar solo las opciones que se ven afectadas por el filtro de departamento
      setFilterOptions(prevOptions => ({
        ...prevOptions,
        distritos: data.distritos,
        nivelesInnovacion: data.nivelesInnovacion,
        sectoresActividad: data.sectoresActividad,
        subSectoresActividad: data.subSectoresActividad,
        subSectoresPorSector: data.subSectoresPorSector
      }))
      
      return Promise.resolve()
    } catch (error) {
      console.error('Error loading filtered options:', error)
      return Promise.reject(error)
    }
  }

  // Cargar opciones filtradas cuando se selecciona nivel de innovación
  const loadFilterOptionsWithNivelInnovacion = async (nivelesSeleccionados: string[]): Promise<void> => {
    try {
      const token = getAuthToken() // Use imported synchronous function
      if (!token) return Promise.resolve()

      // Construir URL con filtro de nivel de innovación
      const url = new URL('http://localhost:3001/api/empresas/filters/options')
      nivelesSeleccionados.forEach(nivel => {
        url.searchParams.append('nivelInnovacion', nivel)
      })

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Actualizar solo las opciones que se ven afectadas por el filtro de nivel de innovación
      setFilterOptions(prevOptions => ({
        ...prevOptions,
        departamentos: data.departamentos,
        distritos: data.distritos,
        sectoresActividad: data.sectoresActividad,
        subSectoresActividad: data.subSectoresActividad,
        subSectoresPorSector: data.subSectoresPorSector
      }))
      
      return Promise.resolve()
    } catch (error) {
      console.error('Error loading filtered options:', error)
      return Promise.reject(error)
    }
  }

  // Cargar opciones de filtros solo al inicio
  useEffect(() => {
    loadFilterOptions()
  }, []) // Removido 'filters' para que no se recargue constantemente


  // Componente de selector con buscador y selección múltiple
  interface ComboboxSelectProps {
    value: string[];
    onValueChange: (value: string[]) => void;
    options: string[];
    placeholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
  }

  const ComboboxSelect = ({ 
    value = [], 
    onValueChange, 
    options, 
    placeholder = "Seleccionar...", 
    emptyMessage = "No se encontraron resultados.",
    disabled = false
  }: ComboboxSelectProps) => {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    
    // Filtrar opciones según la búsqueda
    const filteredOptions = options.filter(option => 
      option.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    // Manejar selección/deselección de opciones
    const handleSelect = (option: string) => {
      if (value.includes(option)) {
        // Si ya está seleccionado, lo quitamos
        onValueChange(value.filter(item => item !== option))
      } else {
        // Si no está seleccionado, lo agregamos
        onValueChange([...value, option])
      }
    }
    
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between text-left min-w-0",
              value.length === 0 && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <span className="truncate flex-1 text-left">
              {value.length === 0 ? (
                placeholder
              ) : value.length === 1 ? (
                value[0]
              ) : (
                `${value.length} seleccionados`
              )}
            </span>
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9"
            />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              <CommandList>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleSelect(option)}
                    className={cn(
                      "cursor-pointer flex items-center",
                      value.includes(option) ? "bg-accent font-medium" : ""
                    )}
                  >
                    <div className="mr-2 h-4 w-4 border rounded-sm flex items-center justify-center">
                      {value.includes(option) && (
                        <div className="h-2 w-2 bg-primary rounded-sm" />
                      )}
                    </div>
                    {option}
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  const handleFilterChange = (key: string, value: string[]) => {
    const newFilters = { ...filters, [key]: value }
    
    // Reset dependencies when parent filter changes
    if (key === "sectorActividad") {
      newFilters.subSectorActividad = [] // Reset subsector when sector changes
    }
    
    // Cuando se selecciona distrito, cargar opciones filtradas para departamento y nivel
    if (key === "distrito") {
      loadFilterOptionsWithDistrito(value)
    }
    
    // Cuando se selecciona departamento, cargar opciones filtradas para distrito y nivel
    if (key === "departamento") {
      loadFilterOptionsWithDepartamento(value)
    }
    
    // Cuando se selecciona nivel de innovación, cargar opciones filtradas para otros filtros
    if (key === "nivelInnovacion") {
      loadFilterOptionsWithNivelInnovacion(value)
        .then(() => {
          // Limpiar selecciones que ya no son válidas después de filtrar por nivel
          const newDepartamentos = filterOptions.departamentos
          const newDistritos = filterOptions.distritos
          const newSectores = filterOptions.sectoresActividad
          const newSubSectores = filterOptions.subSectoresActividad
          
          // Si hay departamentos seleccionados que ya no están en las opciones, limpiarlos
          if (newFilters.departamento.length > 0) {
            newFilters.departamento = newFilters.departamento.filter(dep => 
              newDepartamentos.includes(dep)
            )
          }
          
          // Si hay distritos seleccionados que ya no están en las opciones, limpiarlos
          if (newFilters.distrito.length > 0) {
            newFilters.distrito = newFilters.distrito.filter(dist => 
              newDistritos.includes(dist)
            )
          }
          
          // Si hay sectores seleccionados que ya no están en las opciones, limpiarlos
          if (newFilters.sectorActividad.length > 0) {
            newFilters.sectorActividad = newFilters.sectorActividad.filter(sector => 
              newSectores.includes(sector)
            )
            // Si se limpió el sector, también limpiar subsector
            if (newFilters.sectorActividad.length === 0) {
              newFilters.subSectorActividad = []
            }
          }
          
          // Si hay subsectores seleccionados que ya no están en las opciones, limpiarlos
          if (newFilters.subSectorActividad.length > 0) {
            newFilters.subSectorActividad = newFilters.subSectorActividad.filter(subsector => 
              newSubSectores.includes(subsector)
            )
          }
          
          // Actualizar filtros con las selecciones limpias
          onFiltersChange(newFilters)
        })
    }
    
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    // Recargar opciones completas al limpiar filtros
    loadFilterOptions()
    
    onFiltersChange({
      departamento: [],
      distrito: [],
      nivelInnovacion: [],
      sectorActividad: [],
      subSectorActividad: [],
      tamanoEmpresa: [],
      estadoEncuesta: "completada",
    })
  }

  if (loading) {
    return (
      <Card className="border-[#f5592b]/20">
        <CardHeader>
          <CardTitle className="text-[#150773] flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5592b] mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Cargando opciones de filtros...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          <div className="space-y-2 min-w-0">
            <label className="text-sm font-medium text-gray-700">Departamento</label>
            <ComboboxSelect
              value={filters.departamento}
              onValueChange={(value) => handleFilterChange("departamento", value)}
              options={filterOptions.departamentos}
              placeholder="Seleccionar"
              emptyMessage="No se encontraron departamentos"
            />
          </div>

          <div className="space-y-2 min-w-0">
            <label className="text-sm font-medium text-gray-700">Distrito</label>
            <ComboboxSelect
              value={filters.distrito}
              onValueChange={(value) => handleFilterChange("distrito", value)}
              options={filterOptions.distritos}
              placeholder="Seleccionar"
              emptyMessage="No se encontraron distritos"
            />
          </div>

          <div className="space-y-2 min-w-0">
            <label className="text-sm font-medium text-gray-700">Nivel de Innovación</label>
            <ComboboxSelect
              value={filters.nivelInnovacion}
              onValueChange={(value) => handleFilterChange("nivelInnovacion", value)}
              options={filterOptions.nivelesInnovacion}
              placeholder="Seleccionar"
              emptyMessage="No se encontraron niveles"
            />
          </div>

          <div className="space-y-2 min-w-0">
            <label className="text-sm font-medium text-gray-700">Sector de Actividad</label>
            <ComboboxSelect
              value={filters.sectorActividad}
              onValueChange={(value) => handleFilterChange("sectorActividad", value)}
              options={filterOptions.sectoresActividad}
              placeholder="Seleccionar"
              emptyMessage="No se encontraron sectores"
            />
          </div>
          
          <div className="space-y-2 min-w-0">
            <label className="text-sm font-medium text-gray-700">Subsector de Actividad</label>
            <ComboboxSelect
              value={filters.subSectorActividad}
              onValueChange={(value) => handleFilterChange("subSectorActividad", value)}
              options={filters.sectorActividad && filters.sectorActividad.length > 0 && filterOptions.subSectoresPorSector[filters.sectorActividad[0]] 
                ? filterOptions.subSectoresPorSector[filters.sectorActividad[0]] 
                : filterOptions.subSectoresActividad}
              placeholder="Seleccionar"
              emptyMessage="No se encontraron subsectores"
              disabled={!filters.sectorActividad || filters.sectorActividad.length === 0}
            />
          </div>

          <div className="space-y-2 min-w-0">
            <label className="text-sm font-medium text-gray-700">Tamaño de Empresa</label>
            <ComboboxSelect
              value={filters.tamanoEmpresa}
              onValueChange={(value) => handleFilterChange("tamanoEmpresa", value)}
              options={filterOptions.tamanosEmpresa}
              placeholder="Seleccionar"
              emptyMessage="No se encontraron tamaños"
            />
          </div>

          <div className="flex items-end min-w-0">
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full h-10 border-[#f5592b] text-[#f5592b] hover:bg-[#f5592b]/10 hover:text-[#f5592b] bg-transparent whitespace-nowrap"
            >
              <Eraser className="h-5 w-5 mr-2" />
              Limpiar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
