'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Calendar,
  Hash,
  ChevronDown,
  ChevronRight,
  Filter,
  TrendingUp
} from 'lucide-react';
import { BatchService, InventoryItemService, InventoryService, InventoryCategoryService } from '@/lib/services/inventoryService';
import { Batch, InventoryItem, BatchFormData, Inventory, InventoryCategory } from '@/lib/types';
import { usePagination } from '@/hooks/usePagination';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const batchSchema = z.object({
  batch_number: z.string().min(1, 'El número de lote es requerido'),
  inventory_item_id: z.string().min(1, 'El producto es requerido'),
  quantity: z.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  expiry_date: z.string()
    .min(1, 'La fecha de vencimiento es requerida')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
      return selectedDate >= today;
    }, 'La fecha de vencimiento debe ser hoy o en el futuro'),
  cost_per_unit: z.number().min(0, 'El costo no puede ser negativo'),
  notes: z.string(),
  active: z.boolean()
});

// Opciones predefinidas de notas para lotes
const predefinedNotes = [
  { value: 'compra_nueva', label: 'Compra nueva de proveedor' },
  { value: 'oferta_especial', label: 'Oferta especial del proveedor' },
  { value: 'stock_seguridad', label: 'Stock de seguridad' },
  { value: 'temporada_alta', label: 'Preparación para temporada alta' },
  { value: 'promocion', label: 'Para promoción especial' },
  { value: 'calidad_premium', label: 'Lote de calidad premium' },
  { value: 'proveedor_confiable', label: 'Proveedor confiable' },
  { value: 'inventario_inicial', label: 'Inventario inicial' },
  { value: 'donacion', label: 'Donación recibida' },
  { value: 'otros', label: 'Otros (especificar)' }
];

// Esquema de pérdidas eliminado - usar Movimientos

type InventoryItemWithBatches = InventoryItem & {
  current_stock: number;
  batches: Batch[];
  expanded: boolean;
};

export default function BatchesModule() {
  const [products, setProducts] = useState<InventoryItemWithBatches[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<InventoryItemWithBatches[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<InventoryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInventory, setSelectedInventory] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expiryFilter, setExpiryFilter] = useState<string>('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table');
  const [preSelectedProduct, setPreSelectedProduct] = useState<string | null>(null);
  const [selectedNoteType, setSelectedNoteType] = useState<string>('compra_nueva');
  const [customNote, setCustomNote] = useState<string>('');

  const {
    register: registerBatch,
    handleSubmit: handleSubmitBatch,
    reset: resetBatch,
    formState: { errors: batchErrors }
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      batch_number: '',
      inventory_item_id: '',
      quantity: 0,
      expiry_date: '',
      cost_per_unit: 0,
      notes: '',
      active: true
    }
  });

  // Formulario de pérdidas eliminado - usar Movimientos

  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [batchesRes, productsRes, inventoriesRes, categoriesRes] = await Promise.all([
        BatchService.getAllWithInactive(),
        InventoryItemService.getAllWithStock(),
        InventoryService.getAll(),
        InventoryCategoryService.getAll()
      ]);

      if (batchesRes.data && productsRes.data) {
        setBatches(batchesRes.data);
        
        // Agrupar lotes por producto y calcular stock
        const productsWithBatches = productsRes.data.map(product => {
          const productBatches = batchesRes.data!.filter(batch => 
            batch.inventory_item_id === product.id
          );
          
          return {
            ...product,
            batches: productBatches,
            expanded: false
          };
        });
        
        setProducts(productsWithBatches);
        setFilteredProducts(productsWithBatches);
      }

      if (inventoriesRes.data) {
        setInventories(inventoriesRes.data);
      }

      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar categorías por inventario seleccionado
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

  // Filtrar productos
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.batches.some(batch => 
          batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (batch.notes && batch.notes.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }

    if (selectedInventory) {
      filtered = filtered.filter(product => product.inventory_id === selectedInventory);
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }

    // Filtro por vencimiento
    if (expiryFilter) {
      filtered = filtered.filter(product => {
        return product.batches.some(batch => {
          const expiryInfo = getExpiryStatus(batch.expiry_date);
          switch (expiryFilter) {
            case 'expired':
              return expiryInfo.status === 'expired';
            case 'expiring':
              return expiryInfo.status === 'expiring';
            case 'soon':
              return expiryInfo.status === 'soon';
            case 'good':
              return expiryInfo.status === 'good';
            case 'critical': // Vencidos + críticos
              return expiryInfo.status === 'expired' || expiryInfo.status === 'expiring';
            default:
              return true;
          }
        });
      });
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedInventory, selectedCategory, expiryFilter, products]);

  // Hook de paginación
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedProducts,
    goToPage,
    resetPage
  } = usePagination({ data: filteredProducts || [], itemsPerPage: 10 });



  // Alternar vista expandida de producto
  const toggleProductExpansion = (productId: string) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, expanded: !product.expanded }
        : product
    ));
    setFilteredProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, expanded: !product.expanded }
        : product
    ));
  };

  // Generar número de lote automáticamente (fecha + secuencial)
  const generateBatchNumber = (product: InventoryItemWithBatches) => {
    const today = new Date();
    const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
    
    // Buscar lotes del mismo día para este producto
    const todayBatches = product.batches.filter(batch => 
      batch.batch_number.startsWith(datePrefix)
    );
    
    const nextNumber = todayBatches.length + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0'); // 001, 002, etc.
    
    return `${datePrefix}-${paddedNumber}`;
  };

  // Abrir modal para crear/editar lote (botón principal)
  const openBatchModal = (batch?: Batch) => {
    if (batch) {
      setEditingBatch(batch);
      setPreSelectedProduct(null); // No hay producto pre-seleccionado en edición
      setSelectedNoteType(''); // Reset notas predefinidas para edición
      setCustomNote(''); // Reset nota personalizada
      resetBatch({
        batch_number: batch.batch_number,
        inventory_item_id: batch.inventory_item_id,
        quantity: batch.quantity,
        expiry_date: batch.expiry_date,
        cost_per_unit: batch.cost_per_unit,
        notes: batch.notes || '',
        active: batch.active
      });
    } else {
      setEditingBatch(null);
      setPreSelectedProduct(null); // No hay producto pre-seleccionado
      setSelectedNoteType('compra_nueva'); // Opción por defecto para nuevos lotes
      setCustomNote(''); // Reset nota personalizada
      resetBatch(); // Reset completo para permitir selección de producto
    }
    setShowBatchModal(true);
  };

  // Abrir modal para crear nuevo lote para un producto específico (acción rápida)
  const openNewBatchForProduct = (product: InventoryItemWithBatches) => {
    setEditingBatch(null);
    setPreSelectedProduct(product.id); // Marcar producto como pre-seleccionado
    setSelectedNoteType('compra_nueva'); // Opción por defecto para nuevos lotes
    setCustomNote(''); // Reset nota personalizada
    const autoBatchNumber = generateBatchNumber(product);
    resetBatch({
      batch_number: autoBatchNumber, // Número generado automáticamente
      inventory_item_id: product.id, // Producto pre-llenado
      quantity: 0,
      expiry_date: '',
      cost_per_unit: 0,
      notes: '',
      active: true
    });
    setShowBatchModal(true);
  };

  // Cerrar modal
  const closeBatchModal = () => {
    setShowBatchModal(false);
    setEditingBatch(null);
    setPreSelectedProduct(null);
    setSelectedNoteType('compra_nueva'); // Reset a opción por defecto
    setCustomNote('');
    resetBatch();
  };

  // Funciones de pérdidas eliminadas - usar Movimientos

  // Crear o actualizar lote
  const onSubmitBatch = async (data: BatchFormData) => {
    try {
      setIsSubmitting(true);
      
      // Determinar las notas finales
      let finalNotes = '';
      if (selectedNoteType && selectedNoteType !== 'otros') {
        const selectedNote = predefinedNotes.find(note => note.value === selectedNoteType);
        finalNotes = selectedNote ? selectedNote.label : '';
      } else if (selectedNoteType === 'otros' && customNote.trim()) {
        finalNotes = customNote.trim();
      }
      
      const batchData = {
        ...data,
        notes: finalNotes
      };
      
      console.log('🔍 Datos del lote a guardar:', batchData);
      console.log('🔍 Notas seleccionadas:', { selectedNoteType, customNote, finalNotes });
      
      if (editingBatch) {
        const response = await BatchService.update(editingBatch.id, batchData);
        if (response.data) {
          await loadData();
          closeBatchModal();
        }
      } else {
        const response = await BatchService.create(batchData);
        if (response.data) {
          await loadData();
          closeBatchModal();
        }
      }
    } catch (error) {
      console.error('Error guardando lote:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función de pérdidas eliminada - usar Movimientos

  // Eliminar lote (soft delete)
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este lote?')) {
      try {
        const response = await BatchService.delete(id);
        if (response.data) {
          await loadData();
        }
      } catch (error) {
        console.error('Error eliminando lote:', error);
      }
    }
  };

  // Eliminar permanentemente
  const handleHardDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar PERMANENTEMENTE este lote? Esta acción no se puede deshacer.')) {
      try {
        const response = await BatchService.hardDelete(id);
        if (response.data === null) {
          await loadData();
        }
      } catch (error) {
        console.error('Error eliminando permanentemente:', error);
      }
    }
  };

  // Obtener nombre del inventario
  const getInventoryName = (id: string) => {
    const inventory = inventories.find(inv => inv.id === id);
    return inventory ? inventory.name : 'Sin Inventario';
  };

  // Obtener nombre de la categoría
  const getCategoryName = (id: string) => {
    const category = categories.find(cat => cat.id === id);
    return category ? category.name : 'Sin Categoría';
  };

  // Calcular días hasta vencimiento y obtener estado
  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', color: 'bg-red-100 text-red-800', label: 'Vencido' };
    } else if (diffDays <= 7) {
      return { status: 'expiring', color: 'bg-yellow-100 text-yellow-800', label: `${diffDays}d` };
    } else if (diffDays <= 30) {
      return { status: 'soon', color: 'bg-orange-100 text-orange-800', label: `${diffDays}d` };
    } else {
      return { status: 'good', color: 'bg-green-100 text-green-800', label: `${diffDays}d` };
    }
  };

  // Calcular costo promedio FIFO y valor total
  const calculateFIFOStats = (product: InventoryItemWithBatches) => {
    const activeBatches = product.batches.filter(batch => batch.active && batch.quantity > 0);
    
    if (activeBatches.length === 0) {
      return {
        averageCost: 0,
        totalValue: 0,
        totalQuantity: 0
      };
    }

    // Ordenar por fecha de vencimiento (FIFO)
    const sortedBatches = activeBatches.sort((a, b) => 
      new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
    );

    let totalQuantity = 0;
    let totalValue = 0;

    sortedBatches.forEach(batch => {
      totalQuantity += batch.quantity;
      totalValue += batch.quantity * batch.cost_per_unit;
    });

    const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    return {
      averageCost,
      totalValue,
      totalQuantity
    };
  };

  return (
    <div className="p-6">
      {/* Header con controles */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Lotes</h2>
          
          <div className="flex gap-2">
            <Button
              variant={displayMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDisplayMode('table')}
            >
              📋 Tabla
            </Button>
            <Button
              variant={displayMode === 'cards' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDisplayMode('cards')}
            >
              🔳 Cards
            </Button>
          </div>
        </div>

                {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar productos o lotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select
            value={selectedInventory}
            onChange={(e) => setSelectedInventory(e.target.value)}
          >
            <option value="">Todos los inventarios</option>
            {inventories.map((inventory) => (
              <option key={inventory.id} value={inventory.id}>
                {inventory.name}
              </option>
            ))}
          </Select>

          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
          >
            <option value="">Estado de vencimiento</option>
            <option value="expired">🔴 Vencidos</option>
            <option value="expiring">🟡 Críticos (7 días o menos)</option>
            <option value="soon">🟠 Próximos (30 días o menos)</option>
            <option value="good">🟢 Buenos (más de 30 días)</option>
            <option value="critical">⚠️ Requieren atención</option>
          </Select>

          <Button onClick={() => openBatchModal()} size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Lote
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <p className="text-gray-900 mt-2">Cargando productos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h4>
          <p className="text-gray-900 mb-4">Crea productos primero para gestionar sus lotes</p>
        </Card>
      ) : (
        <>
          {displayMode === 'cards' ? (
            // Vista de Cards
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-gray-900">
                        {getInventoryName(product.inventory_id || '')} • {getCategoryName(product.category_id || '')}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openNewBatchForProduct(product)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {(() => {
                  const fifoStats = calculateFIFOStats(product);
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{product.current_stock}</p>
                          <p className="text-sm text-gray-900">Stock Total</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{product.batches.length}</p>
                          <p className="text-sm text-gray-900">Lotes Activos</p>
                        </div>
                      </div>

                      {/* Información FIFO */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <h5 className="font-medium text-green-800 mb-2">💰 Valor FIFO</h5>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-green-600">Costo Promedio:</p>
                            <p className="font-bold text-green-800">${fifoStats.averageCost.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-green-600">Valor Total:</p>
                            <p className="font-bold text-green-800">${fifoStats.totalValue.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Estados de lotes */}
                <div className="space-y-2">
                  {(() => {
                    const statuses = product.batches.reduce((acc, batch) => {
                      const status = getExpiryStatus(batch.expiry_date);
                      acc[status.status] = (acc[status.status] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    return (
                      <div className="flex flex-wrap gap-2">
                        {statuses.expired > 0 && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            🔴 {statuses.expired} vencidos
                          </span>
                        )}
                        {statuses.expiring > 0 && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            🟡 {statuses.expiring} críticos
                          </span>
                        )}
                        {statuses.soon > 0 && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            🟠 {statuses.soon} próximos
                          </span>
                        )}
                        {statuses.good > 0 && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            🟢 {statuses.good} buenos
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Botón para ver detalles */}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => toggleProductExpansion(product.id)}
                >
                  {product.expanded ? 'Ocultar Lotes' : 'Ver Lotes'}
                  {product.expanded ? (
                    <ChevronDown className="w-4 h-4 ml-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-2" />
                  )}
                </Button>

                {/* Lista de lotes expandida */}
                {product.expanded && (
                  <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                    {product.batches
                      .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                      .map((batch) => (
                        <div key={batch.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Hash className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-sm">{batch.batch_number}</span>
                              {(() => {
                                const expiryInfo = getExpiryStatus(batch.expiry_date);
                                return (
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expiryInfo.color}`}>
                                    {expiryInfo.label}
                                  </span>
                                );
                              })()}
                            </div>
                            <p className="text-xs text-gray-900 mt-1">
                              {batch.quantity} unidades • ${batch.cost_per_unit.toFixed(2)} c/u
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            {/* Edición de lotes deshabilitada */}
                            {/* <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openBatchModal(batch)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                            >
                              <Edit className="w-3 h-3" />
                            </Button> */}
                            {/* Botón de pérdida eliminado - usar Movimientos */}
                            {/* <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openLossModal(batch)}
                              className="text-orange-600 hover:text-orange-700 p-1"
                            >
                              <AlertTriangle className="w-3 h-3" />
                            </Button> */}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
              ))}
            </div>
          ) : (
            // Vista de Tabla (original)
            <div className="space-y-6">
              {paginatedProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader 
                className="bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleProductExpansion(product.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-900">
                        <span>Stock: {product.current_stock}</span>
                        <span>•</span>
                        <span>Lotes: {product.batches.length}</span>
                        <span>•</span>
                        <span>{getInventoryName(product.inventory_id || '')}</span>
                        <span>•</span>
                        <span>{getCategoryName(product.category_id || '')}</span>
                      </div>
                      {(() => {
                        const fifoStats = calculateFIFOStats(product);
                        return (
                          <div className="flex items-center space-x-4 text-sm mt-1">
                            <span className="text-green-600 font-medium">
                              💰 Valor: ${fifoStats.totalValue.toFixed(2)}
                            </span>
                            <span className="text-green-600">
                              Promedio: ${fifoStats.averageCost.toFixed(2)}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNewBatchForProduct(product);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Lote
                    </Button>
                    
                    {product.expanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {product.expanded && (
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lote
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vencimiento
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Días Restantes
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Costo Unitario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {product.batches
                          .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()) // FIFO: por fecha de vencimiento
                          .map((batch) => (
                          <tr key={batch.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-6 w-6 rounded bg-blue-100 flex items-center justify-center mr-3">
                                  <Hash className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {batch.batch_number}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {batch.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(batch.expiry_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                const expiryInfo = getExpiryStatus(batch.expiry_date);
                                return (
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expiryInfo.color}`}>
                                    {expiryInfo.label}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${batch.cost_per_unit.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                batch.active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {batch.active ? 'Activo' : 'Inactivo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {/* Edición de lotes deshabilitada */}
                                {/* <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openBatchModal(batch)}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Editar lote"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button> */}
                                {/* Botón de pérdida eliminado - usar Movimientos */}
                                {/* <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openLossModal(batch)}
                                  className="text-orange-600 hover:text-orange-700"
                                  title="Registrar pérdida"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                </Button> */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(batch.id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Eliminar lote"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                              </CardContent>
            )}
          </Card>
              ))}
            </div>
          )}

          {/* Paginación */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            itemsPerPage={10}
            onPageChange={goToPage}
            itemType="productos"
          />
        </>
      )}

      {/* Modal para crear/editar lote */}
      <Modal
        isOpen={showBatchModal}
        onClose={closeBatchModal}
        title={editingBatch ? 'Editar Lote' : 'Nuevo Lote'}
      >
        <form onSubmit={handleSubmitBatch(onSubmitBatch)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Lote
              </label>
              <Input
                {...registerBatch('batch_number')}
                placeholder="Ej: LOTE-001-2024"
                className={batchErrors.batch_number ? 'border-red-500' : ''}
              />
              {batchErrors.batch_number && (
                <p className="text-red-500 text-sm mt-1">{batchErrors.batch_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto
              </label>
                             <Select
                 {...registerBatch('inventory_item_id')}
                 className={batchErrors.inventory_item_id ? 'border-red-500' : ''}
                 disabled={!!editingBatch || !!preSelectedProduct} // Deshabilitar si es edición o producto pre-seleccionado
               >
                <option value="">Seleccionar producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
              {batchErrors.inventory_item_id && (
                <p className="text-red-500 text-sm mt-1">{batchErrors.inventory_item_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <Input
                type="number"
                {...registerBatch('quantity', { valueAsNumber: true })}
                min="0.01"
                step="0.01"
                className={batchErrors.quantity ? 'border-red-500' : ''}
              />
              {batchErrors.quantity && (
                <p className="text-red-500 text-sm mt-1">{batchErrors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo Unitario
              </label>
              <Input
                type="number"
                {...registerBatch('cost_per_unit', { valueAsNumber: true })}
                min="0"
                step="0.01"
                placeholder="0.00"
                className={batchErrors.cost_per_unit ? 'border-red-500' : ''}
              />
              {batchErrors.cost_per_unit && (
                <p className="text-red-500 text-sm mt-1">{batchErrors.cost_per_unit.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Vencimiento
            </label>
            <Input
              type="date"
              {...registerBatch('expiry_date')}
              className={batchErrors.expiry_date ? 'border-red-500' : ''}
            />
            {batchErrors.expiry_date && (
              <p className="text-red-500 text-sm mt-1">{batchErrors.expiry_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (Opcional)
            </label>
            <Select
              value={selectedNoteType}
              onChange={(e) => {
                setSelectedNoteType(e.target.value);
                if (e.target.value !== 'otros') {
                  setCustomNote('');
                }
              }}
            >
              <option value="">Seleccionar motivo del lote</option>
              {predefinedNotes.map((note) => (
                <option key={note.value} value={note.value}>
                  {note.label}
                </option>
              ))}
            </Select>
            
            {selectedNoteType === 'otros' && (
              <div className="mt-2">
                <Input
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Especifica el motivo del lote"
                  className="mt-1"
                />
              </div>
            )}
            
            {/* Campo oculto para mantener compatibilidad con el formulario */}
            <input
              type="hidden"
              {...registerBatch('notes')}
              value={selectedNoteType === 'otros' ? customNote : (selectedNoteType ? predefinedNotes.find(note => note.value === selectedNoteType)?.label || '' : '')}
            />
          </div>

          {/* TODO: Implementar reactivación de lotes inactivos */}
          {/* {editingBatch && !editingBatch.active && (
            <div className="flex items-center">
              <input
                type="checkbox"
                {...registerBatch('active')}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Reactivar Lote
              </label>
            </div>
          )} */}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeBatchModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (editingBatch ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de pérdidas eliminado - usar Movimientos */}
    </div>
  );
}
