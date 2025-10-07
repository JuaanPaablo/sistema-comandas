'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Truck, 
  Plus, 
  Search,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRightLeft,
  Eye,
  X,
  Edit,
  Trash2,
  List,
  Grid,
  Filter
} from 'lucide-react';
import { TransferService, InventoryService, InventoryItemService, InventoryCategoryService, BatchService } from '@/lib/services/inventoryService';
import { Transfer, Inventory, InventoryItem, TransferFormData, Batch, InventoryCategory } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const transferSchema = z.object({
  from_inventory_id: z.string().min(1, 'El inventario origen es requerido'),
  to_inventory_id: z.string().min(1, 'El inventario destino es requerido'),
  category_id: z.string().min(1, 'La categoría es requerida'),
  inventory_item_id: z.string().min(1, 'El producto es requerido'),
  batch_id: z.string().min(1, 'El lote es requerido'),
  quantity: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  status: z.enum(['pending', 'in_transit', 'completed', 'cancelled']),
  notes: z.string().optional(),
  active: z.boolean()
});

const statusOptions = [
  { value: 'pending', label: 'Pendiente', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { value: 'in_transit', label: 'En Tránsito', icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { value: 'completed', label: 'Completada', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'cancelled', label: 'Cancelada', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' }
];

export default function TransfersModule() {
  // Estados principales
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Estados para datos relacionados
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Estados para filtrado jerárquico
  const [filteredCategories, setFilteredCategories] = useState<InventoryCategory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<InventoryItem[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFromInventory, setFilterFromInventory] = useState('');
  const [filterToInventory, setFilterToInventory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Estado para vista (tabla o tarjetas)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Estados para modal de filtros
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    fromInventory: '',
    toInventory: '',
    status: ''
  });

  // React Hook Form
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      from_inventory_id: '',
      to_inventory_id: '',
      category_id: '',
      inventory_item_id: '',
      batch_id: '',
      quantity: 0,
      status: 'pending',
      notes: '',
      active: true
    }
  });

  // Watchers para filtrado jerárquico
  const watchedFromInventoryId = watch('from_inventory_id');
  const watchedToInventoryId = watch('to_inventory_id');
  const watchedCategoryId = watch('category_id');
  const watchedProductId = watch('inventory_item_id');

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  // Filtrado jerárquico basado en valores watched
  useEffect(() => {
    if (watchedFromInventoryId) {
      const filtered = categories.filter(cat => cat.inventory_id === watchedFromInventoryId);
      setFilteredCategories(filtered);
      setValue('category_id', '');
      setValue('inventory_item_id', '');
      setValue('batch_id', '');
    } else {
      setFilteredCategories([]);
    }
  }, [watchedFromInventoryId, categories, setValue]);

  // Resetear inventario destino si es el mismo que el origen
  useEffect(() => {
    if (watchedToInventoryId === watchedFromInventoryId && watchedFromInventoryId) {
      setValue('to_inventory_id', '');
    }
  }, [watchedFromInventoryId, watchedToInventoryId, setValue]);

  useEffect(() => {
    if (watchedCategoryId) {
      const filtered = products.filter(prod => prod.category_id === watchedCategoryId);
      setFilteredProducts(filtered);
      setValue('inventory_item_id', '');
      setValue('batch_id', '');
    } else {
      setFilteredProducts([]);
    }
  }, [watchedCategoryId, products, setValue]);

  useEffect(() => {
    if (watchedProductId) {
      const filtered = batches.filter(batch => batch.inventory_item_id === watchedProductId);
      setFilteredBatches(filtered);
      setValue('batch_id', '');
    } else {
      setFilteredBatches([]);
    }
  }, [watchedProductId, batches, setValue]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transfersRes, inventoriesRes, categoriesRes, productsRes, batchesRes] = await Promise.all([
        TransferService.getAll(),
        InventoryService.getAll(),
        InventoryCategoryService.getAll(),
        InventoryItemService.getAll(),
        BatchService.getAll()
      ]);

      setTransfers(transfersRes.data || []);
      setInventories(inventoriesRes.data || []);
      setCategories(categoriesRes.data || []);
      setProducts(productsRes.data || []);
      setBatches(batchesRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (transfer?: Transfer) => {
    if (transfer) {
      setEditingTransfer(transfer);
      reset({
        from_inventory_id: transfer.from_inventory_id,
        to_inventory_id: transfer.to_inventory_id,
        category_id: transfer.category_id || '',
        inventory_item_id: transfer.inventory_item_id,
        batch_id: transfer.batch_id || '',
        quantity: transfer.quantity,
        status: transfer.status,
        notes: transfer.notes || '',
        active: transfer.active
      });
    } else {
      setEditingTransfer(null);
      reset();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTransfer(null);
    reset();
  };

  const onSubmit = async (data: TransferFormData) => {
    // Protección contra doble click
    if (submitLoading) return;
    
    try {
      setSubmitLoading(true);
      
      if (editingTransfer) {
        await TransferService.update(editingTransfer.id, data);
      } else {
        await TransferService.create(data);
      }
      
      await loadData();
      closeModal();
    } catch (error) {
      console.error('Error guardando transferencia:', error);
      alert('Error al guardar la transferencia. Por favor, inténtalo de nuevo.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const confirmTransfer = async (transferId: string) => {
    try {
      // Obtener la transferencia completa
      const transfer = transfers.find(t => t.id === transferId);
      if (!transfer) {
        alert('Transferencia no encontrada');
        return;
      }

      // Obtener datos del producto origen
      const sourceProduct = products.find(p => p.id === transfer.inventory_item_id);
      const sourceBatch = batches.find(b => b.id === transfer.batch_id);
      
      if (!sourceProduct || !sourceBatch) {
        alert('No se encontraron los datos del producto o lote origen');
        return;
      }

      // Validar que hay suficiente cantidad en el lote origen
      if (sourceBatch.quantity < transfer.quantity) {
        alert(`No hay suficiente cantidad en el lote origen. Disponible: ${sourceBatch.quantity}, Solicitado: ${transfer.quantity}`);
        return;
      }

      // Obtener la categoría origen
      const sourceCategory = categories.find(c => c.id === sourceProduct.category_id);
      
      // Verificar si ya existe una categoría con el mismo nombre en el inventario destino
      let destinationCategory = categories.find(c => 
        c.name === sourceCategory?.name && 
        c.inventory_id === transfer.to_inventory_id
      );

      // Si no existe la categoría, crearla
      if (!destinationCategory) {
        const categoryData = {
          name: sourceCategory?.name || 'Sin categoría',
          inventory_id: transfer.to_inventory_id,
          active: true
        };
        const newCategoryRes = await InventoryCategoryService.create(categoryData);
        destinationCategory = newCategoryRes.data;
      }

      // Verificar si ya existe el producto en el inventario destino
      let destinationProduct = products.find(p => 
        p.name === sourceProduct.name && 
        p.inventory_id === transfer.to_inventory_id
      );

      // Si no existe el producto, crearlo
      if (!destinationProduct) {
        const productData = {
          name: sourceProduct.name,
          inventory_id: transfer.to_inventory_id,
          category_id: destinationCategory.id,
          unit: sourceProduct.unit,
          stock: 0, // Se actualizará con el lote
          min_stock: sourceProduct.min_stock,
          unit_price: sourceProduct.unit_price,
          active: true
        };
        const newProductRes = await InventoryItemService.create(productData);
        destinationProduct = newProductRes.data;
      }

      // Crear nuevo lote en el inventario destino
      const batchData = {
        inventory_item_id: destinationProduct.id,
        batch_number: `${sourceBatch.batch_number}-TRANSFER`,
        quantity: transfer.quantity,
        cost_per_unit: sourceBatch.cost_per_unit,
        expiry_date: sourceBatch.expiry_date,
        active: true
      };
      await BatchService.create(batchData);

      // Actualizar el stock del producto destino
      await InventoryItemService.update(destinationProduct.id, {
        stock: destinationProduct.stock + transfer.quantity
      });

      // Reducir el stock del producto origen
      await InventoryItemService.update(sourceProduct.id, {
        stock: sourceProduct.stock - transfer.quantity
      });

      // Reducir la cantidad del lote origen específico
      await BatchService.update(sourceBatch.id, {
        quantity: sourceBatch.quantity - transfer.quantity
      });

      // Actualizar la transferencia como completada
      await TransferService.update(transferId, { 
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      await loadData();
      alert(`Transferencia completada exitosamente!\n\n✅ Se transfirieron ${transfer.quantity} unidades del lote "${sourceBatch.batch_number}"\n✅ Se creó el producto "${sourceProduct.name}" en ${transfer.to_inventory_id === transfer.from_inventory_id ? 'el mismo inventario' : 'el inventario destino'}\n✅ Se creó un nuevo lote con ${transfer.quantity} unidades\n✅ Se redujo el lote origen de ${sourceBatch.quantity} a ${sourceBatch.quantity - transfer.quantity} unidades`);
    } catch (error) {
      console.error('Error confirmando transferencia:', error);
      alert('Error al confirmar la transferencia. Por favor, inténtalo de nuevo.');
    }
  };

  const deleteTransfer = async (transferId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta transferencia?')) {
      try {
        await TransferService.delete(transferId);
        await loadData();
        alert('Transferencia eliminada exitosamente');
      } catch (error) {
        console.error('Error eliminando transferencia:', error);
        alert('Error al eliminar la transferencia. Por favor, inténtalo de nuevo.');
      }
    }
  };

  // Filtrado de transferencias
  const filteredTransfers = useMemo(() => {
    return transfers.filter(transfer => {
      const matchesSearch = !searchTerm || 
        transfer.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFromInventory = !filterFromInventory || transfer.from_inventory_id === filterFromInventory;
      const matchesToInventory = !filterToInventory || transfer.to_inventory_id === filterToInventory;
      const matchesStatus = !filterStatus || transfer.status === filterStatus;

      return matchesSearch && matchesFromInventory && matchesToInventory && matchesStatus;
    });
  }, [transfers, searchTerm, filterFromInventory, filterToInventory, filterStatus]);

  // Funciones helper
  const getInventoryName = (id: string) => {
    return inventories.find(inv => inv.id === id)?.name || 'N/A';
  };

  const getProductName = (id: string) => {
    return products.find(prod => prod.id === id)?.name || 'N/A';
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  // Funciones para modal de filtros
  const openFilterModal = () => {
    setActiveFilters({
      fromInventory: filterFromInventory,
      toInventory: filterToInventory,
      status: filterStatus
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setFilterFromInventory(activeFilters.fromInventory);
    setFilterToInventory(activeFilters.toInventory);
    setFilterStatus(activeFilters.status);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({
      fromInventory: '',
      toInventory: '',
      status: ''
    });
    setFilterFromInventory('');
    setFilterToInventory('');
    setFilterStatus('');
    setShowFilterModal(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterFromInventory) count++;
    if (filterToInventory) count++;
    if (filterStatus) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] animate-in fade-in-0 slide-in-from-bottom-4 duration-600">
      {/* Toolbar mejorada con más espacio */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-12 py-8 mb-12">
        <div className="flex items-center justify-between gap-12">
          {/* Controles principales */}
          <div className="flex items-center gap-8">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                placeholder="Buscar transferencias..."
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
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 mr-2" />
                Lista
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'cards' 
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
                setCreateButtonLoading(true);
                setTimeout(() => {
                  openModal();
                  setCreateButtonLoading(false);
                }, 100);
              }}
              disabled={createButtonLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 h-12 text-sm font-semibold"
            >
              {createButtonLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Abriendo...</span>
                </div>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Nueva Transferencia
                </>
              )}
            </Button>
          </div>
                          </div>
            </div>
            
      {/* Modal Local */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          {/* Backdrop con blur */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={closeModal}
          />
          
          {/* Modal Container - Fijo y centrado */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8">
            {/* Modal */}
            <div 
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-out animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4"
              onClick={(e) => e.stopPropagation()}
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-gray-100/50 rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {editingTransfer ? 'Editar Transferencia' : 'Nueva Transferencia'}
                </h2>
                          <Button
                  variant="ghost"
                            size="sm"
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2"
                          >
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                          </Button>
                        </div>
              
              {/* Content - Altura flexible con scroll interno */}
              <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                <div className="space-y-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Primera fila - Inventarios origen y destino */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Inventario Origen */}
            <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Inventario Origen *</label>
                        <select
                {...register('from_inventory_id')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                          <option value="" className="text-gray-600">Seleccionar inventario origen</option>
                          {inventories.map(inventory => (
                  <option key={inventory.id} value={inventory.id}>
                    {inventory.name}
                  </option>
                ))}
                        </select>
              {errors.from_inventory_id && (
                <p className="text-red-500 text-sm mt-1">{errors.from_inventory_id.message}</p>
              )}
            </div>

                      {/* Inventario Destino */}
            <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Inventario Destino *</label>
                        <select
                {...register('to_inventory_id')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                          <option value="" className="text-gray-600">Seleccionar inventario destino</option>
                {inventories
                            .filter(inventory => inventory.id !== watchedFromInventoryId)
                            .map(inventory => (
                    <option key={inventory.id} value={inventory.id}>
                      {inventory.name}
                    </option>
                  ))}
                        </select>
              {errors.to_inventory_id && (
                <p className="text-red-500 text-sm mt-1">{errors.to_inventory_id.message}</p>
              )}
            </div>
          </div>

                    {/* Segunda fila - Categoría y Producto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Categoría */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Categoría *</label>
                        <select
                          {...register('category_id')}
                          disabled={filteredCategories.length === 0}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${
                            filteredCategories.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="" className="text-gray-600">Seleccionar categoría</option>
                          {filteredCategories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        {errors.category_id && (
                          <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>
                        )}
                      </div>

                      {/* Producto */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Producto *</label>
                        <select
                          {...register('inventory_item_id')}
                          disabled={filteredProducts.length === 0}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${
                            filteredProducts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="" className="text-gray-600">Seleccionar producto</option>
                          {filteredProducts.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                        {errors.inventory_item_id && (
                          <p className="text-red-500 text-sm mt-1">{errors.inventory_item_id.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Tercera fila - Lote y Cantidad */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Lote */}
            <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Lote *</label>
                        <select
                {...register('batch_id')}
                          disabled={filteredBatches.length === 0}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 ${
                            filteredBatches.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
              >
                          <option value="" className="text-gray-600">Seleccionar lote</option>
                          {filteredBatches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                              {batch.batch_number} - {batch.quantity} unidades disponibles
                  </option>
                ))}
                        </select>
                        {errors.batch_id && (
                          <p className="text-red-500 text-sm mt-1">{errors.batch_id.message}</p>
                        )}
            </div>

                      {/* Cantidad */}
            <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Cantidad *</label>
              <Input
                type="number"
                step="0.01"
                          {...register('quantity', { valueAsNumber: true })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
              )}
            </div>
          </div>

                    {/* Cuarta fila - Estado y Notas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Estado */}
          <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Estado *</label>
                        <select
              {...register('status')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        >
                          {statusOptions.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                </option>
              ))}
                        </select>
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
            )}
          </div>

                      {/* Notas */}
            <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Notas</label>
              <Input
                {...register('notes')}
                          placeholder="Información adicional sobre la transferencia"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

                    {/* Botones */}
                    <div className="flex space-x-4 pt-6 border-t border-gray-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeModal}
                        className="flex-1"
                      >
              Cancelar
            </Button>
                      <Button
                        type="submit"
                        disabled={submitLoading}
                        className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white ${
                          submitLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {submitLoading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Guardando...</span>
                          </div>
                        ) : (
                          editingTransfer ? 'Actualizar Transferencia' : 'Crear Transferencia'
                        )}
            </Button>
          </div>
        </form>
          </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Contenido principal con más espacio */}
      <div className="px-12">
        {filteredTransfers.length === 0 ? (
          <div className="min-h-[80vh] flex flex-col">
            {/* Estado vacío */}
            <div className="text-center py-20 flex-1">
              <div className="mx-auto w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-8">
                <Truck className="w-16 h-16 text-gray-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No hay transferencias</h3>
              <p className="text-gray-600 mb-8 text-lg">
                {searchTerm || filterFromInventory || filterToInventory || filterStatus
                  ? 'No se encontraron transferencias con los filtros aplicados'
                  : 'Comienza registrando tu primera transferencia de stock'
                }
              </p>
              {!searchTerm && !filterFromInventory && !filterToInventory && !filterStatus && (
                      <Button
                  onClick={() => openModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nueva Transferencia
                      </Button>
                    )}
                  </div>
            {/* Espacio adicional para simular contenido largo */}
            <div className="flex-1 bg-gradient-to-b from-transparent to-gray-50/30 rounded-lg"></div>
                    </div>
        ) : (
          <div className="min-h-[80vh]">
            {viewMode === 'table' ? (
              /* Vista de tabla */
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Fecha</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Estado</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Origen</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Destino</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Producto</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Cantidad</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransfers.map((transfer) => {
                        const statusInfo = getStatusInfo(transfer.status);
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                          <tr key={transfer.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                                  <Truck className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">
                                    {new Date(transfer.created_at).toLocaleDateString()}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {new Date(transfer.created_at).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                                <StatusIcon className="w-4 h-4 mr-2" />
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{getInventoryName(transfer.from_inventory_id)}</div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{getInventoryName(transfer.to_inventory_id)}</div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{getProductName(transfer.inventory_item_id)}</div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap">
                              <div className="text-lg font-bold text-gray-900">{transfer.quantity}</div>
                            </td>
                            <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                {/* Botón Editar (solo para transferencias no completadas) */}
                                {transfer.status !== 'completed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openModal(transfer)}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 px-3 py-2"
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Editar
                                  </Button>
                                )}
                                
                                {/* Botón Confirmar (solo para transferencias pendientes) */}
                                {transfer.status === 'pending' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => confirmTransfer(transfer.id)}
                                    className="text-green-600 border-green-200 hover:bg-green-50 px-3 py-2"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Confirmar
                                  </Button>
                                )}
                                
                                {/* Botón Eliminar (solo para transferencias no completadas) */}
                                {transfer.status !== 'completed' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteTransfer(transfer.id)}
                                    className="text-red-600 border-red-200 hover:bg-red-50 px-3 py-2"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Eliminar
                                  </Button>
                                )}
                                
                                {/* Mensaje para transferencias completadas */}
                                {transfer.status === 'completed' && (
                                  <span className="text-sm text-gray-500 italic">
                                    Transferencia completada
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Vista de tarjetas */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTransfers.map((transfer) => {
                  const statusInfo = getStatusInfo(transfer.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <Card key={transfer.id} className="hover:shadow-lg transition-all duration-200 border border-gray-200">
                      <CardContent className="p-6">
                        {/* Header de la tarjeta */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                              <Truck className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                                {getProductName(transfer.inventory_item_id)}
                              </h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(transfer.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </span>
                        </div>

                        {/* Información de la transferencia */}
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Origen:</span>
                            <span className="text-xs font-medium text-gray-900">{getInventoryName(transfer.from_inventory_id)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Destino:</span>
                            <span className="text-xs font-medium text-gray-900">{getInventoryName(transfer.to_inventory_id)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Cantidad:</span>
                            <span className="text-xs font-semibold text-gray-900">{transfer.quantity}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Hora:</span>
                            <span className="text-xs font-medium text-gray-900">
                              {new Date(transfer.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="space-y-2 pt-4 border-t border-gray-100">
                          {/* Botón Editar (solo para transferencias no completadas) */}
                          {transfer.status !== 'completed' && (
                            <Button
                              onClick={() => openModal(transfer)}
                              variant="outline"
                              size="sm"
                              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 text-xs py-2"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                          )}
                          
                          {/* Botón Confirmar (solo para transferencias pendientes) */}
                          {transfer.status === 'pending' && (
                            <Button
                              onClick={() => confirmTransfer(transfer.id)}
                              variant="outline"
                              size="sm"
                              className="w-full text-green-600 border-green-200 hover:bg-green-50 text-xs py-2"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Confirmar
                            </Button>
                          )}
                          
                          {/* Botón Eliminar (solo para transferencias no completadas) */}
                          {transfer.status !== 'completed' && (
                            <Button
                              onClick={() => deleteTransfer(transfer.id)}
                              variant="outline"
                              size="sm"
                              className="w-full text-red-600 border-red-200 hover:bg-red-50 text-xs py-2"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Eliminar
                            </Button>
                          )}
                          
                          {/* Mensaje para transferencias completadas */}
                          {transfer.status === 'completed' && (
                            <div className="text-center">
                              <span className="text-xs text-gray-500 italic">
                                Transferencia completada
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
                  </div>

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
                    <h2 className="text-xl font-bold text-gray-900">Filtros de Transferencias</h2>
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
                {/* Filtro por Inventario Origen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inventario Origen
                  </label>
                  <select
                    value={activeFilters.fromInventory}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, fromInventory: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Todos los inventarios origen</option>
                    {(Array.isArray(inventories) ? inventories : []).map((inventory) => (
                      <option key={inventory.id} value={inventory.id}>
                        {inventory.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Inventario Destino */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inventario Destino
                  </label>
                  <select
                    value={activeFilters.toInventory}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, toInventory: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Todos los inventarios destino</option>
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
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Todos los estados</option>
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
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