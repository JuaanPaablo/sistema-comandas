import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ComandaService, ComandaComplete } from '../services/comandaService';

interface HistoryItem {
  id: string;
  order_id: string;
  table_number: string; // Cambiado de number a string
  employee_name: string;
  status: 'served';
  total_amount: number;
  items_count: number;
  created_at: string;
  served_at: string;
  notes?: string;
  items: Array<{
    id: string;
    dish_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    status: 'served';
    notes?: string;
  }>;
}

type FilterType = 'all' | 'completed' | 'cancelled';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<HistoryItem[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    cancelled: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, selectedFilter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      
      // Obtener historial de comandas servidas
      const { data: comandas, error } = await ComandaService.getHistory(100);
      
      if (error) {
        console.error('Error loading history:', error);
        return;
      }
      
      // Convertir comandas al formato esperado
      const historyItems = (comandas || []).map(comanda => ({
        id: comanda.id,
        order_id: comanda.order_id,
        table_number: comanda.table_number,
        employee_name: comanda.employee_name,
        status: comanda.status as 'served',
        total_amount: comanda.total_amount,
        items_count: comanda.items_count,
        created_at: comanda.created_at,
        served_at: comanda.served_at || comanda.created_at,
        notes: comanda.notes,
        items: comanda.items || []
      }));
      
      setOrders(historyItems);
      
      // Obtener estadísticas del historial
      const { data: statsData, error: statsError } = await ComandaService.getHistoryStats();
      
      if (statsError) {
        console.error('Error loading stats:', statsError);
        // Usar estadísticas locales como fallback
        const total = historyItems.length;
        const completed = historyItems.filter(order => order.status === 'served').length;
        const cancelled = 0;
        const revenue = historyItems.reduce((sum, order) => sum + order.total_amount, 0);
        setStats({ total, completed, cancelled, revenue });
      } else if (statsData) {
        setStats(statsData);
      }
      
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;
    
    switch (selectedFilter) {
      case 'completed':
        filtered = orders.filter(order => order.status === 'served');
        break;
      case 'cancelled':
        filtered = orders.filter(order => order.status === 'cancelled');
        break;
      default:
        filtered = orders;
    }
    
    setFilteredOrders(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrderItem = ({ item }: { item: HistoryItem['items'][0] }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderItemInfo}>
        <Text style={styles.dishName}>{item.dish_name}</Text>
        <Text style={styles.quantity}>Cantidad: {item.quantity} × ${item.unit_price.toFixed(2)}</Text>
        {item.notes && (
          <Text style={styles.itemNotes}>Nota: {item.notes}</Text>
        )}
      </View>
      <Text style={styles.itemTotal}>${item.total_price.toFixed(2)}</Text>
    </View>
  );

  const renderOrder = ({ item: order }: { item: HistoryItem }) => {
    const isExpanded = expandedOrder === order.id;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>ORD-{order.id.slice(-3).toUpperCase()}</Text>
            <Text style={styles.tableNumber}>Mesa {order.table_number}</Text>
            <Text style={styles.orderDate}>
              {formatDate(order.created_at)}, {formatTime(order.created_at)}
            </Text>
          </View>
          <View style={styles.orderStatus}>
            <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.statusText}>✓ Completada</Text>
            </View>
          </View>
        </View>

        <View style={styles.orderTotal}>
          <Text style={styles.totalAmount}>${order.total_amount.toFixed(2)}</Text>
        </View>

        {/* Botón para ver detalles */}
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => setExpandedOrder(isExpanded ? null : order.id)}
        >
          <Text style={styles.detailsButtonText}>
            {isExpanded ? '👁️ Ocultar Detalles' : '👁️ Ver Detalles'} ({order.items.length} platillos)
          </Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <FlatList
              data={order.items}
              renderItem={renderOrderItem}
              keyExtractor={(item) => item.id}
              style={styles.itemsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>
    );
  };

  const renderFilterButton = (filter: FilterType, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={styles.filterIcon}>{icon}</Text>
      <Text style={[
        styles.filterText,
        selectedFilter === filter && styles.filterTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>{stats.total} comandas en el historial</Text>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completadas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#F44336' }]}>{stats.cancelled}</Text>
          <Text style={styles.statLabel}>Canceladas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>${stats.revenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Ingresos</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        {renderFilterButton('all', 'Todas', '📋')}
        {renderFilterButton('completed', 'Completadas', '✓')}
        {renderFilterButton('cancelled', 'Canceladas', '✗')}
        
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshIcon}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de órdenes */}
      {filteredOrders.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>
            {selectedFilter === 'all' 
              ? 'No hay comandas en el historial' 
              : `No hay comandas ${selectedFilter === 'completed' ? 'completadas' : 'canceladas'}`
            }
          </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: 'white',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  refreshIcon: {
    fontSize: 18,
    color: '#666',
  },
  ordersList: {
    flex: 1,
    padding: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  orderTotal: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  detailsButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  itemsList: {
    maxHeight: 200,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderItemInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  quantity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: 11,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

