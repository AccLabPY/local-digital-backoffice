"use client"

import { useState } from "react"

export default function ApiTestPage() {
  const [token, setToken] = useState("")
  const [username, setUsername] = useState("testuser")
  const [password, setPassword] = useState("testpass123")
  const [loginResult, setLoginResult] = useState(null)
  const [apiResult, setApiResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      
      const data = await response.json()
      setLoginResult(data)
      
      if (data.token) {
        setToken(data.token)
      }
    } catch (error) {
      setLoginResult({ error: error.message })
    }
    setLoading(false)
  }

  const handleRegister = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password, 
          email: `${username}@test.com`, 
          name: username,
          role: 'admin'
        }),
      })
      
      const data = await response.json()
      setLoginResult(data)
    } catch (error) {
      setLoginResult({ error: error.message })
    }
    setLoading(false)
  }

  const testEndpoint = async (endpoint) => {
    if (!token) {
      setApiResult({ error: "No token available. Please login first." })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      // Format the response based on endpoint type
      let formattedData = data
      if (endpoint === '/api/empresas' && data.data) {
        formattedData = {
          ...data,
          data: data.data.slice(0, 3), // Show only first 3 companies
          totalCompanies: data.pagination?.total || 0
        }
      } else if (endpoint === '/api/empresas/filters/options') {
        formattedData = {
          ...data,
          departamentos: data.departamentos?.slice(0, 5) || [],
          distritos: data.distritos?.slice(0, 5) || [],
          sectoresActividad: data.sectoresActividad?.slice(0, 5) || []
        }
      }
      
      setApiResult({ endpoint, status: response.status, data: formattedData })
    } catch (error) {
      setApiResult({ endpoint, error: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-8">
          🔐 Prueba de Autenticación y Endpoints API
        </h1>

        {/* Login Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔑 Autenticación</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Cargando..." : "🔐 Login"}
            </button>
            <button
              onClick={handleRegister}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Cargando..." : "📝 Registrar Usuario"}
            </button>
          </div>

          {loginResult && (
            <div className="bg-gray-50 border rounded-md p-4">
              <h3 className="font-medium mb-2">Resultado del Login:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(loginResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* API Testing Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Prueba de Endpoints</h2>
          
          {token && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <p className="text-green-800">
                ✅ Token disponible: {token.substring(0, 20)}...
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => testEndpoint('/api/empresas')}
              disabled={loading || !token}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              🏢 GET /api/empresas
            </button>
            <button
              onClick={() => testEndpoint('/api/empresas/kpis')}
              disabled={loading || !token}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              📊 GET /api/empresas/kpis
            </button>
            <button
              onClick={() => testEndpoint('/api/empresas/filters/options')}
              disabled={loading || !token}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              🔍 GET /api/empresas/filters/options
            </button>
            <button
              onClick={() => testEndpoint('/api/encuestas/dimensions')}
              disabled={loading || !token}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              📋 GET /api/encuestas/dimensions
            </button>
          </div>

          {apiResult && (
            <div className="bg-gray-50 border rounded-md p-4 mt-4">
              <h3 className="font-medium mb-2">Resultado de la API:</h3>
              {apiResult.error ? (
                <div className="bg-red-100 border border-red-300 rounded p-3">
                  <p className="text-red-800 font-medium">Error:</p>
                  <p className="text-red-700">{apiResult.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-100 border border-green-300 rounded p-3">
                    <p className="text-green-800 font-medium">✅ Status: {apiResult.status}</p>
                    <p className="text-green-700">Endpoint: {apiResult.endpoint}</p>
                  </div>
                  
                  {apiResult.data && (
                    <div className="bg-white border rounded p-3">
                      <h4 className="font-medium mb-2">Datos:</h4>
                      <pre className="text-sm overflow-auto max-h-96 bg-gray-50 p-2 rounded">
                        {JSON.stringify(apiResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Instrucciones</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Primero registra un usuario nuevo con el botón "Registrar Usuario"</li>
            <li>Luego haz login con las credenciales</li>
            <li>Una vez autenticado, prueba los diferentes endpoints</li>
            <li>Los resultados aparecerán en las secciones correspondientes</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
