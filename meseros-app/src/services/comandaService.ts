import { supabase } from './supabase';

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
  notes?: string;
  priority?: number;
  preparation_time?: number;
  kitchen_notes?: string;
  prepared_at?: string;
  served_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Comanda {
  id: string;
  order_id: string;
  table_number: string; // Cambiado de number a string para permitir nombres de mesa
  employee_id: string;
  employee_name: string;
  status: 'pending' | 'ready' | 'served';
  total_amount: number;
  items_count: number;
  notes?: string;
  priority?: number;
  estimated_time?: number;
  actual_time?: number;
  total_preparation_time?: number;
  created_at: string;
  updated_at: string;
  served_at?: string;
}

export interface ComandaComplete extends Comanda {
  items: ComandaItem[];
}

export class ComandaService {
  /**
   * Crear comanda automáticamente desde una orden
   */
  static async createFromOrder(orderId: string): Promise<{ data: string | null; error: any }> {
    try {
      // Obtener información de la orden
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          employee_id,
          notes,
          total_amount,
          employees (name)
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !orderData) {
        console.error('Error obteniendo orden:', orderError);
        return { data: null, error: orderError };
      }

      // Extraer número de mesa del campo notes
      const tableNumber = orderData.notes?.replace('Mesa: ', '') || 'N/A';
      const employeeName = orderData.employees?.name || 'Desconocido';

      // Obtener items de la orden
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          menu_item_id,
          dish_name,
          quantity,
          unit_price,
          total_price,
          notes
        `)
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error obteniendo items:', itemsError);
        return { data: null, error: itemsError };
      }

      // Crear comanda
      const { data: comanda, error: comandaError } = await supabase
        .from('comandas')
        .insert({
          order_id: orderId,
          table_number: tableNumber, // Usar el texto de mesa
          employee_id: orderData.employee_id,
          employee_name: employeeName,
          status: 'pending',
          total_amount: orderData.total_amount,
          items_count: orderItems?.length || 0,
          notes: orderData.notes
        })
        .select()
        .single();

      if (comandaError) {
        console.error('Error creando comanda:', comandaError);
        return { data: null, error: comandaError };
      }

      // Crear items de la comanda
      if (orderItems && orderItems.length > 0) {
        const comandaItems = orderItems.map(item => ({
          comanda_id: comanda.id,
          order_item_id: item.id,
          dish_id: item.menu_item_id, // Usar el menu_item_id que referencia a dishes
          dish_name: item.dish_name || 'Platillo',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          status: 'pending',
          notes: item.notes
        }));

        const { error: itemsError } = await supabase
          .from('comanda_items')
          .insert(comandaItems);

        if (itemsError) {
          console.error('Error creando items de comanda:', itemsError);
          return { data: null, error: itemsError };
        }
      }

      return { data: comanda.id, error: null };
    } catch (err) {
      console.error('Exception en createFromOrder:', err);
      return { data: null, error: err };
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
        console.error('Error obteniendo comandas activas:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getActive:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Obtener comanda por ID
   */
  static async getById(comandaId: string): Promise<{ data: ComandaComplete | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('comanda_complete')
        .select('*')
        .eq('id', comandaId)
        .single();

      if (error) {
        console.error('Error obteniendo comanda por ID:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error en getById:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Actualizar estado de un item de comanda
   */
  static async updateItemStatus(
    itemId: string, 
    status: 'pending' | 'ready' | 'served'
  ): Promise<{ data: any; error: any }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'ready') {
        updateData.prepared_at = new Date().toISOString();
      } else if (status === 'served') {
        updateData.served_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('comanda_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando estado de item:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error en updateItemStatus:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Marcar comanda como servida
   */
  static async markAsServed(comandaId: string): Promise<{ data: boolean; error: any }> {
    try {
      const { data, error } = await supabase.rpc('mark_comanda_served', {
        comanda_uuid: comandaId
      });

      if (error) {
        console.error('Error marcando comanda como servida:', error);
        return { data: false, error };
      }

      return { data: true, error: null };
    } catch (err) {
      console.error('Error en markAsServed:', err);
      return { data: false, error: err };
    }
  }

  /**
   * Marcar comanda como lista
   */
  static async markAsReady(comandaId: string): Promise<{ data: boolean; error: any }> {
    try {
      const { data, error } = await supabase.rpc('mark_comanda_ready', {
        comanda_uuid: comandaId
      });

      if (error) {
        console.error('Error marcando comanda como lista:', error);
        return { data: false, error };
      }

      return { data: true, error: null };
    } catch (err) {
      console.error('Error en markAsReady:', err);
      return { data: false, error: err };
    }
  }

  /**
   * Obtener comandas por estado
   */
  static async getByStatus(status: 'pending' | 'ready' | 'served'): Promise<{ data: ComandaComplete[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('comanda_complete')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo comandas por estado:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getByStatus:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Obtener comandas por empleado
   */
  static async getByEmployee(employeeId: string): Promise<{ data: ComandaComplete[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('comanda_complete')
        .select('*')
        .eq('employee_id', employeeId)
        .in('status', ['pending', 'ready'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo comandas por empleado:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getByEmployee:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Obtener historial de comandas servidas
   */
  static async getHistory(limit: number = 50): Promise<{ data: ComandaComplete[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('comanda_complete')
        .select('*')
        .eq('status', 'served')
        .order('served_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error obteniendo historial:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getHistory:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Obtener estadísticas del historial
   */
  static async getHistoryStats(): Promise<{ 
    data: {
      total: number;
      completed: number;
      cancelled: number;
      revenue: number;
    } | null; 
    error: any 
  }> {
    try {
      // Obtener todas las comandas servidas
      const { data: servedComandas, error: servedError } = await supabase
        .from('comandas')
        .select('total_amount, status')
        .eq('status', 'served');

      if (servedError) {
        console.error('Error obteniendo estadísticas:', servedError);
        return { data: null, error: servedError };
      }

      const total = servedComandas?.length || 0;
      const completed = servedComandas?.filter(c => c.status === 'served').length || 0;
      const cancelled = 0; // Por ahora no hay canceladas en tu esquema
      const revenue = servedComandas?.reduce((sum, c) => sum + (c.total_amount || 0), 0) || 0;

      return { 
        data: { total, completed, cancelled, revenue }, 
        error: null 
      };
    } catch (err) {
      console.error('Error en getHistoryStats:', err);
      return { data: null, error: err };
    }
  }
}
