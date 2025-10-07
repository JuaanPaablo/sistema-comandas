import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  RefreshControl,
  ScrollView,
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
  table_number: string; // Cambiado de number a string
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
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [elapsedTimes, setElapsedTimes] = useState<{[key: string]: number}>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Cronómetro en tiempo real para todas las órdenes
  useEffect(() => {
    const updateTimers = () => {
      const now = Date.now();
      const newElapsedTimes: {[key: string]: number} = {};
      
      orders.forEach(order => {
        const startTime = new Date(order.created_at).getTime();
        const elapsed = Math.floor((now - startTime) / 1000); // en segundos
        newElapsedTimes[order.id] = elapsed;
      });
      
      setElapsedTimes(newElapsedTimes);
    };

    // Actualizar inmediatamente
    updateTimers();

    // Configurar intervalo para actualizar cada segundo
    intervalRef.current = setInterval(updateTimers, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [orders]);

  // Función para formatear el tiempo transcurrido
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${secs}s`;
    }
  };

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

  // Filtrar órdenes según el estado seleccionado
  const getFilteredOrders = () => {
    return orders.filter(order => {
      const hasPendingItems = order.items.some(item => item.status === 'pending');
      const hasReadyItems = order.items.some(item => item.status === 'ready');
      const allItemsServed = order.items.every(item => item.status === 'served');
      
      switch (selectedFilter) {
        case 'all':
          // Solo mostrar órdenes que NO estén completamente servidas
          return !allItemsServed;
        case 'pending':
          return hasPendingItems && !hasReadyItems;
        case 'confirmed':
          return hasReadyItems && !allItemsServed;
        case 'preparing':
          return hasReadyItems && !allItemsServed;
        case 'ready':
          return hasReadyItems && !allItemsServed;
        case 'served':
          // Solo mostrar órdenes completamente servidas
          return allItemsServed;
        default:
          return true;
      }
    });
  };

  // Obtener conteos por estado
  const getStatusCounts = () => {
    const counts = {
      all: 0,
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      served: 0
    };

    orders.forEach(order => {
      const hasPendingItems = order.items.some(item => item.status === 'pending');
      const hasReadyItems = order.items.some(item => item.status === 'ready');
      const allItemsServed = order.items.every(item => item.status === 'served');
      
      if (allItemsServed) {
        counts.served++;
      } else {
        counts.all++;
        
        if (hasPendingItems && !hasReadyItems) {
          counts.pending++;
        }
        if (hasReadyItems && !allItemsServed) {
          counts.confirmed++;
          counts.preparing++;
          counts.ready++;
        }
      }
    });

    return counts;
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

  const cancelOrder = async (orderId: string) => {
    try {
      Alert.alert(
        'Cancelar Comanda',
        '¿Estás seguro de que quieres cancelar esta comanda? Esta acción no se puede deshacer.',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Sí, Cancelar', 
            style: 'destructive',
            onPress: async () => {
              // Por ahora solo eliminamos la comanda de la vista
              // En el futuro se puede implementar un status 'cancelled'
              const { error } = await supabase
                .from('comandas')
                .delete()
                .eq('id', orderId);

              if (error) {
                console.error('Error cancelling order:', error);
                Alert.alert('Error', 'No se pudo cancelar la comanda');
                return;
              }

              Alert.alert('❌ Comanda Cancelada', 'La comanda ha sido cancelada');
              await loadOrders();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error cancelling order:', error);
      Alert.alert('Error', 'No se pudo cancelar la comanda');
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
    
    // Determinar el estado principal de la orden
    let orderStatus = 'pending';
    let statusText = 'Pendiente';
    let statusColor = '#FF9800';
    
    if (allItemsServed) {
      orderStatus = 'served';
      statusText = 'Servido';
      statusColor = '#9E9E9E';
    } else if (hasReadyItems) {
      orderStatus = 'ready';
      statusText = 'Listo';
      statusColor = '#4CAF50';
    }

    // Usar tiempo transcurrido del cronómetro en tiempo real
    const elapsedTime = elapsedTimes[order.id] || 0;

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => navigateToOrderDetail(order)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <View style={styles.orderIconContainer}>
              <Text style={styles.orderIcon}>👤</Text>
            </View>
            <View style={styles.orderDetails}>
              <Text style={styles.orderNumber}>#{order.id.slice(-6)}</Text>
              <Text style={styles.customerName}>{order.employee_name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{statusText}</Text>
              </View>
            </View>
          </View>
          <View style={styles.orderTotal}>
            <Text style={styles.totalAmount}>${order.total_amount.toFixed(2)}</Text>
            <Text style={styles.orderTime}>{formatElapsedTime(elapsedTime)}</Text>
          </View>
        </View>

        <View style={styles.orderItems}>
          {order.items.slice(0, 2).map((item, index) => (
            <View key={item.id} style={styles.orderItemPreview}>
              <Text style={styles.itemPreviewText}>
                {item.quantity}x {item.dish_name}
              </Text>
              <Text style={styles.itemPreviewPrice}>${item.total_price.toFixed(2)}</Text>
            </View>
          ))}
          {order.items.length > 2 && (
            <View style={styles.moreItemsBadge}>
              <Text style={styles.moreItemsText}>+{order.items.length - 2} más</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleItemDelivered = (itemId: string) => {
    console.log('Item entregado desde notificaciones:', itemId);
    loadOrders(); // Recargar órdenes
  };

  const navigateToOrderDetail = (order: Order) => {
    navigation.navigate('OrderDetail' as never, { order } as never);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text style={styles.loadingText}>Cargando órdenes...</Text>
      </View>
    );
  }

  const statusCounts = getStatusCounts();
  const filteredOrders = getFilteredOrders();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>📋</Text>
          </View>
          <View>
            <Text style={styles.title}>Comandas Abiertas</Text>
            <Text style={styles.subtitle}>{statusCounts.all} activas</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshIcon}>↻</Text>
          </TouchableOpacity>
          <NotificationCenter onItemDelivered={handleItemDelivered} />
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
              Todas ({statusCounts.all})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('pending')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'pending' && styles.filterButtonTextActive]}>
              Pendiente ({statusCounts.pending})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'confirmed' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('confirmed')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'confirmed' && styles.filterButtonTextActive]}>
              Confirmada ({statusCounts.confirmed})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'preparing' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('preparing')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'preparing' && styles.filterButtonTextActive]}>
              Preparando ({statusCounts.preparing})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'ready' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('ready')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'ready' && styles.filterButtonTextActive]}>
              Lista ({statusCounts.ready})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'served' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('served')}
          >
            <Text style={[styles.filterButtonText, selectedFilter === 'served' && styles.filterButtonTextActive]}>
              Servidos ({statusCounts.served})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No hay comandas en este estado</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          style={styles.ordersList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2563eb']}
              tintColor="#2563eb"
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
    backgroundColor: '#f8f9fa',
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
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  refreshIcon: {
    fontSize: 18,
    color: '#6b7280',
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  ordersList: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderIcon: {
    fontSize: 20,
  },
  orderDetails: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  customerName: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  orderTotal: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  orderTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  orderItems: {
    marginTop: 8,
  },
  orderItemPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemPreviewText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  itemPreviewPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  moreItemsBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  moreItemsText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
