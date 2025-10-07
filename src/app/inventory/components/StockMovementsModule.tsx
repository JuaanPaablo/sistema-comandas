'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, TrendingUp, TrendingDown, Search, Package, Eye, X, List, Grid, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StockMovement, StockMovementFormData, Inventory, InventoryCategory, InventoryItem, Batch } from '@/lib/types';
import { StockMovementService, InventoryService, InventoryCategoryService, InventoryItemService, BatchService } from '@/lib/services/inventoryService';

// Esquema de validación
const stockMovementSchema = z.object({
  inventory_id: z.string().min(1, 'Inventario es requerido'),
  category_id: z.string().min(1, 'Categoría es requerida'),
  inventory_item_id: z.string().min(1, 'Producto es requerido'),
  batch_id: z.string().min(1, 'Lote es requerido'),
  movement_type: z.enum(['ajuste_positivo', 'ajuste_negativo'], {
    required_error: 'Tipo de ajuste es requerido'
  }),
  quantity: z.number().min(0.01, 'Cantidad debe ser mayor a 0'),
  reason: z.string().min(1, 'Motivo es requerido'),
  reference: z.string().optional(),
  notes: z.string().optional()
});

export default function StockMovementsModule() {
  // Estados principales
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);

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
  const [filterInventory, setFilterInventory] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Estado para vista (tabla o tarjetas)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Estados para modal de filtros
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    inventory: '',
    category: '',
    product: '',
    type: ''
  });

  // React Hook Form
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<StockMovementFormData>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      inventory_id: '',
      category_id: '',
      inventory_item_id: '',
      batch_id: '',
      movement_type: 'ajuste_positivo',
      quantity: 0,
      reason: '',
      reference: '',
      notes: ''
    }
  });

  // Watchers para filtrado jerárquico
  const watchedInventoryId = watch('inventory_id');
  const watchedCategoryId = watch('category_id');
  const watchedProductId = watch('inventory_item_id');

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  // Filtrado jerárquico basado en valores watched
  useEffect(() => {
    if (watchedInventoryId) {
      const filtered = categories.filter(cat => cat.inventory_id === watchedInventoryId);
      setFilteredCategories(filtered);
      setValue('category_id', '');
      setValue('inventory_item_id', '');
      setValue('batch_id', '');
    } else {
      setFilteredCategories([]);
    }
  }, [watchedInventoryId, categories, setValue]);

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
      const [movementsRes, inventoriesRes, categoriesRes, productsRes, batchesRes] = await Promise.all([
        StockMovementService.getAll(),
        InventoryService.getAll(),
        InventoryCategoryService.getAll(),
        InventoryItemService.getAll(),
        BatchService.getAll()
      ]);

      setMovements(movementsRes.data || []);
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

  const openModal = (movement?: StockMovement) => {
    if (movement) {
      setEditingMovement(movement);
      reset({
        inventory_id: movement.inventory_id,
        category_id: movement.category_id,
        inventory_item_id: movement.inventory_item_id,
        batch_id: movement.batch_id,
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        reason: movement.reason,
        reference: movement.reference || '',
        notes: movement.notes || ''
      });
    } else {
      setEditingMovement(null);
      reset();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMovement(null);
    reset();
  };

  const onSubmit = async (data: StockMovementFormData) => {
    try {
      if (editingMovement) {
        await StockMovementService.update(editingMovement.id, data);
      } else {
        await StockMovementService.create(data);
      }
      await loadData();
      closeModal();
    } catch (error) {
      console.error('Error guardando movimiento:', error);
    }
  };

  // Filtrado de movimientos
  const filteredMovements = useMemo(() => {
    return movements.filter(movement => {
      const matchesSearch = !searchTerm || 
        movement.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.reference?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesInventory = !filterInventory || movement.inventory_id === filterInventory;
      const matchesCategory = !filterCategory || movement.category_id === filterCategory;
      const matchesProduct = !filterProduct || movement.inventory_item_id === filterProduct;
      const matchesType = !filterType || movement.movement_type === filterType;

      return matchesSearch && matchesInventory && matchesCategory && matchesProduct && matchesType;
    });
  }, [movements, searchTerm, filterInventory, filterCategory, filterProduct, filterType]);

  // Funciones helper
  const getInventoryName = (id: string) => {
    return inventories.find(inv => inv.id === id)?.name || 'N/A';
  };

  const getProductName = (id: string) => {
    return products.find(prod => prod.id === id)?.name || 'N/A';
  };

  const getMovementTypeLabel = (type: string) => {
    return type === 'ajuste_positivo' ? 'Ajuste Positivo' : 'Ajuste Negativo';
  };

  const getMovementTypeColor = (type: string) => {
    return type === 'ajuste_positivo' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  // Funciones para modal de filtros
  const openFilterModal = () => {
    setActiveFilters({
      inventory: filterInventory,
      category: filterCategory,
      product: filterProduct,
      type: filterType
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setFilterInventory(activeFilters.inventory);
    setFilterCategory(activeFilters.category);
    setFilterProduct(activeFilters.product);
    setFilterType(activeFilters.type);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({
      inventory: '',
      category: '',
      product: '',
      type: ''
    });
    setFilterInventory('');
    setFilterCategory('');
    setFilterProduct('');
    setFilterType('');
    setShowFilterModal(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterInventory) count++;
    if (filterCategory) count++;
    if (filterProduct) count++;
    if (filterType) count++;
    return count;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
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
                placeholder="Buscar movimientos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-96 h-12 px-6 text-gray-900 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>

            {/* Botón de filtros */}
            <Button
              onClick={openFilterModal}
              variant="outline"
              className="h-12 px-6 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 focus:border-teal-500 focus:ring-teal-500"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtros
              {getActiveFiltersCount() > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-teal-100 text-teal-600 rounded-full">
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
                    ? 'bg-white text-teal-600 shadow-sm' 
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
                    ? 'bg-white text-teal-600 shadow-sm' 
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
              className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 h-12 text-sm font-semibold"
            >
              {createButtonLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Abriendo...</span>
                </div>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Nuevo Movimiento
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
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-out animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4"
              onClick={(e) => e.stopPropagation()}
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-gray-100/50 rounded-t-2xl">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {editingMovement ? 'Editar Movimiento' : 'Nuevo Movimiento'}
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
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-teal-800">Ajuste de Stock</h3>
                        <p className="text-xs text-teal-700">Registra correcciones, daños o hallazgos de inventario</p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Primera fila - Inventario y Categoría */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Inventario */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Inventario *</label>
                        <select
                          {...register('inventory_id')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                        >
                          <option value="">Seleccionar inventario</option>
                          {inventories.map(inventory => (
                            <option key={inventory.id} value={inventory.id}>
                              {inventory.name}
                            </option>
                          ))}
                        </select>
                        {errors.inventory_id && (
                          <p className="text-red-500 text-sm mt-1">{errors.inventory_id.message}</p>
                        )}
                      </div>

                      {/* Categoría */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Categoría *</label>
                        <select
                          {...register('category_id')}
                          disabled={filteredCategories.length === 0}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white ${
                            filteredCategories.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="">Seleccionar categoría</option>
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
                    </div>

                    {/* Segunda fila - Producto y Lote */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Producto */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Producto *</label>
                        <select
                          {...register('inventory_item_id')}
                          disabled={filteredProducts.length === 0}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white ${
                            filteredProducts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="">Seleccionar producto</option>
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

                      {/* Lote */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Lote *</label>
                        <select
                          {...register('batch_id')}
                          disabled={filteredBatches.length === 0}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white ${
                            filteredBatches.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <option value="">Seleccionar lote</option>
                          {filteredBatches.map(batch => (
                            <option key={batch.id} value={batch.id}>
                              {batch.batch_number}
                            </option>
                          ))}
                        </select>
                        {errors.batch_id && (
                          <p className="text-red-500 text-sm mt-1">{errors.batch_id.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Tercera fila - Tipo de Ajuste y Cantidad */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Tipo de Ajuste */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Tipo de Ajuste *</label>
                        <select
                          {...register('movement_type')}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                        >
                          <option value="ajuste_positivo">Ajuste Positivo (+)</option>
                          <option value="ajuste_negativo">Ajuste Negativo (-)</option>
                        </select>
                        {errors.movement_type && (
                          <p className="text-red-500 text-sm mt-1">{errors.movement_type.message}</p>
                        )}
                      </div>

                      {/* Cantidad */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Cantidad *</label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register('quantity', { valueAsNumber: true })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        {errors.quantity && (
                          <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Motivo */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">Motivo *</label>
                      <Input
                        {...register('reason')}
                        placeholder="Ej: Corrección de inventario, Daño por transporte, Hallazgo de producto"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                      {errors.reason && (
                        <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
                      )}
                    </div>

                    {/* Referencia y Notas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Referencia</label>
                        <Input
                          {...register('reference')}
                          placeholder="Ej: Factura #123, Orden #456"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Notas</label>
                        <Input
                          {...register('notes')}
                          placeholder="Información adicional"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        {editingMovement ? 'Actualizar Movimiento' : 'Crear Movimiento'}
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
        {filteredMovements.length === 0 ? (
          <div className="min-h-[80vh] flex flex-col">
            {/* Estado vacío */}
            <div className="text-center py-20 flex-1">
              <div className="mx-auto w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-8">
                <Package className="w-16 h-16 text-gray-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No hay movimientos de stock</h3>
              <p className="text-gray-600 mb-8 text-lg">
                {searchTerm || filterInventory || filterCategory || filterProduct || filterType
                  ? 'No se encontraron movimientos con los filtros aplicados'
                  : 'Comienza registrando tu primer movimiento de stock'
                }
              </p>
              {!searchTerm && !filterInventory && !filterCategory && !filterProduct && !filterType && (
                <Button
                  onClick={() => openModal()}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 text-lg font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nuevo Movimiento
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
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Tipo</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Inventario</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Producto</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Cantidad</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Motivo</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMovements.map((movement) => (
                        <tr key={movement.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-4">
                                <TrendingUp className="w-5 h-5 text-teal-600" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {new Date(movement.created_at).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {new Date(movement.created_at).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getMovementTypeColor(movement.movement_type)}`}>
                              {getMovementTypeLabel(movement.movement_type)}
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{getInventoryName(movement.inventory_id)}</div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">{getProductName(movement.inventory_item_id)}</div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="text-lg font-bold text-gray-900">{movement.quantity}</div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="text-sm text-gray-800 max-w-xs truncate" title={movement.reason}>
                              {movement.reason}
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openModal(movement)}
                              className="text-teal-600 border-teal-200 hover:bg-teal-50 px-3 py-2"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalles
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Vista de tarjetas */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMovements.map((movement) => (
                  <Card key={movement.id} className="hover:shadow-lg transition-all duration-200 border border-gray-200">
                    <CardContent className="p-6">
                      {/* Header de la tarjeta */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mr-3">
                            <TrendingUp className="w-6 h-6 text-teal-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                              {getProductName(movement.inventory_item_id)}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(movement.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMovementTypeColor(movement.movement_type)}`}>
                          {getMovementTypeLabel(movement.movement_type)}
                        </span>
                      </div>

                      {/* Información del movimiento */}
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Inventario:</span>
                          <span className="text-xs font-medium text-gray-900">{getInventoryName(movement.inventory_id)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Cantidad:</span>
                          <span className="text-xs font-semibold text-gray-900">{movement.quantity}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Hora:</span>
                          <span className="text-xs font-medium text-gray-900">
                            {new Date(movement.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-gray-500">Motivo:</span>
                          <span className="text-xs font-medium text-gray-900 text-right max-w-32 truncate" title={movement.reason}>
                            {movement.reason}
                          </span>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="pt-4 border-t border-gray-100">
                        <Button
                          onClick={() => openModal(movement)}
                          variant="outline"
                          size="sm"
                          className="w-full text-teal-600 border-teal-200 hover:bg-teal-50 text-xs py-2"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver Detalles
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-100 rounded-lg">
                    <Filter className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Filtros de Movimientos</h2>
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
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                  >
                    <option value="">Todos los inventarios</option>
                    {inventories.map(inventory => (
                      <option key={inventory.id} value={inventory.id}>
                        {inventory.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={activeFilters.category}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                  >
                    <option value="">Todas las categorías</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Producto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto
                  </label>
                  <select
                    value={activeFilters.product}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, product: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                  >
                    <option value="">Todos los productos</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Movimiento
                  </label>
                  <select
                    value={activeFilters.type}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="ajuste_positivo">Ajuste Positivo</option>
                    <option value="ajuste_negativo">Ajuste Negativo</option>
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
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6"
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
