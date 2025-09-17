'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KitchenScreenService } from '@/lib/services/kitchenScreenService';
import { MenuService } from '@/lib/services/menuService';

interface Category {
  id: string;
  name: string;
}

interface Dish {
  id: string;
  name: string;
  price: number;
  category_id: string;
  category_name: string;
}

export default function CrearPantallaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: ''
  });
  
  // Categories and dishes
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [showIndividualSelection, setShowIndividualSelection] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, dishesData] = await Promise.all([
        MenuService.getCategories(),
        MenuService.getDishes()
      ]);
      
      setCategories(categoriesData);
      setDishes(dishesData);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading data:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleDishToggle = (dishId: string) => {
    setSelectedDishes(prev => 
      prev.includes(dishId) 
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('El nombre de la pantalla es requerido');
      return;
    }

    if (selectedCategories.length === 0 && selectedDishes.length === 0) {
      setError('Debes seleccionar al menos una categoría o platillo');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Crear la pantalla
      const newScreen = await KitchenScreenService.createScreen({
        name: formData.name,
        description: undefined,
        active: true
      });

      // Asignar categorías
      for (const categoryId of selectedCategories) {
        await KitchenScreenService.assignDishesByCategory(newScreen.id, categoryId);
      }

      // Asignar platillos individuales
      for (const dishId of selectedDishes) {
        await KitchenScreenService.assignDishToScreen(newScreen.id, dishId);
      }

      router.push('/cocina');
    } catch (err) {
      setError('Error al crear la pantalla');
      console.error('Error creating screen:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDishesByCategory = (categoryId: string) => {
    return dishes.filter(dish => dish.category_id === categoryId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🍳 Crear Nueva Pantalla</h1>
              <p className="mt-2 text-gray-600">
                Configura una nueva pantalla para mostrar órdenes específicas
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre de la Pantalla *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ej: Cocina Principal, Bebidas, Bar, Postres"
                  required
                />
              </div>
              
            </div>
          </div>

          {/* Selection Method */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Método de Selección</h2>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowIndividualSelection(false)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  !showIndividualSelection
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Por Categorías
              </button>
              <button
                type="button"
                onClick={() => setShowIndividualSelection(true)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  showIndividualSelection
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Platillos Individuales
              </button>
            </div>
          </div>

          {/* Category Selection */}
          {!showIndividualSelection && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Categorías</h2>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona las categorías cuyos platillos aparecerán en esta pantalla
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`category-${category.id}`} className="ml-2 text-sm text-gray-700">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Dish Selection */}
          {showIndividualSelection && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Platillos</h2>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona los platillos específicos que aparecerán en esta pantalla
              </p>
              
              <div className="space-y-4">
                {categories.map((category) => {
                  const categoryDishes = getDishesByCategory(category.id);
                  if (categoryDishes.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">{category.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryDishes.map((dish) => (
                          <div key={dish.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`dish-${dish.id}`}
                                checked={selectedDishes.includes(dish.id)}
                                onChange={() => handleDishToggle(dish.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`dish-${dish.id}`} className="ml-2 text-sm text-gray-700">
                                {dish.name}
                              </label>
                            </div>
                            <span className="text-sm text-gray-500">${dish.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Resumen de Selección</h3>
            <p className="text-sm text-blue-700">
              {!showIndividualSelection ? (
                <>
                  <strong>{selectedCategories.length}</strong> categorías seleccionadas
                  {selectedCategories.length > 0 && (
                    <span className="ml-2">
                      ({selectedCategories.map(id => categories.find(c => c.id === id)?.name).join(', ')})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <strong>{selectedDishes.length}</strong> platillos seleccionados
                </>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Pantalla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
