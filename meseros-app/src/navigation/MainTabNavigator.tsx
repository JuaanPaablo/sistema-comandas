import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

// Pantallas
import NewOrderScreen from '../screens/NewOrderScreen';
import OpenOrdersScreen from '../screens/OpenOrdersScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Componente para badges de notificaciones
const TabIcon = ({ 
  icon, 
  focused, 
  badge = 0 
}: { 
  icon: string; 
  focused: boolean; 
  badge?: number; 
}) => (
  <View style={styles.tabIconContainer}>
    <Text style={[
      styles.tabIcon,
      focused && styles.tabIconFocused
    ]}>
      {icon}
    </Text>
    {badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {badge > 99 ? '99+' : badge}
        </Text>
      </View>
    )}
  </View>
);

export default function MainTabNavigator() {
  // Simular número de comandas pendientes - luego conectar con estado real
  const pendingOrdersCount = 3;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIconStyle,
      }}
    >
      <Tab.Screen
        name="NewOrder"
        component={NewOrderScreen}
        options={{
          title: 'Nueva Comanda',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🍴" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OpenOrdersScreen}
        options={{
          title: 'Comandas Abiertas',
          tabBarIcon: ({ focused }) => (
            <TabIcon 
              icon="📋" 
              focused={focused} 
              badge={pendingOrdersCount}
            />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'Historial',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📊" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Configuración',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⚙️" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  tabIconStyle: {
    marginTop: 4,
  },
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.7,
  },
  tabIconFocused: {
    opacity: 1,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
