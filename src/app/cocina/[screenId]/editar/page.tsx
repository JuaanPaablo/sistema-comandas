'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KitchenScreenService, KitchenScreen } from '@/lib/services/kitchenScreenService';

interface Dish {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
}

export default function EditarPantallaPage() {
  const params = useParams();
  const router = useRouter();
  const screenId = params.screenId as string;
  
  const [screen, setScreen] = useState<KitchenScreen | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (screenId) {
      loadScreenData();
    }
  }, [screenId]);

  const loadScreenData = async () => {
    try {
      setLoadingData(true);
      
      const [screenData, dishesData] = await Promise.all([
        KitchenScreenService.getScreenById(screenId),
        KitchenScreenService.getDishes()
      ]);
      
      if (!screenData) {
        setError('Pantalla no encontrada');
        return;
      }
      
      setScreen(screenData);
      setName(screenData.name);
      setDescription(screenData.description || '');
      setDishes(dishesData);
      
      // Cargar platillos seleccionados
      const assignedDishIds = screenData.assigned_dishes?.map(d => d.dish_id) || [];
      setSelectedDishes(assignedDishIds);
      
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading screen data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (selectedDishes.length === 0) {
      setError('Debes seleccionar al menos un platillo');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await KitchenScreenService.updateScreen(screenId, {
        name: name.trim(),
        description: description.trim() || undefined,
        dishIds: selectedDishes
      });
      
      router.push('/cocina');
    } catch (err) {
      setError('Error al actualizar la pantalla');
      console.error('Error updating screen:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta pantalla? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      await KitchenScreenService.deleteScreen(screenId);
      router.push('/cocina');
    } catch (err) {
      setError('Error al eliminar la pantalla');
      console.error('Error deleting screen:', err);
      setLoading(false);
    }
  };

  const toggleDish = (dishId: string) => {
    setSelectedDishes(prev => 
      prev.includes(dishId)
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    );
  };

  const selectAllByCategory = (categoryName: string) => {
    const categoryDishes = dishes.filter(dish => dish.category_name === categoryName);
    const categoryDishIds = categoryDishes.map(dish => dish.id);
    
    const allSelected = categoryDishIds.every(id => selectedDishes.includes(id));
    
    if (allSelected) {
      setSelectedDishes(prev => prev.filter(id => !categoryDishIds.includes(id)));
    } else {
      setSelectedDishes(prev => [...new Set([...prev, ...categoryDishIds])]);
    }
  };

  // Agrupar platillos por categoría
  const dishesByCategory = dishes.reduce((acc, dish) => {
    if (!acc[dish.category_name]) {
      acc[dish.category_name] = [];
    }
    acc[dish.category_name].push(dish);
    return acc;
  }, {} as Record<string, Dish[]>);

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error && !screen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ {error}</div>
          <button
            onClick={() => router.push('/cocina')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Volver a Cocina
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/cocina')}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">✏️ Editar Pantalla</h1>
              <p className="mt-2 text-gray-600">Modificar configuración de {screen?.name}</p>
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información básica */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Básica</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre de la Pantalla *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ej. Estación de Carnes"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Descripción (opcional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción de la estación de trabajo..."
                />
              </div>
            </div>
          </div>

          {/* Selección de platillos */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Seleccionar Platillos ({selectedDishes.length} seleccionados)
            </h2>
            
            <div className="space-y-6">
              {Object.entries(dishesByCategory).map(([categoryName, categoryDishes]) => {
                const categoryDishIds = categoryDishes.map(dish => dish.id);
                const allSelected = categoryDishIds.every(id => selectedDishes.includes(id));
                const someSelected = categoryDishIds.some(id => selectedDishes.includes(id));
                
                return (
                  <div key={categoryName} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        🍽️ {categoryName} ({categoryDishes.length} platillos)
                      </h3>
                      <button
                        type="button"
                        onClick={() => selectAllByCategory(categoryName)}
                        className={`px-3 py-1 text-sm rounded ${
                          allSelected
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : someSelected
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        {allSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryDishes.map((dish) => (
                        <label
                          key={dish.id}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedDishes.includes(dish.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedDishes.includes(dish.id)}
                            onChange={() => toggleDish(dish.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-3 text-sm font-medium text-gray-900">
                            {dish.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🗑️ Eliminar Pantalla
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.push('/cocina')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
