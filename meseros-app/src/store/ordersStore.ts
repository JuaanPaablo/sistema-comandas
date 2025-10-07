import { create } from 'zustand';
import { supabase, Order, OrderItem, Table } from '../services/supabase';

interface OrdersState {
  orders: Order[];
  tables: Table[];
  currentOrder: Order | null;
  isLoading: boolean;
  loadOrders: () => Promise<void>;
  loadTables: () => Promise<void>;
  setTables: (tables: Table[]) => void;
  upsertTable: (table: Table) => void;
  removeTable: (tableId: string) => void;
  createOrder: (tableId: string, employeeId: string) => Promise<Order | null>;
  addItemToOrder: (orderId: string, menuItemId: string, quantity: number, notes?: string) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<boolean>;
  sendOrderToKitchen: (orderId: string) => Promise<boolean>;
  getOrdersByTable: (tableId: string) => Order[];
  getActiveOrders: () => Order[];
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  tables: [],
  currentOrder: null,
  isLoading: false,

  loadOrders: async () => {
    set({ isLoading: true });
    
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            menu_item_name,
            quantity,
            unit_price,
            total_price,
            notes,
            status
          )
        `)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error cargando órdenes:', ordersError);
        set({ isLoading: false });
        return;
      }

      const orders: Order[] = ordersData.map((order: any) => ({
        id: order.id,
        table_id: order.table_id,
        employee_id: order.employee_id,
        status: order.status,
        total_amount: order.total_amount,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: order.order_items || [],
      }));

      set({ orders, isLoading: false });
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      set({ isLoading: false });
    }
  },

  loadTables: async () => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('number', { ascending: true });

      if (error) {
        console.error('Error cargando mesas:', error);
        return;
      }

      const tables: Table[] = data?.map(table => ({
        id: table.id,
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        current_order_id: table.current_order_id
      })) || [];

      set({ tables });
    } catch (error) {
      console.error('Error cargando mesas:', error);
    }
  },

  setTables: (tables: Table[]) => {
    set({ tables });
  },

  upsertTable: (table: Table) => {
    set((state) => {
      const exists = state.tables.some(t => t.id === table.id);
      const updated = exists
        ? state.tables.map(t => (t.id === table.id ? table : t))
        : [...state.tables, table];
      // ordenar por número si existe
      updated.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
      return { tables: updated };
    });
  },

  removeTable: (tableId: string) => {
    set((state) => ({
      tables: state.tables.filter(t => t.id !== tableId)
    }));
  },

  createOrder: async (tableId: string, employeeId: string) => {
    try {
      // Obtener número de mesa para usar en notes
      const { data: tableData } = await supabase
        .from('tables')
        .select('number')
        .eq('id', tableId)
        .single();

      const { data, error } = await supabase
        .from('orders')
        .insert({
          employee_id: employeeId,
          status: 'pending',
          total_amount: 0,
          notes: `Mesa ${tableData?.number || 'N/A'}`,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creando orden:', error);
        return null;
      }

      // Actualizar estado de la mesa
      await supabase
        .from('tables')
        .update({ 
          status: 'occupied',
          current_order_id: data.id
        })
        .eq('id', tableId);

      const newOrder: Order = {
        id: data.id,
        table_id: tableId,
        employee_id: data.employee_id,
        status: data.status,
        total_amount: data.total_amount,
        created_at: data.created_at,
        updated_at: data.updated_at,
        items: [],
      };

      set(state => ({
        orders: [newOrder, ...state.orders],
        currentOrder: newOrder,
      }));

      return newOrder;
    } catch (error) {
      console.error('Error creando orden:', error);
      return null;
    }
  },

  addItemToOrder: async (orderId: string, menuItemId: string, quantity: number, notes?: string, variantName?: string) => {
    try {
      // Obtener información del platillo
      const { data: menuItem, error: menuError } = await supabase
        .from('dishes')
        .select('name, price')
        .eq('id', menuItemId)
        .single();

      if (menuError || !menuItem) {
        console.error('Error obteniendo platillo:', menuError);
        return false;
      }

      const unitPrice = menuItem.price;
      const totalPrice = unitPrice * quantity;
      const displayName = variantName || menuItem.name;

      // Crear item de la orden
      const insertData: any = {
        order_id: orderId,
        menu_item_id: menuItemId,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        status: 'pending',
      };

      // Intentar usar dish_name si existe, sino usar notes
      try {
        insertData.dish_name = displayName;
        insertData.notes = notes;
      } catch (e) {
        // Si dish_name no existe, usar notes como fallback
        insertData.notes = notes ? `${notes} | ${displayName}` : displayName;
      }

      const { data, error } = await supabase
        .from('order_items')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error agregando item a la orden:', error);
        return false;
      }

      // Actualizar total de la orden
      const { data: orderData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('id', orderId)
        .single();

      const newTotal = (orderData?.total_amount || 0) + totalPrice;

      await supabase
        .from('orders')
        .update({ total_amount: newTotal })
        .eq('id', orderId);

      // Actualizar estado local
      set(state => ({
        orders: state.orders.map(order =>
          order.id === orderId
            ? {
                ...order,
                total_amount: newTotal,
                items: [...order.items, {
                  id: data.id,
                  order_id: orderId,
                  menu_item_id: menuItemId,
                  menu_item_name: menuItem.name,
                  quantity,
                  unit_price: unitPrice,
                  total_price: totalPrice,
                  notes,
                  status: 'pending',
                }],
              }
            : order
        ),
      }));

      return true;
    } catch (error) {
      console.error('Error agregando item a la orden:', error);
      return false;
    }
  },

  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        console.error('Error actualizando estado de orden:', error);
        return false;
      }

      set(state => ({
        orders: state.orders.map(order =>
          order.id === orderId ? { ...order, status, updated_at: new Date().toISOString() } : order
        ),
      }));

      return true;
    } catch (error) {
      console.error('Error actualizando estado de orden:', error);
      return false;
    }
  },

  sendOrderToKitchen: async (orderId: string) => {
    try {
      // Actualizar estado de la orden
      const success = await get().updateOrderStatus(orderId, 'confirmed');
      
      if (success) {
        // Asignar items a pantallas de cocina
        const { error } = await supabase.rpc('assign_order_to_kitchen_screens', {
          order_id_param: orderId
        });
        
        if (error) {
          console.error('Error asignando orden a pantallas:', error);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error enviando orden a cocina:', error);
      return false;
    }
  },

  getOrdersByTable: (tableId: string) => {
    const { orders } = get();
    return orders.filter(order => order.table_id === tableId);
  },

  getActiveOrders: () => {
    const { orders } = get();
    return orders.filter(order => 
      ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
    );
  },
}));
