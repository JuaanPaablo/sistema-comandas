import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSimpleAuthStore } from './src/store/simpleAuthStore';
import { useOrdersStore } from './src/store/ordersStore';
import { supabase } from './src/services/supabase';

// Pantallas
import SimpleLoginScreen from './src/screens/SimpleLoginScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import OrderDetailScreen from './src/screens/OrderDetailScreen';

const Stack = createStackNavigator();

// Componente de Loading
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={styles.loadingText}>Cargando...</Text>
  </View>
);

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useSimpleAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const { upsertTable, removeTable, loadTables } = useOrdersStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await checkAuth();
        await loadTables();
      } catch (error) {
        console.error('Error inicializando app:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Realtime tables: INSERT/UPDATE/DELETE con reconexión automática
  useEffect(() => {
    let channel: any;
    let reconnectTimeout: NodeJS.Timeout;
    
    const setupRealtime = () => {
      channel = supabase
        .channel('meseros_tables_changes', {
          config: {
            broadcast: { self: false },
            presence: { key: 'meseros-app' }
          }
        })
        .on('postgres_changes', { 
          event: '*',
          schema: 'public', 
          table: 'tables' 
        }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const record: any = payload.new;
            upsertTable({
              id: record.id,
              number: record.number,
              capacity: record.capacity,
              status: record.status,
              current_order_id: record.current_order_id,
            });
          } else if (payload.eventType === 'UPDATE') {
            const record: any = payload.new;
            upsertTable({
              id: record.id,
              number: record.number,
              capacity: record.capacity,
              status: record.status,
              current_order_id: record.current_order_id,
            });
          } else if (payload.eventType === 'DELETE') {
            const oldRec: any = payload.old;
            removeTable(oldRec.id);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(reconnectTimeout);
          } else if (status === 'CHANNEL_ERROR') {
            reconnectTimeout = setTimeout(setupRealtime, 5000);
          } else if (status === 'TIMED_OUT') {
            reconnectTimeout = setTimeout(setupRealtime, 3000);
          }
        });
    };

    setupRealtime();

    return () => {
      clearTimeout(reconnectTimeout);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [upsertTable, removeTable]);

  // Mostrar loading hasta que la app esté inicializada
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {isAuthenticated ? (
            // Navegación principal con tabs
            <>
              <Stack.Screen name="Main" component={MainTabNavigator} />
              <Stack.Screen 
                name="OrderDetail" 
                component={OrderDetailScreen}
                options={{
                  headerShown: false,
                }}
              />
            </>
          ) : (
            // Pantalla de login simple
            <Stack.Screen name="Login" component={SimpleLoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
});