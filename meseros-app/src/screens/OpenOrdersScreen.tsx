import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { NotificationCenter } from '../components/NotificationCenter';
import { ComandaService, ComandaComplete } from '../services/comandaService';

interface OrderItem {
  id: string;
  dish_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: 'pending' | 'ready' | 'served';
  created_at: string;
  prepared_at?: string;
  served_at?: string;
}

interface Order {
  id: string;
  order_id: string;
  table_number: number;
  employee_name: string;
  status: 'pending' | 'ready' | 'served';
  total_amount: number;
  items_count: number;
  created_at: string;
  updated_at: string;
  served_at?: string;
  notes?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimated_time: number;
  actual_time: number;
  total_preparation_time: number;
  items: OrderItem[];
}

export default function OpenOrdersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    
    // Configurar suscripción en tiempo real para comandas
    const subscription = supabase
      .channel('comandas_realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comandas'
        }, 
        (payload) => {
          console.log('🔄 Cambio detectado en comandas:', payload);
          loadOrders();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comanda_items'
        }, 
        (payload) => {
          console.log('🔄 Cambio detectado en comanda_items:', payload);
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Usar el servicio de comandas para obtener comandas activas
      const { data: comandas, error } = await ComandaService.getActive();
      
      if (error) {
        console.error('Error loading comandas:', error);
        Alert.alert('Error', 'No se pudieron cargar las comandas');
        return;
      }
      
      // Convertir comandas al formato esperado por la UI
      const ordersWithItems = (comandas || []).map(comanda => ({
        id: comanda.id,
        order_id: comanda.order_id,
        table_number: comanda.table_number,
        employee_name: comanda.employee_name,
        status: comanda.status,
        total_amount: comanda.total_amount,
        items_count: comanda.items_count,
        created_at: comanda.created_at,
        updated_at: comanda.updated_at,
        served_at: comanda.served_at,
        notes: comanda.notes,
        priority: comanda.priority,
        estimated_time: comanda.estimated_time,
        actual_time: comanda.actual_time,
        total_preparation_time: comanda.total_preparation_time,
        items: comanda.items || []
      }));
      
      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'No se pudieron cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const markItemAsDelivered = async (itemId: string) => {
    try {
      const { data, error } = await ComandaService.updateItemStatus(itemId, 'served');
      
      if (error) {
        console.error('Error marking item as served:', error);
        Alert.alert('Error', 'No se pudo marcar como servido');
        return;
      }

      Alert.alert('✅ Servido', 'Plato marcado como servido');
      await loadOrders(); // Recargar para actualizar la vista
    } catch (error) {
      console.error('Error marking item as served:', error);
      Alert.alert('Error', 'No se pudo marcar como servido');
    }
  };

  const markOrderAsDelivered = async (orderId: string) => {
    try {
      const { data, error } = await ComandaService.markAsServed(orderId);
      
      if (error) {
        console.error('Error marking order as served:', error);
        Alert.alert('Error', 'No se pudo marcar la orden como servida');
        return;
      }

      Alert.alert('✅ Orden Servida', 'Toda la orden ha sido marcada como servida');
      await loadOrders();
    } catch (error) {
      console.error('Error marking order as served:', error);
      Alert.alert('Error', 'No se pudo marcar la orden como servida');
    }
  };

  const removeItemFromOrder = async (itemId: string, orderId: string) => {
    try {
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error removing item:', error);
        Alert.alert('Error', 'No se pudo eliminar el platillo');
        return;
      }

      // Recalcular total de la orden
      const { data: remainingItems } = await supabase
        .from('order_items')
        .select('total_price')
        .eq('order_id', orderId);

      const newTotal = remainingItems?.reduce((sum, item) => sum + item.total_price, 0) || 0;
      
      await supabase
        .from('orders')
        .update({ total_amount: newTotal })
        .eq('id', orderId);

      Alert.alert('🗑️ Eliminado', 'Platillo eliminado de la orden');
      await loadOrders();
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'No se pudo eliminar el platillo');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '⏳ Pendiente';
      case 'ready': return '✅ Listo';
      case 'served': return '📦 Servido';
      default: return '❓ Desconocido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'ready':
        return '#4CAF50';
      case 'served':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const renderOrderItem = ({ item, orderId }: { item: OrderItem, orderId: string }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderItemInfo}>
        <Text style={styles.dishName}>{item.dish_name}</Text>
        <Text style={styles.quantity}>x{item.quantity}</Text>
        <Text style={styles.price}>${item.total_price.toFixed(2)}</Text>
      </View>
      
      <View style={styles.orderItemActions}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
        
        <View style={styles.itemButtons}>
          {item.status === 'ready' && (
            <TouchableOpacity 
              style={styles.deliverButton}
              onPress={() => markItemAsDelivered(item.id)}
            >
              <Text style={styles.deliverButtonText}>Servir</Text>
            </TouchableOpacity>
          )}
          
          {item.status !== 'served' && (
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={() => {
                Alert.alert(
                  'Eliminar Platillo',
                  `¿Estás seguro de que quieres eliminar "${item.dish_name}" de esta orden?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: () => removeItemFromOrder(item.id, orderId) }
                  ]
                );
              }}
            >
              <Text style={styles.removeButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderOrder = ({ item: order }: { item: Order }) => {
    const hasReadyItems = order.items.some(item => item.status === 'ready');
    const allItemsServed = order.items.every(item => item.status === 'served');
    const hasPendingItems = order.items.some(item => item.status === 'pending');
    const isExpanded = expandedOrder === order.id;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>Comanda #{order.id.slice(-6)}</Text>
            <Text style={styles.tableNumber}>Mesa {order.table_number}</Text>
            <Text style={styles.employeeName}>Mesero: {order.employee_name}</Text>
          </View>
          <View style={styles.orderTotal}>
            <Text style={styles.totalAmount}>${order.total_amount.toFixed(2)}</Text>
            <Text style={styles.orderTime}>
              {new Date(order.created_at).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Botón para ver detalles */}
        <View style={styles.detailsContainer}>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={() => setExpandedOrder(isExpanded ? null : order.id)}
          >
            <Text style={styles.detailsButtonText}>
              {isExpanded ? '👁️ Ocultar Detalles' : '👁️ Ver Detalles'} ({order.items.length} platillos)
            </Text>
          </TouchableOpacity>
        </View>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Botón de editar orden dentro del modal */}
            <View style={styles.editOrderContainer}>
              <TouchableOpacity 
                style={styles.editOrderButton}
                onPress={() => {
                  // Navegar a Nueva Orden con la orden actual para editar
                  navigation.navigate('NewOrder' as never, { 
                    editingOrder: order,
                    isEditing: true 
                  } as never);
                }}
              >
                <Text style={styles.editOrderButtonText}>✏️ Editar Orden</Text>
              </TouchableOpacity>
            </View>

            {/* Lista de platillos */}
            <FlatList
              data={order.items}
              renderItem={({ item }) => renderOrderItem({ item, orderId: order.id })}
              keyExtractor={(item) => item.id}
              style={styles.itemsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Botones de acción para la orden completa */}
        <View style={styles.orderActions}>
          {!allItemsServed && (
            <TouchableOpacity 
              style={hasReadyItems ? styles.deliverAllButton : styles.markDeliveredButton}
              onPress={() => {
                Alert.alert(
                  hasReadyItems ? 'Servir Orden Completa' : 'Marcar como Servido',
                  '¿Estás seguro de que quieres marcar toda la orden como servida?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: hasReadyItems ? 'Servir Todo' : 'Servido', style: 'default', onPress: () => markOrderAsDelivered(order.id) }
                  ]
                );
              }}
            >
              <Text style={hasReadyItems ? styles.deliverAllButtonText : styles.markDeliveredButtonText}>
                {hasReadyItems ? '📦 Servir Orden Completa' : '✅ Marcar como Servido'}
              </Text>
            </TouchableOpacity>
          )}
          
          {allItemsServed && (
            <View style={styles.completedOrder}>
              <Text style={styles.completedText}>✅ Orden Completamente Servida</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const handleItemDelivered = (itemId: string) => {
    console.log('Item entregado desde notificaciones:', itemId);
    loadOrders(); // Recargar órdenes
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text style={styles.loadingText}>Cargando órdenes...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ÓRDENES ABIERTAS</Text>
        <NotificationCenter onItemDelivered={handleItemDelivered} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No hay órdenes abiertas</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          style={styles.ordersList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2196F3']}
              tintColor="#2196F3"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  ordersList: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tableNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  employeeName: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  orderTotal: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  itemsList: {
    maxHeight: 200,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderItemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dishName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  quantity: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  orderItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  deliverButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deliverButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  itemButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  removeButtonText: {
    fontSize: 16,
    color: '#d32f2f',
  },
  orderActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  deliverAllButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deliverAllButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedOrder: {
    backgroundColor: '#e8f5e8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  completedText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
  editOrderContainer: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  editOrderButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  editOrderButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  markDeliveredButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  markDeliveredButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  detailsButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  detailsButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  expandedContent: {
    marginTop: 8,
  },
});
