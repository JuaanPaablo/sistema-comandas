'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { 
  Warehouse, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Grid,
  List,
  TrendingUp,
  Package,
  Calendar,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  X,
  Star,
  Archive,
  Clock,
  Activity,
  Layers
} from 'lucide-react';
import { InventoryService } from '@/lib/services/inventoryService';
import { Inventory, InventoryFormData } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const inventorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  active: z.boolean().default(true)
});

interface InventoriesModuleProps {
  onOpenModal?: (type: string, title: string, content: React.ReactNode) => void;
  onOpenConfirmationModal?: (title: string, message: string, onConfirm: () => void, loading?: boolean) => void;
  onCloseModal?: () => void;
}

export default function InventoriesModule({ onOpenModal, onOpenConfirmationModal, onCloseModal }: InventoriesModuleProps) {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [filteredInventories, setFilteredInventories] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'created_at_desc' | 'created_at_asc' | 'name_asc' | 'name_desc'>('created_at_desc');
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('table');
  const [showModal, setShowModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingButtons, setLoadingButtons] = useState<Set<string>>(new Set());
  const [modalButtonLoading, setModalButtonLoading] = useState(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Estados para modal de filtros
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: 'all' as 'all' | 'active' | 'inactive',
    sort: 'created_at_desc' as 'created_at_desc' | 'created_at_asc' | 'name_asc' | 'name_desc'
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: '',
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

  // Cargar inventarios
  const loadInventories = async () => {
    try {
      setIsLoading(true);
      const response = await InventoryService.getAllWithInactive();
      if (response.data) {
        setInventories(response.data);
        setFilteredInventories(response.data);
      }
    } catch (error) {
      console.error('Error cargando inventarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventories();
  }, []);

  // Búsqueda, filtros y orden
  useEffect(() => {
    let data = inventories.slice();

    if (searchTerm.trim()) {
      data = data.filter(inv => inv.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (statusFilter !== 'all') {
      data = data.filter(inv => (statusFilter === 'active' ? inv.active : !inv.active));
    }

    data.sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'created_at_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredInventories(data);
  }, [searchTerm, inventories, statusFilter, sortBy]);

  // Abrir modal para crear/editar
  const openModal = (inventory?: Inventory) => {
    if (inventory) {
      setEditingInventory(inventory);
      reset({
        name: inventory.name,
        active: inventory.active
      });
    } else {
      setEditingInventory(null);
      reset({
        name: '',
        active: true
      });
    }
    
    // Usar el modal global si está disponible
    if (onOpenModal) {
      const modalContent = (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="inventory-name" className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Inventario
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="inventory-name"
                  {...register('name')}
                  placeholder="Ej: Cocina Principal, Bar, Almacén General"
                  className={`pl-11 h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
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

            {editingInventory && !editingInventory.active && (
              <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Este inventario está inactivo
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
              disabled={isSubmitting || isButtonLoading('create-inventory-modal') || modalButtonLoading}
              onClick={(e) => {
                // DESHABILITAR INMEDIATAMENTE AL HACER CLIC
                if (!isSubmitting && !isButtonLoading('create-inventory-modal') && !modalButtonLoading) {
                  
                  // Cambiar la apariencia del botón DIRECTAMENTE en el DOM para feedback instantáneo
                  const button = e.currentTarget;
                  button.style.opacity = '0.5';
                  button.style.cursor = 'not-allowed';
                  button.style.backgroundColor = '#9ca3af'; // Gris para indicar deshabilitado
                  // NO deshabilitar el botón porque bloquea el envío del formulario
                  
                  // Actualizar estados para el siguiente renderizado
                  setIsSubmitting(true);
                  setButtonLoading('create-inventory-modal', true);
                  setModalButtonLoading(true);
                  
                } else {
                  // Prevenir el envío si ya está en proceso
                  e.preventDefault();
                }
              }}
              className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting || isButtonLoading('create-inventory-modal') || modalButtonLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{editingInventory ? 'Actualizando...' : 'Creando...'}</span>
                </div>
              ) : (
                editingInventory ? 'Actualizar Inventario' : 'Crear Inventario'
              )}
            </Button>
          </div>
        </form>
      );
      
      onOpenModal('inventory', editingInventory ? 'Editar Inventario' : 'Nuevo Inventario', modalContent);
    } else {
      setShowModal(true);
    }
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setEditingInventory(null);
    reset();
  };

  // Crear o actualizar inventario
  const onSubmit = useCallback(async (data: InventoryFormData) => {
    const buttonId = 'create-inventory-modal';

    try {
      const inventoryData = { ...data };

      let response;
      if (editingInventory) {
        response = await InventoryService.update(editingInventory.id, inventoryData);
      } else {
        response = await InventoryService.create(inventoryData);
      }
      if (response.data) {
        // Cerrar el modal INMEDIATAMENTE después del éxito
        if (onCloseModal) {
          onCloseModal();
        } else {
          closeModal();
        }
        
        // Recargar datos después de cerrar el modal
        await loadInventories();
      } else {
        console.error('❌ Error en la respuesta:', response.error);
        alert(`Error: ${response.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('💥 Error guardando inventario:', error);
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
  }, [editingInventory, onCloseModal, loadInventories, setButtonLoading]);

  // Eliminar inventario (soft delete)
  const handleDelete = async (id: string) => {
    if (onOpenConfirmationModal) {
      onOpenConfirmationModal(
        'Eliminar Inventario',
        'Esta acción colocará el inventario como inactivo. Podrás reactivarlo después.',
        async () => {
          try {
            const response = await InventoryService.delete(id);
            if (response.data) {
              await loadInventories();
            }
          } catch (error) {
            console.error('Error eliminando inventario:', error);
          }
        }
      );
    }
  };

  // Eliminar permanentemente
  const handleHardDelete = async (id: string) => {
    if (onOpenConfirmationModal) {
      onOpenConfirmationModal(
        'Eliminar Inventario Permanentemente',
        '⚠️ Esta acción NO se puede deshacer. Se eliminará definitivamente el inventario y su historial asociado.',
        async () => {
          try {
            const response = await InventoryService.hardDelete(id);
            if (response.data === null) {
              await loadInventories();
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
      status: statusFilter,
      sort: sortBy
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setStatusFilter(activeFilters.status);
    setSortBy(activeFilters.sort);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({
      status: 'all',
      sort: 'created_at_desc'
    });
    setStatusFilter('all');
    setSortBy('created_at_desc');
    setShowFilterModal(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (sortBy !== 'created_at_desc') count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
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
                  placeholder="Buscar inventarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 w-96 h-12 px-6 text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Botón de filtros */}
              <Button
                onClick={openFilterModal}
                variant="outline"
                className="h-12 px-6 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 focus:border-blue-500 focus:ring-blue-500"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filtros
                {getActiveFiltersCount() > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
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
                      ? 'bg-white text-blue-600 shadow-sm' 
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
                      ? 'bg-white text-blue-600 shadow-sm' 
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 h-12 text-sm font-semibold"
              >
                {modalButtonLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Abriendo...</span>
                  </div>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Nuevo Inventario
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
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Cargando inventarios</h3>
                    <p className="text-gray-600">Obteniendo información actualizada...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : filteredInventories.length === 0 ? (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <Warehouse className="w-10 h-10 text-blue-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {searchTerm || statusFilter !== 'all' ? 'No se encontraron inventarios' : 'No hay inventarios'}
                    </h3>
                    <p className="text-gray-600 max-w-md">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Intenta ajustar los filtros de búsqueda para encontrar lo que necesitas'
                        : 'Crea tu primer inventario para comenzar a organizar el stock de tu negocio'
                      }
                    </p>
                  </div>
                  {(!searchTerm && statusFilter === 'all') && (
                    <Button 
                      onClick={() => openModal()} 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Crear Primer Inventario
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : displayMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredInventories.map((inventory, index) => (
              <Card 
                key={inventory.id} 
                className="group overflow-hidden border-0 shadow-sm hover:shadow-xl bg-white/90 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1"
              >
                <CardContent className="p-0">
                  {/* Header de la tarjeta */}
                  <div className="p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg group-hover:scale-110 transition-transform duration-200">
                          <Warehouse className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg tracking-tight group-hover:text-blue-700 transition-colors">
                            {inventory.name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {new Date(inventory.created_at).toLocaleDateString('es-ES', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`
                        inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ring-2 ring-inset transition-all
                        ${inventory.active 
                          ? 'bg-green-50 text-green-700 ring-green-200 group-hover:bg-green-100' 
                          : 'bg-red-50 text-red-700 ring-red-200 group-hover:bg-red-100'
                        }
                      `}>
                        {inventory.active ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactivo
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Activity className="w-3 h-3" />
                          <span>Gestionar</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(inventory)}
                          className="h-9 w-9 p-0 rounded-xl border-blue-200 text-blue-600 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Editar inventario"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(inventory.id)}
                          className="h-9 w-9 p-0 rounded-xl border-red-200 text-red-600 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Eliminar inventario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Vista de tabla moderna */
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 tracking-wider">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4" />
                        <span>Inventario</span>
                      </div>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 tracking-wider">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4" />
                        <span>Estado</span>
                      </div>
                    </th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 tracking-wider">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Fecha de Creación</span>
                      </div>
                    </th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-700 tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredInventories.map((inventory, index) => (
                    <tr 
                      key={inventory.id} 
                      className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/20 transition-all duration-200 group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 group-hover:scale-110 transition-transform">
                            <Warehouse className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {inventory.name}
                            </div>
                            <div className="text-sm text-gray-500">ID: {inventory.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`
                          inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ring-2 ring-inset
                          ${inventory.active 
                            ? 'bg-green-50 text-green-700 ring-green-200' 
                            : 'bg-red-50 text-red-700 ring-red-200'
                          }
                        `}>
                          {inventory.active ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Activo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Inactivo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>
                            {new Date(inventory.created_at).toLocaleDateString('es-ES', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openModal(inventory)}
                            className="h-9 px-3 rounded-lg border-blue-200 text-blue-600 hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(inventory.id)}
                            className="h-9 px-3 rounded-lg border-red-200 text-red-600 hover:text-white hover:bg-red-600 hover:border-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        </div>

      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
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
      `}</style>

      {/* Modal de filtros */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFilterModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Filter className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Filtros de Inventarios</h2>
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
                {/* Filtro por Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={activeFilters.status}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
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
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
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
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
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