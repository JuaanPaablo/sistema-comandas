import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSimpleAuthStore } from '../store/simpleAuthStore';
import { supabase } from '../services/supabase';

interface Order {
  id: string;
  orderNumber: string;
  tableNumber: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  createdAt: string;
  notes?: string;
}

interface OrderItem {
  id: string;
  dishName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { employee } = useSimpleAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Conectar con la base de datos real
      const { data, error } = await supabase
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

      if (error) {
        console.error('Error cargando órdenes:', error);
        Alert.alert('Error', 'Error cargando las órdenes');
        return;
      }

      const ordersWithItems: Order[] = data?.map(order => ({
        id: order.id,
        orderNumber: order.order_number || `ORD-${order.id.slice(-4)}`,
        tableNumber: `Mesa ${order.notes || 'N/A'}`,
        items: order.order_items?.map((item: any) => ({
          id: item.id,
          dishName: item.menu_item_name || 'Producto',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          notes: item.notes
        })) || [],
        total: order.total_amount,
        status: order.status,
        createdAt: order.created_at,
        notes: order.notes
      })) || [];

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      Alert.alert('Error', 'Error cargando las órdenes');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'preparing': return '#3b82f6';
      case 'ready': return '#10b981';
      case 'served': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Listo';
      case 'served': return 'Servido';
      default: return 'Desconocido';
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    Alert.alert(
      'Cambiar Estado',
      `¿Cambiar estado a "${getStatusText(newStatus)}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            setOrders(prev => prev.map(order => 
              order.id === orderId 
                ? { ...order, status: newStatus as any }
                : order
            ));
          }
        }
      ]
    );
  };

  const renderOrderItem = (item: OrderItem) => (
    <View key={item.id} style={styles.orderItem}>
      <View style={styles.orderItemHeader}>
        <Text style={styles.orderItemName}>{item.dishName}</Text>
        <Text style={styles.orderItemPrice}>${item.totalPrice.toFixed(2)}</Text>
      </View>
      <Text style={styles.orderItemDetails}>
        Cantidad: {item.quantity} × ${item.unitPrice.toFixed(2)}
      </Text>
      {item.notes && (
        <Text style={styles.orderItemNotes}>Nota: {item.notes}</Text>
      )}
    </View>
  );

  const renderOrder = (order: Order) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.tableNumber}>{order.tableNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.items.map(renderOrderItem)}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: ${order.total.toFixed(2)}</Text>
        <View style={styles.orderActions}>
          {order.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.prepareButton]}
              onPress={() => handleStatusChange(order.id, 'preparing')}
            >
              <Text style={styles.actionButtonText}>Preparar</Text>
            </TouchableOpacity>
          )}
          {order.status === 'preparing' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.readyButton]}
              onPress={() => handleStatusChange(order.id, 'ready')}
            >
              <Text style={styles.actionButtonText}>Listo</Text>
            </TouchableOpacity>
          )}
          {order.status === 'ready' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.servedButton]}
              onPress={() => handleStatusChange(order.id, 'served')}
            >
              <Text style={styles.actionButtonText}>Servido</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {order.notes && (
        <View style={styles.orderNotes}>
          <Text style={styles.notesLabel}>Notas:</Text>
          <Text style={styles.notesText}>{order.notes}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <Text style={styles.title}>Comandas Abiertas</Text>
        <Text style={styles.subtitle}>
          {orders.length} comanda{orders.length !== 1 ? 's' : ''} activa{orders.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando comandas...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No hay comandas abiertas</Text>
            <Text style={styles.emptySubtitle}>
              Las comandas aparecerán aquí cuando se creen
            </Text>
          </View>
        ) : (
          orders.map(renderOrder)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tableNumber: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  orderItemDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  orderItemNotes: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 4,
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  prepareButton: {
    backgroundColor: '#3b82f6',
  },
  readyButton: {
    backgroundColor: '#10b981',
  },
  servedButton: {
    backgroundColor: '#6b7280',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  orderNotes: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#92400e',
  },
});