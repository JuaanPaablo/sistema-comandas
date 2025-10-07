import { supabase } from '@/lib/supabase';

export interface Batch {
  id: string;
  inventory_item_id: string;
  batch_number: string;
  quantity: number;
  expiry_date?: string;
  cost_per_unit: number;
  created_at: string;
  active: boolean;
  notes?: string;
}

export interface BatchWithItem extends Batch {
  inventory_item: {
    id: string;
    name: string;
    unit: string;
  };
}

export class BatchService {
  /**
   * Obtener lotes disponibles de un producto específico
   */
  static async getAvailableBatches(inventoryItemId: string): Promise<{ data: Batch[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('inventory_item_id', inventoryItemId)
        .eq('active', true)
        .gt('quantity', 0)
        .order('created_at', { ascending: true }); // FIFO

      if (error) {
        console.error('Error obteniendo lotes disponibles:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getAvailableBatches:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Obtener todos los lotes de un producto con información del item
   */
  static async getBatchesWithItem(inventoryItemId: string): Promise<{ data: BatchWithItem[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select(`
          *,
          inventory_item:inventory_items (
            id,
            name,
            unit
          )
        `)
        .eq('inventory_item_id', inventoryItemId)
        .eq('active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error obteniendo lotes con item:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getBatchesWithItem:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Obtener stock total disponible de un producto
   */
  static async getTotalStock(inventoryItemId: string): Promise<{ data: number; error: any }> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('quantity')
        .eq('inventory_item_id', inventoryItemId)
        .eq('active', true)
        .gt('quantity', 0);

      if (error) {
        console.error('Error obteniendo stock total:', error);
        return { data: 0, error };
      }

      const totalStock = data?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
      return { data: totalStock, error: null };
    } catch (err) {
      console.error('Error en getTotalStock:', err);
      return { data: 0, error: err };
    }
  }

  /**
   * Actualizar cantidad de un lote
   */
  static async updateQuantity(batchId: string, newQuantity: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (newQuantity < 0) {
        return { success: false, error: 'La cantidad no puede ser negativa' };
      }

      const { error } = await supabase
        .from('batches')
        .update({ 
          quantity: newQuantity
        })
        .eq('id', batchId);

      if (error) {
        console.error('Error actualizando cantidad del lote:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error en updateQuantity:', err);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Obtener lote por ID
   */
  static async getById(batchId: string): Promise<{ data: Batch | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (error) {
        console.error('Error obteniendo lote por ID:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error en getById:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Descontar cantidad de lotes usando FIFO
   */
  static async descontarCantidad(
    inventoryItemId: string, 
    cantidad: number, 
    referencia: string
  ): Promise<{ success: boolean; error?: string; lotesUsados: Array<{ batchId: string; cantidadDescontada: number }> }> {
    try {
      if (cantidad <= 0) {
        return { success: true, lotesUsados: [] };
      }

      // Obtener lotes disponibles ordenados por FIFO
      const { data: lotes, error: lotesError } = await this.getAvailableBatches(inventoryItemId);
      
      if (lotesError || !lotes) {
        return { success: false, error: 'Error obteniendo lotes disponibles', lotesUsados: [] };
      }

      let cantidadRestante = cantidad;
      const lotesUsados: Array<{ batchId: string; cantidadDescontada: number }> = [];

      for (const lote of lotes) {
        if (cantidadRestante <= 0) break;

        const cantidadADescontar = Math.min(cantidadRestante, lote.quantity);
        
        // Actualizar lote
        const { success: updateSuccess, error: updateError } = await this.updateQuantity(
          lote.id, 
          lote.quantity - cantidadADescontar
        );

        if (!updateSuccess) {
          return { 
            success: false, 
            error: `Error actualizando lote ${lote.batch_number}: ${updateError}`, 
            lotesUsados 
          };
        }

        lotesUsados.push({
          batchId: lote.id,
          cantidadDescontada: cantidadADescontar
        });

        cantidadRestante -= cantidadADescontar;
      }

      if (cantidadRestante > 0) {
        return { 
          success: false, 
          error: `Stock insuficiente. Faltan ${cantidadRestante} unidades`, 
          lotesUsados 
        };
      }

      return { success: true, lotesUsados };
    } catch (err) {
      console.error('Error en descontarCantidad:', err);
      return { success: false, error: 'Error interno del servidor', lotesUsados: [] };
    }
  }
}
