'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
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
  TrendingUp,
  Grid,
  List,
  Warehouse,
  Tags,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  DollarSign,
  Box
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
      today.setHours(0, 0, 0, 0);
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

type InventoryItemWithBatches = InventoryItem & {
  current_stock: number;
  batches: Batch[];
  expanded: boolean;
};

interface BatchesModuleProps {
  onOpenConfirmationModal?: (title: string, message: string, onConfirm: () => void, loading?: boolean) => void;
}

export default function BatchesModule({ onOpenConfirmationModal }: BatchesModuleProps) {
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
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayMode, setDisplayMode] = useState<'table' | 'cards'>('table');
  const [preSelectedProduct, setPreSelectedProduct] = useState<string | null>(null);
  const [selectedNoteType, setSelectedNoteType] = useState<string>('compra_nueva');
  const [customNote, setCustomNote] = useState<string>('');
  const [loadingButtons, setLoadingButtons] = useState<Set<string>>(new Set());
  const [modalButtonLoading, setModalButtonLoading] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Estados para modal de filtros
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    inventory: '',
    category: '',
    expiry: ''
  });

  // Estados para modal local de lotes
  const [showBatchModal, setShowBatchModal] = useState(false);

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
      quantity: 1,
      expiry_date: '',
      cost_per_unit: 0,
      notes: '',
      active: true
    }
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  // Filtrar categorías cuando cambia el inventario seleccionado
  useEffect(() => {
    if (selectedInventory) {
      const filtered = categories.filter(cat => cat.inventory_id === selectedInventory);
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [selectedInventory, categories]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...products];

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.batches.some(batch => 
          batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filtro por inventario
    if (selectedInventory) {
      filtered = filtered.filter(product => product.inventory_id === selectedInventory);
    }

    // Filtro por categoría
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
            case 'critical':
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

  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [productsResponse, batchesResponse, inventoriesResponse, categoriesResponse] = await Promise.all([
        InventoryItemService.getAllWithInactive(),
        BatchService.getAllWithInactive(),
        InventoryService.getAllWithInactive(),
        InventoryCategoryService.getAllWithInactive()
      ]);

      const productsData = productsResponse.data || [];
      const batchesData = batchesResponse.data || [];
      const inventoriesData = inventoriesResponse.data || [];
      const categoriesData = categoriesResponse.data || [];

      // Combinar productos con sus lotes y calcular stock actual
      const productsWithBatches = productsData.map(product => {
        const productBatches = batchesData.filter(batch => batch.inventory_item_id === product.id);
        const currentStock = productBatches
          .filter(batch => batch.active && batch.quantity > 0)
          .reduce((sum, batch) => sum + batch.quantity, 0);

        return {
          ...product,
          current_stock: currentStock,
          batches: productBatches,
          expanded: false
        };
      });

      setProducts(productsWithBatches);
      setBatches(batchesData);
      setInventories(inventoriesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Abrir modal de lote
  const openBatchModal = async (batch?: Batch) => {
    const buttonId = batch ? `edit-batch-${batch.id}` : 'new-batch-main';
    if (isButtonLoading(buttonId)) return; // Prevenir doble clic
    
    setButtonLoading(buttonId, true);
    try {
      if (batch) {
        setEditingBatch(batch);
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
        resetBatch({
          batch_number: '',
          inventory_item_id: preSelectedProduct || '',
          quantity: 1,
          expiry_date: '',
          cost_per_unit: 0,
          notes: '',
          active: true
        });
      }

      setShowBatchModal(true);
    } finally {
      setButtonLoading(buttonId, false);
    }
  };

  const closeBatchModalLocal = () => {
    setShowBatchModal(false);
    setEditingBatch(null);
    setPreSelectedProduct(null);
    resetBatch();
  };

  // Enviar formulario de lote
  const onSubmitBatch = useCallback(async (data: BatchFormData) => {
    const buttonId = 'create-batch-modal';
    try {
      const batchData = {
        ...data,
        notes: selectedNoteType === 'otros' ? customNote : predefinedNotes.find(n => n.value === selectedNoteType)?.label || data.notes
      };
      let response;
      if (editingBatch) {
        response = await BatchService.update(editingBatch.id, batchData);
      } else {
        response = await BatchService.create(batchData);
      }
      if (response.data) {
        // Cerrar el modal local
        closeBatchModalLocal();
        
        // Recargar datos después de cerrar el modal
        await loadData();
      } else {
        console.error('❌ Error en la respuesta:', response.error);
        alert(`Error: ${response.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('💥 Error guardando lote:', error);
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
  }, [isSubmitting, isButtonLoading, modalButtonLoading, selectedNoteType, customNote, editingBatch, loadData, setButtonLoading]);

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

  const batchModalContent = (
    <form onSubmit={handleSubmitBatch(onSubmitBatch)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Lote *
              </label>
              <Input
                {...registerBatch('batch_number')}
                placeholder="Ej: LOTE-001"
                className="rounded-xl border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              {batchErrors.batch_number && (
                <p className="text-red-500 text-sm mt-1">{batchErrors.batch_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Producto *
              </label>
              <Select
                {...registerBatch('inventory_item_id')}
                className="rounded-xl border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="">Seleccionar producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({getInventoryName(product.inventory_id || '')})
                  </option>
                ))}
              </Select>
              {batchErrors.inventory_item_id && (
                <p className="text-red-500 text-sm mt-1">{batchErrors.inventory_item_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad *
              </label>
              <Input
                type="number"
                step="0.01"
                {...registerBatch('quantity', { valueAsNumber: true })}
                placeholder="0.00"
                className="rounded-xl border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              {batchErrors.quantity && (
                <p className="text-red-500 text-sm mt-1">{batchErrors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Vencimiento *
              </label>
              <Input
                type="date"
                {...registerBatch('expiry_date')}
                className="rounded-xl border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              {batchErrors.expiry_date && (
                <p className="text-red-500 text-sm mt-1">{batchErrors.expiry_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo por Unidad *
              </label>
              <Input
                type="number"
                step="0.01"
                {...registerBatch('cost_per_unit', { valueAsNumber: true })}
                placeholder="0.00"
                className="rounded-xl border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              {batchErrors.cost_per_unit && (
                <p className="text-red-500 text-sm mt-1">{batchErrors.cost_per_unit.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Nota
              </label>
              <Select
                value={selectedNoteType}
                onChange={(e) => setSelectedNoteType(e.target.value)}
                className="rounded-xl border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {predefinedNotes.map((note) => (
                  <option key={note.value} value={note.value}>
                    {note.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {selectedNoteType === 'otros' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nota Personalizada
              </label>
              <Input
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Describe el lote..."
                className="rounded-xl border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          )}

          <div className="flex space-x-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={closeBatchModalLocal}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-3 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Cancelar
            </Button>
            <Button
              ref={submitButtonRef}
              type="submit"
              disabled={isSubmitting || isButtonLoading('create-batch-modal') || modalButtonLoading}
              onClick={(e) => {
                // DESHABILITAR INMEDIATAMENTE AL HACER CLIC
                if (!isSubmitting && !isButtonLoading('create-batch-modal') && !modalButtonLoading) {
                  // Cambiar la apariencia del botón DIRECTAMENTE en el DOM para feedback instantáneo
                  const button = e.currentTarget;
                  button.style.opacity = '0.5';
                  button.style.cursor = 'not-allowed';
                  button.style.backgroundColor = '#9ca3af'; // Gris para indicar deshabilitado
                  // NO deshabilitar el botón porque bloquea el envío del formulario
                  
                  // Actualizar estados para el siguiente renderizado
                  setIsSubmitting(true);
                  setButtonLoading('create-batch-modal', true);
                  setModalButtonLoading(true);
                } else {
                  // Prevenir el envío si ya está en proceso
                  e.preventDefault();
                  console.log('🚫 CLICK: Botón ya en proceso, previniendo envío');
                }
              }}
              className="flex-1 sm:flex-none px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSubmitting || isButtonLoading('create-batch-modal') || modalButtonLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{editingBatch ? 'Actualizando...' : 'Creando...'}</span>
                </div>
              ) : (
                editingBatch ? 'Actualizar Lote' : 'Crear Lote'
              )}
            </Button>
          </div>
        </form>
      );

  // Abrir modal para nuevo lote de producto específico
  const openNewBatchForProduct = async (product: InventoryItem) => {
    const buttonId = `new-batch-${product.id}`;
    if (isButtonLoading(buttonId)) return; // Prevenir doble clic
    
    setButtonLoading(buttonId, true);
    try {
      setPreSelectedProduct(product.id);
      openBatchModal();
    } finally {
      setButtonLoading(buttonId, false);
    }
  };

  // Cerrar modal
  const closeBatchModal = () => {
    setEditingBatch(null);
    setPreSelectedProduct(null);
    resetBatch();
  };


  // Eliminar lote
  const handleDelete = async (id: string) => {
    const buttonId = `delete-batch-${id}`;
    if (isButtonLoading(buttonId)) return; // Prevenir doble clic
    
    setButtonLoading(buttonId, true);
    try {
      if (onOpenConfirmationModal) {
        onOpenConfirmationModal(
          'Eliminar Lote',
          'Esta acción colocará el lote como inactivo. Podrás reactivarlo después.',
          async () => {
            try {
              const response = await BatchService.delete(id);
              if (response.data) {
                await loadData();
              }
            } catch (error) {
              console.error('Error eliminando lote:', error);
            }
          }
        );
      } else {
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
      }
    } finally {
      setButtonLoading(buttonId, false);
    }
  };

  // Eliminar permanentemente
  const handleHardDelete = async (id: string) => {
    if (onOpenConfirmationModal) {
      onOpenConfirmationModal(
        'Eliminar Lote Permanentemente',
        '⚠️ Esta acción NO se puede deshacer. Se eliminará definitivamente el lote.',
        async () => {
          try {
            const response = await BatchService.hardDelete(id);
            if (response.data === null) {
              await loadData();
            }
          } catch (error) {
            console.error('Error eliminando permanentemente:', error);
          }
        }
      );
    } else {
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
    }
  };

  // Funciones para modal de filtros
  const openFilterModal = () => {
    setActiveFilters({
      inventory: selectedInventory,
      category: selectedCategory,
      expiry: expiryFilter
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setSelectedInventory(activeFilters.inventory);
    setSelectedCategory(activeFilters.category);
    setExpiryFilter(activeFilters.expiry);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({
      inventory: '',
      category: '',
      expiry: ''
    });
    setSelectedInventory('');
    setSelectedCategory('');
    setExpiryFilter('');
    setShowFilterModal(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedInventory) count++;
    if (selectedCategory) count++;
    if (expiryFilter) count++;
    return count;
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
    <div className="min-h-[80vh] animate-fadeIn">
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

      {/* Toolbar mejorada con más espacio */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-12 py-8 mb-12">
        <div className="flex items-center justify-between gap-12">
          {/* Controles principales */}
          <div className="flex items-center gap-8">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                placeholder="Buscar lotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 w-96 h-12 px-6 text-gray-900 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>

            {/* Botón de filtros */}
            <Button
              onClick={openFilterModal}
              variant="outline"
              className="h-12 px-6 border border-gray-300 rounded-lg bg-white text-gray-900 hover:bg-gray-50 focus:border-orange-500 focus:ring-orange-500"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filtros
              {getActiveFiltersCount() > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded-full">
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
                    ? 'bg-white text-orange-600 shadow-sm' 
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
                    ? 'bg-white text-orange-600 shadow-sm' 
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
                if (isButtonLoading('new-batch-main')) return;
                openBatchModal();
              }}
              disabled={isButtonLoading('new-batch-main')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 h-12 text-sm font-semibold"
            >
              {isButtonLoading('new-batch-main') ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Abriendo...</span>
                </div>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Nuevo Lote
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="px-6">
      {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-orange-600 rounded-full animate-spin"></div>
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cargando lotes</h3>
              <p className="text-gray-500">Obteniendo información de productos y lotes...</p>
            </div>
        </div>
      ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                <Box className="w-12 h-12 text-orange-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-center max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No hay productos disponibles</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                No se encontraron productos que coincidan con los filtros aplicados. 
                Intenta ajustar los filtros o crear un nuevo lote.
              </p>
              <Button 
                onClick={() => openBatchModal()} 
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear primer lote
              </Button>
            </div>
          </div>
      ) : (
        <>
          {displayMode === 'cards' ? (
              // Vista de Cards moderna
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedProducts.map((product) => {
                  const fifoStats = calculateFIFOStats(product);
                  const activeBatches = product.batches.filter(batch => batch.active && batch.quantity > 0);
                  const criticalBatches = activeBatches.filter(batch => {
                    const expiryInfo = getExpiryStatus(batch.expiry_date);
                    return expiryInfo.status === 'expired' || expiryInfo.status === 'expiring';
                  });

                  return (
                    <Card key={product.id} className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white">
                      {/* Header con gradiente */}
                      <div className="relative bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 p-6 border-b border-orange-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Package className="w-7 h-7 text-white" />
                    </div>
                              {criticalBatches.length > 0 && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <AlertTriangle className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-orange-700 transition-colors duration-200">
                                {product.name}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Warehouse className="w-3 h-3 mr-1" />
                                  <span className="truncate">{getInventoryName(product.inventory_id || '')}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <Tags className="w-3 h-3 mr-1" />
                                  <span className="truncate">{getCategoryName(product.category_id || '')}</span>
                                </div>
                              </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openNewBatchForProduct(product)}
                    disabled={isButtonLoading(`new-batch-${product.id}`)}
                    className="h-8 w-8 p-0 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Agregar lote"
                  >
                    {isButtonLoading(`new-batch-${product.id}`) ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                      </div>

                      {/* Contenido principal */}
                      <div className="p-6">
                        {/* Estadísticas principales */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="text-2xl font-bold text-blue-600 mb-1">{product.current_stock}</div>
                            <div className="text-sm font-medium text-blue-800">Stock Total</div>
                            <div className="text-xs text-blue-600 mt-1">{product.unit}</div>
                        </div>
                          <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                            <div className="text-2xl font-bold text-purple-600 mb-1">{activeBatches.length}</div>
                            <div className="text-sm font-medium text-purple-800">Lotes Activos</div>
                            <div className="text-xs text-purple-600 mt-1">Disponibles</div>
                        </div>
                      </div>

                      {/* Información FIFO */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                          <div className="flex items-center mb-3">
                            <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                            <h4 className="font-semibold text-green-800">Valor FIFO</h4>
                          </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                              <div className="text-green-600 font-medium">Costo Promedio</div>
                              <div className="text-green-800 font-bold">${fifoStats.averageCost.toFixed(2)}</div>
                          </div>
                          <div>
                              <div className="text-green-600 font-medium">Valor Total</div>
                              <div className="text-green-800 font-bold">${fifoStats.totalValue.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                        {/* Lotes críticos */}
                        {criticalBatches.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                            <div className="flex items-center mb-2">
                              <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
                              <h4 className="font-semibold text-red-800">Atención Requerida</h4>
                      </div>
                            <p className="text-sm text-red-700">
                              {criticalBatches.length} lote{criticalBatches.length !== 1 ? 's' : ''} crítico{criticalBatches.length !== 1 ? 's' : ''} o vencido{criticalBatches.length !== 1 ? 's' : ''}
                            </p>
                </div>
                        )}

                        {/* Botón expandir */}
                        <div className="flex justify-center">
                <Button
                  variant="outline"
                            size="sm"
                  onClick={() => toggleProductExpansion(product.id)}
                            className="w-full bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900 rounded-xl transition-all duration-200"
                >
                  {product.expanded ? (
                              <>
                                <ChevronDown className="w-4 h-4 mr-2" />
                                Ocultar lotes
                              </>
                  ) : (
                              <>
                                <ChevronRight className="w-4 h-4 mr-2" />
                                Ver lotes ({activeBatches.length})
                              </>
                  )}
                </Button>
                            </div>

                        {/* Sección de lotes expandible */}
                        {product.expanded && (
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold text-gray-900">Lotes del Producto</h4>
                              <span className="text-sm text-gray-500">{activeBatches.length} lote{activeBatches.length !== 1 ? 's' : ''} activo{activeBatches.length !== 1 ? 's' : ''}</span>
                            </div>
                            
                            {activeBatches.length > 0 ? (
                              <div className="space-y-3 max-h-80 overflow-y-auto">
                                {activeBatches
                                  .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                                  .map((batch) => {
                                    const expiryInfo = getExpiryStatus(batch.expiry_date);
                                    return (
                                      <div key={batch.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
                                        <div className="flex items-center space-x-4">
                                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                                            <Hash className="w-5 h-5 text-white" />
                                          </div>
                                          <div>
                                            <div className="flex items-center space-x-2">
                                              <span className="font-semibold text-gray-900">{batch.batch_number}</span>
                                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expiryInfo.color}`}>
                                                {expiryInfo.label}
                                              </span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                              {batch.quantity} {product.unit} • ${batch.cost_per_unit.toFixed(2)} c/u
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              Vence: {new Date(batch.expiry_date).toLocaleDateString()}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <div className="text-right">
                                            <div className="text-sm font-semibold text-gray-900">
                                              ${(batch.quantity * batch.cost_per_unit).toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-500">Valor total</div>
                                          </div>
                                          <div className="flex space-x-1">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleDelete(batch.id)}
                                              disabled={isButtonLoading(`delete-batch-${batch.id}`)}
                                              className="h-7 w-7 p-0 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                              title="Eliminar lote"
                                            >
                                              {isButtonLoading(`delete-batch-${batch.id}`) ? (
                                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-red-600 border-t-transparent"></div>
                                              ) : (
                                                <Trash2 className="w-3.5 h-3.5" />
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <Package className="w-8 h-8 text-gray-400" />
                                </div>
                                <h5 className="text-lg font-medium text-gray-900 mb-2">No hay lotes activos</h5>
                                <p className="text-gray-500 mb-4">Este producto no tiene lotes disponibles.</p>
                                <Button
                                  size="sm"
                                  onClick={() => openNewBatchForProduct(product)}
                                  disabled={isButtonLoading(`new-batch-${product.id}`)}
                                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isButtonLoading(`new-batch-${product.id}`) ? (
                                    <div className="flex items-center space-x-2">
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                      <span>Creando...</span>
                                    </div>
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4 mr-2" />
                                      Crear primer lote
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                          </div>
            </Card>
                  );
                })}
                    </div>
            ) : (
              // Vista de Tabla moderna
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800">Producto</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800">Inventario</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-orange-800">Categoría</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-orange-800">Stock</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-orange-800">Lotes</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-orange-800">Valor FIFO</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-orange-800">Estado</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-orange-800">Acciones</th>
                        </tr>
                      </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedProducts.map((product) => {
                        const fifoStats = calculateFIFOStats(product);
                        const activeBatches = product.batches.filter(batch => batch.active && batch.quantity > 0);
                        const criticalBatches = activeBatches.filter(batch => {
                          const expiryInfo = getExpiryStatus(batch.expiry_date);
                          return expiryInfo.status === 'expired' || expiryInfo.status === 'expiring';
                        });

                        return (
                          <React.Fragment key={product.id}>
                            <tr className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                                    <Package className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{product.name}</div>
                                    <div className="text-sm text-gray-500">{product.unit}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Warehouse className="w-4 h-4 mr-2 text-gray-400" />
                                  {getInventoryName(product.inventory_id || '')}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Tags className="w-4 h-4 mr-2 text-gray-400" />
                                  {getCategoryName(product.category_id || '')}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="text-lg font-bold text-blue-600">{product.current_stock}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="text-lg font-bold text-purple-600">{activeBatches.length}</div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="text-sm">
                                  <div className="font-semibold text-green-600">${fifoStats.averageCost.toFixed(2)}</div>
                                  <div className="text-xs text-gray-500">promedio</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {criticalBatches.length > 0 ? (
                                  <div className="flex items-center justify-center">
                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                      <AlertTriangle className="w-4 h-4 text-red-600" />
                                    </div>
                                    <span className="ml-2 text-sm font-medium text-red-600">
                                      {criticalBatches.length} crítico{criticalBatches.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    </div>
                                    <span className="ml-2 text-sm font-medium text-green-600">Normal</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => openNewBatchForProduct(product)}
                                    disabled={isButtonLoading(`new-batch-${product.id}`)}
                                    className="h-8 w-8 p-0 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Agregar lote"
                                  >
                                    {isButtonLoading(`new-batch-${product.id}`) ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    ) : (
                                      <Plus className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleProductExpansion(product.id)}
                                    className="h-8 w-8 p-0 bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900 rounded-lg transition-all duration-200"
                                    title="Ver lotes"
                                  >
                                    {product.expanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Fila expandible con lotes */}
                            {product.expanded && (
                              <tr>
                                <td colSpan={8} className="px-6 py-4 bg-gray-50">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-lg font-semibold text-gray-900">Lotes del Producto</h4>
                                      <span className="text-sm text-gray-500">{activeBatches.length} lote{activeBatches.length !== 1 ? 's' : ''} activo{activeBatches.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    
                                    {activeBatches.length > 0 ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {activeBatches
                                          .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime())
                                          .map((batch) => {
                                            const expiryInfo = getExpiryStatus(batch.expiry_date);
                                            return (
                                              <div key={batch.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
                                                <div className="flex items-start justify-between mb-3">
                                                  <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                                                      <Hash className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                      <div className="font-semibold text-gray-900">{batch.batch_number}</div>
                                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expiryInfo.color}`}>
                                                        {expiryInfo.label}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(batch.id)}
                                                    disabled={isButtonLoading(`delete-batch-${batch.id}`)}
                                                    className="h-6 w-6 p-0 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Eliminar lote"
                                                  >
                                                    {isButtonLoading(`delete-batch-${batch.id}`) ? (
                                                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 border-t-transparent"></div>
                                                    ) : (
                                                      <Trash2 className="w-3 h-3" />
                                                    )}
                                                  </Button>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                  <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Cantidad:</span>
                                                    <span className="font-medium text-gray-900">{batch.quantity} {product.unit}</span>
                                                  </div>
                                                  <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Costo unitario:</span>
                                                    <span className="font-medium text-gray-900">${batch.cost_per_unit.toFixed(2)}</span>
                                                  </div>
                                                  <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Valor total:</span>
                                                    <span className="font-semibold text-green-600">${(batch.quantity * batch.cost_per_unit).toFixed(2)}</span>
                                                  </div>
                                                  <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Vence:</span>
                                                    <span className="font-medium text-gray-900">{new Date(batch.expiry_date).toLocaleDateString()}</span>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>
                                    ) : (
                                      <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                          <Package className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h5 className="text-lg font-medium text-gray-900 mb-2">No hay lotes activos</h5>
                                        <p className="text-gray-500 mb-4">Este producto no tiene lotes disponibles.</p>
                                        <Button
                                          size="sm"
                                          onClick={() => openNewBatchForProduct(product)}
                                          disabled={isButtonLoading(`new-batch-${product.id}`)}
                                          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {isButtonLoading(`new-batch-${product.id}`) ? (
                                            <div className="flex items-center space-x-2">
                                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                              <span>Creando...</span>
                                            </div>
                                          ) : (
                                            <>
                                              <Plus className="w-4 h-4 mr-2" />
                                              Crear primer lote
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
            </div>
          )}

          {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
              </div>
            )}
        </>
      )}
      </div>

      {/* Modal local de lotes */}
      {showBatchModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeBatchModalLocal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {editingBatch ? 'Editar Lote' : 'Nuevo Lote'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {editingBatch ? 'Modifica los datos del lote' : 'Completa la información del nuevo lote'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={closeBatchModalLocal}
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
              {batchModalContent}
            </div>
          </div>
        </div>,
        document.body
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
                    <h2 className="text-xl font-bold text-gray-900">Filtros de Lotes</h2>
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
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:ring-orange-500"
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
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                  >
                    <option value="">Todas las categorías</option>
                    {(Array.isArray(categories) ? categories : []).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Estado de Vencimiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de Vencimiento
                  </label>
                  <select
                    value={activeFilters.expiry}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, expiry: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:ring-orange-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="expired">🔴 Vencidos</option>
                    <option value="expiring">🟡 Críticos</option>
                    <option value="soon">🟠 Próximos</option>
                    <option value="good">🟢 Buenos</option>
                    <option value="critical">⚠️ Críticos</option>
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

    </div>
  );
}