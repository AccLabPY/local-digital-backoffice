"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Loader2, Building2 } from "lucide-react"
import { getAuthToken } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface Company {
  id: number
  nombre: string
  rut: string
}

interface CompanySearchSelectProps {
  value: string
  onValueChange: (value: string) => void
  onCompanySelect?: (company: Company) => void
  placeholder?: string
  required?: boolean
  id?: string
}

export function CompanySearchSelect({ 
  value, 
  onValueChange, 
  onCompanySelect,
  placeholder = "Seleccionar empresa",
  required = false,
  id
}: CompanySearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const { toast } = useToast()


  // Buscar empresas
  const searchCompanies = async (search: string) => {
    if (search.length < 2) {
      setCompanies([])
      return
    }

    setLoading(true)
    try {
      const token = getAuthToken()
      if (!token) {
        toast({
          title: "Error",
          description: "No se pudo obtener el token de autenticación",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`http://localhost:3001/api/catalogos/empresas?search=${encodeURIComponent(search)}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setCompanies(data)
    } catch (error) {
      console.error('Error searching companies:', error)
      toast({
        title: "Error",
        description: `Error buscando empresas: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchCompanies(searchTerm)
      } else {
        setCompanies([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Obtener empresa seleccionada por ID
  const getSelectedCompany = (companyId: string) => {
    if (!companyId) return null
    return companies.find(c => c.id.toString() === companyId) || null
  }

  // Sincronizar valor inicial con empresa seleccionada
  useEffect(() => {
    if (value && !selectedCompany) {
      // Buscar la empresa por ID si no está en la lista actual
      const fetchCompanyById = async () => {
        try {
          const token = getAuthToken()
          if (!token) return

          const response = await fetch(`http://localhost:3001/api/catalogos/empresas?id=${encodeURIComponent(value)}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.length > 0) {
              setSelectedCompany(data[0])
            }
          }
        } catch (error) {
          console.error('Error fetching company by ID:', error)
        }
      }

      fetchCompanyById()
    } else if (!value) {
      setSelectedCompany(null)
    }
  }, [value])

  // Manejar selección de empresa
  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company)
    onValueChange(company.id.toString())
    onCompanySelect?.(company)
    setSearchTerm('')
    setIsOpen(false)
  }

  // Manejar apertura del selector
  const handleOpen = () => {
    setIsOpen(true)
    setSearchTerm('')
    setCompanies([])
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Empresa</Label>
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between"
          onClick={handleOpen}
        >
          <span className="truncate">
            {selectedCompany ? selectedCompany.nombre : placeholder}
          </span>
          <Building2 className="h-4 w-4 opacity-50" />
        </Button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg">
            <div className="p-3 space-y-3">
              {/* Campo de búsqueda */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Buscar empresa..."
                  className="pl-8 pr-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                {loading && (
                  <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-gray-500" />
                )}
              </div>
              
              {/* Mensaje de ayuda */}
              {!searchTerm && (
                <p className="text-sm text-gray-500 text-center">
                  Escribe al menos 2 caracteres para buscar empresas
                </p>
              )}
              
              {/* Lista de resultados */}
              {searchTerm.length >= 2 && (
                <div className="border rounded-md overflow-hidden">
                  {companies.length === 0 && !loading ? (
                    <div className="p-4 text-center text-gray-500">
                      No se encontraron empresas con "{searchTerm}"
                    </div>
                  ) : (
                    <div className="max-h-[250px] overflow-y-auto">
                      {companies.map((company) => (
                        <div
                          key={company.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => handleCompanySelect(company)}
                        >
                          <div>
                            <div className="font-medium">{company.nombre}</div>
                            <div className="text-sm text-gray-500">RUT: {company.rut}</div>
                          </div>
                          <Button size="sm" variant="ghost" className="text-[#150773]">
                            <Building2 className="h-4 w-4 mr-1" />
                            Seleccionar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Botón cerrar */}
              <div className="flex justify-end">
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
