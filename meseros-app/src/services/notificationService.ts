import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface Notification {
  id: string;
  type: 'item_ready' | 'order_ready' | 'item_delivered';
  title: string;
  message: string;
  orderId: string;
  orderNumber: string;
  tableNumber?: string;
  itemName: string;
  quantity: number;
  timestamp: Date;
  read: boolean;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: ((notifications: Notification[]) => void)[] = [];

  constructor() {
    this.loadNotifications();
    this.setupRealtimeSubscriptions();
  }

  private async loadNotifications() {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  private async saveNotifications() {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private setupRealtimeSubscriptions() {
    // Suscripción a cambios en comandas cuando cambian a 'ready'
    supabase
      .channel('comanda_ready_notifications')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'comandas',
          filter: 'status=eq.ready'
        }, 
        (payload) => {
          console.log('🔔 Comanda lista detectada:', payload);
          this.handleComandaReady(payload.new);
        }
      )
      .subscribe();

    // Suscripción a cambios en order_items cuando cambian a 'ready'
    supabase
      .channel('item_ready_notifications')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'order_items',
          filter: 'status=eq.ready'
        }, 
        (payload) => {
          console.log('🔔 Item listo detectado:', payload);
          this.handleItemReady(payload.new);
        }
      )
      .subscribe();

    // Suscripción a cambios en order_items cuando cambian a 'delivered'
    supabase
      .channel('item_delivered_notifications')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'order_items',
          filter: 'status=eq.delivered'
        }, 
        (payload) => {
          console.log('✅ Item entregado detectado:', payload);
          this.handleItemDelivered(payload.new);
        }
      )
      .subscribe();
  }

  private async handleComandaReady(comanda: any) {
    try {
      const notification: Notification = {
        id: `comanda_ready_${comanda.id}_${Date.now()}`,
        type: 'order_ready',
        title: '¡La orden está lista!',
        message: `¡La orden de ${comanda.table_number} está lista!`,
        orderId: comanda.order_id,
        orderNumber: comanda.table_number,
        tableNumber: comanda.table_number,
        itemName: 'Orden completa',
        quantity: 1,
        timestamp: new Date(),
        read: false
      };

      this.addNotification(notification);
    } catch (error) {
      console.error('Error handling comanda ready:', error);
    }
  }

  private async handleItemReady(item: any) {
    try {
      // Obtener información de la orden
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          tables!inner(number)
        `)
        .eq('id', item.order_id)
        .single();

      if (orderData) {
      // Extraer número de mesa desde notes
      const tableMatch = orderData.notes?.match(/Mesa:\s*(.+)/);
      const tableNumber = tableMatch ? tableMatch[1] : 'N/A';

      const notification: Notification = {
        id: `item_ready_${item.id}_${Date.now()}`,
        type: 'item_ready',
        title: '🍽️ Plato Listo',
        message: `${item.quantity}x ${item.dish_name || 'Plato'} está listo para entregar`,
        orderId: item.order_id,
        orderNumber: orderData.order_number,
        tableNumber: tableNumber,
        itemName: item.dish_name || 'Plato',
        quantity: item.quantity,
        timestamp: new Date(),
        read: false
      };

        this.addNotification(notification);
      }
    } catch (error) {
      console.error('Error handling item ready:', error);
    }
  }

  private async handleItemDelivered(item: any) {
    try {
      // Obtener información de la orden
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          tables!inner(number)
        `)
        .eq('id', item.order_id)
        .single();

      if (orderData) {
      // Extraer número de mesa desde notes
      const tableMatch = orderData.notes?.match(/Mesa:\s*(.+)/);
      const tableNumber = tableMatch ? tableMatch[1] : 'N/A';

      const notification: Notification = {
        id: `item_delivered_${item.id}_${Date.now()}`,
        type: 'item_delivered',
        title: '✅ Entregado',
        message: `${item.quantity}x ${item.dish_name || 'Plato'} entregado a mesa ${tableNumber}`,
        orderId: item.order_id,
        orderNumber: orderData.order_number,
        tableNumber: tableNumber,
        itemName: item.dish_name || 'Plato',
        quantity: item.quantity,
        timestamp: new Date(),
        read: false
      };

        this.addNotification(notification);
      }
    } catch (error) {
      console.error('Error handling item delivered:', error);
    }
  }

  private addNotification(notification: Notification) {
    this.notifications.unshift(notification);
    // Mantener solo las últimas 50 notificaciones
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    this.saveNotifications();
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // Métodos públicos
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Método para marcar item como entregado
  async markItemAsDelivered(itemId: string) {
    try {
      const { error } = await supabase
        .from('order_items')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          delivered_by: 'mesero' // En una implementación real, usar el ID del mesero
        })
        .eq('id', itemId);

      if (error) {
        console.error('Error marking item as delivered:', error);
        throw error;
      }

      console.log('✅ Item marcado como entregado:', itemId);
    } catch (error) {
      console.error('Error marking item as delivered:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
