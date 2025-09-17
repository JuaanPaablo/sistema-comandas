'use client';

import { useState, useEffect } from 'react';
import { KitchenScreenService, KitchenScreen } from '@/lib/services/kitchenScreenService';
import Link from 'next/link';

export default function CocinaPage() {
  const [screens, setScreens] = useState<KitchenScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScreens();
  }, []);

  const loadScreens = async () => {
    try {
      setLoading(true);
      const data = await KitchenScreenService.getScreens();
      setScreens(data);
    } catch (err) {
      setError('Error al cargar las pantallas');
      console.error('Error loading screens:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await KitchenScreenService.updateScreen(id, { active: !currentStatus });
      setScreens(screens.map(screen => 
        screen.id === id ? { ...screen, active: !currentStatus } : screen
      ));
    } catch (err) {
      setError('Error al actualizar el estado de la pantalla');
      console.error('Error updating screen:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pantallas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">🍳 COCINA</h1>
              <p className="mt-2 text-gray-600">Gestión de pantallas de cocina por estación</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/cocina/general"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-lg transition-colors"
              >
                🔄 Vista General
              </Link>
              <Link
                href="/cocina/crear"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium text-lg transition-colors"
              >
                ➕ Nueva Pantalla
              </Link>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pantallas</p>
                <p className="text-2xl font-semibold text-gray-900">{screens.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pantallas Activas</p>
                <p className="text-2xl font-semibold text-gray-900">{screens.filter(s => s.active).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pantallas Inactivas</p>
                <p className="text-2xl font-semibold text-gray-900">{screens.filter(s => !s.active).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Screens Grid */}
        {screens.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pantallas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando una nueva pantalla de cocina.
            </p>
            <div className="mt-6">
              <Link
                href="/cocina/crear"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                ➕ Nueva Pantalla
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {screens.map((screen) => (
              <div key={screen.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  screen.active ? 'ring-2 ring-green-500' : 'ring-2 ring-gray-200'
                }`}
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      🖥️ {screen.name}
                      {screen.active && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activa
                        </span>
                      )}
                    </h3>
                    <div className={`w-3 h-3 rounded-full ${screen.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  {screen.description && (
                    <p className="mt-2 text-sm text-gray-600">{screen.description}</p>
                  )}
                  <div className="mt-3 text-xs text-gray-500">
                    Creada: {new Date(screen.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                  <div className="flex space-x-3">
                    <Link
                      href={`/cocina/${screen.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      👁️ Ver Pantalla
                    </Link>
                    <Link
                      href={`/cocina/${screen.id}/editar`}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-center px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      ✏️ Editar
                    </Link>
                    <button
                      onClick={() => handleToggleActive(screen.id, screen.active)}
                      className={`flex-1 text-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        screen.active
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {screen.active ? '⏸️ Desactivar' : '▶️ Activar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}