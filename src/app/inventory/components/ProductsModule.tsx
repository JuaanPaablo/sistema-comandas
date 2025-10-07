'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Pagination } from '@/components/ui/Pagination';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Grid,
  List,
  Filter,
  Warehouse,
  Tags,
  CheckCircle,
  XCircle,
  X,
  Clock,
  Activity,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Calendar,
  Ruler
} from 'lucide-react';
import { InventoryItemService, InventoryService, InventoryCategoryService } from '@/lib/services/inventoryService';
import { InventoryItem, Inventory, InventoryCategory, InventoryItemFormData } from '@/lib/types';
import { usePagination } from '@/hooks/usePagination';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Tipo extendido para productos con stock calculado
type InventoryItemWithStock = InventoryItem & { current_stock: number };

const inventoryItemSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  inventory_id: z.string().min(1, 'El inventario es requerido'),
  category_id: z.string().min(1, 'La categoría es requerida'),
  unit: z.string().min(1, 'La unidad es requerida'),
  stock: z.number().min(0, 'El stock no puede ser negativo'),
  min_stock: z.number().min(0, 'El stock mínimo no puede ser negativo'),
  unit_price: z.number().min(0, 'El precio no puede ser negativo'),
  expiry_date: z.string().optional(),
  active: z.boolean()
});

const unitOptions = [
  { value: 'g', label: 'Gramos (g)' },
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'units', label: 'Unidades' },
  { value: 'boxes', label: 'Cajas' },
  { value: 'packs', label: 'Paquetes' }
];

interface ProductsModuleProps {}

export default function ProductsModule({}: ProductsModuleProps) {
  // Estados principales
  const [products, setProducts] = useState<InventoryItemWithStock[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados del modal
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryItemWithStock | null>(null);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Estados de filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInventory, setSelectedInventory] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Estado para vista (tabla o tarjetas)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Estados para modal de filtros
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    inventory: '',
    category: '',
    status: 'all' as 'all' | 'active' | 'inactive'
  });

  // Formulario
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: '',
      inventory_id: '',
      category_id: '',
      unit: '',
      stock: 0,
      min_stock: 0,
      unit_price: 0,
      expiry_date: '',
      active: true
    }
  });

  // Valores observados del formulario
  const watchedInventoryId = watch('inventory_id');
  const watchedCategoryId = watch('category_id');
  const watchedUnit = watch('unit');

  // Categorías filtradas por inventario seleccionado
  const formFilteredCategories = (Array.isArray(categories) ? categories : []).filter(category => 
    watchedInventoryId ? category.inventory_id === watchedInventoryId : false
  );

  // Filtrar productos
  const filteredProducts = (Array.isArray(products) ? products : []).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInventory = !selectedInventory || product.inventory_id === selectedInventory;
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' ? product.active : !product.active);
    
    return matchesSearch && matchesInventory && matchesCategory && matchesStatus;
  });

  // Paginación
  const { currentPage, totalPages, paginatedData, goToPage } = usePagination({ 
    data: filteredProducts, 
    itemsPerPage: 10 
  });

  // Cargar datos
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Cargando datos...');
      
      const [productsResponse, inventoriesResponse, categoriesResponse] = await Promise.all([
        InventoryItemService.getAll(),
        InventoryService.getAll(),
        InventoryCategoryService.getAll()
      ]);

      // Extraer los datos de la respuesta (los servicios devuelven {data: [], error: null})
      const productsData = productsResponse?.data || [];
      const inventoriesData = inventoriesResponse?.data || [];
      const categoriesData = categoriesResponse?.data || [];
      
      console.log('📦 Productos cargados:', productsData?.length || 0);
      console.log('🏢 Inventarios cargados:', inventoriesData?.length || 0);
      console.log('📂 Categorías cargadas:', categoriesData?.length || 0);
      console.log('🏢 Inventarios:', inventoriesData);
      
      setProducts(productsData);
      setInventories(inventoriesData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('❌ Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto para cargar datos
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Efecto para resetear categoría cuando cambia el inventario
  useEffect(() => {
    if (watchedInventoryId && Array.isArray(categories)) {
      const currentCategory = categories.find(cat => cat.id === watchedCategoryId);
      if (currentCategory && currentCategory.inventory_id !== watchedInventoryId) {
      setValue('category_id', '');
    }
    }
  }, [watchedInventoryId, watchedCategoryId, categories, setValue]);


  // Abrir modal para crear/editar
  const openModal = (product?: InventoryItemWithStock) => {
    setEditingProduct(product || null);
    reset();
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    reset();
  };

  // Crear o actualizar producto
  const onSubmit = useCallback(async (data: InventoryItemFormData) => {
    if (submitLoading) return;
    
    try {
      setSubmitLoading(true);
      
              if (editingProduct) {
        await InventoryItemService.update(editingProduct.id, data);
      } else {
        await InventoryItemService.createWithInitialBatch(data);
      }
      
            await loadData();
            closeModal();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Error al guardar el producto');
    } finally {
      setSubmitLoading(false);
    }
  }, [editingProduct, loadData, submitLoading]);

  // Eliminar producto
  const deleteProduct = async (product: InventoryItemWithStock) => {
    if (confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?`)) {
      try {
        await InventoryItemService.delete(product.id);
          await loadData();
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Error al eliminar el producto');
      }
    }
  };

  // Funciones para modal de filtros
  const openFilterModal = () => {
    setActiveFilters({
      inventory: selectedInventory,
      category: selectedCategory,
      status: statusFilter
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setSelectedInventory(activeFilters.inventory);
    setSelectedCategory(activeFilters.category);
    setStatusFilter(activeFilters.status);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({
      inventory: '',
      category: '',
      status: 'all'
    });
    setSelectedInventory('');
    setSelectedCategory('');
    setStatusFilter('all');
    setShowFilterModal(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedInventory) count++;
    if (selectedCategory) count++;
    if (statusFilter !== 'all') count++;
    return count;
  };

  if (loading) {
  return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadData} className="bg-purple-600 hover:bg-purple-700 text-white">
          Reintentar
        </Button>
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
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-96 h-12 px-6 text-gray-900 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          
            {/* Botón de filtros */}
            <Button
              onClick={openFilterModal}
              variant="outline"
              className="h-12 px-6 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 focus:border-purple-500 focus:ring-purple-500"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtros
              {getActiveFiltersCount() > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">
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
                    ? 'bg-white text-purple-600 shadow-sm' 
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
                    ? 'bg-white text-purple-600 shadow-sm' 
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
                if (createButtonLoading) return;
                setCreateButtonLoading(true);
                openModal();
                setTimeout(() => setCreateButtonLoading(false), 100);
              }}
              disabled={createButtonLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 h-12 text-sm font-semibold"
            >
              {createButtonLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Abriendo...</span>
                </div>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
          Nuevo Producto
                </>
              )}
        </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal con más espacio */}
      <div className="px-12">
        {filteredProducts.length === 0 ? (
          <div className="min-h-[80vh] flex flex-col">
            {/* Estado vacío */}
            <div className="text-center py-20 flex-1">
              <div className="mx-auto w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-8">
                <Package className="w-16 h-16 text-gray-500" />
          </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No hay productos</h3>
              <p className="text-gray-600 mb-8 text-lg">
                {searchTerm || selectedInventory || selectedCategory
                  ? 'No se encontraron productos con los filtros aplicados'
                  : 'Comienza creando tu primer producto de inventario'
                }
              </p>
              {!searchTerm && !selectedInventory && !selectedCategory && (
                <Button
                  onClick={() => {
                    if (createButtonLoading) return;
                    setCreateButtonLoading(true);
                    openModal();
                    setTimeout(() => setCreateButtonLoading(false), 100);
                  }}
                  disabled={createButtonLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg font-semibold"
                >
                  <Plus className="w-5 h-5 mr-2" />
              Crear Primer Producto
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
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Producto</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Inventario</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Categoría</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Stock</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Precio</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Estado</th>
                        <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedData.map((product) => {
                        const inventory = (Array.isArray(inventories) ? inventories : []).find(inv => inv.id === product.inventory_id);
                        const category = (Array.isArray(categories) ? categories : []).find(cat => cat.id === product.category_id);
                        
                        return (
                          <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-8 py-6">
                      <div className="flex items-center">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                                  <Package className="w-5 h-5 text-purple-600" />
                          </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.unit}</div>
                        </div>
                      </div>
                    </td>
                            <td className="px-8 py-6 text-sm text-gray-900">
                              {inventory?.name || 'N/A'}
                    </td>
                            <td className="px-8 py-6 text-sm text-gray-900">
                              {category?.name || 'N/A'}
                    </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center">
                                <span className={`text-sm font-semibold ${
                                  product.stock <= product.min_stock ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {product.stock}
                                </span>
                                {product.stock <= product.min_stock && (
                                  <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                                )}
                      </div>
                    </td>
                            <td className="px-8 py-6 text-sm font-semibold text-gray-900">
                              ${product.unit_price.toFixed(2)}
                    </td>
                            <td className="px-8 py-6">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                product.active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center space-x-3">
                        <Button
                                  onClick={() => openModal(product)}
                          variant="outline"
                          size="sm"
                                  className="text-purple-600 border-purple-200 hover:bg-purple-50 px-3 py-2"
                        >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Editar
                        </Button>
                        <Button
                                  onClick={() => deleteProduct(product)}
                          variant="outline"
                          size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50 px-3 py-2"
                        >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Eliminar
                        </Button>
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
                {paginatedData.map((product) => {
                  const inventory = (Array.isArray(inventories) ? inventories : []).find(inv => inv.id === product.inventory_id);
                  const category = (Array.isArray(categories) ? categories : []).find(cat => cat.id === product.category_id);
                  
                  return (
                    <Card key={product.id} className="hover:shadow-lg transition-all duration-200 border border-gray-200">
                      <CardContent className="p-6">
                        {/* Header de la tarjeta */}
                        <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                              <Package className="w-6 h-6 text-purple-600" />
                          </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</h3>
                              <p className="text-xs text-gray-500 mt-1">{product.unit}</p>
                        </div>
                        </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            product.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.active ? 'Activo' : 'Inactivo'}
                          </span>
                      </div>

                        {/* Información del producto */}
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Inventario:</span>
                            <span className="text-xs font-medium text-gray-900">{inventory?.name || 'N/A'}</span>
                      </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Categoría:</span>
                            <span className="text-xs font-medium text-gray-900">{category?.name || 'N/A'}</span>
                        </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Stock:</span>
                            <div className="flex items-center">
                              <span className={`text-xs font-semibold ${
                                product.stock <= product.min_stock ? 'text-red-600' : 'text-gray-900'
                              }`}>
                                {product.stock}
                      </span>
                              {product.stock <= product.min_stock && (
                                <AlertTriangle className="w-3 h-3 text-red-500 ml-1" />
                              )}
                        </div>
                      </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Precio:</span>
                            <span className="text-xs font-semibold text-gray-900">${product.unit_price.toFixed(2)}</span>
                      </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex space-x-2 pt-4 border-t border-gray-100">
                        <Button
                            onClick={() => openModal(product)}
                          variant="outline"
                          size="sm"
                            className="flex-1 text-purple-600 border-purple-200 hover:bg-purple-50 text-xs py-2"
                        >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                        </Button>
                        <Button
                            onClick={() => deleteProduct(product)}
                          variant="outline"
                          size="sm"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 text-xs py-2"
                        >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Eliminar
                        </Button>
                      </div>
                      </CardContent>
                    </Card>
                  );
                })}
        </div>
      )}

      {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
                  onNextPage={goToNextPage}
                  onPreviousPage={goToPreviousPage}
                />
              </div>
            )}
          </div>
            )}
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
                    {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
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
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-6">
                      {/* Primera fila: Inventario y Categoría */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="product-inventory" className="block text-sm font-semibold text-gray-700">
                Inventario
              </label>
                          <div className="relative">
                            <Warehouse className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Select
                              id="product-inventory"
                {...register('inventory_id')}
                              className={`pl-11 h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 ${
                                errors.inventory_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
                              }`}
              >
                              <option value="">Seleccionar inventario...</option>
                              {(Array.isArray(inventories) ? inventories : []).map((inventory) => (
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

                        <div className="space-y-2">
                          <label htmlFor="product-category" className="block text-sm font-semibold text-gray-700">
                Categoría
              </label>
                          <div className="relative">
                            <Tags className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Select
                              id="product-category"
                {...register('category_id')}
                              disabled={!watchedInventoryId || formFilteredCategories.length === 0}
                              className={`pl-11 h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 ${
                                errors.category_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
                              } ${!watchedInventoryId || formFilteredCategories.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                              <option value="">
                                {!watchedInventoryId ? 'Primero selecciona un inventario' : 
                                 formFilteredCategories.length === 0 ? 'No hay categorías disponibles' : 
                                 'Seleccionar categoría...'}
                              </option>
                {formFilteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
                          </div>
              {errors.category_id && (
                            <p className="text-red-600 text-sm mt-1 flex items-center">
                              <XCircle className="w-4 h-4 mr-1" />
                              {errors.category_id.message}
                            </p>
              )}
            </div>
          </div>

                      {/* Segunda fila: Nombre del producto */}
                      <div className="space-y-2">
                        <label htmlFor="product-name" className="block text-sm font-semibold text-gray-700">
                          Nombre del Producto
                        </label>
                        <div className="relative">
                          <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="product-name"
                            {...register('name')}
                            placeholder="Ej: Tomates, Pollo, Coca-Cola"
                            className={`pl-11 h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 ${
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

                      {/* Tercera fila: Unidad y Precio */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="product-unit" className="block text-sm font-semibold text-gray-700">
                Unidad
              </label>
                          <div className="relative">
                            <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Select
                              id="product-unit"
                {...register('unit')}
                disabled={!watchedCategoryId}
                              className={`pl-11 h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 ${
                                errors.unit ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
                              } ${!watchedCategoryId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                              <option value="">{watchedCategoryId ? 'Seleccionar unidad...' : 'Primero selecciona una categoría'}</option>
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
                          </div>
              {errors.unit && (
                            <p className="text-red-600 text-sm mt-1 flex items-center">
                              <XCircle className="w-4 h-4 mr-1" />
                              {errors.unit.message}
                            </p>
              )}
            </div>

                        <div className="space-y-2">
                          <label htmlFor="product-price" className="block text-sm font-semibold text-gray-700">
                            Precio Unitario
              </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                              id="product-price"
                type="number"
                step="0.01"
                              {...register('unit_price', { valueAsNumber: true })}
                              placeholder="0.00"
                              className={`pl-11 h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 ${
                                errors.unit_price ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
                              }`}
                            />
                          </div>
                          {errors.unit_price && (
                            <p className="text-red-600 text-sm mt-1 flex items-center">
                              <XCircle className="w-4 h-4 mr-1" />
                              {errors.unit_price.message}
                            </p>
              )}
            </div>
          </div>

                      {/* Cuarta fila: Stock Inicial y Stock Mínimo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="product-stock" className="block text-sm font-semibold text-gray-700">
                            Stock Inicial
              </label>
                          <div className="relative">
                            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                              id="product-stock"
                type="number"
                {...register('stock', { valueAsNumber: true })}
                min="0.01"
                step="0.01"
                disabled={!watchedUnit}
                              className={`pl-11 h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 ${
                                errors.stock ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
                              } ${!watchedUnit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder={watchedUnit ? '0.00' : 'Selecciona una unidad primero'}
              />
                          </div>
              {errors.stock && (
                            <p className="text-red-600 text-sm mt-1 flex items-center">
                              <XCircle className="w-4 h-4 mr-1" />
                              {errors.stock.message}
                            </p>
              )}
            </div>

                        <div className="space-y-2">
                          <label htmlFor="product-min-stock" className="block text-sm font-semibold text-gray-700">
                Stock Mínimo
              </label>
                          <div className="relative">
                            <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                              id="product-min-stock"
                type="number"
                {...register('min_stock', { valueAsNumber: true })}
                min="0.01"
                step="0.01"
                disabled={!watchedUnit}
                              className={`pl-11 h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 ${
                                errors.min_stock ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''
                              } ${!watchedUnit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder={watchedUnit ? '0.00' : 'Selecciona una unidad primero'}
              />
                          </div>
              {errors.min_stock && (
                            <p className="text-red-600 text-sm mt-1 flex items-center">
                              <XCircle className="w-4 h-4 mr-1" />
                              {errors.min_stock.message}
                            </p>
              )}
            </div>

          </div>

                      {/* Quinta fila: Fecha de Vencimiento */}
                      <div className="space-y-2">
                        <label htmlFor="product-expiry" className="block text-sm font-semibold text-gray-700">
                          Fecha de Vencimiento (Opcional)
              </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                            id="product-expiry"
                type="date"
                {...register('expiry_date')}
                            className="pl-11 h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
                        </div>
            </div>
          </div>



                    {/* Botones del modal */}
                    <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeModal}
                        disabled={submitLoading}
                        className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-xl font-medium transition-all duration-200"
                      >
              Cancelar
            </Button>
            <Button 
              type="submit" 
                        disabled={submitLoading}
                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitLoading ? (
                          <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>{editingProduct ? 'Actualizando...' : 'Creando...'}</span>
                          </div>
                        ) : (
                          editingProduct ? 'Actualizar Producto' : 'Crear Producto'
                        )}
            </Button>
            </div>
                </form>
          </div>
            </div>
          </div>
        </div>,
        document.body
          )}

      {/* Modal de filtros */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFilterModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Filter className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Filtros de Productos</h2>
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
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">Todos los inventarios</option>
                    {(Array.isArray(inventories) ? inventories : []).map((inventory) => (
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
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">Todas las categorías</option>
                    {(Array.isArray(categories) ? categories : []).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
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
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="active">Solo activos</option>
                    <option value="inactive">Solo inactivos</option>
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
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6"
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
