import { supabase } from '@/lib/supabase/client';
import { 
  Inventory, 
  InventoryCategory, 
  InventoryItem, 
  Batch, 
  StockMovement, 
  Transfer,
  ApiResponse,
  InventoryItemFormData
} from '@/lib/types';

// ===== SERVICIOS DE INVENTARIOS (ALMACENES) =====
export class InventoryService {
  static async getAll(): Promise<ApiResponse<Inventory[]>> {
    try {
      const { data, error } = await supabase
        .from('inventories')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getAllWithInactive(): Promise<ApiResponse<Inventory[]>> {
    try {
      const { data, error } = await supabase
        .from('inventories')
        .select('*')
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async create(inventory: Omit<Inventory, 'id' | 'created_at'>): Promise<ApiResponse<Inventory>> {
    try {
      const { data, error } = await supabase
        .from('inventories')
        .insert(inventory)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getById(id: string): Promise<ApiResponse<Inventory>> {
    try {
      const { data, error } = await supabase
        .from('inventories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async update(id: string, inventory: Partial<Inventory>): Promise<ApiResponse<Inventory>> {
    try {
      const { data, error } = await supabase
        .from('inventories')
        .update(inventory)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async delete(id: string): Promise<ApiResponse<Inventory>> {
    try {
      const { data, error } = await supabase
        .from('inventories')
        .update({ active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async hardDelete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('inventories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
}

// ===== SERVICIOS DE CATEGORÍAS DE INVENTARIO =====
export class InventoryCategoryService {
  static async getAll(): Promise<ApiResponse<InventoryCategory[]>> {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getAllWithInactive(): Promise<ApiResponse<InventoryCategory[]>> {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getByInventory(inventoryId: string): Promise<ApiResponse<InventoryCategory[]>> {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('inventory_id', inventoryId)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async create(category: Omit<InventoryCategory, 'id' | 'created_at'>): Promise<ApiResponse<InventoryCategory>> {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async update(id: string, category: Partial<InventoryCategory>): Promise<ApiResponse<InventoryCategory>> {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async delete(id: string): Promise<ApiResponse<InventoryCategory>> {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .update({ active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async hardDelete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('inventory_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
}

// ===== SERVICIOS DE PRODUCTOS DE INVENTARIO =====
export class InventoryItemService {
  static async getAll(): Promise<ApiResponse<InventoryItem[]>> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getAllWithInactive(): Promise<ApiResponse<InventoryItem[]>> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getByCategory(categoryId: string): Promise<ApiResponse<InventoryItem[]>> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('category_id', categoryId)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getByInventory(inventoryId: string): Promise<ApiResponse<InventoryItem[]>> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('inventory_id', inventoryId)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getByInventoryAndCategory(inventoryId: string, categoryId: string): Promise<ApiResponse<InventoryItem[]>> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('inventory_id', inventoryId)
        .eq('category_id', categoryId)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async create(item: Omit<InventoryItem, 'id' | 'created_at'>): Promise<ApiResponse<InventoryItem>> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;

      // Crear log histórico para la creación del producto
      if (data) {
        const inventory = await InventoryService.getById(item.inventory_id);
        const inventoryName = inventory.data?.name || 'Inventario desconocido';
        
        await HistoryLogService.createLogEntry({
          event_type: 'product_created',
          inventory_item_id: data.id,
          inventory_id: item.inventory_id,
          product_name: item.name,
          inventory_name: inventoryName,
          quantity_before: 0,
          quantity_after: 0,
          quantity_changed: 0,
          description: `Producto ${item.name} creado en ${inventoryName}`,
          notes: `Unidad: ${item.unit}, Stock mínimo: ${item.min_stock}`,
          reference: `PROD-${data.id}`
        });
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getById(id: string): Promise<ApiResponse<InventoryItem>> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async update(id: string, item: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(item)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async delete(id: string): Promise<ApiResponse<InventoryItem>> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .update({ active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async hardDelete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Calcular stock actual sumando todos los lotes activos y ajustes
  static async getCurrentStock(productId: string): Promise<ApiResponse<number>> {
    try {
      // Obtener stock de lotes
      const { data: batches, error: batchesError } = await supabase
        .from('batches')
        .select('quantity, batch_number')
        .eq('inventory_item_id', productId)
        .eq('active', true);

      if (batchesError) throw batchesError;

      // Obtener ajustes de stock (solo los que NO tienen batch_id para evitar doble conteo)
      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('movement_type, quantity, batch_id, created_at')
        .eq('inventory_item_id', productId)
        .eq('active', true);

      if (movementsError) throw movementsError;

      // Calcular stock base de lotes
      const baseStock = batches.reduce((sum, batch) => sum + Number(batch.quantity), 0);

      // Calcular ajustes (solo movimientos sin batch_id específico)
      const movementsWithoutBatch = movements.filter(movement => !movement.batch_id);
      const adjustments = movementsWithoutBatch.reduce((sum, movement) => {
        if (movement.movement_type === 'ajuste_positivo') {
          return sum + Number(movement.quantity);
        } else {
          return sum - Number(movement.quantity);
        }
      }, 0);

      const totalStock = baseStock + adjustments;

      // Debug logs removidos - sistema funcionando correctamente

      return { data: totalStock, error: null };
    } catch (error) {
      return { data: 0, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener productos con stock calculado
  static async getAllWithStock(): Promise<ApiResponse<(InventoryItem & { current_stock: number })[]>> {
    try {
      const { data: products, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) throw error;

      // Calcular stock para cada producto
      const productsWithStock = await Promise.all(
        products.map(async (product) => {
          const stockResponse = await this.getCurrentStock(product.id);
          return {
            ...product,
            current_stock: stockResponse.data || 0
          };
        })
      );

      return { data: productsWithStock, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Crear producto con lote automático
  static async createWithInitialBatch(itemData: InventoryItemFormData): Promise<ApiResponse<InventoryItem>> {
    try {
      // 1. Crear el producto (sin stock, precio ni fecha)
      const cleanProductData = {
        name: itemData.name,
        inventory_id: itemData.inventory_id,
        category_id: itemData.category_id,
        unit: itemData.unit,
        min_stock: itemData.min_stock,
        active: itemData.active
      };

      const { data: product, error: productError } = await supabase
        .from('inventory_items')
        .insert(cleanProductData)
        .select()
        .single();

      if (productError) throw productError;

      // 2. Crear el primer lote automáticamente
      const today = new Date();
      const datePrefix = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const firstBatchNumber = `${datePrefix}-001`; // Primer lote del día
      
      const initialBatch = {
        inventory_item_id: product.id,
        batch_number: firstBatchNumber,
        quantity: itemData.stock,
        expiry_date: itemData.expiry_date,
        cost_per_unit: itemData.unit_price,
        notes: 'Lote inicial creado automáticamente al crear el producto',
        active: true
      };

      const { data: batch, error: batchError } = await supabase
        .from('batches')
        .insert(initialBatch)
        .select()
        .single();

      if (batchError) throw batchError;

      // Crear logs históricos para producto y lote (no bloqueante)
      if (product && batch) {
        try {
          const inventory = await InventoryService.getById(itemData.inventory_id);
          const inventoryName = inventory.data?.name || 'Inventario desconocido';
          
          // Log para creación de producto
          await HistoryLogService.createLogEntry({
            event_type: 'product_created',
            inventory_item_id: product.id,
            inventory_id: itemData.inventory_id,
            product_name: itemData.name,
            inventory_name: inventoryName,
            quantity_before: 0,
            quantity_after: 0,
            quantity_changed: 0,
            description: `Producto ${itemData.name} creado en ${inventoryName}`,
            notes: `Unidad: ${itemData.unit}, Stock mínimo: ${itemData.min_stock}`,
            reference: `PROD-${product.id}`
          });

          // Log para creación de lote inicial
          await HistoryLogService.createLogEntry({
            event_type: 'batch_created',
            inventory_item_id: product.id,
            inventory_id: itemData.inventory_id,
            product_name: itemData.name,
            inventory_name: inventoryName,
            quantity_before: 0,
            quantity_after: itemData.stock,
            quantity_changed: itemData.stock,
            batch_id: batch.id,
            batch_number: firstBatchNumber,
            description: `Lote inicial ${firstBatchNumber} creado para ${itemData.name}`,
            notes: `Cantidad: ${itemData.stock}, Vencimiento: ${itemData.expiry_date}`,
            reference: `BATCH-${batch.id}`
          });
        } catch (logError) {
          // No fallar la operación principal por errores de log
        }
      }

      return { data: product, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
}

// ===== SERVICIOS DE LOTES =====
export class BatchService {
  static async getAll(): Promise<ApiResponse<Batch[]>> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getAllWithInactive(): Promise<ApiResponse<Batch[]>> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getByItem(itemId: string): Promise<ApiResponse<Batch[]>> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('inventory_item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getById(id: string): Promise<ApiResponse<Batch>> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async create(batch: Omit<Batch, 'id' | 'created_at'>): Promise<ApiResponse<Batch>> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .insert(batch)
        .select()
        .single();

      if (error) throw error;

      // Crear log histórico para la creación del lote (no bloqueante)
      if (data) {
        try {
          const product = await InventoryItemService.getById(batch.inventory_item_id);
          const inventory = await InventoryService.getById(product.data?.inventory_id || '');
          const inventoryName = inventory.data?.name || 'Inventario desconocido';
          const productName = product.data?.name || 'Producto desconocido';
          
          await HistoryLogService.createLogEntry({
            event_type: 'batch_created',
            inventory_item_id: batch.inventory_item_id,
            inventory_id: product.data?.inventory_id || '',
            product_name: productName,
            inventory_name: inventoryName,
            quantity_before: 0,
            quantity_after: batch.quantity,
            quantity_changed: batch.quantity,
            batch_id: data.id,
            batch_number: batch.batch_number,
            description: `Lote ${batch.batch_number} creado para ${productName}`,
            notes: batch.notes || `Cantidad: ${batch.quantity}, Vencimiento: ${batch.expiry_date}`,
            reference: `BATCH-${data.id}`
          });
        } catch (logError) {
          // No fallar la operación principal por errores de log
        }
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async update(id: string, batch: Partial<Batch>): Promise<ApiResponse<Batch>> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .update(batch)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async delete(id: string): Promise<ApiResponse<Batch>> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .update({ active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async hardDelete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
}

// ===== SERVICIOS DE MOVIMIENTOS DE STOCK =====
export class StockMovementService {
  static async getAll(): Promise<ApiResponse<StockMovement[]>> {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getAllWithInactive(): Promise<ApiResponse<StockMovement[]>> {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getByItem(itemId: string): Promise<ApiResponse<StockMovement[]>> {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('inventory_item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async create(movement: Omit<StockMovement, 'id' | 'created_at'>): Promise<ApiResponse<StockMovement>> {
    try {
      // Si se especifica un lote, actualizar su cantidad
      if (movement.batch_id) {
        const { data: batch, error: batchError } = await supabase
          .from('batches')
          .select('quantity, batch_number')
          .eq('id', movement.batch_id)
          .single();

        if (batchError) throw batchError;

        let newQuantity = Number(batch.quantity);
        if (movement.movement_type === 'ajuste_positivo') {
          newQuantity += Number(movement.quantity);
        } else {
          newQuantity -= Number(movement.quantity);
        }

        // Actualizar la cantidad del lote
        const { error: updateError } = await supabase
          .from('batches')
          .update({ quantity: newQuantity })
          .eq('id', movement.batch_id);

        if (updateError) throw updateError;
      }

      // Crear el movimiento
      const { data, error } = await supabase
        .from('stock_movements')
        .insert(movement)
        .select()
        .single();

      if (error) throw error;

      // Crear log histórico para el movimiento de stock (no bloqueante)
      if (data) {
        try {
          const product = await InventoryItemService.getById(movement.inventory_item_id);
          const inventory = await InventoryService.getById(product.data?.inventory_id || '');
          const inventoryName = inventory.data?.name || 'Inventario desconocido';
          const productName = product.data?.name || 'Producto desconocido';
          
          // Obtener cantidad antes del movimiento
          let quantityBefore = 0;
          if (movement.batch_id) {
            const batch = await BatchService.getById(movement.batch_id);
            quantityBefore = batch.data ? Number(batch.data.quantity) - Number(movement.quantity) : 0;
          }
          
          await HistoryLogService.createLogEntry({
            event_type: 'stock_adjusted',
            inventory_item_id: movement.inventory_item_id,
            inventory_id: product.data?.inventory_id || '',
            product_name: productName,
            inventory_name: inventoryName,
            quantity_before: quantityBefore,
            quantity_after: quantityBefore + Number(movement.quantity),
            quantity_changed: Number(movement.quantity),
            batch_id: movement.batch_id,
            movement_id: data.id,
            description: `Ajuste de stock: ${movement.movement_type} de ${movement.quantity} unidades`,
            notes: movement.notes,
            reference: movement.reference || `MOV-${data.id}`
          });
        } catch (logError) {
          // No fallar la operación principal por errores de log
        }
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error in StockMovementService.create:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async update(id: string, movement: Partial<StockMovement>): Promise<ApiResponse<StockMovement>> {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .update(movement)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async delete(id: string): Promise<ApiResponse<StockMovement>> {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .update({ active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async hardDelete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('stock_movements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
}

// ===== SERVICIOS DE LOG HISTÓRICO =====
export class HistoryLogService {
  static async createLogEntry(entry: {
    event_type: string;
    inventory_item_id: string;
    inventory_id: string;
    product_name: string;
    inventory_name: string;
    quantity_before?: number;
    quantity_after?: number;
    quantity_changed?: number;
    batch_id?: string;
    batch_number?: string;
    transfer_id?: string;
    movement_id?: string;
    description: string;
    notes?: string;
    reference?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('history_log')
        .insert([entry])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getAll(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('history_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
}

// ===== SERVICIOS DE TRANSFERENCIAS =====
export class TransferService {
  static async getAll(): Promise<ApiResponse<Transfer[]>> {
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getAllWithInactive(): Promise<ApiResponse<Transfer[]>> {
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async getByStatus(status: string): Promise<ApiResponse<Transfer[]>> {
    try {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('status', status)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async create(transfer: Omit<Transfer, 'id' | 'created_at'>): Promise<ApiResponse<Transfer>> {
    try {
      const { data, error } = await supabase
        .from('transfers')
        .insert(transfer)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async update(id: string, transfer: Partial<Transfer>): Promise<ApiResponse<Transfer>> {
    try {
      const { data, error } = await supabase
        .from('transfers')
        .update(transfer)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async delete(id: string): Promise<ApiResponse<Transfer>> {
    try {
      const { data, error } = await supabase
        .from('transfers')
        .update({ active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  static async hardDelete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('transfers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
}
