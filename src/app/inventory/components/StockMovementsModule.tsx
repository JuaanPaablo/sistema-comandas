'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { 
  TrendingUp, 
  TrendingDown,
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Package
} from 'lucide-react';
import { StockMovementService, InventoryItemService, BatchService, InventoryService, InventoryCategoryService } from '@/lib/services/inventoryService';
import { StockMovement, InventoryItem, StockMovementFormData, Batch, Inventory, InventoryCategory } from '@/lib/types';
import { usePagination } from '@/hooks/usePagination';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const stockMovementSchema = z.object({
  inventory_id: z.string().min(1, 'El inventario es requerido'),
  category_id: z.string().min(1, 'La categoría es requerida'),
  inventory_item_id: z.string().min(1, 'El producto es requerido'),
  batch_id: z.string().optional(),
  movement_type: z.enum(['ajuste_positivo', 'ajuste_negativo']),
  quantity: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  reason: z.string().min(1, 'La razón es requerida'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean()
});

const movementTypeOptions = [
  { value: 'ajuste_positivo', label: 'Ajuste Positivo (+)', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'ajuste_negativo', label: 'Ajuste Negativo (-)', icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-100' }
];

const reasonOptions = [
  { value: 'producto_encontrado', label: 'Producto encontrado en almacén' },
  { value: 'error_conteo', label: 'Error de conteo' },
  { value: 'devolucion_proveedor', label: 'Devolución de proveedor' },
  { value: 'merma_natural', label: 'Merma natural' },
  { value: 'producto_danado', label: 'Producto dañado' },
  { value: 'vencimiento', label: 'Producto vencido' },
  { value: 'robo_perdida', label: 'Robo o pérdida' },
  { value: 'ajuste_inventario', label: 'Ajuste de inventario' },
  { value: 'otros', label: 'Otros' }
];

export default function StockMovementsModule() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<InventoryCategory[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<InventoryItem[]>([]);
  const [productBatches, setProductBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInventory, setSelectedInventory] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockWarning, setStockWarning] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<StockMovementFormData>({
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
      notes: '',
      active: true
    }
  });

  const watchedInventoryId = watch('inventory_id');
  const watchedCategoryId = watch('category_id');
  const watchedProductId = watch('inventory_item_id');
  const watchedBatchId = watch('batch_id');
  const watchedMovementType = watch('movement_type');
  const watchedQuantity = watch('quantity');

  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [movementsRes, productsRes, batchesRes, inventoriesRes, categoriesRes] = await Promise.all([
        StockMovementService.getAllWithInactive(),
        InventoryItemService.getAll(),
        BatchService.getAllWithInactive(),
        InventoryService.getAll(),
        InventoryCategoryService.getAll()
      ]);

      if (movementsRes.data) setMovements(movementsRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (batchesRes.data) setBatches(batchesRes.data);
      if (inventoriesRes.data) setInventories(inventoriesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar categorías por inventario seleccionado (para la tabla)
  useEffect(() => {
    if (selectedInventory) {
      const filtered = categories.filter(category => category.inventory_id === selectedInventory);
      setFilteredCategories(filtered);
      // Resetear categoría seleccionada si no está disponible en el inventario actual
      if (selectedCategory && !filtered.find(cat => cat.id === selectedCategory)) {
        setSelectedCategory('');
      }
    } else {
      setFilteredCategories(categories);
    }
  }, [selectedInventory, categories, selectedCategory]);

  // Filtrar categorías para el formulario basado en el inventario seleccionado en el formulario
  useEffect(() => {
    if (watchedInventoryId) {
      const filtered = categories.filter(category => category.inventory_id === watchedInventoryId);
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [watchedInventoryId, categories]);

  // Filtrar productos por inventario y categoría seleccionados (para el formulario)
  useEffect(() => {
    if (watchedInventoryId && watchedCategoryId) {
      const filtered = products.filter(product => 
        product.inventory_id === watchedInventoryId && 
        product.category_id === watchedCategoryId
      );
      setFilteredProducts(filtered);
      // Resetear producto seleccionado si no está disponible
      if (watchedProductId && !filtered.find(p => p.id === watchedProductId)) {
        setValue('inventory_item_id', '');
        setValue('batch_id', '');
      }
    } else {
      setFilteredProducts([]);
    }
  }, [watchedInventoryId, watchedCategoryId, products, watchedProductId, setValue]);

  // Filtrar lotes por producto seleccionado
  useEffect(() => {
    if (watchedProductId) {
      const filtered = batches.filter(batch => 
        batch.inventory_item_id === watchedProductId && batch.quantity > 0
      );
      setProductBatches(filtered);
      // Resetear lote seleccionado si no está disponible
      if (watchedProductId && !filtered.find(b => b.id === watch('batch_id'))) {
        setValue('batch_id', '');
      }
    } else {
      setProductBatches([]);
    }
  }, [watchedProductId, batches, setValue, watch]);

  // Validar stock en tiempo real
  useEffect(() => {
    if (watchedMovementType === 'ajuste_negativo' && watchedQuantity && watchedQuantity > 0) {
      if (watchedBatchId) {
        // Validar stock en lote específico
        const batch = batches.find(b => b.id === watchedBatchId);
        if (batch) {
          if (batch.quantity < watchedQuantity) {
            setStockWarning(`⚠️ Stock insuficiente en el lote. Disponible: ${batch.quantity} unidades`);
          } else {
            setStockWarning('');
          }
        }
      } else if (watchedProductId) {
        // Validar stock total del producto
        const productBatches = batches.filter(b => 
          b.inventory_item_id === watchedProductId && 
          b.active && 
          b.quantity > 0
        );
        
        const totalStock = productBatches.reduce((sum, batch) => sum + batch.quantity, 0);
        
        if (totalStock < watchedQuantity) {
          setStockWarning(`⚠️ Stock insuficiente. Disponible: ${totalStock} unidades`);
        } else {
          setStockWarning('');
        }
      }
    } else {
      setStockWarning('');
    }
  }, [watchedMovementType, watchedQuantity, watchedBatchId, watchedProductId, batches]);

  // Filtrar productos por inventario y categoría
  useEffect(() => {
    let filtered = products;

    if (selectedInventory) {
      filtered = filtered.filter(product => product.inventory_id === selectedInventory);
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }

    setFilteredProducts(filtered);
    
    // Resetear producto seleccionado si no está disponible en los filtros actuales
    if (selectedProduct && !filtered.find(prod => prod.id === selectedProduct)) {
      setSelectedProduct('');
    }
  }, [selectedInventory, selectedCategory, products, selectedProduct]);

  // Filtrar movimientos
  useEffect(() => {
    let filtered = movements;

    if (searchTerm) {
      filtered = filtered.filter(movement =>
        movement.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.reference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedProduct) {
      filtered = filtered.filter(movement => movement.inventory_item_id === selectedProduct);
    }

    if (selectedType) {
      filtered = filtered.filter(movement => movement.movement_type === selectedType);
    }

    setFilteredMovements(filtered);
  }, [searchTerm, selectedProduct, selectedType, movements]);

  // Abrir modal para crear/editar
  const openModal = (movement?: StockMovement) => {
    if (movement) {
      setEditingMovement(movement);
      reset({
        inventory_item_id: movement.inventory_item_id,
        batch_id: movement.batch_id || '',
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        reason: movement.reason,
        reference: movement.reference || '',
        notes: movement.notes || '',
        active: movement.active
      });
    } else {
      setEditingMovement(null);
      reset({
        inventory_item_id: '',
        batch_id: '',
        movement_type: 'ajuste_positivo',
        quantity: 0,
        reason: '',
        reference: '',
        notes: '',
        active: true
      });
    }
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setEditingMovement(null);
    setSelectedReason('');
    setCustomReason('');
    reset();
  };

  // Determinar si el botón debe estar deshabilitado
  const isSubmitDisabled = (): boolean => {
    if (isSubmitting) return true;
    if (stockWarning) return true;
    if (watchedMovementType === 'ajuste_negativo' && watchedQuantity && watchedQuantity > 0) {
      if (watchedBatchId) {
        const batch = batches.find(b => b.id === watchedBatchId);
        return batch ? batch.quantity < watchedQuantity : true;
      } else if (watchedProductId) {
        const productBatches = batches.filter(b => 
          b.inventory_item_id === watchedProductId && 
          b.active && 
          b.quantity > 0
        );
        const totalStock = productBatches.reduce((sum, batch) => sum + batch.quantity, 0);
        return totalStock < watchedQuantity;
      }
    }
    return false;
  };

  // Validar stock disponible antes de crear movimiento
  const validateStockAvailability = (data: StockMovementFormData): { isValid: boolean; message: string } => {
    // Solo validar para ajustes negativos
    if (data.movement_type !== 'ajuste_negativo') {
      return { isValid: true, message: '' };
    }

    if (data.batch_id) {
      // Validar stock en lote específico
      const batch = batches.find(b => b.id === data.batch_id);
      if (!batch) {
        return { isValid: false, message: 'Lote no encontrado' };
      }
      
      if (batch.quantity < data.quantity) {
        return { 
          isValid: false, 
          message: `Stock insuficiente en el lote. Disponible: ${batch.quantity} unidades, solicitado: ${data.quantity} unidades` 
        };
      }
    } else {
      // Validar stock total del producto
      const product = products.find(p => p.id === data.inventory_item_id);
      if (!product) {
        return { isValid: false, message: 'Producto no encontrado' };
      }
      
      // Calcular stock total del producto sumando todos los lotes
      const productBatches = batches.filter(b => 
        b.inventory_item_id === data.inventory_item_id && 
        b.active && 
        b.quantity > 0
      );
      
      const totalStock = productBatches.reduce((sum, batch) => sum + batch.quantity, 0);
      
      if (totalStock < data.quantity) {
        return { 
          isValid: false, 
          message: `Stock insuficiente. Disponible: ${totalStock} unidades, solicitado: ${data.quantity} unidades` 
        };
      }
    }

    return { isValid: true, message: '' };
  };

  // Crear o actualizar movimiento
  const onSubmit = async (data: StockMovementFormData) => {
    try {
      setIsSubmitting(true);
      
      // Validar stock disponible antes de proceder
      const stockValidation = validateStockAvailability(data);
      if (!stockValidation.isValid) {
        alert(`❌ Error de validación: ${stockValidation.message}`);
        return;
      }
      
      // Preparar datos para envío (remover campos de filtro)
      const movementData = {
        inventory_item_id: data.inventory_item_id,
        batch_id: data.batch_id || undefined,
        movement_type: data.movement_type,
        quantity: data.quantity,
        reason: data.reason,
        reference: data.reference,
        notes: data.notes,
        active: data.active
      };
      
      if (editingMovement) {
        // Actualizar
        const response = await StockMovementService.update(editingMovement.id, movementData);
        if (response.data) {
          await loadData();
          closeModal();
        }
      } else {
        // Crear
        const response = await StockMovementService.create(movementData);
        if (response.data) {
          await loadData();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error guardando movimiento:', error);
      alert('Error al guardar el movimiento. Verifica los datos e intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar movimiento permanentemente
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar PERMANENTEMENTE este ajuste? Esta acción no se puede deshacer.')) {
      try {
        const response = await StockMovementService.hardDelete(id);
        if (response.data === null) {
          await loadData();
        }
      } catch (error) {
        console.error('Error eliminando ajuste:', error);
      }
    }
  };

  // Obtener nombre del producto
  const getProductName = (id: string) => {
    return products.find(product => product.id === id)?.name || 'N/A';
  };

  // Obtener lotes de un producto específico
  const getProductBatches = (productId: string) => {
    return batches.filter(batch => 
      batch.inventory_item_id === productId && batch.active && batch.quantity > 0
    );
  };

  // Obtener nombre del lote
  const getBatchName = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    return batch ? `${batch.batch_number} (${batch.quantity} unidades)` : 'N/A';
  };

  // Obtener información del tipo de movimiento
  const getMovementTypeInfo = (type: string) => {
    return movementTypeOptions.find(option => option.value === type) || movementTypeOptions[0];
  };

  // Todos los movimientos (sin soft delete por ahora)
  const activeMovements = filteredMovements;

  // Hook de paginación para movimientos activos
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedActiveMovements,
    goToPage
  } = usePagination({ data: activeMovements || [], itemsPerPage: 10 });

  return (
    <div className="p-6">
      {/* Barra de búsqueda y botón nuevo */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search-movements"
              type="text"
              placeholder="Buscar por razón o referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              id="filter-inventory"
              value={selectedInventory}
              onChange={(e) => setSelectedInventory(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="">Todos los inventarios</option>
              {inventories.map((inventory) => (
                <option key={inventory.id} value={inventory.id}>
                  {inventory.name}
                </option>
              ))}
            </Select>

            <Select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="">Todas las categorías</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>

            <Select
              id="filter-product"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="min-w-[180px]"
            >
              <option value="">Todos los productos</option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
            
            <Select
              id="filter-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="">Todos los tipos</option>
              {movementTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        
        <Button onClick={() => openModal()} size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Ajuste
        </Button>
      </div>



      {/* Movimientos Activos */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Movimientos Activos ({activeMovements.length})
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-900 mt-2">Cargando movimientos...</p>
          </div>
        ) : activeMovements.length === 0 ? (
          <Card className="p-8 text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No hay ajustes registrados</h4>
            <p className="text-gray-900 mb-4">Registra tu primer ajuste de inventario para corregir diferencias de stock</p>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Ajuste
            </Button>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Lote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Razón
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Referencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedActiveMovements.map((movement) => {
                  const typeInfo = getMovementTypeInfo(movement.movement_type);
                  const IconComponent = typeInfo.icon;
                  
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className={`h-8 w-8 rounded-lg ${typeInfo.bgColor} flex items-center justify-center`}>
                              <IconComponent className={`h-5 w-5 ${typeInfo.color}`} />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{typeInfo.label}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getProductName(movement.inventory_item_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.batch_id ? getBatchName(movement.batch_id) : 'Sin lote específico'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(movement.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.reference || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openModal(movement)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(movement.id)}
                            className="text-red-600 hover:text-red-700"
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
        )}

        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={activeMovements.length}
          itemsPerPage={10}
          onPageChange={goToPage}
          itemType="movimientos"
        />
      </div>



      {/* Modal para crear/editar */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingMovement ? 'Editar Ajuste de Inventario' : 'Nuevo Ajuste de Inventario'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Filtros jerárquicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inventory_id" className="block text-sm font-medium text-gray-700 mb-1">
                Inventario *
              </label>
              <Select
                id="inventory_id"
                {...register('inventory_id')}
                className={errors.inventory_id ? 'border-red-500' : ''}
              >
                <option value="">Seleccionar inventario</option>
                {inventories.filter(inv => inv.active).map((inventory) => (
                  <option key={inventory.id} value={inventory.id}>
                    {inventory.name}
                  </option>
                ))}
              </Select>
              {errors.inventory_id && (
                <p className="text-red-500 text-sm mt-1">{errors.inventory_id.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <Select
                id="category_id"
                {...register('category_id')}
                className={errors.category_id ? 'border-red-500' : ''}
                disabled={!watchedInventoryId}
              >
                <option value="">Seleccionar categoría</option>
                {watchedInventoryId && filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              {errors.category_id && (
                <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inventory_item_id" className="block text-sm font-medium text-gray-700 mb-1">
                Producto *
              </label>
              <Select
                id="inventory_item_id"
                {...register('inventory_item_id')}
                className={errors.inventory_item_id ? 'border-red-500' : ''}
                disabled={!watchedCategoryId}
              >
                <option value="">Seleccionar producto</option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
              {errors.inventory_item_id && (
                <p className="text-red-500 text-sm mt-1">{errors.inventory_item_id.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="batch_id" className="block text-sm font-medium text-gray-700 mb-1">
                Lote (Opcional)
              </label>
              <Select
                id="batch_id"
                {...register('batch_id')}
                disabled={!watchedProductId}
              >
                <option value="">Sin lote específico</option>
                {productBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_number} - {batch.quantity} unidades (Vence: {new Date(batch.expiry_date).toLocaleDateString()})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="movement_type" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Ajuste *
              </label>
              <Select
                id="movement_type"
                {...register('movement_type')}
                className={errors.movement_type ? 'border-red-500' : ''}
              >
                {movementTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.movement_type && (
                <p className="text-red-500 text-sm mt-1">{errors.movement_type.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
              </label>
              <Input
                id="quantity"
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                min="0.01"
                step="0.01"
                className={errors.quantity ? 'border-red-500' : (stockWarning ? 'border-yellow-500' : '')}
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
              )}
              {stockWarning && (
                <p className="text-yellow-600 text-sm mt-1 font-medium">{stockWarning}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Motivo del Ajuste *
            </label>
            <Select
              id="reason"
              {...register('reason')}
              className={errors.reason ? 'border-red-500' : ''}
              onChange={(e) => {
                setSelectedReason(e.target.value);
                if (e.target.value === 'otros') {
                  setCustomReason('');
                } else {
                  setValue('reason', e.target.value);
                }
              }}
            >
              <option value="">Seleccionar motivo</option>
              {reasonOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {selectedReason === 'otros' && (
              <Input
                id="custom_reason"
                type="text"
                placeholder="Especificar motivo personalizado"
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  setValue('reason', e.target.value);
                }}
                className="mt-2"
              />
            )}
            {errors.reason && (
              <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
                Referencia (Opcional)
              </label>
              <Input
                id="reference"
                {...register('reference')}
                placeholder="Ej: Factura #123, Orden #456"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas (Opcional)
              </label>
              <Input
                id="notes"
                {...register('notes')}
                placeholder="Información adicional"
              />
            </div>
          </div>



          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitDisabled()}>
              {isSubmitting ? 'Guardando...' : (editingMovement ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
