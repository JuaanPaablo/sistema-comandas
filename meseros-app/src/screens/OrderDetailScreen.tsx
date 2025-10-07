import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ComandaService } from '../services/comandaService';
import { supabase } from '../services/supabase';
import { NotificationCenter } from '../components/NotificationCenter';

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
  table_number: string;
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

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { order: initialOrder } = route.params as { order: Order };
  
  const [order, setOrder] = useState<Order>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Configurar suscripción en tiempo real para esta comanda específica
    const subscription = supabase
      .channel(`comanda_${order.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comandas',
          filter: `id=eq.${order.id}`
        }, 
        async (payload) => {
          console.log('Cambio detectado en comanda:', payload);
          // Recargar la comanda completa
          const { data: updatedComanda, error } = await ComandaService.getById(order.id);
          if (!error && updatedComanda) {
            setOrder(updatedComanda);
          }
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comanda_items',
          filter: `comanda_id=eq.${order.id}`
        }, 
        async (payload) => {
          console.log('Cambio detectado en items de comanda:', payload);
          // Recargar la comanda completa
          const { data: updatedComanda, error } = await ComandaService.getById(order.id);
          if (!error && updatedComanda) {
            setOrder(updatedComanda);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [order.id]);

  // Cronómetro en tiempo real
  useEffect(() => {
    const startTime = new Date(order.created_at).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000); // en segundos
      setElapsedTime(elapsed);
    };

    // Actualizar inmediatamente
    updateTimer();

    // Configurar intervalo para actualizar cada segundo
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [order.created_at]);

  // Función para formatear el tiempo transcurrido
  const formatElapsedTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Función eliminada: markItemAsReady - Solo cocina puede marcar como listo

  const markItemAsServed = async (itemId: string) => {
    try {
      setLoading(true);
      const { error } = await ComandaService.updateItemStatus(itemId, 'served');
      
      if (error) {
        console.error('Error marking item as served:', error);
        Alert.alert('Error', 'No se pudo marcar como servido');
        return;
      }

      Alert.alert('✅ Servido', 'Plato marcado como servido');
    } catch (error) {
      console.error('Error marking item as served:', error);
      Alert.alert('Error', 'No se pudo marcar como servido');
    } finally {
      setLoading(false);
    }
  };

  // Función eliminada: markOrderAsPreparing - Solo cocina puede marcar como preparando

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'ready': return 'Listo';
      case 'served': return 'Servido';
      default: return 'Desconocido';
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

  const getOrderStatus = () => {
    const hasPendingItems = order.items.some(item => item.status === 'pending');
    const hasReadyItems = order.items.some(item => item.status === 'ready');
    const allItemsServed = order.items.every(item => item.status === 'served');
    
    if (allItemsServed) return 'served';
    if (hasReadyItems) return 'ready';
    return 'pending';
  };

  const getOrderStatusText = () => {
    const status = getOrderStatus();
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'ready': return 'Confirmada';
      case 'served': return 'Servida';
      default: return 'Desconocido';
    }
  };

  const getOrderStatusColor = () => {
    const status = getOrderStatus();
    switch (status) {
      case 'pending': return '#FF9800';
      case 'ready': return '#2563eb';
      case 'served': return '#4CAF50';
      default: return '#666';
    }
  };

  const getServiceType = () => {
    // Extraer tipo de servicio de las notas
    if (order.notes?.includes('Para comer aquí') || order.notes?.includes('local')) {
      return 'Comer en local';
    }
    return 'Para llevar';
  };

  // Función eliminada: getElapsedTime - Ahora usamos cronómetro en tiempo real

  const renderOrderItem = (item: OrderItem) => (
    <View key={item.id} style={styles.orderItem}>
      <View style={styles.orderItemInfo}>
        <Text style={styles.dishName}>{item.dish_name}</Text>
        <View style={styles.itemDetails}>
          <Text style={styles.quantity}>{item.quantity}x ${item.unit_price.toFixed(2)}</Text>
          <Text style={styles.totalPrice}>${item.total_price.toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={styles.orderItemActions}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
        
        {item.status === 'ready' && (
          <TouchableOpacity 
            style={styles.serveButton}
            onPress={() => markItemAsServed(item.id)}
            disabled={loading}
          >
            <Text style={styles.serveButtonText}>Servir</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'served' && (
          <View style={styles.servedBadge}>
            <Text style={styles.servedText}>✓ Servido</Text>
          </View>
        )}
      </View>
    </View>
  );

  const handleItemDelivered = (itemId: string) => {
    console.log('Item entregado desde notificaciones:', itemId);
    // Recargar datos si es necesario
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Detalle de Comanda</Text>
          <Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
        </View>
        <NotificationCenter onItemDelivered={handleItemDelivered} />
      </View>

      <ScrollView style={styles.content}>
        {/* Resumen de la orden */}
        <View style={styles.orderSummary}>
          <View style={styles.orderSummaryLeft}>
            <Text style={styles.tableIcon}>🍽️</Text>
            <View>
              <Text style={styles.tableNumber}>{order.table_number}</Text>
              <Text style={styles.serviceType}>{getServiceType()}</Text>
            </View>
          </View>
          <View style={[styles.orderStatusBadge, { backgroundColor: getOrderStatusColor() }]}>
            <Text style={styles.orderStatusText}>{getOrderStatusText()}</Text>
          </View>
        </View>

        {/* Información adicional */}
        <View style={styles.orderInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>👤</Text>
            <Text style={styles.infoText}>{order.employee_name}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>⏰</Text>
            <Text style={styles.infoText}>{formatElapsedTime(elapsedTime)} transcurridos</Text>
          </View>
        </View>

        {/* Lista de items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          {order.items.map(renderOrderItem)}
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${order.total_amount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={[styles.totalValue, styles.totalAmount]}>${order.total_amount.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Botón de acción eliminado - Solo cocina puede marcar como preparando */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2563eb',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  orderId: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  tableNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  serviceType: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  orderStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  orderStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  orderInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  itemsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderItemInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  orderItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  serveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  serveButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  servedBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  servedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  totalSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  actionButtonContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
