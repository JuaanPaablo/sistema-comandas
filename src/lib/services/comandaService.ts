import { supabase } from '@/lib/supabase';

export interface Comanda {
  id: string;
  order_id: string;
  table_number: string; // Cambiado a string para permitir nombres de mesa
  employee_id: string;
  employee_name: string;
  status: 'pending' | 'ready' | 'served' | 'closed'; // Agregado 'closed'
  total_amount: number;
  items_count: number;
  created_at: string;
  updated_at: string;
  served_at?: string;
  closed_at?: string; // Nuevo campo para caja
  notes?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimated_time: number;
  actual_time: number;
  total_preparation_time: number;
  payment_method?: 'efectivo' | 'tarjeta' | 'transferencia'; // Nuevo campo para caja
  caja_employee_id?: string; // Nuevo campo para caja
  ticket_number?: string; // Nuevo campo para caja
}

export interface ComandaItem {
  id: string;
  comanda_id: string;
  order_item_id: string;
  dish_id: string;
  dish_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: 'pending' | 'ready' | 'served';
  screen_id?: string;
  prepared_by?: string;
  prepared_at?: string;
  served_at?: string;
  notes?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimated_time: number;
  actual_time: number;
  preparation_time: number;
  kitchen_notes?: string;
}

export interface ComandaComplete extends Comanda {
  items: ComandaItem[];
}

export class ComandaService {
  /**
   * Obtener una comanda por ID (incluye items)
   */
  static async getById(comandaId: string): Promise<{ data: ComandaComplete | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('comanda_complete')
        .select('*')
        .eq('id', comandaId)
        .single();

      if (error) {
        console.error('Error fetching comanda by id:', error);
        return { data: null, error };
      }

      return { data: (data as ComandaComplete) || null, error: null };
    } catch (error) {
      console.error('Error fetching comanda by id:', error);
      return { data: null, error };
    }
  }

  /**
   * Crear comanda automáticamente desde una orden
   */
  static async createFromOrder(orderId: string): Promise<{ data: string | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .rpc('create_comanda_from_order', { order_uuid: orderId });

      if (error) {
        console.error('Error creating comanda from order:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating comanda from order:', error);
      return { data: null, error: 'Error interno del servidor' };
    }
  }

  /**
   * Obtener todas las comandas con sus items
   */
  static async getAll(): Promise<ComandaComplete[]> {
    try {
      const { data, error } = await supabase
        .from('comanda_complete')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comandas:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching comandas:', error);
      return [];
    }
  }

  /**
   * Obtener comandas por estado
   */
  static async getByStatus(status: 'pending' | 'ready' | 'served'): Promise<ComandaComplete[]> {
    try {
      const { data, error } = await supabase
        .from('comanda_complete')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comandas by status:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching comandas by status:', error);
      return [];
    }
  }

  /**
   * Obtener comandas activas (pending y ready)
   */
  static async getActive(): Promise<{ data: ComandaComplete[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('comanda_complete')
        .select('*')
        .in('status', ['pending', 'ready'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active comandas:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching active comandas:', error);
      return { data: null, error };
    }
  }

  /**
   * Obtener comandas por pantalla de cocina
   */
  static async getByScreen(screenId: string): Promise<{ data: ComandaComplete[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('comanda_complete')
        .select('*')
        .eq('items.screen_id', screenId)
        .in('status', ['pending', 'ready'])
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comandas by screen:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching comandas by screen:', error);
      return { data: null, error };
    }
  }

  /**
   * Marcar comanda como lista
   */
  static async markAsReady(comandaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('mark_comanda_ready', { comanda_uuid: comandaId });

      if (error) {
        console.error('Error marking comanda as ready:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking comanda as ready:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Marcar comanda como servida
   */
  static async markAsServed(comandaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('mark_comanda_served', { comanda_uuid: comandaId });

      if (error) {
        console.error('Error marking comanda as served:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking comanda as served:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Actualizar estado de item de comanda
   */
  static async updateItemStatus(
    itemId: string, 
    status: 'pending' | 'ready' | 'served',
    preparedBy?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚨 updateItemStatus INICIADO:', { itemId, status, preparedBy });
      
      const updateData: any = { status };
      
      if (status === 'ready') {
        updateData.prepared_at = new Date().toISOString();
        if (preparedBy) {
          updateData.prepared_by = preparedBy;
        }
      } else if (status === 'served') {
        updateData.served_at = new Date().toISOString();
      }

      console.log('🚨 updateData a enviar:', updateData);

      const { error } = await supabase
        .from('comanda_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) {
        console.error('❌ Error updating comanda item status:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ updateItemStatus EXITOSO para item:', itemId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating comanda item status:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Agregar nota de cocina a item
   */
  static async addKitchenNote(
    itemId: string, 
    note: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('comanda_items')
        .update({ kitchen_notes: note })
        .eq('id', itemId);

      if (error) {
        console.error('Error adding kitchen note:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding kitchen note:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Asignar comanda a pantalla de cocina
   */
  static async assignToScreen(
    comandaId: string, 
    screenId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('comanda_items')
        .update({ screen_id: screenId })
        .eq('comanda_id', comandaId);

      if (error) {
        console.error('Error assigning comanda to screen:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error assigning comanda to screen:', error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Obtener estadísticas de comandas
   */
  static async getStats(): Promise<{
    total: number;
    pending: number;
    ready: number;
    served: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('comandas')
        .select('status');

      if (error) {
        console.error('Error fetching comanda stats:', error);
        return { total: 0, pending: 0, ready: 0, served: 0 };
      }

      const stats = data?.reduce((acc, comanda) => {
        acc.total++;
        acc[comanda.status as keyof typeof acc]++;
        return acc;
      }, { total: 0, pending: 0, ready: 0, served: 0 });

      return stats || { total: 0, pending: 0, ready: 0, served: 0 };
    } catch (error) {
      console.error('Error fetching comanda stats:', error);
      return { total: 0, pending: 0, ready: 0, served: 0 };
    }
  }

  /**
   * Obtener comandas servidas pendientes de cierre (para caja)
   */
  static async getComandasServidas(): Promise<{ data: ComandaComplete[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('comanda_complete')
        .select('*')
        .eq('status', 'served')
        .order('served_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo comandas servidas:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getComandasServidas:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Marcar comanda como cerrada (para caja)
   */
  static async markAsClosed(
    comandaId: string, 
    paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia',
    cajaEmployeeId: string | null,
    ticketNumber: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Actualizando comanda:', {
        comandaId,
        status: 'closed',
        payment_method: paymentMethod,
        caja_employee_id: cajaEmployeeId,
        ticket_number: ticketNumber
      });

      const { error } = await supabase
        .from('comandas')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          payment_method: paymentMethod,
          caja_employee_id: cajaEmployeeId,
          ticket_number: ticketNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', comandaId);

      if (error) {
        console.error('Error marcando comanda como cerrada:', error);
        return { success: false, error: error.message };
      }

      console.log('Comanda actualizada exitosamente');
      return { success: true };
    } catch (err) {
      console.error('Error en markAsClosed:', err);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Obtener comandas cerradas (para historial de caja)
   */
  static async getComandasCerradas(limit: number = 50): Promise<{ data: ComandaComplete[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('comanda_complete')
        .select('*')
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error obteniendo comandas cerradas:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getComandasCerradas:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Generar número de ticket único
   */
  static async generarTicketNumber(): Promise<{ data: string; error: any }> {
    try {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const ticketNumber = `T${timestamp}${random}`;

      // Verificar que no exista
      const { data: existing } = await supabase
        .from('comandas')
        .select('id')
        .eq('ticket_number', ticketNumber)
        .single();

      if (existing) {
        // Si existe, generar uno nuevo
        return this.generarTicketNumber();
      }

      return { data: ticketNumber, error: null };
    } catch (err) {
      console.error('Error generando número de ticket:', err);
      return { data: '', error: err };
    }
  }
}
