"use client"

import { useState, useEffect } from "react"
import { authService } from "../services/auth-service"

export function TestingPage() {
  const [token, setToken] = useState("")
  const [kpis, setKpis] = useState(null)
  const [empresas, setEmpresas] = useState(null)
  const [filters, setFilters] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Auto-login on component mount
  useEffect(() => {
    handleAutoLogin()
  }, [])

  const handleAutoLogin = async () => {
    setLoading(true)
    try {
      const token = await authService.getValidToken()
      if (token) {
        setToken(token)
        // Load data automatically
        await loadDashboardData(token)
      } else {
        setError("No se pudo obtener el token de autenticación")
      }
    } catch (error) {
      setError(`Error de conexión: ${error.message}`)
    }
    setLoading(false)
  }

  const loadDashboardData = async (authToken) => {
    try {
      // Load KPIs
      const kpisResponse = await fetch('http://localhost:3001/api/empresas/kpis', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })
      const kpisData = await kpisResponse.json()
      setKpis(kpisData)

      // Load companies (first page)
      const empresasResponse = await fetch('http://localhost:3001/api/empresas?limit=5', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })
      const empresasData = await empresasResponse.json()
      setEmpresas(empresasData)

      // Load filter options
      const filtersResponse = await fetch('http://localhost:3001/api/empresas/filters/options', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })
      const filtersData = await filtersResponse.json()
      setFilters(filtersData)

    } catch (error) {
      setError(`Error cargando datos: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando datos de testing...</p>
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
          <button 
            onClick={handleAutoLogin}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">
          🧪 Testing - Datos en Tiempo Real
        </h1>
        <p className="text-gray-600">
          Verificación de conectividad y datos desde la base de datos
        </p>
      </div>

      {/* KPIs Section */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-xl">🏢</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Empresas</p>
                <p className="text-xl font-bold text-gray-900">{kpis.totalEmpresas?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-xl">📈</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Nivel General</p>
                <p className="text-xl font-bold text-gray-900">{kpis.nivelGeneral}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-xl">🌱</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Empresas Incipientes</p>
                <p className="text-xl font-bold text-gray-900">{kpis.empresasIncipientes?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-xl">👥</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                <p className="text-xl font-bold text-gray-900">{kpis.totalEmpleados?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Companies Section */}
      {empresas && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">🏢 Empresas Recientes</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empleados</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empresas.data?.map((empresa, index) => (
                  <tr key={`${empresa.IdEmpresa}-${index}`}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {empresa.empresa}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {empresa.departamento || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {empresa.sectorActividadDescripcion || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {empresa.totalEmpleados || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Mostrando {empresas.data?.length || 0} de {empresas.pagination?.total || 0} empresas
          </div>
        </div>
      )}

      {/* Filter Options Section */}
      {filters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-semibold mb-2">📍 Departamentos</h3>
            <div className="space-y-1">
              {filters.departamentos?.slice(0, 3).map((depto, index) => (
                <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                  {depto}
                </div>
              ))}
              {filters.departamentos?.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{filters.departamentos.length - 3} más...
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-semibold mb-2">🏘️ Distritos</h3>
            <div className="space-y-1">
              {filters.distritos?.slice(0, 3).map((distrito, index) => (
                <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                  {distrito}
                </div>
              ))}
              {filters.distritos?.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{filters.distritos.length - 3} más...
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-semibold mb-2">🏭 Sectores</h3>
            <div className="space-y-1">
              {filters.sectoresActividad?.slice(0, 3).map((sector, index) => (
                <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                  {sector}
                </div>
              ))}
              {filters.sectoresActividad?.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{filters.sectoresActividad.length - 3} más...
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-semibold mb-2">📊 Niveles</h3>
            <div className="space-y-1">
              {filters.nivelesInnovacion?.slice(0, 3).map((nivel, index) => (
                <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                  {nivel}
                </div>
              ))}
              {filters.nivelesInnovacion?.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{filters.nivelesInnovacion.length - 3} más...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-green-600 text-lg mr-2">✅</span>
          <div>
            <h3 className="text-green-800 font-medium">Sistema Funcionando Correctamente</h3>
            <p className="text-green-700 text-sm">
              Backend conectado • Autenticación activa • Datos cargados desde la base de datos
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
