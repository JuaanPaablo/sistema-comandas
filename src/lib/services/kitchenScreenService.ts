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

  // Duplicar pantalla
  static async duplicateScreen(sourceId: string, newName: string): Promise<KitchenScreen> {
    const { data, error } = await supabase
      .rpc('duplicate_kitchen_screen', {
        source_screen_id: sourceId,
        new_name: newName
      });

    if (error) throw error;
    
    // Obtener la pantalla duplicada
    const { data: newScreen, error: fetchError } = await supabase
      .from('kitchen_screens')
      .select('*')
      .eq('id', data)
      .single();

    if (fetchError) throw fetchError;
    return newScreen;
  }

  // Obtener platillos asignados a una pantalla
  static async getScreenDishes(screenId: string): Promise<ScreenDish[]> {
    const { data, error } = await supabase
      .rpc('get_screen_dishes', { screen_id_param: screenId });

    if (error) throw error;
    return data || [];
  }

  // Obtener órdenes de una pantalla (versión simplificada)
  static async getScreenOrders(screenId: string): Promise<ScreenOrder[]> {
    try {
      console.log('🔍 Obteniendo órdenes para pantalla:', screenId);
      
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
        console.log('📝 No hay platillos asignados a esta pantalla');
        return [];
      }

      const dishIds = assignments.map(a => a.dish_id);
      console.log('🍽️ Platillos asignados:', dishIds);

      // Obtener los order_items que corresponden a estos platillos
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          menu_item_id,
          quantity,
          unit_price,
          total_price,
          status,
          created_at,
          orders!inner(
            id,
            order_number,
            notes
          )
        `)
        .in('menu_item_id', dishIds)
        .in('status', ['pending', 'preparing', 'ready']);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        return [];
      }

      console.log('📦 Items de orden encontrados:', orderItems?.length || 0);

      // Obtener nombres de platillos
      const dishNames: { [key: string]: string } = {};
      if (orderItems && orderItems.length > 0) {
        const { data: dishes } = await supabase
          .from('dishes')
          .select('id, name')
          .in('id', dishIds);
        
        dishes?.forEach(dish => {
          dishNames[dish.id] = dish.name;
        });
      }

      const result = orderItems?.map(item => ({
        order_id: item.order_id,
        order_number: item.orders.order_number || `ORD-${item.order_id.slice(-4)}`,
        table_number: item.orders.notes || 'N/A',
        customer_name: 'Cliente',
        item_id: item.id,
        dish_name: this.extractDishName(item, dishNames[item.menu_item_id] || 'Platillo'),
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        status: item.status,
        created_at: item.created_at
      })) || [];

      console.log('✅ Órdenes procesadas:', result.length);
      return result;
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
    // Obtener todos los platillos de la categoría
    const { data: dishes, error: dishesError } = await supabase
      .from('dishes')
      .select('id')
      .eq('category_id', categoryId)
      .eq('active', true);

    if (dishesError) throw dishesError;

    if (dishes && dishes.length > 0) {
      // Insertar todas las asignaciones
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

  // Extraer nombre del platillo desde notes o usar el nombre por defecto
  private static extractDishName(item: any, defaultName: string): string {
    if (item.notes && item.notes.includes(' | ')) {
      // Si hay notas con formato "notas | nombre_variante", extraer el nombre
      const parts = item.notes.split(' | ');
      return parts[parts.length - 1]; // Tomar la última parte (el nombre)
    }
    return defaultName;
  }

  // Actualizar estado de item de orden (versión simplificada)
  static async updateOrderItemStatus(itemId: string, status: string, preparedBy?: string): Promise<void> {
    try {
      console.log('🔄 Actualizando estado del item:', itemId, 'a:', status);
      
      // Primero verificar que el item existe
      const { data: existingItem, error: fetchError } = await supabase
        .from('order_items')
        .select('id, status, menu_item_id')
        .eq('id', itemId)
        .single();

      if (fetchError) {
        console.error('Error fetching item:', fetchError);
        throw fetchError;
      }

      console.log('📦 Item encontrado:', existingItem);

      const updateData: any = { 
        status: status
      };

      // Solo agregar campos que existen en la tabla
      if (status === 'preparing') {
        updateData.prepared_at = new Date().toISOString();
        if (preparedBy) {
          updateData.prepared_by = preparedBy;
        }
      }

      const { error } = await supabase
        .from('order_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) {
        console.error('❌ Error updating order item status:', {
          error,
          itemId,
          status,
          updateData
        });
        throw error;
      }
      
      console.log('✅ Estado actualizado correctamente');
    } catch (err) {
      console.error('Error in updateOrderItemStatus:', err);
      throw err;
    }
  }

  // Obtener todos los platillos con sus categorías
  static async getDishes(): Promise<Array<{
    id: string;
    name: string;
    category_id: string;
    category_name: string;
  }>> {
    const { data, error } = await supabase
      .from('dishes')
      .select(`
        id,
        name,
        category_id,
        categories!inner(
          name
        )
      `)
      .eq('active', true)
      .eq('categories.active', true)
      .order('name');

    if (error) throw error;
    
    return (data || []).map(dish => ({
      id: dish.id,
      name: dish.name,
      category_id: dish.category_id,
      category_name: dish.categories?.name || 'Sin categoría'
    }));
  }

  // Crear nueva pantalla con asignaciones de platillos
  static async createScreen(screenData: {
    name: string;
    description?: string;
    dishIds: string[];
  }): Promise<KitchenScreen> {
    const { data: screen, error: screenError } = await supabase
      .from('kitchen_screens')
      .insert({
        name: screenData.name,
        description: screenData.description,
        active: true
      })
      .select()
      .single();

    if (screenError) throw screenError;

    // Asignar platillos a la pantalla
    if (screenData.dishIds.length > 0) {
      const assignments = screenData.dishIds.map(dishId => ({
        screen_id: screen.id,
        dish_id: dishId
      }));

      const { error: assignmentError } = await supabase
        .from('screen_dish_assignments')
        .insert(assignments);

      if (assignmentError) throw assignmentError;
    }

    return screen;
  }

  // Obtener pantalla por ID con platillos asignados
  static async getScreenById(screenId: string): Promise<KitchenScreen & {
    assigned_dishes?: Array<{
      dish_id: string;
      dish_name: string;
      category_name: string;
    }>;
  } | null> {
    const { data: screen, error: screenError } = await supabase
      .from('kitchen_screens')
      .select('*')
      .eq('id', screenId)
      .single();

    if (screenError) return null;

    // Obtener platillos asignados
    const { data: assignments, error: assignmentError } = await supabase
      .from('screen_dish_assignments')
      .select(`
        dish_id,
        dishes!inner(
          name,
          categories!inner(name)
        )
      `)
      .eq('screen_id', screenId);

    if (assignmentError) throw assignmentError;

    const assigned_dishes = (assignments || []).map(assignment => ({
      dish_id: assignment.dish_id,
      dish_name: assignment.dishes?.name || 'Sin nombre',
      category_name: assignment.dishes?.categories?.name || 'Sin categoría'
    }));

    return {
      ...screen,
      assigned_dishes
    };
  }

  // Actualizar pantalla y sus asignaciones
  static async updateScreen(screenId: string, updateData: {
    name?: string;
    description?: string;
    active?: boolean;
    dishIds?: string[];
  }): Promise<void> {
    // Actualizar datos básicos de la pantalla
    const screenUpdate: any = {};
    if (updateData.name !== undefined) screenUpdate.name = updateData.name;
    if (updateData.description !== undefined) screenUpdate.description = updateData.description;
    if (updateData.active !== undefined) screenUpdate.active = updateData.active;

    if (Object.keys(screenUpdate).length > 0) {
      const { error: screenError } = await supabase
        .from('kitchen_screens')
        .update(screenUpdate)
        .eq('id', screenId);

      if (screenError) throw screenError;
    }

    // Actualizar asignaciones de platillos si se proporcionan
    if (updateData.dishIds !== undefined) {
      // Eliminar asignaciones existentes
      const { error: deleteError } = await supabase
        .from('screen_dish_assignments')
        .delete()
        .eq('screen_id', screenId);

      if (deleteError) throw deleteError;

      // Crear nuevas asignaciones
      if (updateData.dishIds.length > 0) {
        const assignments = updateData.dishIds.map(dishId => ({
          screen_id: screenId,
          dish_id: dishId
        }));

        const { error: insertError } = await supabase
          .from('screen_dish_assignments')
          .insert(assignments);

        if (insertError) throw insertError;
      }
    }
  }

  // Eliminar pantalla
  static async deleteScreen(screenId: string): Promise<void> {
    // Primero eliminar asignaciones
    const { error: assignmentError } = await supabase
      .from('screen_dish_assignments')
      .delete()
      .eq('screen_id', screenId);

    if (assignmentError) throw assignmentError;

    // Luego eliminar la pantalla
    const { error: screenError } = await supabase
      .from('kitchen_screens')
      .delete()
      .eq('id', screenId);

    if (screenError) throw screenError;
  }
}
