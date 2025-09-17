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
  table_number: number;
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
      const { data, error } = await supabase.rpc('create_comanda_from_order', {
        order_uuid: orderId
      });
      
      if (error) {
        console.error('Error creando comanda desde orden:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (err) {
      console.error('Error en createFromOrder:', err);
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
}
