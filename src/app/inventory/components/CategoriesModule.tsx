'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { 
  Tags, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Grid,
  List,
  Filter,
  Warehouse,
  CheckCircle,
  XCircle,
  X,
  Clock,
  Package,
  Activity,
  Layers
} from 'lucide-react';
import { InventoryCategoryService, InventoryService } from '@/lib/services/inventoryService';
import { InventoryCategory, InventoryCategoryFormData, Inventory } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  inventory_id: z.string().min(1, 'El inventario es requerido'),
  active: z.boolean().default(true)
});

interface CategoriesModuleProps {
  onOpenModal?: (type: string, title: string, content: React.ReactNode) => void;
  onOpenConfirmationModal?: (title: string, message: string, onConfirm: () => void, loading?: boolean) => void;
  onCloseModal?: () => void;
}

export default function CategoriesModule({ onOpenModal, onOpenConfirmationModal, onCloseModal }: CategoriesModuleProps) {
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<InventoryCategory[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'created_at_desc' | 'created_at_asc' | 'name_asc' | 'name_desc'>('created_at_desc');
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('table');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingButtons, setLoadingButtons] = useState<Set<string>>(new Set());
  const [modalButtonLoading, setModalButtonLoading] = useState(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Estados para modal de filtros
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    inventory: '',
    status: 'all' as 'all' | 'active' | 'inactive',
    sort: 'created_at_desc' as 'created_at_desc' | 'created_at_asc' | 'name_asc' | 'name_desc'
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<InventoryCategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      inventory_id: '',
      active: true
    }
  });

  // Funciones helper para manejar estados de carga de botones
  const setButtonLoading = useCallback((buttonId: string, loading: boolean) => {
    setLoadingButtons(prev => {
      const newSet = new Set(prev);
      if (loading) {
        newSet.add(buttonId);
      } else {
        newSet.delete(buttonId);
      }
      return newSet;
    });
  }, []);

  const isButtonLoading = useCallback((buttonId: string) => {
    return loadingButtons.has(buttonId);
  }, [loadingButtons]);

  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [categoriesResponse, inventoriesResponse] = await Promise.all([
        InventoryCategoryService.getAllWithInactive(),
        InventoryService.getAllWithInactive()
      ]);
      setCategories(categoriesResponse.data || []);
      setInventories(inventoriesResponse.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar y ordenar categorías
  useEffect(() => {
    let data = [...categories];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      data = data.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inventories.find(inv => inv.id === category.inventory_id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por inventario
    if (inventoryFilter) {
      data = data.filter(category => category.inventory_id === inventoryFilter);
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      data = data.filter(category => 
        statusFilter === 'active' ? category.active : !category.active
      );
    }

    // Ordenar
    switch (sortBy) {
      case 'name_asc':
        data.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        data.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'created_at_asc':
        data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'created_at_desc':
      default:
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setFilteredCategories(data);
  }, [searchTerm, categories, inventoryFilter, statusFilter, sortBy]);

  // Abrir modal para crear/editar
  const openModal = (category?: InventoryCategory) => {
    if (category) {
      setEditingCategory(category);
      reset({
        name: category.name,
        inventory_id: category.inventory_id,
        active: category.active
      });
    } else {
      setEditingCategory(null);
      reset({
        name: '',
        inventory_id: '',
        active: true
      });
    }
    
    // Usar el modal global si está disponible
    if (onOpenModal) {
      const modalContent = (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="category-inventory" className="block text-sm font-semibold text-gray-700 mb-2">
                Inventario
              </label>
              <div className="relative">
                <Warehouse className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Select
                  id="category-inventory"
                  {...register('inventory_id')}
                  className={`pl-11 h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 ${
                    errors.inventory_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                >
                  <option value="">Seleccionar inventario...</option>
                  {inventories.map((inventory) => (
                    <option key={inventory.id} value={inventory.id}>
                      {inventory.name}
                    </option>
                  ))}
                </Select>
              </div>
              {errors.inventory_id && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  {errors.inventory_id.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="category-name" className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre de la Categoría
              </label>
              <div className="relative">
                <Tags className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="category-name"
                  {...register('name')}
                  placeholder="Ej: Verduras, Carnes, Bebidas, Condimentos"
                  className={`pl-11 h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 ${
                    errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-red-600 text-sm mt-1 flex items-center">
                  <XCircle className="w-4 h-4 mr-1" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {editingCategory && !editingCategory.active && (
              <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Esta categoría está inactiva
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (onCloseModal) {
                  onCloseModal();
                } else {
                  setShowModal(false);
                }
              }}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-3 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Cancelar
            </Button>
            <Button
              ref={submitButtonRef}
              type="submit"
              disabled={isSubmitting || isButtonLoading('create-category-modal') || modalButtonLoading}
              onClick={(e) => {
                // DESHABILITAR INMEDIATAMENTE AL HACER CLIC
                if (!isSubmitting && !isButtonLoading('create-category-modal') && !modalButtonLoading) {
                  // Cambiar la apariencia del botón DIRECTAMENTE en el DOM para feedback instantáneo
                  const button = e.currentTarget;
                  button.style.opacity = '0.5';
                  button.style.cursor = 'not-allowed';
                  button.style.backgroundColor = '#9ca3af'; // Gris para indicar deshabilitado
                  // NO deshabilitar el botón porque bloquea el envío del formulario
                  
                  // Actualizar estados para el siguiente renderizado
                  setIsSubmitting(true);
                  setButtonLoading('create-category-modal', true);
                  setModalButtonLoading(true);
                } else {
                  // Prevenir el envío si ya está en proceso
                  e.preventDefault();
                  console.log('🚫 CLICK: Botón ya en proceso, previniendo envío');
                }
              }}
              className="flex-1 sm:flex-none px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting || isButtonLoading('create-category-modal') || modalButtonLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{editingCategory ? 'Actualizando...' : 'Creando...'}</span>
                </div>
              ) : (
                editingCategory ? 'Actualizar Categoría' : 'Crear Categoría'
              )}
            </Button>
          </div>
        </form>
      );
      
      onOpenModal('category', editingCategory ? 'Editar Categoría' : 'Nueva Categoría', modalContent);
    } else {
    setShowModal(true);
    }
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    reset();
  };

  // Enviar formulario
  const onSubmit = useCallback(async (data: InventoryCategoryFormData) => {
    const buttonId = 'create-category-modal';
    try {
      const categoryData = { ...data };
      let response;
      if (editingCategory) {
        response = await InventoryCategoryService.update(editingCategory.id, categoryData);
      } else {
        response = await InventoryCategoryService.create(categoryData);
      }
      if (response.data) {
        // Cerrar el modal INMEDIATAMENTE después del éxito
        if (onCloseModal) {
          onCloseModal();
        } else {
          closeModal();
        }
        
        // Recargar datos después de cerrar el modal
        await loadData();
      } else {
        console.error('❌ Error en la respuesta:', response.error);
        alert(`Error: ${response.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('💥 Error guardando categoría:', error);
      alert('Error al procesar el formulario');
    } finally {
      // SIEMPRE limpiar estados
      setIsSubmitting(false);
      setButtonLoading(buttonId, false);
      setModalButtonLoading(false);
      
      // SIEMPRE restaurar el botón en el DOM
      if (submitButtonRef.current) {
        submitButtonRef.current.disabled = false;
        submitButtonRef.current.style.opacity = '1';
        submitButtonRef.current.style.cursor = 'pointer';
        submitButtonRef.current.style.backgroundColor = ''; // Restaurar color original
      }
    }
  }, [editingCategory, onCloseModal, loadData, setButtonLoading]);

  // Eliminar categoría (soft delete)
  const handleDelete = async (id: string) => {
    if (onOpenConfirmationModal) {
      onOpenConfirmationModal(
        'Eliminar Categoría',
        'Esta acción colocará la categoría como inactiva. Podrás reactivarla después.',
        async () => {
      try {
        const response = await InventoryCategoryService.delete(id);
        if (response.data) {
              await loadData();
        }
      } catch (error) {
        console.error('Error eliminando categoría:', error);
      }
        }
      );
    }
  };

  // Eliminar permanentemente
  const handleHardDelete = async (id: string) => {
    if (onOpenConfirmationModal) {
      onOpenConfirmationModal(
        'Eliminar Categoría Permanentemente',
        '⚠️ Esta acción NO se puede deshacer. Se eliminará definitivamente la categoría y su historial asociado.',
        async () => {
      try {
        const response = await InventoryCategoryService.hardDelete(id);
        if (response.data === null) {
              await loadData();
        }
      } catch (error) {
        console.error('Error eliminando permanentemente:', error);
      }
        }
      );
    }
  };

  // Funciones para modal de filtros
  const openFilterModal = () => {
    setActiveFilters({
      inventory: inventoryFilter,
      status: statusFilter,
      sort: sortBy
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setInventoryFilter(activeFilters.inventory);
    setStatusFilter(activeFilters.status);
    setSortBy(activeFilters.sort);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({
      inventory: '',
      status: 'all',
      sort: 'created_at_desc'
    });
    setInventoryFilter('');
    setStatusFilter('all');
    setSortBy('created_at_desc');
    setShowFilterModal(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (inventoryFilter) count++;
    if (statusFilter !== 'all') count++;
    if (sortBy !== 'created_at_desc') count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-emerald-50/30">
      <div className="h-full w-full animate-fadeIn">

        {/* Toolbar mejorada con más espacio */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-12 py-8 mb-12">
          <div className="flex items-center justify-between gap-12">
            {/* Controles principales */}
            <div className="flex items-center gap-8">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <Input
                  placeholder="Buscar categorías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 w-96 h-12 px-6 text-gray-900 border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              {/* Botón de filtros */}
              <Button
                onClick={openFilterModal}
                variant="outline"
                className="h-12 px-6 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 focus:border-green-500 focus:ring-green-500"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filtros
                {getActiveFiltersCount() > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </Button>
            </div>

            {/* Controles de vista y botón crear */}
            <div className="flex items-center gap-6">
              {/* Botones de vista */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={displayMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDisplayMode('table')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    displayMode === 'table' 
                      ? 'bg-white text-green-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4 mr-2" />
                  Lista
                </Button>
                <Button
                  variant={displayMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDisplayMode('cards')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    displayMode === 'cards' 
                      ? 'bg-white text-green-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid className="w-4 h-4 mr-2" />
                  Tarjetas
                </Button>
              </div>

              {/* Botón crear */}
              <Button
                onClick={() => {
                  if (modalButtonLoading) return;
                  setModalButtonLoading(true);
                  openModal();
                  setTimeout(() => setModalButtonLoading(false), 100);
                }}
                disabled={modalButtonLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 h-12 text-sm font-semibold"
              >
                {modalButtonLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Abriendo...</span>
                  </div>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Nueva Categoría
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="mx-6 mb-6 min-h-[80vh]">
          {isLoading ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Cargando categorías</h3>
                    <p className="text-gray-600">Por favor espera mientras cargamos los datos...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : filteredCategories.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="p-4 rounded-full bg-green-100">
                    <Tags className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {searchTerm ? 'No se encontraron categorías' : 'No hay categorías creadas'}
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm 
                        ? 'Intenta con otros términos de búsqueda' 
                        : 'Comienza creando tu primera categoría de inventario'
                      }
                    </p>
                  </div>
                  {!searchTerm && (
                    <Button
                      onClick={() => openModal()}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                    >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Categoría
            </Button>
                  )}
                </div>
              </CardContent>
          </Card>
          ) : displayMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
              {filteredCategories.map((category, index) => {
                const inventory = inventories.find(inv => inv.id === category.inventory_id);
                return (
                  <Card key={category.id} className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 group-hover:scale-110 transition-transform">
                            <Tags className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-600">{inventory?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {category.active ? (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-500">
                          Creado: {new Date(category.created_at).toLocaleDateString()}
                      </div>
                        <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(category)}
                            className="h-7 w-7 p-0 bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100 hover:border-yellow-300 hover:text-yellow-700 shadow-sm"
                            title="Editar categoría"
                        >
                            <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                            className="h-7 w-7 p-0 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 shadow-sm"
                            title="Eliminar categoría"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        </div>
                      </div>
          </div>
                  </Card>
                );
              })}
      </div>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden mt-6">
          <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 tracking-wider">
                        <div className="flex items-center space-x-2">
                          <Tags className="w-4 h-4" />
                          <span>Categoría</span>
                        </div>
                  </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 tracking-wider">
                        <div className="flex items-center space-x-2">
                          <Warehouse className="w-4 h-4" />
                          <span>Inventario</span>
                        </div>
                  </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700 tracking-wider">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>Estado</span>
                        </div>
                  </th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-700 tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredCategories.map((category, index) => {
                      const inventory = inventories.find(inv => inv.id === category.inventory_id);
                      return (
                        <tr 
                          key={category.id} 
                          className="hover:bg-gradient-to-r hover:from-green-50/30 hover:to-emerald-50/20 transition-all duration-200 group"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-4">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 group-hover:scale-110 transition-transform">
                                <Tags className="h-5 w-5 text-green-600" />
                          </div>
                              <div>
                                <div className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                                  {category.name}
                        </div>
                                <div className="text-sm text-gray-500">
                                  Creado: {new Date(category.created_at).toLocaleDateString()}
                                </div>
                        </div>
                      </div>
                    </td>
                          <td className="py-4 px-6 text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Warehouse className="w-4 h-4 text-gray-400" />
                              <span>{inventory?.name}</span>
                      </div>
                    </td>
                          <td className="py-4 px-6">
                            {category.active ? (
                              <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                                Inactivo
                      </span>
                            )}
                    </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(category)}
                                className="h-8 w-8 p-0 bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100 hover:border-yellow-300 hover:text-yellow-700 shadow-sm"
                                title="Editar categoría"
                        >
                                <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                                onClick={() => handleDelete(category.id)}
                                className="h-8 w-8 p-0 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 shadow-sm"
                                title="Eliminar categoría"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
            </Card>
          )}
        </div>
          </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          opacity: 0;
        }
      `}</style>

      {/* Modal de filtros */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFilterModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Filter className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Filtros de Categorías</h2>
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
            <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Filtro por Inventario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inventario
                  </label>
                  <select
                    value={activeFilters.inventory}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, inventory: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="">Todos los inventarios</option>
                    {(Array.isArray(inventories) ? inventories : []).map((inventory) => (
                      <option key={inventory.id} value={inventory.id}>
                        {inventory.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={activeFilters.status}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Solo activos</option>
                    <option value="inactive">Solo inactivos</option>
                  </select>
                </div>

                {/* Filtro por Ordenamiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordenar por
                  </label>
                  <select
                    value={activeFilters.sort}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, sort: e.target.value as any }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                  >
                    <option value="created_at_desc">Más recientes</option>
                    <option value="created_at_asc">Más antiguos</option>
                    <option value="name_asc">Nombre (A-Z)</option>
                    <option value="name_desc">Nombre (Z-A)</option>
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
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}