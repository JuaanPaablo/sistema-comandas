import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useOrdersStore } from '../store/ordersStore';

export default function DashboardScreen({ navigation }: any) {
  const { employee, logout } = useAuthStore();
  const { 
    tables, 
    orders, 
    loadTables, 
    loadOrders, 
    isLoading,
    getActiveOrders,
    createOrder 
  } = useOrdersStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadTables(),
      loadOrders(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTablePress = async (table: any) => {
    if (table.status === 'available') {
      // Crear nueva orden para esta mesa
      if (employee) {
        const newOrder = await createOrder(table.id, employee.id);
        if (newOrder) {
          navigation.navigate('Menu', { 
            orderId: newOrder.id, 
            tableNumber: table.number 
          });
        }
      }
    } else if (table.status === 'occupied') {
      // Ver órdenes existentes de esta mesa
      const tableOrders = orders.filter(order => order.table_id === table.id);
      navigation.navigate('Orders', { 
        tableId: table.id, 
        tableNumber: table.number,
        orders: tableOrders 
      });
    }
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#10b981'; // verde
      case 'occupied':
        return '#f59e0b'; // amarillo
      case 'reserved':
        return '#8b5cf6'; // púrpura
      case 'cleaning':
        return '#ef4444'; // rojo
      default:
        return '#6b7280'; // gris
    }
  };

  const getTableStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      case 'cleaning':
        return 'Limpieza';
      default:
        return 'Desconocido';
    }
  };

  const activeOrders = getActiveOrders();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>¡Hola, {employee?.name}!</Text>
          <Text style={styles.subtitle}>Mesa de trabajo</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas rápidas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{tables.length}</Text>
          <Text style={styles.statLabel}>Mesas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {tables.filter(t => t.status === 'available').length}
          </Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeOrders.length}</Text>
          <Text style={styles.statLabel}>Órdenes Activas</Text>
        </View>
      </View>

      {/* Mesas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mesas</Text>
        <View style={styles.tablesGrid}>
          {tables.map((table) => (
            <TouchableOpacity
              key={table.id}
              style={[
                styles.tableCard,
                { borderLeftColor: getTableStatusColor(table.status) }
              ]}
              onPress={() => handleTablePress(table)}
            >
              <View style={styles.tableHeader}>
                <Text style={styles.tableNumber}>Mesa {table.number}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getTableStatusColor(table.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {getTableStatusText(table.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.tableCapacity}>
                Capacidad: {table.capacity} personas
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Órdenes activas */}
      {activeOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Órdenes Activas</Text>
          {activeOrders.slice(0, 3).map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => navigation.navigate('Orders', { 
                orderId: order.id,
                tableId: order.table_id 
              })}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderTable}>
                  Mesa {tables.find(t => t.id === order.table_id)?.number || '?'}
                </Text>
                <Text style={styles.orderAmount}>
                  ${order.total_amount.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.orderStatus}>
                Estado: {order.status}
              </Text>
              <Text style={styles.orderTime}>
                {new Date(order.created_at).toLocaleTimeString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tableCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  tableCapacity: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTable: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  orderStatus: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
