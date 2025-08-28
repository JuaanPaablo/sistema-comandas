import SupabaseTest from '@/components/SupabaseTest'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Comandas
          </h1>
          <p className="text-gray-600">
            Prueba de conexión con Supabase
          </p>
        </div>
        
        <SupabaseTest />
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Configura las variables de entorno en tu archivo .env.local</p>
        </div>
      </div>
    </div>
  )
}
