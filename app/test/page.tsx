"use client"

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-8">
          🧪 Página de Prueba - Chequeo Digital
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">✅ Estado de la Aplicación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800">Backend</h3>
              <p className="text-green-600">Puerto 3001 - ✅ Funcionando</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800">Frontend</h3>
              <p className="text-green-600">Puerto 3000 - ✅ Funcionando</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🔗 Endpoints Disponibles</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-mono text-sm">GET /api/empresas</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Requiere Auth</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-mono text-sm">GET /api/empresas/kpis</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Requiere Auth</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-mono text-sm">GET /api/encuestas/dimensions</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Requiere Auth</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-mono text-sm">GET /api-docs</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Público</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="http://localhost:3001/api-docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📚 Ver Documentación API
          </a>
        </div>
      </div>
    </div>
  )
}
