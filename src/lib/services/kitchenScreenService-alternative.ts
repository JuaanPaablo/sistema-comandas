import { supabase } from '@/lib/supabase';

export interface KitchenScreen {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScreenDishAssignment {
  id: string;
  screen_id: string;
  dish_id: string;
  created_at: string;
}

export interface ScreenDish {
  dish_id: string;
  dish_name: string;
  dish_price: number;
  category_name: string;
  status: string;
}

export interface ScreenOrder {
  order_id: string;
  order_number: string;
  table_number: string;
  customer_name: string;
  item_id: string;
  dish_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  created_at: string;
}

export class KitchenScreenService {
  // Obtener todas las pantallas
  static async getScreens(): Promise<KitchenScreen[]> {
    const { data, error } = await supabase
      .from('kitchen_screens')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Obtener pantalla por ID
  static async getScreenById(id: string): Promise<KitchenScreen | null> {
    const { data, error } = await supabase
      .from('kitchen_screens')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching screen:', error);
      return null;
    }
    return data;
  }

  // Crear nueva pantalla
  static async createScreen(screen: Omit<KitchenScreen, 'id' | 'created_at' | 'updated_at'>): Promise<KitchenScreen> {
    const { data, error } = await supabase
      .from('kitchen_screens')
      .insert(screen)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Actualizar pantalla
  static async updateScreen(id: string, updates: Partial<KitchenScreen>): Promise<KitchenScreen> {
    const { data, error } = await supabase
      .from('kitchen_screens')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Eliminar pantalla
  static async deleteScreen(id: string): Promise<void> {
    const { error } = await supabase
      .from('kitchen_screens')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Obtener platillos asignados a una pantalla (versión alternativa sin función SQL)
  static async getScreenDishes(screenId: string): Promise<ScreenDish[]> {
    try {
      const { data, error } = await supabase
        .from('screen_dish_assignments')
        .select(`
          dish_id,
          dishes!inner(
            id,
            name,
            price,
            categories!inner(name)
          )
        `)
        .eq('screen_id', screenId);

      if (error) {
        console.error('Error fetching screen dishes:', error);
        return [];
      }

      return data?.map(item => ({
        dish_id: item.dish_id,
        dish_name: item.dishes.name,
        dish_price: item.dishes.price,
        category_name: item.dishes.categories.name,
        status: 'assigned'
      })) || [];
    } catch (err) {
      console.error('Error in getScreenDishes:', err);
      return [];
    }
  }

  // Obtener órdenes de una pantalla (versión alternativa sin función SQL)
  static async getScreenOrders(screenId: string): Promise<ScreenOrder[]> {
    try {
      // Primero obtener los dish_ids asignados a esta pantalla
      const { data: assignments, error: assignError } = await supabase
        .from('screen_dish_assignments')
        .select('dish_id')
        .eq('screen_id', screenId);

      if (assignError) {
        console.error('Error fetching screen assignments:', assignError);
        return [];
      }

      if (!assignments || assignments.length === 0) {
        console.log('No dishes assigned to this screen');
        return [];
      }

      const dishIds = assignments.map(a => a.dish_id);

      // Obtener los order_items que corresponden a estos platillos
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          dish_id,
          quantity,
          unit_price,
          total_price,
          status,
          created_at,
          orders!inner(
            id,
            order_number,
            notes
          ),
          dishes!inner(
            id,
            name
          )
        `)
        .in('dish_id', dishIds)
        .in('status', ['pending', 'preparing', 'ready']);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        return [];
      }

      return orderItems?.map(item => ({
        order_id: item.order_id,
        order_number: item.orders.order_number,
        table_number: item.orders.notes || 'N/A',
        customer_name: 'Cliente',
        item_id: item.id,
        dish_name: item.dishes.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        status: item.status,
        created_at: item.created_at
      })) || [];
    } catch (err) {
      console.error('Error in getScreenOrders:', err);
      return [];
    }
  }

  // Asignar platillo a pantalla
  static async assignDishToScreen(screenId: string, dishId: string): Promise<ScreenDishAssignment> {
    const { data, error } = await supabase
      .from('screen_dish_assignments')
      .insert({ screen_id: screenId, dish_id: dishId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Desasignar platillo de pantalla
  static async unassignDishFromScreen(screenId: string, dishId: string): Promise<void> {
    const { error } = await supabase
      .from('screen_dish_assignments')
      .delete()
      .eq('screen_id', screenId)
      .eq('dish_id', dishId);

    if (error) throw error;
  }

  // Asignar múltiples platillos por categoría
  static async assignDishesByCategory(screenId: string, categoryId: string): Promise<void> {
    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('id')
      .eq('category_id', categoryId)
      .eq('active', true);

    if (dishesError) throw dishesError;

    if (dishes && dishes.length > 0) {
      const assignments = dishes.map(dish => ({
        screen_id: screenId,
        dish_id: dish.id
      }));

      const { error: assignError } = await supabase
        .from('screen_dish_assignments')
        .insert(assignments);

      if (assignError) throw assignError;
    }
  }

  // Obtener platillos disponibles para asignar
  static async getAvailableDishes(screenId: string): Promise<ScreenDish[]> {
    const { data, error } = await supabase
      .from('dishes')
      .select(`
        id,
        name,
        price,
        categories!inner(name)
      `)
      .eq('active', true)
      .not('id', 'in', `(SELECT dish_id FROM screen_dish_assignments WHERE screen_id = '${screenId}')`);

    if (error) throw error;
    
    return data?.map(dish => ({
      dish_id: dish.id,
      dish_name: dish.name,
      dish_price: dish.price,
      category_name: dish.categories.name,
      status: 'available'
    })) || [];
  }

  // Actualizar estado de item de orden
  static async updateOrderItemStatus(itemId: string, status: string, preparedBy?: string): Promise<void> {
    const updates: any = { status };
    
    if (status === 'ready' || status === 'delivered') {
      updates.prepared_at = new Date().toISOString();
    }
    
    if (preparedBy) {
      updates.prepared_by = preparedBy;
    }

    const { error } = await supabase
      .from('order_items')
      .update(updates)
      .eq('id', itemId);

    if (error) throw error;
  }
}
