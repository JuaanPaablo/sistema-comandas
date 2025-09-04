import { supabase } from '../supabase/client';
import { Order, OrderItem, OrderFormData, OrderItemFormData, ApiResponse, DateRangeFilter, OrderFilter } from '../types';

// ===== SERVICIO DE VENTAS =====
export class SalesService {
  // Obtener todas las órdenes
  static async getAll(): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener órdenes por estado
  static async getByStatus(status: string): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener órdenes por rango de fechas
  static async getByDateRange(filter: DateRangeFilter): Promise<ApiResponse<Order[]>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', filter.start_date)
        .lte('created_at', filter.end_date)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener órdenes con filtros
  static async getWithFilters(filter: OrderFilter): Promise<ApiResponse<Order[]>> {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .gte('created_at', filter.start_date)
        .lte('created_at', filter.end_date);

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener orden por ID
  static async getById(id: string): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener orden por número de orden
  static async getByOrderNumber(orderNumber: string): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Crear nueva orden
  static async create(orderData: OrderFormData): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Actualizar orden
  static async update(id: string, orderData: Partial<OrderFormData>): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(orderData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Actualizar estado de la orden
  static async updateStatus(id: string, status: string): Promise<ApiResponse<Order>> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Completar orden
  static async complete(id: string): Promise<ApiResponse<Order>> {
    return this.updateStatus(id, 'completed');
  }

  // Cancelar orden
  static async cancel(id: string): Promise<ApiResponse<Order>> {
    return this.updateStatus(id, 'cancelled');
  }

  // Eliminar orden
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Generar número de orden único
  static async generateOrderNumber(): Promise<string> {
    try {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Obtener el último número de orden del día
      const { data, error } = await supabase
        .from('orders')
        .select('order_number')
        .like('order_number', `${dateStr}%`)
        .order('order_number', { ascending: false })
        .limit(1);

      if (error) throw error;

      let sequence = 1;
      if (data && data.length > 0) {
        const lastOrderNumber = data[0].order_number;
        const lastSequence = parseInt(lastOrderNumber.slice(-4));
        sequence = lastSequence + 1;
      }

      return `${dateStr}${sequence.toString().padStart(4, '0')}`;
    } catch (error) {
      // Fallback: usar timestamp
      return `ORD${Date.now()}`;
    }
  }

  // Calcular total de la orden
  static calculateOrderTotal(items: Array<{ quantity: number; unit_price: number }>): number {
    return items.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  }

  // Obtener estadísticas de ventas
  static async getSalesStats(filter: DateRangeFilter): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    completedOrders: number;
    cancelledOrders: number;
  }> {
    try {
      const { data: orders, error } = await this.getByDateRange(filter);

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const completedOrders = orders?.filter(order => order.status === 'completed').length || 0;
      const cancelledOrders = orders?.filter(order => order.status === 'cancelled').length || 0;

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        completedOrders,
        cancelledOrders
      };
    } catch (error) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        completedOrders: 0,
        cancelledOrders: 0
      };
    }
  }
}

// ===== SERVICIO DE ITEMS DE ORDEN =====
export class OrderItemService {
  // Obtener todos los items de una orden
  static async getByOrder(orderId: string): Promise<ApiResponse<OrderItem[]>> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener item por ID
  static async getById(id: string): Promise<ApiResponse<OrderItem>> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Crear nuevo item
  static async create(itemData: OrderItemFormData): Promise<ApiResponse<OrderItem>> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Crear múltiples items
  static async createMultiple(items: OrderItemFormData[]): Promise<ApiResponse<OrderItem[]>> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .insert(items)
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Actualizar item
  static async update(id: string, itemData: Partial<OrderItemFormData>): Promise<ApiResponse<OrderItem>> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .update(itemData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Eliminar item
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Eliminar todos los items de una orden
  static async deleteByOrder(orderId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Calcular total de un item
  static calculateItemTotal(quantity: number, unitPrice: number): number {
    return quantity * unitPrice;
  }

  // Obtener items por platillo
  static async getByDish(dishId: string): Promise<ApiResponse<OrderItem[]>> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('dish_id', dishId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener items por variante
  static async getByVariant(variantId: string): Promise<ApiResponse<OrderItem[]>> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('variant_id', variantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
}
