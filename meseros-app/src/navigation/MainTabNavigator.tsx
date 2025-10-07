import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Pantallas
import NewOrderScreen from '../screens/NewOrderScreen';
import OpenOrdersScreen from '../screens/OpenOrdersScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Componente para badges de notificaciones
const TabIcon = ({
  iconName,
  focused,
  badge = 0,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  badge?: number;
}) => (
  <View style={styles.tabIconContainer}>
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Ionicons
        name={iconName}
        size={22}
        color={focused ? '#3b82f6' : '#6b7280'}
      />
    </View>
    {badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
      </View>
    )}
  </View>
);

export default function MainTabNavigator() {
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        // Contar órdenes activas
        const { getState } = require('../store/ordersStore');
        const state = getState();

        if (state.orders.length === 0) {
          await state.loadOrders();
        }

        const active = state.getActiveOrders();
        if (isMounted) setPendingOrdersCount(active.length);
      } catch (e) {
        // noop en UI
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

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
            <TabIcon iconName="restaurant-outline" focused={focused} />
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
              iconName="clipboard-outline" 
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
            <TabIcon iconName="stats-chart-outline" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Configuración',
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="settings-outline" focused={focused} />
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
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconPillActive: {
    backgroundColor: '#E8F1FF',
  },
  tabIcon: {
    fontSize: 22,
    color: '#6b7280',
  },
  tabIconFocused: {
    color: '#3b82f6',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});
