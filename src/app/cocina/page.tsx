'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { KitchenScreenService, KitchenScreen } from '@/lib/services/kitchenScreenService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { 
  Monitor, 
  Plus, 
  Edit, 
  Eye, 
  Power, 
  PowerOff,
  Search,
  Filter,
  List,
  Grid,
  X,
  Settings,
  Play,
  Pause,
  ChefHat,
  CheckSquare,
  Square
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import Link from 'next/link';

export default function CocinaPage() {
  const [screens, setScreens] = useState<KitchenScreen[]>([]);
  const [filteredScreens, setFilteredScreens] = useState<KitchenScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Estados para vista (tabla o tarjetas)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Estados para modal de filtros
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: 'all' as 'all' | 'active' | 'inactive'
  });

  // Estados para modal de nueva pantalla
  const [showNewScreenModal, setShowNewScreenModal] = useState(false);
  const [newScreenName, setNewScreenName] = useState('');
  const [newScreenDescription, setNewScreenDescription] = useState('');
  const [dishes, setDishes] = useState<Array<{
    id: string;
    name: string;
    category_id: string;
    category_name: string;
  }>>([]);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadScreens();
  }, []);

  const loadScreens = async () => {
    try {
      setLoading(true);
      const data = await KitchenScreenService.getScreens();
      setScreens(data);
      setFilteredScreens(data);
    } catch (err) {
      setError('Error al cargar las pantallas');
      console.error('Error loading screens:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar pantallas
  useEffect(() => {
    let filtered = screens;

    if (searchTerm) {
      filtered = filtered.filter(screen =>
        screen.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (screen.description && screen.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(screen => 
        statusFilter === 'active' ? screen.active : !screen.active
      );
    }

    setFilteredScreens(filtered);
  }, [searchTerm, statusFilter, screens]);

  // Hook de paginación
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedScreens,
    goToPage
  } = usePagination({ data: filteredScreens || [], itemsPerPage: 10 });

  // Funciones para modal de filtros
  const openFilterModal = () => {
    setActiveFilters({
      status: statusFilter
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setStatusFilter(activeFilters.status);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({ status: 'all' });
    setStatusFilter('all');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.status !== 'all') count++;
    return count;
  };

  // Funciones para modal de nueva pantalla
  const openNewScreenModal = useCallback(async () => {
    if (createButtonLoading) return;
    
    setCreateButtonLoading(true);
    try {
      setShowNewScreenModal(true);
      setNewScreenName('');
      setNewScreenDescription('');
      setSelectedDishes([]);
      await loadDishes();
    } finally {
      setTimeout(() => setCreateButtonLoading(false), 100);
    }
  }, [createButtonLoading]);

  const closeNewScreenModal = useCallback(() => {
    setShowNewScreenModal(false);
    setNewScreenName('');
    setNewScreenDescription('');
    setSelectedDishes([]);
    setDishes([]);
  }, []);

  const loadDishes = async () => {
    try {
      setLoadingDishes(true);
      const data = await KitchenScreenService.getDishes();
      setDishes(data);
    } catch (err) {
      setError('Error al cargar los platillos');
      console.error('Error loading dishes:', err);
    } finally {
      setLoadingDishes(false);
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
      // Deseleccionar todos de esta categoría
      setSelectedDishes(prev => prev.filter(id => !categoryDishIds.includes(id)));
    } else {
      // Seleccionar todos de esta categoría
      setSelectedDishes(prev => [...new Set([...prev, ...categoryDishIds])]);
    }
  };

  const onSubmitNewScreen = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitLoading) return;
    
    if (!newScreenName.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (selectedDishes.length === 0) {
      setError('Debes seleccionar al menos un platillo');
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);
      
      await KitchenScreenService.createScreen({
        name: newScreenName.trim(),
        description: newScreenDescription.trim() || undefined,
        dishIds: selectedDishes
      });
      
      await loadScreens();
      closeNewScreenModal();
    } catch (err) {
      setError('Error al crear la pantalla');
      console.error('Error creating screen:', err);
    } finally {
      setSubmitLoading(false);
    }
  }, [submitLoading, newScreenName, newScreenDescription, selectedDishes, closeNewScreenModal]);

  // Agrupar platillos por categoría
  const dishesByCategory = dishes.reduce((acc, dish) => {
    if (!acc[dish.category_name]) {
      acc[dish.category_name] = [];
    }
    acc[dish.category_name].push(dish);
    return acc;
  }, {} as Record<string, typeof dishes>);

  const handleToggleActive = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      await KitchenScreenService.updateScreen(id, { active: !currentStatus });
      setScreens(screens.map(screen => 
        screen.id === id ? { ...screen, active: !currentStatus } : screen
      ));
    } catch (err) {
      setError('Error al actualizar el estado de la pantalla');
      console.error('Error updating screen:', err);
    }
  }, [screens]);

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="px-12 py-8 mb-12">
        {/* Toolbar unificado */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar pantallas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 px-6 pl-12 text-gray-900 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>

          {/* Filtros */}
          <Button
            onClick={openFilterModal}
            variant="outline"
            className="h-12 px-6 text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filtros
            {getActiveFiltersCount() > 0 && (
              <span className="ml-2 bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </Button>

          {/* Vista */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              onClick={() => setViewMode('table')}
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className={`px-4 ${viewMode === 'table' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </Button>
            <Button
              onClick={() => setViewMode('cards')}
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              className={`px-4 ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
            >
              <Grid className="w-4 h-4 mr-2" />
              Tarjetas
            </Button>
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <Link href="/cocina/general">
              <Button
                variant="outline"
                className="h-12 px-6 text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <Monitor className="w-5 h-5 mr-2" />
                Vista General
              </Button>
            </Link>
            <Button
              onClick={openNewScreenModal}
              disabled={createButtonLoading}
              className="h-12 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createButtonLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Abriendo...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Nueva Pantalla
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
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

        {/* Contenido principal */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="text-gray-900 mt-4 text-lg">Cargando pantallas...</p>
          </div>
        ) : filteredScreens.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-orange-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Monitor className="w-12 h-12 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No hay pantallas</h3>
            <p className="text-gray-600 mb-8 text-lg">Crea pantallas de cocina para gestionar las órdenes por estación</p>
            <Button
              onClick={openNewScreenModal}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-8 py-3 text-lg shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Crear Primera Pantalla
            </Button>
          </div>
        ) : viewMode === 'table' ? (
          /* Vista de tabla */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pantalla
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creada
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedScreens.map((screen) => (
                    <tr key={screen.id} className="hover:bg-gray-50">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-orange-100 rounded-lg mr-4">
                            <Monitor className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{screen.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        {screen.description || '-'}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          screen.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {screen.active ? (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Activa
                            </>
                          ) : (
                            <>
                              <Pause className="w-3 h-3 mr-1" />
                              Inactiva
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        {new Date(screen.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link href={`/cocina/${screen.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/cocina/${screen.id}/editar`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(screen.id, screen.active)}
                            className={screen.active 
                              ? 'text-red-600 hover:text-red-700 border-red-300 hover:border-red-400'
                              : 'text-green-600 hover:text-green-700 border-green-300 hover:border-green-400'
                            }
                          >
                            {screen.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Vista de tarjetas */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedScreens.map((screen) => (
              <Card key={screen.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Monitor className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">{screen.name}</CardTitle>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      screen.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {screen.active ? (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          Activa
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3 mr-1" />
                          Inactiva
                        </>
                      )}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {screen.description && (
                    <p className="text-sm text-gray-600">{screen.description}</p>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Creada: {new Date(screen.created_at).toLocaleDateString()}
                  </div>

                  {/* Acciones */}
                  <div className="flex space-x-2 pt-2">
                    <Link href={`/cocina/${screen.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                    </Link>
                    <Link href={`/cocina/${screen.id}/editar`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(screen.id, screen.active)}
                      className={screen.active 
                        ? 'text-red-600 hover:text-red-700 border-red-300 hover:border-red-400'
                        : 'text-green-600 hover:text-green-700 border-green-300 hover:border-green-400'
                      }
                    >
                      {screen.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paginación */}
        {!loading && filteredScreens.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredScreens.length}
              itemsPerPage={10}
              onPageChange={goToPage}
              itemType="pantallas"
            />
          </div>
        )}

        {/* Modal de filtros */}
        {showFilterModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFilterModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Filter className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Filtros de Pantallas</h2>
                      <p className="text-sm text-gray-600">Selecciona los filtros que deseas aplicar</p>
                    </div>
                  </div>
                  <Button
                    onClick={closeFilterModal}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Contenido */}
              <div className="px-8 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  {/* Filtro por Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={activeFilters.status}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value as 'all' | 'active' | 'inactive' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="active">🟢 Activas</option>
                      <option value="inactive">🔴 Inactivas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Limpiar Filtros
                  </Button>
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={closeFilterModal}
                      variant="outline"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={applyFilters}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6"
                    >
                      Aplicar Filtros
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Modal de nueva pantalla */}
        {showNewScreenModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeNewScreenModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Plus className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Nueva Pantalla de Cocina</h2>
                      <p className="text-sm text-gray-600">Configura una nueva estación de trabajo</p>
                    </div>
                  </div>
                  <Button
                    onClick={closeNewScreenModal}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Contenido */}
              <div className="px-8 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <form onSubmit={onSubmitNewScreen} className="space-y-8">
                  {/* Información básica */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Monitor className="w-5 h-5 mr-2 text-orange-600" />
                      Información Básica
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-3">
                          <Monitor className="w-4 h-4 inline mr-2 text-orange-600" />
                          Nombre de la Pantalla <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newScreenName}
                          onChange={(e) => setNewScreenName(e.target.value)}
                          className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                          placeholder="ej. Estación de Carnes"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-800 mb-3">
                          <Monitor className="w-4 h-4 inline mr-2 text-orange-600" />
                          Descripción (opcional)
                        </label>
                        <textarea
                          value={newScreenDescription}
                          onChange={(e) => setNewScreenDescription(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                          placeholder="Descripción de la estación de trabajo..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Selección de platillos */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <ChefHat className="w-5 h-5 mr-2 text-orange-600" />
                      Seleccionar Platillos ({selectedDishes.length} seleccionados)
                    </h3>
                    
                    {loadingDishes ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Cargando platillos...</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(dishesByCategory).map(([categoryName, categoryDishes]) => {
                          const categoryDishIds = categoryDishes.map(dish => dish.id);
                          const allSelected = categoryDishIds.every(id => selectedDishes.includes(id));
                          const someSelected = categoryDishIds.some(id => selectedDishes.includes(id));
                          
                          return (
                            <div key={categoryName} className="border border-gray-200 rounded-lg p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-medium text-gray-900 flex items-center">
                                  <ChefHat className="w-4 h-4 mr-2 text-orange-600" />
                                  {categoryName} ({categoryDishes.length} platillos)
                                </h4>
                                <Button
                                  type="button"
                                  onClick={() => selectAllByCategory(categoryName)}
                                  variant="outline"
                                  size="sm"
                                  className={`${
                                    allSelected
                                      ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                                      : someSelected
                                      ? 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                                      : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100'
                                  }`}
                                >
                                  {allSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {categoryDishes.map((dish) => (
                                  <label
                                    key={dish.id}
                                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                                      selectedDishes.includes(dish.id)
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedDishes.includes(dish.id)}
                                      onChange={() => toggleDish(dish.id)}
                                      className="sr-only"
                                    />
                                    <div className="flex items-center w-full">
                                      {selectedDishes.includes(dish.id) ? (
                                        <CheckSquare className="w-5 h-5 text-orange-600 mr-3" />
                                      ) : (
                                        <Square className="w-5 h-5 text-gray-400 mr-3" />
                                      )}
                                      <span className="text-sm font-medium text-gray-900">
                                        {dish.name}
                                      </span>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer con botones */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeNewScreenModal}
                      className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitLoading}
                      className="px-8 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Crear Pantalla
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );
}