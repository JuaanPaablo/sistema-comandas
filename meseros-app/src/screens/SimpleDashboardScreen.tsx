import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSimpleAuthStore } from '../store/simpleAuthStore';

export default function SimpleDashboardScreen({ navigation }: any) {
  const { employee, logout } = useSimpleAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar Sesión', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      id: 'menu',
      title: 'Ver Menú',
      description: 'Explorar platillos disponibles',
      icon: '🍽️',
      onPress: () => navigation.navigate('Menu'),
    },
    {
      id: 'orders',
      title: 'Mis Órdenes',
      description: 'Ver órdenes asignadas',
      icon: '📋',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      id: 'profile',
      title: 'Mi Perfil',
      description: 'Información del empleado',
      icon: '👤',
      onPress: () => Alert.alert('Perfil', `Nombre: ${employee?.name}\nPosición: ${employee?.position === 'mesero' ? 'Mesero' : 'Cocinero'}`),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>¡Hola, {employee?.name}!</Text>
          <Text style={styles.positionText}>
            {employee?.position === 'mesero' ? 'Mesero' : 'Cocinero'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <Text style={styles.menuItemIcon}>{item.icon}</Text>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemDescription}>{item.description}</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Estado del Sistema</Text>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Conexión:</Text>
          <Text style={styles.statusValue}>Conectado</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Última actualización:</Text>
          <Text style={styles.statusValue}>
            {new Date().toLocaleTimeString()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  positionText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  menuItemArrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
  statusContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
});
