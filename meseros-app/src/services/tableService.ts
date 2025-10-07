import { supabase } from './supabase';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  current_order_id?: string;
  created_at: string;
  updated_at: string;
}

export class TableService {
  // Obtener todas las mesas
  static async getAll(): Promise<Table[]> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Obtener mesas disponibles
  static async getAvailable(): Promise<Table[]> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('status', 'available')
      .order('number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Obtener mesa por número
  static async getByNumber(number: number): Promise<Table | null> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('number', number)
      .single();

    if (error) throw error;
    return data;
  }

  // Ocupar mesa
  static async occupyTable(tableId: string, orderId: string): Promise<Table> {
    const { data, error } = await supabase
      .from('tables')
      .update({
        status: 'occupied',
        current_order_id: orderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', tableId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Liberar mesa
  static async freeTable(tableId: string): Promise<Table> {
    const { data, error } = await supabase
      .from('tables')
      .update({
        status: 'available',
        current_order_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', tableId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Cambiar estado de mesa
  static async changeStatus(tableId: string, status: Table['status']): Promise<Table> {
    const { data, error } = await supabase
      .from('tables')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', tableId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Obtener estadísticas de mesas
  static async getStats(): Promise<{
    total: number;
    available: number;
    occupied: number;
    reserved: number;
    cleaning: number;
  }> {
    const { data, error } = await supabase
      .from('table_stats')
      .select('*')
      .single();

    if (error) throw error;

    return {
      total: data?.total_tables || 0,
      available: data?.available_tables || 0,
      occupied: data?.occupied_tables || 0,
      reserved: data?.reserved_tables || 0,
      cleaning: data?.cleaning_tables || 0,
    };
  }
}
