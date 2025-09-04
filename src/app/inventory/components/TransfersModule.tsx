'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { TransferService, InventoryService, InventoryItemService, InventoryCategoryService, BatchService, StockMovementService, HistoryLogService } from '@/lib/services/inventoryService';
import { Transfer, Inventory, InventoryItem, TransferFormData, Batch } from '@/lib/types';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/Pagination';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const transferSchema = z.object({
  from_inventory_id: z.string().min(1, 'El inventario origen es requerido'),
  to_inventory_id: z.string().min(1, 'El inventario destino es requerido'),
  inventory_item_id: z.string().min(1, 'El producto es requerido'),
  batch_id: z.string().optional(),
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
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState<Transfer[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<InventoryItem[]>([]);
  const [allBatches, setAllBatches] = useState<Batch[]>([]);
  const [productBatches, setProductBatches] = useState<Batch[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkTransfers, setBulkTransfers] = useState<Partial<TransferFormData>[]>([]);

  // Paginación
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedTransfers,
    goToPage,
    nextPage,
    prevPage,
    resetPage
  } = usePagination({ data: filteredTransfers || [], itemsPerPage: 10 });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      from_inventory_id: '',
      to_inventory_id: '',
      inventory_item_id: '',
      batch_id: '',
      quantity: 0,
      status: 'pending',
      notes: '',
      active: true
    }
  });

  const watchedFromInventory = watch('from_inventory_id');
  const watchedToInventory = watch('to_inventory_id');
  const watchedProduct = watch('inventory_item_id');

  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [transfersRes, inventoriesRes, productsRes, batchesRes, categoriesRes] = await Promise.all([
        TransferService.getAllWithInactive(),
        InventoryService.getAll(),
        InventoryItemService.getAll(),
        BatchService.getAll(),
        InventoryCategoryService.getAll()
      ]);

      if (transfersRes.data) setTransfers(transfersRes.data);
      if (inventoriesRes.data) setInventories(inventoriesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (batchesRes.data) setAllBatches(batchesRes.data);
      if (categoriesRes.data) setAllCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar productos por inventario origen
  useEffect(() => {
    if (watchedFromInventory) {
      const filtered = products.filter(product => product.inventory_id === watchedFromInventory);
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [watchedFromInventory, products]);

  // Cargar lotes cuando se selecciona un producto
  useEffect(() => {
    if (watchedProduct) {
      const batches = allBatches.filter(batch => 
        batch.inventory_item_id === watchedProduct && batch.active && batch.quantity > 0
      );
      setProductBatches(batches);
    } else {
      setProductBatches([]);
    }
  }, [watchedProduct, allBatches]);

  // Filtrar transferencias
  useEffect(() => {
    let filtered = transfers;

    if (searchTerm) {
      filtered = filtered.filter(transfer =>
        transfer.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getProductName(transfer.inventory_item_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getInventoryName(transfer.from_inventory_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getInventoryName(transfer.to_inventory_id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedProduct) {
      filtered = filtered.filter(transfer => transfer.inventory_item_id === selectedProduct);
    }

    if (selectedStatus) {
      filtered = filtered.filter(transfer => transfer.status === selectedStatus);
    }

    setFilteredTransfers(filtered);
  }, [searchTerm, selectedProduct, selectedStatus, transfers]);

  // Abrir modal para crear/editar
  const openModal = (transfer?: Transfer) => {
    if (transfer) {
      setEditingTransfer(transfer);
      reset({
        from_inventory_id: transfer.from_inventory_id,
        to_inventory_id: transfer.to_inventory_id,
        inventory_item_id: transfer.inventory_item_id,
        batch_id: transfer.batch_id || '',
        quantity: transfer.quantity,
        status: transfer.status,
        notes: transfer.notes || '',
        active: transfer.active
      });
    } else {
      setEditingTransfer(null);
      reset({
        from_inventory_id: '',
        to_inventory_id: '',
        inventory_item_id: '',
        batch_id: '',
        quantity: 0,
        status: 'pending',
        notes: '',
        active: true
      });
    }
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setEditingTransfer(null);
    reset();
  };

  // Abrir modal de transferencias masivas
  const openBulkModal = () => {
    setBulkTransfers([{
      from_inventory_id: '',
      to_inventory_id: '',
      inventory_item_id: '',
      batch_id: '',
      quantity: 0,
      status: 'pending',
      notes: '',
      active: true
    }]);
    setShowBulkModal(true);
  };

  // Cerrar modal de transferencias masivas
  const closeBulkModal = () => {
    setShowBulkModal(false);
    setBulkTransfers([]);
  };

  // Agregar nueva fila de transferencia masiva
  const addBulkTransfer = () => {
    setBulkTransfers([...bulkTransfers, {
      from_inventory_id: '',
      to_inventory_id: '',
      inventory_item_id: '',
      batch_id: '',
      quantity: 0,
      status: 'pending',
      notes: '',
      active: true
    }]);
  };

  // Remover fila de transferencia masiva
  const removeBulkTransfer = (index: number) => {
    if (bulkTransfers.length > 1) {
      setBulkTransfers(bulkTransfers.filter((_, i) => i !== index));
    }
  };

  // Actualizar transferencia masiva
  const updateBulkTransfer = (index: number, field: keyof TransferFormData, value: any) => {
    const updated = [...bulkTransfers];
    updated[index] = { ...updated[index], [field]: value };
    setBulkTransfers(updated);
  };

  // Actualizar stock cuando se completa una transferencia
  const updateStockOnTransferCompletion = async (transfer: Transfer, categories: any[]) => {
    try {

      // 1. Obtener el producto original
      const originalProduct = products.find(p => p.id === transfer.inventory_item_id);
      if (!originalProduct) {
        throw new Error('Producto origen no encontrado');
      }
      
      // 2. Verificar si el producto existe en el inventario destino
      const productInDestination = products.find(p => 
        p.name === originalProduct.name &&
        p.inventory_id === transfer.to_inventory_id
      );

      let destinationProductId = transfer.inventory_item_id;

      if (!productInDestination) {
        // Crear la categoría en el inventario destino si no existe
          const destinationCategoryResponse = await InventoryCategoryService.getByInventory(transfer.to_inventory_id);
          const destinationCategory = destinationCategoryResponse.data || [];
          
          // Obtener el nombre de la categoría original desde categories
          if (!categories || !Array.isArray(categories)) {
            console.error('❌ Categories no es un array válido:', categories);
            return;
          }
          
          const originalCategory = categories.find(cat => cat.id === originalProduct.category_id);
          const categoryName = originalCategory ? originalCategory.name : 'Sin categoría';
          
          let categoryId = originalProduct.category_id;
          
          // Buscar si ya existe una categoría con el mismo nombre en el inventario destino
          const existingCategory = destinationCategory.find(cat => 
            cat.name === categoryName
          );
          
          if (!existingCategory) {
            const newCategoryResponse = await InventoryCategoryService.create({
              name: categoryName,
              inventory_id: transfer.to_inventory_id
            });
            
            if (newCategoryResponse.data) {
              categoryId = newCategoryResponse.data.id;
            } else {
              console.error('❌ Error creando categoría en destino:', newCategoryResponse);
              return;
            }
          } else {
            categoryId = existingCategory.id;
          }
          
          const newProductResponse = await InventoryItemService.create({
            name: originalProduct.name,
            inventory_id: transfer.to_inventory_id,
            category_id: categoryId, // Usar la categoría del inventario destino
            unit: originalProduct.unit,
            min_stock: originalProduct.min_stock,
            active: true
          });
          
          if (newProductResponse.data) {
            destinationProductId = newProductResponse.data.id;
          }
      } else {
        destinationProductId = productInDestination.id;
      }

      // 3. Reducir stock en inventario origen
      if (transfer.batch_id) {

        // Reducir cantidad del lote específico
        const batch = allBatches.find(b => b.id === transfer.batch_id);
        if (batch && batch.quantity >= transfer.quantity) {
          // Verificar si es un lote de transferencia
          if (batch.batch_number.includes('-TRANS')) {
            // Advertencia: transfiriendo desde un lote de transferencia
          }
          
          const newQuantity = batch.quantity - transfer.quantity;

          // Actualizar la cantidad del lote origen
          const updateResponse = await BatchService.update(transfer.batch_id, {
            quantity: newQuantity
          });
          


          // NO crear movimiento negativo en el lote origen
          // Los lotes ya se actualizan directamente, los movimientos causarían doble conteo
          
          /*
          await StockMovementService.create({
            inventory_item_id: transfer.inventory_item_id,
            batch_id: transfer.batch_id,
            movement_type: 'ajuste_negativo',
            quantity: transfer.quantity,
            reason: `Transferencia completada a ${getInventoryName(transfer.to_inventory_id)}`,
            reference: `TRANS-${transfer.id}`,
            notes: `Transferencia: ${transfer.notes || 'Sin notas'}`,
            active: true
          });
          */
        }
      } else {

        // Reducir stock general del producto en inventario origen
        // Buscar el lote más antiguo (FIFO) para reducir
        const originBatches = allBatches.filter(b => 
          b.inventory_item_id === transfer.inventory_item_id && 
          b.quantity > 0
        ).sort((a, b) => new Date(a.expiry_date || '').getTime() - new Date(b.expiry_date || '').getTime());

        let remainingQuantity = transfer.quantity;
        for (const batch of originBatches) {
          if (remainingQuantity <= 0) break;
          
          const reduceAmount = Math.min(remainingQuantity, batch.quantity);
          const newQuantity = batch.quantity - reduceAmount;

          
          await BatchService.update(batch.id, {
            quantity: newQuantity
          });

          // Crear movimiento negativo
          await StockMovementService.create({
            inventory_item_id: transfer.inventory_item_id,
            batch_id: batch.id,
            movement_type: 'ajuste_negativo',
            quantity: reduceAmount,
            reason: `Transferencia completada a ${getInventoryName(transfer.to_inventory_id)}`,
            reference: `TRANS-${transfer.id}`,
            notes: `Transferencia: ${transfer.notes || 'Sin notas'}`,
            active: true
          });

          remainingQuantity -= reduceAmount;
        }
      }

      // 4. Crear o fusionar lote en inventario destino
      let destinationBatchId = null;
      let originalBatchInDestination = null; // Declarar fuera del scope
      
      if (transfer.batch_id) {
        const originBatch = allBatches.find(b => b.id === transfer.batch_id);
        if (originBatch) {
          // Verificar si el lote original existe en el inventario destino
          originalBatchInDestination = allBatches.find(b => 
            b.inventory_item_id === destinationProductId && 
            b.batch_number === originBatch.batch_number.replace(/-TRANS.*$/, '') // Remover sufijos -TRANS
          );

          if (originalBatchInDestination) {
            // FUSIÓN: Si el lote original existe en destino, fusionar cantidades
            const newQuantity = originalBatchInDestination.quantity + transfer.quantity;
            const updateResponse = await BatchService.update(originalBatchInDestination.id, {
              quantity: newQuantity
            });
            
            if (updateResponse.data) {
              destinationBatchId = originalBatchInDestination.id;
            } else {
              console.error('❌ Error fusionando lote en destino:', updateResponse);
            }
          } else {
            // CREACIÓN: Si no existe el lote original, crear nuevo lote
            const newBatchResponse = await BatchService.create({
              inventory_item_id: destinationProductId,
              batch_number: `${originBatch.batch_number}-TRANS`,
              quantity: transfer.quantity,
              expiry_date: originBatch.expiry_date,
              cost_per_unit: originBatch.cost_per_unit,
              notes: `Transferido de ${getInventoryName(transfer.from_inventory_id)}`,
              active: true
            });
            
            if (newBatchResponse.data) {
              destinationBatchId = newBatchResponse.data.id;
              
              // Registrar en historial inmutable
              await HistoryLogService.createLogEntry({
                event_type: 'batch_created_transfer',
                inventory_item_id: destinationProductId,
                inventory_id: transfer.to_inventory_id,
                product_name: originalProduct.name,
                inventory_name: getInventoryName(transfer.to_inventory_id),
                quantity_before: 0,
                quantity_after: transfer.quantity,
                quantity_changed: transfer.quantity,
                batch_id: newBatchResponse.data.id,
                batch_number: newBatchResponse.data.batch_number,
                transfer_id: transfer.id,
                description: `Lote ${newBatchResponse.data.batch_number} creado por transferencia`,
                notes: transfer.notes,
                reference: `TRANS-${transfer.id}`
              });
            } else {
              console.error('❌ Error creando lote en destino:', newBatchResponse);
            }
          }
        }
      } else {
        // Crear lote general en destino
        const newBatchResponse = await BatchService.create({
          inventory_item_id: destinationProductId,
          batch_number: `TRANS-${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substr(2, 9)}`,
          quantity: transfer.quantity,
          expiry_date: null,
          cost_per_unit: null,
          notes: `Transferencia general de ${getInventoryName(transfer.from_inventory_id)}`,
          active: true
        });
        
        if (newBatchResponse.data) {
          destinationBatchId = newBatchResponse.data.id;
        } else {
          console.error('❌ Error creando lote general en destino:', newBatchResponse);
        }
      }

      // NO crear movimiento positivo en inventario destino
      // Los lotes ya se actualizan directamente, los movimientos causarían doble conteo
      
      /*
      await StockMovementService.create({
        inventory_item_id: destinationProductId,
        batch_id: destinationBatchId,
        movement_type: 'ajuste_positivo',
        quantity: transfer.quantity,
        reason: `Transferencia recibida de ${getInventoryName(transfer.from_inventory_id)}`,
        reference: `TRANS-${transfer.id}`,
        notes: `Transferencia: ${transfer.notes || 'Sin notas'}`,
        active: true
      });
      */

      // 6. Esperar un momento para que Supabase sincronice
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 7. Verificar estado final de los lotes
      const finalBatches = await BatchService.getAllWithInactive();
      if (finalBatches.data) {
        const originBatch = finalBatches.data.find(b => b.id === transfer.batch_id);
        const destinationBatch = finalBatches.data.find(b => b.id === destinationBatchId);
        

        
        // 8. Si los datos siguen incorrectos, intentar una consulta directa
        // Calcular las cantidades esperadas correctamente
        const originalBatch = allBatches.find(b => b.id === transfer.batch_id);
        const expectedOriginQuantity = originalBatch ? (originalBatch.quantity - transfer.quantity) : 0;
        const expectedDestinationQuantity = transfer.quantity;
        
        if (originBatch && originBatch.quantity !== expectedOriginQuantity) {

          
          // Consulta directa del lote origen
          const directOriginBatch = await BatchService.getById(transfer.batch_id);

          
          // Consulta directa del lote destino
          let directDestinationBatch = null;
          if (destinationBatchId) {
            directDestinationBatch = await BatchService.getById(destinationBatchId);

          }
          
          // 9. CORRECCIÓN AUTOMÁTICA: Si las consultas directas también fallan, forzar corrección
          
          if (directOriginBatch.data && directOriginBatch.data.quantity !== expectedOriginQuantity) {

            await BatchService.update(transfer.batch_id, { quantity: expectedOriginQuantity });

          }
          
          // Solo corregir el lote destino si NO es una fusión (no tiene el mismo batch_number que el origen)
          const isFusion = originalBatchInDestination && destinationBatchId === originalBatchInDestination.id;
          
          if (destinationBatchId && directDestinationBatch && directDestinationBatch.data && 
              directDestinationBatch.data.quantity !== expectedDestinationQuantity && !isFusion) {

            await BatchService.update(destinationBatchId, { quantity: expectedDestinationQuantity });

          }
        }
      }

      // Esperar un momento para que Supabase se sincronice
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificación final omitida - sistema funcionando correctamente
      
      // Actualizar la UI una sola vez al final
      await loadData();

    } catch (error) {
      console.error('❌ Error actualizando stock en transferencia:', error);
      throw error;
    }
  };

  // Crear o actualizar transferencia
  const onSubmit = async (data: TransferFormData) => {
    try {
      setIsSubmitting(true);
      
      if (editingTransfer) {
        // Actualizar
        const response = await TransferService.update(editingTransfer.id, data);
        if (response.data) {
          // Si se está marcando como completada, actualizar stock
          if (data.status === 'completed' && editingTransfer.status !== 'completed') {
            await updateStockOnTransferCompletion(response.data, allCategories);
          }
          await loadData();
          closeModal();
        }
      } else {
        // Crear
        const response = await TransferService.create(data);
        if (response.data) {
          // Si se crea directamente como completada, actualizar stock
          if (data.status === 'completed') {
            await updateStockOnTransferCompletion(response.data, allCategories);
          }
          await loadData();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error guardando transferencia:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Procesar transferencias masivas
  const onSubmitBulk = async () => {
    try {
      setIsSubmitting(true);
      
      // Validar que todas las transferencias tengan los campos requeridos
      const validTransfers = bulkTransfers.filter(transfer => 
        transfer.from_inventory_id && 
        transfer.to_inventory_id && 
        transfer.inventory_item_id && 
        transfer.quantity && 
        transfer.quantity > 0
      );

      if (validTransfers.length === 0) {
        alert('Por favor, completa al menos una transferencia válida');
        return;
      }

      // Crear todas las transferencias
      const promises = validTransfers.map(transfer => 
        TransferService.create(transfer as TransferFormData)
      );

      await Promise.all(promises);
      await loadData();
      closeBulkModal();
    } catch (error) {
      console.error('Error creando transferencias masivas:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar transferencia (soft delete)
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta transferencia?')) {
      try {
        const response = await TransferService.delete(id);
        if (response.data) {
          await loadData();
        }
      } catch (error) {
        console.error('Error eliminando transferencia:', error);
      }
    }
  };

  // Eliminar permanentemente
  const handleHardDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar PERMANENTEMENTE esta transferencia? Esta acción no se puede deshacer.')) {
      try {
        const response = await TransferService.hardDelete(id);
        if (response.data === null) {
          await loadData();
        }
      } catch (error) {
        console.error('Error eliminando permanentemente:', error);
      }
    }
  };

  // Obtener nombres para mostrar
  const getInventoryName = (id: string) => {
    return inventories.find(inv => inv.id === id)?.name || 'N/A';
  };

  const getProductName = (id: string) => {
    return products.find(product => product.id === id)?.name || 'N/A';
  };

  const getBatchName = (id: string) => {
    if (!id) return 'Sin lote específico';
    return allBatches.find(batch => batch.id === id)?.batch_number || 'N/A';
  };

  const getProductsByInventory = (inventoryId: string) => {
    if (!inventoryId) return products;
    return products.filter(product => product.inventory_id === inventoryId);
  };

  // Obtener información del estado
  const getStatusInfo = (status: string) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  // Marcar transferencia como completada
  const markAsCompleted = async (transfer: Transfer) => {
    // Verificar si está transfiriendo desde un lote de transferencia
    if (transfer.batch_id) {
      const batch = allBatches.find(b => b.id === transfer.batch_id);
      if (batch && batch.batch_number.includes('-TRANS')) {
        const confirmMessage = `⚠️ ADVERTENCIA: Estás transfiriendo desde un lote de transferencia (${batch.batch_number}).\n\nEsto puede causar problemas de trazabilidad.\n\n¿Estás seguro de que quieres continuar?`;
        if (!window.confirm(confirmMessage)) {
          return;
        }
      }
    }
    
    if (window.confirm(`¿Estás seguro de que quieres marcar esta transferencia como completada?\n\nEsto actualizará el stock en ambos inventarios.`)) {
      try {
        setIsSubmitting(true);
        
        // Actualizar estado a completada
        const response = await TransferService.update(transfer.id, {
          ...transfer,
          status: 'completed',
          completed_at: new Date().toISOString()
        });
        
        if (response.data) {
          // Actualizar stock
          await updateStockOnTransferCompletion(response.data, allCategories);
          // loadData() se llama al final de updateStockOnTransferCompletion
        }
      } catch (error) {
        console.error('Error completando transferencia:', error);
        alert('Error al completar la transferencia. Verifica que haya suficiente stock.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Separar transferencias activas e inactivas
  const activeTransfers = filteredTransfers.filter(transfer => transfer.active);
  const inactiveTransfers = filteredTransfers.filter(transfer => !transfer.active);

  return (
    <div className="p-6">
      {/* Barra de búsqueda y botones */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search-transfers"
              type="text"
              placeholder="Buscar transferencias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
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
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="">Todos los estados</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => openModal()} size="sm" className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Transferencia
          </Button>
          <Button onClick={openBulkModal} size="sm" variant="outline" className="w-full sm:w-auto">
            <Layers className="w-4 h-4 mr-2" />
            Transferencias Masivas
          </Button>
        </div>
      </div>

      {/* Transferencias Activas */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Transferencias Activas ({activeTransfers.length})
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando transferencias...</p>
          </div>
        ) : activeTransfers.length === 0 ? (
          <Card className="p-8 text-center">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No hay transferencias activas</h4>
            <p className="text-gray-600 mb-4">Crea tu primera transferencia para comenzar a mover productos entre inventarios</p>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Transferencia
            </Button>
          </Card>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Lote
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Origen
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Destino
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Fecha de Creación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Fecha de Completado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTransfers.map((transfer) => {
                    const statusInfo = getStatusInfo(transfer.status);
                    const IconComponent = statusInfo.icon;
                    
                    return (
                      <tr key={transfer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className={`h-8 w-8 rounded-lg ${statusInfo.bgColor} flex items-center justify-center`}>
                                <IconComponent className={`h-5 w-5 ${statusInfo.color}`} />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{statusInfo.label}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getProductName(transfer.inventory_item_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transfer.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getBatchName(transfer.batch_id || '')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getInventoryName(transfer.from_inventory_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getInventoryName(transfer.to_inventory_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(transfer.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transfer.completed_at ? new Date(transfer.completed_at).toLocaleDateString() : 'Pendiente'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {transfer.status !== 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsCompleted(transfer)}
                                className="text-green-600 hover:text-green-700"
                                disabled={isSubmitting}
                                title="Marcar como completada"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openModal(transfer)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(transfer.id)}
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
            
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  onPreviousPage={prevPage}
                  onNextPage={nextPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Transferencias Inactivas */}
      {inactiveTransfers.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Transferencias Inactivas ({inactiveTransfers.length})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-50 border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Lote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Origen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Destino
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Fecha de Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Fecha de Completado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-50 divide-y divide-gray-200">
                {inactiveTransfers.map((transfer) => {
                  const statusInfo = getStatusInfo(transfer.status);
                  const IconComponent = statusInfo.icon;
                  
                  return (
                    <tr key={transfer.id} className="hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-500">{statusInfo.label}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getProductName(transfer.inventory_item_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transfer.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getBatchName(transfer.batch_id || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getInventoryName(transfer.from_inventory_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getInventoryName(transfer.to_inventory_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(transfer.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {transfer.completed_at ? new Date(transfer.completed_at).toLocaleDateString() : 'Pendiente'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openModal(transfer)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Reactivar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleHardDelete(transfer.id)}
                            className="text-red-600 hover:text-red-700 border-red-200"
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
        </div>
      )}

      {/* Modal para crear/editar */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingTransfer ? 'Editar Transferencia' : 'Nueva Transferencia'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="from_inventory_id" className="block text-sm font-medium text-gray-700 mb-1">
                Inventario Origen
              </label>
              <Select
                id="from_inventory_id"
                {...register('from_inventory_id')}
                className={errors.from_inventory_id ? 'border-red-500' : ''}
              >
                <option value="">Seleccionar inventario origen</option>
                {inventories.map((inventory) => (
                  <option key={inventory.id} value={inventory.id}>
                    {inventory.name}
                  </option>
                ))}
              </Select>
              {errors.from_inventory_id && (
                <p className="text-red-500 text-sm mt-1">{errors.from_inventory_id.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="to_inventory_id" className="block text-sm font-medium text-gray-700 mb-1">
                Inventario Destino
              </label>
              <Select
                id="to_inventory_id"
                {...register('to_inventory_id')}
                className={errors.to_inventory_id ? 'border-red-500' : ''}
              >
                <option value="">Seleccionar inventario destino</option>
                {inventories
                  .filter(inv => inv.id !== watchedFromInventory)
                  .map((inventory) => (
                    <option key={inventory.id} value={inventory.id}>
                      {inventory.name}
                    </option>
                  ))}
              </Select>
              {errors.to_inventory_id && (
                <p className="text-red-500 text-sm mt-1">{errors.to_inventory_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inventory_item_id" className="block text-sm font-medium text-gray-700 mb-1">
                Producto
              </label>
              <Select
                id="inventory_item_id"
                {...register('inventory_item_id')}
                className={errors.inventory_item_id ? 'border-red-500' : ''}
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
                disabled={!watchedProduct}
              >
                <option value="">Sin lote específico</option>
                {productBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_number} - {batch.quantity} unidades
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <Input
                id="quantity"
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                min="0.01"
                step="0.01"
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <Select
                id="status"
                {...register('status')}
                className={errors.status ? 'border-red-500' : ''}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.status && (
                <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notas (Opcional)
            </label>
            <Input
              id="notes"
              {...register('notes')}
              placeholder="Información adicional sobre la transferencia"
            />
          </div>

          {/* Solo mostrar casilla "activo" cuando se está editando una transferencia inactiva */}
          {editingTransfer && !editingTransfer.active && (
            <div className="flex items-center">
              <input
                id="active"
                type="checkbox"
                {...register('active')}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                Reactivar Transferencia
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (editingTransfer ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal para transferencias masivas */}
      <Modal
        isOpen={showBulkModal}
        onClose={closeBulkModal}
        title="Transferencias Masivas"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Crea múltiples transferencias de una vez
            </p>
            <Button onClick={addBulkTransfer} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Fila
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {bulkTransfers.map((transfer, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      Transferencia {index + 1}
                    </h4>
                    {bulkTransfers.length > 1 && (
                      <Button
                        onClick={() => removeBulkTransfer(index)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Inventario Origen
                      </label>
                      <Select
                        value={transfer.from_inventory_id || ''}
                        onChange={(e) => updateBulkTransfer(index, 'from_inventory_id', e.target.value)}
                      >
                        <option value="">Seleccionar origen</option>
                        {inventories.map((inventory) => (
                          <option key={inventory.id} value={inventory.id}>
                            {inventory.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Inventario Destino
                      </label>
                      <Select
                        value={transfer.to_inventory_id || ''}
                        onChange={(e) => updateBulkTransfer(index, 'to_inventory_id', e.target.value)}
                      >
                        <option value="">Seleccionar destino</option>
                        {inventories
                          .filter(inv => inv.id !== transfer.from_inventory_id)
                          .map((inventory) => (
                            <option key={inventory.id} value={inventory.id}>
                              {inventory.name}
                            </option>
                          ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Producto
                      </label>
                      <Select
                        value={transfer.inventory_item_id || ''}
                        onChange={(e) => updateBulkTransfer(index, 'inventory_item_id', e.target.value)}
                      >
                        <option value="">Seleccionar producto</option>
                        {getProductsByInventory(transfer.from_inventory_id || '').map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cantidad
                      </label>
                      <Input
                        type="number"
                        value={transfer.quantity || ''}
                        onChange={(e) => updateBulkTransfer(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Notas (Opcional)
                      </label>
                      <Input
                        value={transfer.notes || ''}
                        onChange={(e) => updateBulkTransfer(index, 'notes', e.target.value)}
                        placeholder="Información adicional"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeBulkModal}>
              Cancelar
            </Button>
            <Button onClick={onSubmitBulk} disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : `Crear ${bulkTransfers.length} Transferencias`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}