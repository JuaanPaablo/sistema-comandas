'use client';

import { Button } from '@/components/ui/Button';
import { 
  BookOpen, 
  Search, 
  Filter
} from 'lucide-react';
import Link from 'next/link';

// Importar el componente principal de recetas
import RecipesModule from './components/RecipesModule';

export default function RecipesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  ← Volver al Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">📚 Módulo de Recetas</h1>
                <p className="text-gray-600 mt-2">
                  Conecta tu menú con el inventario para calcular costos y producción
                </p>
              </div>
            </div>
            
            {/* Acciones rápidas */}
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Búsqueda Global
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        {/* Header del módulo */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recetas</h2>
              <p className="text-gray-600">Gestión de ingredientes y cantidades</p>
            </div>
          </div>
        </div>

        {/* Renderizar el componente de recetas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <RecipesModule />
        </div>
      </div>
    </div>
  );
}
