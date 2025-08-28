'use client'

import { useState } from 'react'
import { testConnection } from '@/lib/supabase'

export default function SupabaseTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const handleTestConnection = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const connectionResult = await testConnection()
      setResult(connectionResult)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Prueba de Conexión Supabase
      </h2>
      
      <button
        onClick={handleTestConnection}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        {isLoading ? 'Probando...' : 'Probar Conexión'}
      </button>

      {result && (
        <div className={`mt-4 p-3 rounded-md ${
          result.success 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <p className="font-medium">
            {result.success ? '✅ Éxito' : '❌ Error'}
          </p>
          <p className="text-sm mt-1">
            {result.message || result.error}
          </p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-600">
        <p><strong>Nota:</strong> Asegúrate de configurar las variables de entorno:</p>
        <ul className="mt-2 space-y-1">
          <li>• NEXT_PUBLIC_SUPABASE_URL</li>
          <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        </ul>
      </div>
    </div>
  )
}
