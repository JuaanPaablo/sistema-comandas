import { supabase } from '@/lib/supabase';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  current_order_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TableFormData {
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
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

  // Obtener mesa por ID
  static async getById(id: string): Promise<Table | null> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
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

  // Crear nueva mesa
  static async create(tableData: TableFormData): Promise<Table> {
    const { data, error } = await supabase
      .from('tables')
      .insert(tableData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Actualizar mesa
  static async update(id: string, tableData: Partial<TableFormData>): Promise<Table> {
    const { data, error } = await supabase
      .from('tables')
      .update({
        ...tableData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Eliminar mesa
  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);

    if (error) throw error;
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

  // Obtener mesas ocupadas
  static async getOccupied(): Promise<Table[]> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('status', 'occupied')
      .order('number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Cambiar estado de mesa
  static async changeStatus(id: string, status: Table['status'], orderId?: string): Promise<Table> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (orderId) {
      updateData.current_order_id = orderId;
    } else if (status === 'available') {
      updateData.current_order_id = null;
    }

    const { data, error } = await supabase
      .from('tables')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Ocupar mesa
  static async occupyTable(id: string, orderId: string): Promise<Table> {
    return this.changeStatus(id, 'occupied', orderId);
  }

  // Liberar mesa
  static async freeTable(id: string): Promise<Table> {
    return this.changeStatus(id, 'available');
  }

  // Reservar mesa
  static async reserveTable(id: string): Promise<Table> {
    return this.changeStatus(id, 'reserved');
  }

  // Marcar mesa para limpieza
  static async markForCleaning(id: string): Promise<Table> {
    return this.changeStatus(id, 'cleaning');
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
      .from('tables')
      .select('status');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      available: data?.filter(t => t.status === 'available').length || 0,
      occupied: data?.filter(t => t.status === 'occupied').length || 0,
      reserved: data?.filter(t => t.status === 'reserved').length || 0,
      cleaning: data?.filter(t => t.status === 'cleaning').length || 0,
    };

    return stats;
  }
}
