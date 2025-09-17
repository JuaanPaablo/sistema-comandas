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

interface CompletedOrder {
  id: string;
  orderNumber: string;
  tableNumber: string;
  items: OrderItem[];
  total: number;
  status: 'completed' | 'cancelled';
  createdAt: string;
  completedAt: string;
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

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<CompletedOrder[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Datos de prueba - luego conectar con API
  const mockOrders: CompletedOrder[] = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      tableNumber: 'Mesa 5',
      items: [
        {
          id: '1',
          dishName: 'Hamburguesa Clásica',
          quantity: 2,
          unitPrice: 8.50,
          totalPrice: 17.00,
          notes: 'Sin cebolla'
        },
        {
          id: '2',
          dishName: 'Papas Fritas',
          quantity: 1,
          unitPrice: 3.50,
          totalPrice: 3.50
        }
      ],
      total: 20.50,
      status: 'completed',
      createdAt: '2025-01-10T10:30:00Z',
      completedAt: '2025-01-10T11:15:00Z',
      notes: 'Cliente satisfecho'
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      tableNumber: 'Mesa 3',
      items: [
        {
          id: '3',
          dishName: 'Pizza Margherita',
          quantity: 1,
          unitPrice: 12.00,
          totalPrice: 12.00
        }
      ],
      total: 12.00,
      status: 'completed',
      createdAt: '2025-01-10T11:00:00Z',
      completedAt: '2025-01-10T11:45:00Z'
    },
    {
      id: '3',
      orderNumber: 'ORD-003',
      tableNumber: 'Mesa 7',
      items: [
        {
          id: '4',
          dishName: 'Ensalada César',
          quantity: 1,
          unitPrice: 7.50,
          totalPrice: 7.50
        }
      ],
      total: 7.50,
      status: 'cancelled',
      createdAt: '2025-01-10T12:00:00Z',
      completedAt: '2025-01-10T12:05:00Z',
      notes: 'Cliente canceló la orden'
    }
  ];

  const filters = [
    { id: 'all', name: 'Todas', icon: '📋' },
    { id: 'completed', name: 'Completadas', icon: '✅' },
    { id: 'cancelled', name: 'Canceladas', icon: '❌' }
  ];

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrders(mockOrders);
    } catch (error) {
      console.error('Error cargando historial:', error);
      Alert.alert('Error', 'Error cargando el historial');
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

  useEffect(() => {
    let filtered = orders;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(order => order.status === selectedFilter);
    }

    setFilteredOrders(filtered);
  }, [selectedFilter, orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalStats = () => {
    const completed = orders.filter(o => o.status === 'completed');
    const cancelled = orders.filter(o => o.status === 'cancelled');
    const totalRevenue = completed.reduce((sum, order) => sum + order.total, 0);

    return {
      total: orders.length,
      completed: completed.length,
      cancelled: cancelled.length,
      revenue: totalRevenue
    };
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

  const renderOrder = (order: CompletedOrder) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.tableNumber}>{order.tableNumber}</Text>
          <Text style={styles.orderDate}>
            {formatDate(order.createdAt)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusIcon}>{getStatusIcon(order.status)}</Text>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.items.map(renderOrderItem)}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: ${order.total.toFixed(2)}</Text>
        <Text style={styles.completedDate}>
          {order.status === 'completed' ? 'Completada' : 'Cancelada'}: {formatDate(order.completedAt)}
        </Text>
      </View>

      {order.notes && (
        <View style={styles.orderNotes}>
          <Text style={styles.notesLabel}>Notas:</Text>
          <Text style={styles.notesText}>{order.notes}</Text>
        </View>
      )}
    </View>
  );

  const stats = getTotalStats();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>
          {filteredOrders.length} comanda{filteredOrders.length !== 1 ? 's' : ''} en el historial
        </Text>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completadas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.cancelled}</Text>
          <Text style={styles.statLabel}>Canceladas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>${stats.revenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Ingresos</Text>
        </View>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              selectedFilter === filter.id && styles.filterButtonActive
            ]}
            onPress={() => setSelectedFilter(filter.id as any)}
          >
            <Text style={styles.filterIcon}>{filter.icon}</Text>
            <Text style={[
              styles.filterText,
              selectedFilter === filter.id && styles.filterTextActive
            ]}>
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de órdenes */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No hay comandas en el historial</Text>
            <Text style={styles.emptySubtitle}>
              Las comandas completadas aparecerán aquí
            </Text>
          </View>
        ) : (
          filteredOrders.map(renderOrder)
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
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
    alignItems: 'flex-start',
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
  orderDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 4,
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
  completedDate: {
    fontSize: 12,
    color: '#6b7280',
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
