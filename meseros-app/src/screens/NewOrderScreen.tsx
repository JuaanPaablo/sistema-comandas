import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MenuService, Category, DishWithVariants } from '../services/menuService';
import { AvailabilityService, DishAvailability, supabase } from '../services/availabilityService';
import { TableService, Table } from '../services/tableService';
import { useOrdersStore } from '../store/ordersStore';
import { useMemo } from 'react';
import { useSimpleAuthStore } from '../store/simpleAuthStore';
import { NotificationCenter } from '../components/NotificationCenter';
import { ComandaService } from '../services/comandaService';
import { useSupabaseMenu } from '../hooks/useSupabaseMenu';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  selectedVariants?: any[];
}

interface NewOrderScreenProps {
  onOrderCreated?: (order: any) => void;
}

export default function NewOrderScreen({ onOrderCreated }: NewOrderScreenProps) {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const navigation = useNavigation();
  const { employee } = useSimpleAuthStore();
  const { tables, createOrder: createOrderInDB, addItemToOrder: addItemToOrderDB, sendOrderToKitchen } = useOrdersStore();
  
  // Parámetros de navegación para edición
  const editingOrder = route.params?.editingOrder;
  const isEditing = route.params?.isEditing || false;
  // Hook de Supabase Real-time para datos del menú
  const { categories, dishes, loading: menuLoading, error: menuError, isConnected, refetch: refetchMenu } = useSupabaseMenu();
  const [filteredDishes, setFilteredDishes] = useState<DishWithVariants[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  // Mesas disponibles derivadas del store (realtime)
  const availableTables = useMemo<Table[]>(() => {
    const sorted = [...tables].filter(t => t.status === 'available');
    // Ordenar por número ascendente si existe
    sorted.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
    return sorted;
  }, [tables]);
  const [showTableModal, setShowTableModal] = useState(false);
  const [customTableInput, setCustomTableInput] = useState('');
  const [showCustomTableInput, setShowCustomTableInput] = useState(false);
  const [serviceType, setServiceType] = useState<'local' | 'takeaway'>('local');
  const [showTakeawayOption, setShowTakeawayOption] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [selectedDish, setSelectedDish] = useState<DishWithVariants | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [itemNote, setItemNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  // isLoading ahora viene del hook useRealtimeMenu
  const [dishAvailability, setDishAvailability] = useState<DishAvailability[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Función para cargar datos adicionales (disponibilidad, recetas, inventario)
  const loadAdditionalData = async () => {
    try {
      if (dishes.length > 0) {
        // Calcular disponibilidad de todos los platillos
        const dishIds = dishes.map(dish => dish.id);
        const availability = await AvailabilityService.calculateAllDishesAvailability(dishIds);
        setDishAvailability(availability);
        
        // Cargar recetas e inventario para cálculo de variantes
        const recipesResult = await AvailabilityService.getActiveRecipes();
        const inventoryResult = await AvailabilityService.getCurrentInventory();
        
        if (recipesResult.data) setRecipes(recipesResult.data);
        if (inventoryResult.data) setInventory(inventoryResult.data);
      }
    } catch (error) {
      console.error('Error cargando datos adicionales:', error);
    }
  };

  // Efecto para cargar datos adicionales cuando cambien los platillos
  useEffect(() => {
    if (dishes.length > 0) {
      loadAdditionalData();
      setFilteredDishes(dishes);
    }
  }, [dishes]);

  // Eliminado: carga snapshot. Ahora usamos realtime desde el store

  useEffect(() => {
    
    // Configurar actualizaciones en tiempo real
    const setupRealtimeUpdates = () => {
      // Escuchar cambios en recetas
      const recipesSubscription = supabase
        .channel('recipes_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'recipes' },
          () => {
            console.log('Cambio detectado en recetas, recargando...');
            refetchMenu();
          }
        )
        .subscribe();

      // Escuchar cambios en inventario
      const inventorySubscription = supabase
        .channel('inventory_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'inventory_items' },
          () => {
            console.log('Cambio detectado en inventario, recargando...');
            refetchMenu();
          }
        )
        .subscribe();

      // Escuchar cambios en lotes
      const batchesSubscription = supabase
        .channel('batches_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'batches' },
          () => {
            console.log('Cambio detectado en lotes, recargando...');
            refetchMenu();
          }
        )
        .subscribe();

      return () => {
        recipesSubscription.unsubscribe();
        inventorySubscription.unsubscribe();
        batchesSubscription.unsubscribe();
      };
    };

    const cleanup = setupRealtimeUpdates();
    return cleanup;
  }, []);

  // Función de recarga optimizada
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const now = Date.now();
      
      // Solo recargar si han pasado al menos 5 segundos desde la última recarga
      if (now - lastRefreshTime < 5000) {
        console.log('Recarga muy reciente, usando caché');
        setIsRefreshing(false);
        return;
      }
      
      await refetchMenu();
      setLastRefreshTime(now);
    } catch (error) {
      console.error('Error al recargar:', error);
      Alert.alert('Error', 'No se pudo recargar el menú');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Función para manejar items entregados
  const handleItemDelivered = (itemId: string) => {
    console.log('Item entregado:', itemId);
    // Aquí podrías actualizar el estado local si es necesario
    // Por ejemplo, refrescar las órdenes abiertas
  };

  // Filtrar platos por categoría y búsqueda
  useEffect(() => {
    let filtered = dishes;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(dish => dish.category_id === selectedCategory);
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter(dish =>
        dish.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDishes(filtered);
  }, [dishes, selectedCategory, searchTerm]);

  // Cargar datos de la orden si estamos editando
  useEffect(() => {
    if (isEditing && editingOrder) {
      // Extraer número de mesa desde notes
      const tableMatch = editingOrder.notes?.match(/Mesa:\s*(.+)/);
      const tableNumber = tableMatch ? tableMatch[1] : 'N/A';
      setTableNumber(tableNumber);
      
      // Establecer tipo de servicio
      setServiceType(editingOrder.service_type || 'local');
      
      // Convertir items de la orden al formato esperado
      const orderItems = editingOrder.items.map((item: any) => ({
        id: item.id,
        name: item.dish_name,
        price: item.unit_price,
        quantity: item.quantity,
        notes: item.notes || '',
        selectedVariants: []
      }));
      setOrderItems(orderItems);
    }
  }, [isEditing, editingOrder]);

  // Obtener cantidad total de items
  const getTotalItems = () => {
    return orderItems.reduce((total, item) => total + item.quantity, 0);
  };


  // Obtener total de la orden
  const getOrderTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Agregar item a la orden
  const addToOrder = (dish: DishWithVariants) => {
    if (dish.variants && dish.variants.length > 0) {
      setSelectedDish(dish);
      setShowVariants(true);
      return;
    }

    addItemToOrder(dish, []);
  };

  // Agregar item con variantes
  const addItemToOrder = (dish: DishWithVariants, selectedVariants: any[] = []) => {
    // Obtener stock disponible
    let availableStock = 0;
    
    if (selectedVariants.length > 0) {
      // Para variantes, usar el stock de la variante específica
      const variantId = selectedVariants[0].id;
      availableStock = getVariantAvailability(dish.id, variantId);
    } else {
      // Para platillos sin variantes, usar el stock general
      const availability = dishAvailability.find(av => av.dishId === dish.id);
      availableStock = availability?.availableQuantity || 0;
    }

    // Verificar si hay stock disponible
    if (availableStock <= 0) {
      Alert.alert(
        'Sin stock disponible',
        'Este producto no tiene stock disponible en este momento.',
        [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }

    const existingItemIndex = orderItems.findIndex(
      item => item.id === dish.id && 
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
    );

    if (existingItemIndex >= 0) {
      // Verificar si se puede incrementar la cantidad
      const currentQuantity = orderItems[existingItemIndex].quantity;
      if (currentQuantity >= availableStock) {
        Alert.alert(
          'Stock insuficiente',
          `Solo hay ${availableStock} unidades disponibles de este producto.`,
          [{ text: 'Entendido', style: 'default' }]
        );
        return;
      }

      // Incrementar cantidad si ya existe
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += 1;
      setOrderItems(updatedItems);
    } else {
      // Agregar nuevo item
      const displayName = selectedVariants.length > 0 
        ? selectedVariants[0].name 
        : dish.name;
      
      const adjustedPrice = selectedVariants.length > 0
        ? dish.price + (selectedVariants[0].price_adjustment || 0)
        : dish.price;

      const newItem: OrderItem = {
        id: dish.id,
        name: displayName,
        price: adjustedPrice,
        quantity: 1,
        selectedVariants: selectedVariants,
      };
      setOrderItems([...orderItems, newItem]);
    }
  };

  // Remover item de la orden
  const removeFromOrder = (itemId: string, selectedVariants: any[] = []) => {
    const existingItemIndex = orderItems.findIndex(
      item => item.id === itemId && 
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...orderItems];
      if (updatedItems[existingItemIndex].quantity > 1) {
        updatedItems[existingItemIndex].quantity -= 1;
      } else {
        updatedItems.splice(existingItemIndex, 1);
      }
      setOrderItems(updatedItems);
    }
  };

  // Función para agregar/editar nota de un item
  const handleEditItemNote = (index: number) => {
    setEditingItemIndex(index);
    setItemNote(orderItems[index].notes || '');
    setShowNoteModal(true);
  };

  // Función para guardar nota de un item
  const handleSaveItemNote = () => {
    if (editingItemIndex !== null) {
      const updatedItems = [...orderItems];
      updatedItems[editingItemIndex].notes = itemNote.trim();
      setOrderItems(updatedItems);
      setEditingItemIndex(null);
      setItemNote('');
      setShowNoteModal(false);
    }
  };

  // Función para cancelar edición de nota
  const handleCancelEditNote = () => {
    setEditingItemIndex(null);
    setItemNote('');
    setShowNoteModal(false);
  };

  // Obtener cantidad de un item específico
  const getItemQuantity = (dishId: string, selectedVariants: any[] = []) => {
    const item = orderItems.find(
      item => item.id === dishId && 
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
    );
    return item ? item.quantity : 0;
  };

  // Calcular disponibilidad de una variante específica
  const getVariantAvailability = (dishId: string, variantId: string) => {
    const availability = dishAvailability.find(av => av.dishId === dishId);
    if (!availability || !availability.available) {
      return 0;
    }

    // Buscar recetas específicas para esta variante
    const variantRecipes = recipes.filter(r => 
      r.dish_id === dishId && r.variant_id === variantId
    );

    if (variantRecipes.length === 0) {
      return 0;
    }

    // Calcular disponibilidad para esta variante específica
    let maxAvailable = 0;
    for (const recipe of variantRecipes) {
      const inventoryItem = inventory.find(item => item.id === recipe.inventory_item_id);
      if (inventoryItem && inventoryItem.active) {
        const availableInBatches = inventoryItem.batches
          ?.filter(batch => batch.active && batch.quantity > 0 && new Date(batch.expiry_date) > new Date())
          ?.reduce((total, batch) => total + batch.quantity, 0) || 0;
        
        const possibleQuantity = Math.floor(availableInBatches / recipe.quantity);
        maxAvailable = Math.max(maxAvailable, possibleQuantity);
      }
    }

    return maxAvailable;
  };

  // Crear o actualizar orden
  const createOrder = async () => {
    // Validar que se haya seleccionado una mesa o ingresado un número
    if (!selectedTable && !tableNumber.trim()) {
      Alert.alert('Error', 'Por favor selecciona una mesa o ingresa el número de mesa');
      return;
    }

    if (orderItems.length === 0) {
      Alert.alert('Error', 'Agrega al menos un producto a la orden');
      return;
    }

    if (!employee) {
      Alert.alert('Error', 'No hay empleado autenticado');
      return;
    }

    // Prevenir múltiples llamadas simultáneas
    if (isCreatingOrder) {
      return;
    }

    setIsCreatingOrder(true);

    try {
      if (isEditing && editingOrder) {
        // Actualizar orden existente
        await updateExistingOrder();
      } else {
        // Crear nueva orden
        await createNewOrder();
      }
    } catch (error) {
      console.error('Error en createOrder:', error);
      Alert.alert('Error', 'No se pudo procesar la orden');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const createNewOrder = async () => {
    try {
      // Validar que existan pantallas de cocina antes de crear la orden
      const { data: screens, error: screensError } = await supabase
        .from('kitchen_screens')
        .select('id, name')
        .eq('active', true);

      if (screensError) {
        console.error('Error verificando pantallas:', screensError);
        Alert.alert('Error', 'No se pudo verificar las pantallas de cocina');
        return;
      }

      if (!screens || screens.length === 0) {
        Alert.alert(
          'Sin Pantallas de Cocina',
          'No hay pantallas de cocina configuradas. Por favor, configura al menos una pantalla antes de crear órdenes.',
          [
            { text: 'Entendido', style: 'default' }
          ]
        );
        return;
      }

      // Crear orden con mesa seleccionada
      const mesaInfo = selectedTable ? `Mesa: ${selectedTable.number}` : `Mesa: ${tableNumber}`;
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          employee_id: employee.id,
          status: 'pending',
          total_amount: 0,
          notes: mesaInfo,
          service_type: serviceType,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creando orden:', orderError);
        Alert.alert('Error', 'No se pudo crear la orden');
        return;
      }

      // Ocupar mesa si se seleccionó una
      if (selectedTable) {
        try {
          await TableService.occupyTable(selectedTable.id, newOrder.id);
        } catch (tableError) {
          console.error('Error ocupando mesa:', tableError);
          // No mostrar error al usuario, solo log
        }
      }
      
      setCurrentOrderId(newOrder.id);

      // Agregar items a la orden
      for (const item of orderItems) {
        await addItemToOrderDB(newOrder.id, item.id, item.quantity, item.notes, item.name);
      }

      // Actualizar total de la orden
      const totalAmount = getOrderTotal();
      await supabase
        .from('orders')
        .update({ total_amount: totalAmount })
        .eq('id', newOrder.id);

      // Crear comanda automáticamente desde la orden
      const { data: comandaId, error: comandaError } = await ComandaService.createFromOrder(newOrder.id);
      
      if (comandaError) {
        console.error('Error creando comanda:', comandaError);
        Alert.alert('Error', 'No se pudo crear la comanda para cocina');
        return;
      }

      // Enviar orden a cocina (cambiar status a confirmed)
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', newOrder.id);

      Alert.alert(
        'Orden Creada',
        `${mesaInfo}\nItems: ${getTotalItems()}\nTotal: $${getOrderTotal().toFixed(2)}\n\nComanda enviada a cocina`,
        [
          { text: 'OK', onPress: () => {
            setOrderItems([]);
            setTableNumber('');
            setSelectedTable(null);
            setCurrentOrderId(null);
            onOrderCreated?.(newOrder);
          }}
        ]
      );
    } catch (error) {
      console.error('Error creando orden:', error);
      Alert.alert('Error', 'No se pudo crear la orden');
    }
  };

  const updateExistingOrder = async () => {
    try {
      if (!editingOrder) return;

      // Eliminar items existentes de la orden
      await supabase
        .from('order_items')
        .delete()
        .eq('order_id', editingOrder.id);

      // Agregar nuevos items
      for (const item of orderItems) {
        await addItemToOrderDB(editingOrder.id, item.id, item.quantity, item.notes, item.name);
      }

      // Actualizar total de la orden
      const totalAmount = getOrderTotal();
      await supabase
        .from('orders')
        .update({ 
          total_amount: totalAmount,
          notes: `Mesa: ${tableNumber}`
        })
        .eq('id', editingOrder.id);

      Alert.alert(
        'Orden Actualizada',
        `Mesa: ${tableNumber}\nItems: ${getTotalItems()}\nTotal: $${totalAmount.toFixed(2)}`,
        [
          { text: 'OK', onPress: () => {
            navigation.goBack();
          }}
        ]
      );
    } catch (error) {
      console.error('Error actualizando orden:', error);
      Alert.alert('Error', 'No se pudo actualizar la orden');
    }
  };

  // Renderizar categorías
  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoriesContainer}
      contentContainerStyle={styles.categoriesContent}
    >
      <TouchableOpacity
        style={[
          styles.categoryButton,
          selectedCategory === 'all' && styles.categoryButtonActive
        ]}
        onPress={() => setSelectedCategory('all')}
      >
        <Text style={[
          styles.categoryButtonText,
          selectedCategory === 'all' && styles.categoryButtonTextActive
        ]}>
          TODOS
        </Text>
      </TouchableOpacity>
      
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryButton,
            selectedCategory === category.id && styles.categoryButtonActive
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === category.id && styles.categoryButtonTextActive
          ]}>
            {category.name.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Renderizar plato
  const renderDish = (dish: DishWithVariants) => {
    const quantity = getItemQuantity(dish.id);
    const hasVariants = dish.variants && dish.variants.length > 0;
    
    // Obtener disponibilidad real del platillo
    const availability = dishAvailability.find(av => av.dishId === dish.id);
    
    let statusColor = '#4CAF50'; // Verde - Disponible
    let statusText = 'DISP';
    let availableQuantity = 0;
    
    if (!availability) {
      statusColor = '#F44336'; // Rojo - No disponible
      statusText = 'NO DISP';
    } else if (availability.status === 'no_recipe') {
      statusColor = '#F44336'; // Rojo - Sin receta
      statusText = 'SIN RECETA';
    } else if (availability.status === 'no_stock') {
      statusColor = '#F44336'; // Rojo - Sin stock
      statusText = 'SIN STOCK';
    } else if (availability.status === 'low_stock') {
      statusColor = '#FF9800'; // Naranja - Stock bajo
      statusText = 'ESCASO';
      availableQuantity = availability.availableQuantity;
    } else if (availability.status === 'available') {
      statusColor = '#4CAF50'; // Verde - Disponible
      statusText = 'DISP';
      availableQuantity = availability.availableQuantity;
    }
    
    const isAvailable = availability?.available || false;

    // Determinar si está bloqueado (sin receta o no disponible)
    const isBlocked = !isAvailable || availability?.status === 'no_recipe';
    
    return (
      <TouchableOpacity 
        key={dish.id} 
        style={[
          styles.dishCard, 
          { 
            borderColor: statusColor,
            opacity: isBlocked ? 0.4 : 1.0
          }
        ]}
        onPress={() => !isBlocked && addToOrder(dish)}
        disabled={isBlocked}
      >
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>

        {/* Quantity circle */}
        {quantity > 0 && (
          <View style={styles.quantityCircle}>
            <Text style={styles.quantityText}>{quantity}</Text>
          </View>
        )}

        {/* Warning icon for low stock */}
        {availability?.status === 'low_stock' && isAvailable && (
          <View style={styles.warningIcon}>
            <Text style={styles.warningText}>!</Text>
          </View>
        )}

        <Text style={styles.dishName}>{dish.name}</Text>
        <Text style={styles.dishPrice}>${dish.price.toFixed(2)}</Text>
        
        {/* Mostrar cantidad disponible solo si NO tiene variantes */}
        {isAvailable && availableQuantity > 0 && !hasVariants && (
          <View style={styles.availableQuantityBadge}>
            <Text style={styles.availableQuantityNumber}>
              {availableQuantity}
            </Text>
          </View>
        )}
        
        {!isAvailable && !isBlocked && (
          <Text style={styles.unavailableText}>
            {availability?.status === 'no_stock' ? 'SIN STOCK' : 'NO DISPONIBLE'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Validar si el botón crear orden debe estar habilitado
  const isOrderValid = () => {
    const hasTable = selectedTable || tableNumber.trim();
    const hasServiceType = serviceType !== null;
    const hasItems = orderItems.length > 0;
    return hasTable && hasServiceType && hasItems;
  };

  // Renderizar modal de orden completa
  const renderOrderModal = () => {
    const mesaInfo = selectedTable ? `Mesa ${selectedTable.number}` : (tableNumber.trim() ? `Mesa: ${tableNumber}` : 'Sin mesa seleccionada');
    const tipoServicio = serviceType === 'local' ? 'Para comer aquí' : serviceType === 'takeaway' ? 'Para Llevar' : 'Sin tipo de servicio';
    
    return (
      <Modal
        visible={showOrderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.orderModalContent}>
            <View style={styles.orderModalHeader}>
              <Text style={styles.orderModalTitle}>Resumen de Orden</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowOrderModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.orderModalList}>
              {/* Información de la orden en una línea */}
              <View style={styles.orderSummarySection}>
                <View style={styles.orderSummaryLine}>
                  <View style={styles.orderSummaryItem}>
                    <Ionicons name="restaurant-outline" size={16} color="#6b7280" />
                    <Text style={styles.orderSummaryText}>{mesaInfo}</Text>
                  </View>
                  <View style={styles.orderSummarySeparator}>
                    <Text style={styles.orderSummaryDot}>•</Text>
                  </View>
                  <View style={styles.orderSummaryItem}>
                    <Ionicons 
                      name={serviceType === 'local' ? 'home-outline' : 'bag-outline'} 
                      size={16} 
                      color="#6b7280" 
                    />
                    <Text style={styles.orderSummaryText}>{tipoServicio}</Text>
                  </View>
                </View>
              </View>

              {/* Separador */}
              <View style={styles.orderModalSeparator}>
                <Text style={styles.orderModalSeparatorText}>Platillos Seleccionados</Text>
              </View>

              {/* Lista de platillos */}
              {orderItems.map((item, index) => (
                <View key={index} style={styles.orderModalItem}>
                  <View style={styles.orderModalItemInfo}>
                    <Text style={styles.orderModalItemName}>{item.name}</Text>
                    <Text style={styles.orderModalItemPrice}>
                      ${item.price.toFixed(2)} c/u
                    </Text>
                    {item.notes && (
                      <View style={styles.orderModalItemNote}>
                        <Ionicons name="document-text-outline" size={14} color="#6b7280" style={styles.orderModalItemNoteIcon} />
                        <Text style={styles.orderModalItemNoteText}>{item.notes}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.orderModalItemActions}>
                    <View style={styles.orderModalItemQuantity}>
                      <Text style={styles.orderModalQuantityText}>
                        {item.quantity}x
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.orderModalNoteButton}
                      onPress={() => handleEditItemNote(index)}
                    >
                      <Ionicons 
                        name={item.notes ? "create-outline" : "add-outline"} 
                        size={16} 
                        color="#6b7280" 
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.orderModalItemTotal}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.orderModalFooter}>
              <View style={styles.orderModalTotal}>
                <View style={styles.orderModalTotalLeft}>
                  <Ionicons name="card-outline" size={18} color="#6b7280" />
                  <Text style={styles.orderModalTotalLabel}>Total:</Text>
                </View>
                <Text style={styles.orderModalTotalAmount}>
                  ${getOrderTotal().toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.orderModalButtons}>
                <TouchableOpacity
                  style={styles.orderModalCancelButton}
                  onPress={() => setShowOrderModal(false)}
                >
                  <Text style={styles.orderModalCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.orderModalCreateButton,
                    (!isOrderValid() || isCreatingOrder) && styles.orderModalCreateButtonDisabled
                  ]}
                  onPress={() => {
                    if (isOrderValid()) {
                      setShowOrderModal(false);
                      createOrder();
                    }
                  }}
                  disabled={!isOrderValid() || isCreatingOrder}
                >
                  <Text style={[
                    styles.orderModalCreateButtonText,
                    (!isOrderValid() || isCreatingOrder) && styles.orderModalCreateButtonTextDisabled
                  ]}>
                    {isCreatingOrder ? 'CREANDO...' : 'Crear Orden'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderVariantsModal = () => (
    <Modal
      visible={showVariants}
      transparent
      animationType="slide"
      onRequestClose={() => setShowVariants(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedDish?.name}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowVariants(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.variantsList}>
            {selectedDish?.variants?.map((variant, index) => {
              const availableQuantity = getVariantAvailability(selectedDish!.id, variant.id);
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.variantItem}
                  onPress={() => {
                    addItemToOrder(selectedDish!, [variant]);
                    setShowVariants(false);
                  }}
                >
                  <View style={styles.variantContent}>
                    {availableQuantity > 0 && (
                      <View style={styles.variantStockBadge}>
                        <Text style={styles.variantStockNumber}>
                          {availableQuantity}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.variantName}>{variant.name}</Text>
                  </View>
                  <Text style={styles.variantPrice}>
                    +${variant.price_adjustment?.toFixed(2) || '0.00'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );

  const renderNoteModal = () => (
    <Modal
      visible={showNoteModal}
      transparent={false}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={handleCancelEditNote}
    >
      <View style={styles.noteModalOverlay}>
        <View style={styles.noteModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Nota para: {editingItemIndex !== null ? orderItems[editingItemIndex]?.name : ''}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancelEditNote}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.noteModalBody}>
            <TextInput
              style={styles.noteInput}
              placeholder="Agregar nota especial (ej: sin cebolla, bien cocido, etc.)"
              value={itemNote}
              onChangeText={setItemNote}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.noteModalFooter}>
            <TouchableOpacity
              style={styles.noteModalCancelButton}
              onPress={handleCancelEditNote}
            >
              <Text style={styles.noteModalCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.noteModalSaveButton}
              onPress={handleSaveItemNote}
            >
              <Text style={styles.noteModalSaveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderTableModal = () => (
    <Modal
      visible={showTableModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTableModal(false)}
    >
      <View style={styles.tableModalOverlay}>
        <View style={styles.tableModalContent}>
          <View style={styles.tableModalHeader}>
            <Text style={styles.tableModalTitle}>Seleccionar Mesa</Text>
            <TouchableOpacity
              style={styles.tableModalCloseButton}
              onPress={() => setShowTableModal(false)}
            >
              <Text style={styles.tableModalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.tableModalList}>
            {availableTables.map((table) => (
              <TouchableOpacity
                key={table.id}
                style={[
                  styles.tableModalItem,
                  selectedTable?.id === table.id && styles.tableModalItemSelected
                ]}
                onPress={() => {
                  setSelectedTable(table);
                  setTableNumber(''); // Limpiar mesa personalizada
                  setShowTableModal(false);
                }}
              >
                <View style={styles.tableModalItemInfo}>
                  <Text style={styles.tableModalItemNumber}>Mesa {table.number}</Text>
                  <Text style={styles.tableModalItemCapacity}>
                    Capacidad: {table.capacity} personas
                  </Text>
                </View>
                <View style={styles.tableModalItemStatus}>
                  <Text style={styles.tableModalItemStatusText}>Disponible</Text>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Botón para mesa personalizada */}
            <TouchableOpacity
              style={[
                styles.tableModalItem,
                styles.customTableButton,
                tableNumber.trim() && !selectedTable && styles.tableModalItemSelected
              ]}
              onPress={() => setShowCustomTableInput(!showCustomTableInput)}
            >
              <View style={styles.tableModalItemInfo}>
                <Text style={styles.tableModalItemNumber}>
                  {tableNumber.trim() ? `Mesa: ${tableNumber}` : 'Mesa Personalizada'}
                </Text>
                <Text style={styles.tableModalItemCapacity}>
                  {tableNumber.trim() ? 'Tap para cambiar' : 'Tap para escribir'}
                </Text>
              </View>
              <View style={styles.tableModalItemStatus}>
                <Text style={styles.tableModalItemStatusText}>Custom</Text>
              </View>
            </TouchableOpacity>
            
            {/* Input para mesa personalizada */}
            {showCustomTableInput && (
              <View style={styles.customTableInputContainer}>
                <TextInput
                  style={styles.customTableInput}
                  placeholder="Ej: Delivery, Mostrador, Barra..."
                  value={customTableInput}
                  onChangeText={setCustomTableInput}
                  placeholderTextColor="#999"
                  autoFocus={true}
                />
                <View style={styles.customTableButtons}>
                  <TouchableOpacity
                    style={styles.customTableCancelButton}
                    onPress={() => {
                      setShowCustomTableInput(false);
                      setCustomTableInput('');
                    }}
                  >
                    <Text style={styles.customTableCancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.customTableConfirmButton}
                    onPress={() => {
                      if (customTableInput.trim()) {
                        setTableNumber(customTableInput.trim());
                        setSelectedTable(null); // Limpiar mesa seleccionada
                        setShowCustomTableInput(false);
                        setShowTableModal(false);
                      }
                    }}
                  >
                    <Text style={styles.customTableConfirmButtonText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.tableModalFooter}>
            <TouchableOpacity
              style={styles.tableModalCancelButton}
              onPress={() => setShowTableModal(false)}
            >
              <Text style={styles.tableModalCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Modal de búsqueda
  const renderSearchModal = () => (
    <Modal
      visible={showSearchModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSearchModal(false)}
    >
      <View style={styles.searchModalOverlay}>
        <View style={styles.searchModalContent}>
          <View style={styles.searchModalHeader}>
            <Text style={styles.searchModalTitle}>Buscar Platillos</Text>
            <TouchableOpacity
              style={styles.searchModalCloseButton}
              onPress={() => setShowSearchModal(false)}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchModalInputContainer}>
            <Ionicons name="search-outline" size={20} color="#9ca3af" style={styles.searchModalIcon} />
            <TextInput
              style={styles.searchModalInput}
              placeholder="Buscar platillos..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9ca3af"
              autoFocus={true}
            />
          </View>
          
          <ScrollView 
            style={styles.searchModalResults}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filteredDishes.map((dish) => (
              <TouchableOpacity
                key={dish.id}
                style={styles.searchModalItem}
                onPress={() => {
                  setSelectedDish(dish);
                  setShowVariants(true);
                  setShowSearchModal(false);
                }}
              >
                <View style={styles.searchModalItemInfo}>
                  <Text style={styles.searchModalItemName}>{dish.name}</Text>
                  <Text style={styles.searchModalItemPrice}>${dish.price.toFixed(2)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            ))}
            {filteredDishes.length === 0 && searchTerm.trim() && (
              <View style={styles.searchModalEmpty}>
                <Ionicons name="search-outline" size={48} color="#d1d5db" />
                <Text style={styles.searchModalEmptyText}>No se encontraron platillos</Text>
                <Text style={styles.searchModalEmptySubtext}>Intenta con otro término de búsqueda</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Modal de tipo de servicio
  const renderServiceModal = () => (
    <Modal
      visible={showServiceModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowServiceModal(false)}
    >
      <View style={styles.serviceModalOverlay}>
        <View style={styles.serviceModalContent}>
          <View style={styles.serviceModalHeader}>
            <Text style={styles.serviceModalTitle}>Tipo de Servicio</Text>
            <TouchableOpacity
              style={styles.serviceModalCloseButton}
              onPress={() => setShowServiceModal(false)}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.serviceModalOptions}>
            <TouchableOpacity
              style={[
                styles.serviceModalOption,
                serviceType === 'local' && styles.serviceModalOptionActive
              ]}
              onPress={() => {
                setServiceType('local');
                setShowServiceModal(false);
              }}
            >
              <Ionicons 
                name="home-outline" 
                size={24} 
                color={serviceType === 'local' ? '#3b82f6' : '#6b7280'} 
              />
              <View style={styles.serviceModalOptionInfo}>
                <Text style={[
                  styles.serviceModalOptionTitle,
                  serviceType === 'local' && styles.serviceModalOptionTitleActive
                ]}>
                  Para comer aquí
                </Text>
                <Text style={styles.serviceModalOptionDescription}>
                  Servicio en el local
                </Text>
              </View>
              {serviceType === 'local' && (
                <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.serviceModalOption,
                serviceType === 'takeaway' && styles.serviceModalOptionActive
              ]}
              onPress={() => {
                setServiceType('takeaway');
                setShowServiceModal(false);
              }}
            >
              <Ionicons 
                name="bag-outline" 
                size={24} 
                color={serviceType === 'takeaway' ? '#3b82f6' : '#6b7280'} 
              />
              <View style={styles.serviceModalOptionInfo}>
                <Text style={[
                  styles.serviceModalOptionTitle,
                  serviceType === 'takeaway' && styles.serviceModalOptionTitleActive
                ]}>
                  Para llevar
                </Text>
                <Text style={styles.serviceModalOptionDescription}>
                  Servicio para llevar
                </Text>
              </View>
              {serviceType === 'takeaway' && (
                <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (menuLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Cargando menú...</Text>
      </View>
    );
  }

  if (menuError) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Error cargando el menú</Text>
        <Text style={styles.errorDetailText}>{menuError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetchMenu}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (dishes.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>No hay platillos disponibles</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetchMenu}>
          <Text style={styles.retryButtonText}>Recargar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.refreshButton, isRefreshing && styles.refreshButtonActive]}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <Text style={[styles.refreshIcon, isRefreshing && styles.refreshIconActive]}>
            {isRefreshing ? '⟳' : '↻'}
          </Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{isEditing ? 'EDITAR COMANDA' : 'NUEVA COMANDA'}</Text>
          <View style={[styles.connectionIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]}>
            <Text style={styles.connectionText}>{isConnected ? '●' : '●'}</Text>
          </View>
        </View>
        <NotificationCenter onItemDelivered={handleItemDelivered} />
      </View>

      {/* Selección de mesa */}
      {/* Controles compactos */}
      <View style={styles.compactControls}>
        {/* Seleccionar Mesa */}
        <TouchableOpacity
          style={styles.compactButton}
          onPress={() => setShowTableModal(true)}
        >
          <Ionicons name="restaurant-outline" size={20} color="#6b7280" />
          <Text style={styles.compactButtonText}>
            {selectedTable ? `Mesa ${selectedTable.number}` : 
             tableNumber.trim() ? `Mesa: ${tableNumber}` : 'Mesa'}
          </Text>
        </TouchableOpacity>

        {/* Tipo de Servicio */}
        <TouchableOpacity
          style={styles.compactButton}
          onPress={() => setShowServiceModal(true)}
        >
          <Ionicons 
            name={serviceType === 'local' ? 'home-outline' : 'bag-outline'} 
            size={20} 
            color="#6b7280" 
          />
          <Text style={styles.compactButtonText}>
            {serviceType === 'local' ? 'Comer aquí' : 'Para llevar'}
          </Text>
        </TouchableOpacity>

        {/* Buscador */}
        <TouchableOpacity
          style={styles.compactButton}
          onPress={() => setShowSearchModal(true)}
        >
          <Ionicons name="search-outline" size={20} color="#6b7280" />
          <Text style={styles.compactButtonText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Indicador de recarga */}
      {isRefreshing && (
        <View style={styles.refreshIndicator}>
          <Text style={styles.refreshText}>Actualizando disponibilidad...</Text>
        </View>
      )}

      {/* Categorías */}
      {renderCategories()}

      {/* Lista de platos */}
      <ScrollView style={[styles.dishesContainer, { paddingBottom: orderItems.length > 0 ? 200 : 20 }]}>
        <View style={styles.dishesGrid}>
          {filteredDishes.map(renderDish)}
        </View>
      </ScrollView>

      {/* Vista de orden en la parte inferior */}
      {orderItems.length > 0 && (
        <View style={styles.orderView}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderTitle}>Orden Actual</Text>
            <View style={styles.orderHeaderRight}>
              <Text style={styles.orderCount}>{getTotalItems()} items</Text>
              <TouchableOpacity
                style={styles.viewOrderButton}
                onPress={() => setShowOrderModal(true)}
              >
                <Text style={styles.viewOrderButtonText}>Ver Orden Completa</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView 
            style={styles.orderItemsList}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {orderItems.map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.orderItem}>
                <Text style={styles.orderItemName}>{item.name}</Text>
                <Text style={styles.orderItemPrice}>${item.price.toFixed(2)} c/u</Text>
                
                {/* Controles de cantidad */}
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => removeFromOrder(item.id, item.selectedVariants)}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.quantityDisplay}>{item.quantity}</Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.quantityButton,
                      (() => {
                        // Verificar si se puede incrementar
                        let availableStock = 0;
                        if (item.selectedVariants && item.selectedVariants.length > 0) {
                          const variantId = item.selectedVariants[0].id;
                          availableStock = getVariantAvailability(item.id, variantId);
                        } else {
                          const availability = dishAvailability.find(av => av.dishId === item.id);
                          availableStock = availability?.availableQuantity || 0;
                        }
                        return item.quantity >= availableStock ? styles.quantityButtonDisabled : null;
                      })()
                    ]}
                    onPress={() => {
                      // Buscar el platillo original para agregar
                      const originalDish = dishes.find(d => d.id === item.id);
                      if (originalDish) {
                        addItemToOrder(originalDish, item.selectedVariants || []);
                      }
                    }}
                    disabled={(() => {
                      // Deshabilitar si se alcanzó el límite
                      let availableStock = 0;
                      if (item.selectedVariants && item.selectedVariants.length > 0) {
                        const variantId = item.selectedVariants[0].id;
                        availableStock = getVariantAvailability(item.id, variantId);
                      } else {
                        const availability = dishAvailability.find(av => av.dishId === item.id);
                        availableStock = availability?.availableQuantity || 0;
                      }
                      return item.quantity >= availableStock;
                    })()}
                  >
                    <Text style={[
                      styles.quantityButtonText,
                      (() => {
                        let availableStock = 0;
                        if (item.selectedVariants && item.selectedVariants.length > 0) {
                          const variantId = item.selectedVariants[0].id;
                          availableStock = getVariantAvailability(item.id, variantId);
                        } else {
                          const availability = dishAvailability.find(av => av.dishId === item.id);
                          availableStock = availability?.availableQuantity || 0;
                        }
                        return item.quantity >= availableStock ? styles.quantityButtonTextDisabled : null;
                      })()
                    ]}>+</Text>
                  </TouchableOpacity>
                </View>
                
                
                <TouchableOpacity
                  style={styles.removeOrderItemButton}
                  onPress={() => {
                    // Eliminar completamente el item
                    const updatedItems = orderItems.filter((_, i) => i !== index);
                    setOrderItems(updatedItems);
                  }}
                >
                  <Text style={styles.removeOrderItemText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.orderFooter}>
            <Text style={styles.orderTotal}>Total: ${getOrderTotal().toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* Modal de variantes */}
      {renderNoteModal()}
      {renderOrderModal()}
      {renderVariantsModal()}
      {renderTableModal()}
      {renderSearchModal()}
      {renderServiceModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContent: {
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  refreshButtonActive: {
    backgroundColor: '#2196F3',
  },
  refreshIcon: {
    fontSize: 20,
    color: '#666',
  },
  refreshIconActive: {
    color: '#ffffff',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionText: {
    fontSize: 6,
    color: '#fff',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tableInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  // Nuevos estilos para mesa personalizada en modal
  customTableButton: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
  },
  customTableInputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  customTableInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 12,
  },
  customTableButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  customTableCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  customTableCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  customTableConfirmButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  customTableConfirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Estilos para tipo de servicio mejorado
  serviceTypeToggleButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTypeToggleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  // Estilos para controles compactos
  compactControls: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  compactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  compactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  // Estilos para modal de búsqueda
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  searchModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  searchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  searchModalCloseButton: {
    padding: 4,
  },
  searchModalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  searchModalIcon: {
    marginRight: 8,
  },
  searchModalInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  searchModalResults: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchModalItemInfo: {
    flex: 1,
  },
  searchModalItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  searchModalItemPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  searchModalEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  searchModalEmptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  searchModalEmptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  // Estilos para modal de tipo de servicio
  serviceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
  },
  serviceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  serviceModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  serviceModalCloseButton: {
    padding: 4,
  },
  serviceModalOptions: {
    padding: 20,
  },
  serviceModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  serviceModalOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  serviceModalOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  serviceModalOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  serviceModalOptionTitleActive: {
    color: '#1d4ed8',
  },
  serviceModalOptionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  serviceTypeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  serviceTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  serviceTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceTypeButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceTypeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    elevation: 4,
  },
  serviceTypeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  serviceTypeButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchInput: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoriesContainer: {
    maxHeight: 60,
    paddingVertical: 12,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 40,
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  dishesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  dishesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  dishCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
    minHeight: 85,
    maxHeight: 85,
    justifyContent: 'flex-start',
  },
  statusBadge: {
    position: 'absolute',
    top: -1,
    left: -1,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderTopLeftRadius: 5,
    borderBottomRightRadius: 3,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
  },
  quantityCircle: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  warningIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
  },
  dishName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 14,
    marginBottom: 4,
    lineHeight: 17,
    flex: 1,
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 2,
  },
  unavailableText: {
    fontSize: 8,
    color: '#F44336',
    fontWeight: '600',
  },
  availableQuantityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  availableQuantityNumber: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  refreshIndicator: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  orderView: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 2,
    borderTopColor: '#2196F3',
    maxHeight: 220,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewOrderButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewOrderButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  orderItemsList: {
    maxHeight: 100,
    paddingHorizontal: 15,
  },
  orderItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    marginVertical: 5,
    minWidth: 160,
    position: 'relative',
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orderItemPrice: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  quantityButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityButtonTextDisabled: {
    color: '#999999',
  },
  quantityDisplay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 15,
    minWidth: 25,
    textAlign: 'center',
  },
  removeOrderItemButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeOrderItemText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#e3f2fd',
    borderTopWidth: 1,
    borderTopColor: '#bbdefb',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  createOrderButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  createOrderButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  variantsList: {
    maxHeight: 300,
  },
  variantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  variantContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  variantStockBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  variantStockNumber: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  variantName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  variantPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Estilos del modal de orden completa
  orderModalContent: {
    backgroundColor: '#FFFFFF',
    margin: 10,
    borderRadius: 12,
    maxHeight: '85%',
    minHeight: '60%',
    width: '95%',
  },
  orderModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  orderModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  orderModalList: {
    flex: 1,
    padding: 16,
  },
  orderModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderModalItemInfo: {
    flex: 1,
  },
  orderModalItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  orderModalItemPrice: {
    fontSize: 12,
    color: '#666',
  },
  orderModalItemNote: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  orderModalItemNoteText: {
    fontSize: 11,
    color: '#2E7D32',
    fontStyle: 'italic',
    flex: 1,
  },
  orderModalItemNoteIcon: {
    marginRight: 4,
  },
  orderModalItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderModalItemQuantity: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  orderModalNoteButton: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  orderModalNoteButtonText: {
    fontSize: 12,
  },
  orderModalQuantityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  orderModalItemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 60,
    textAlign: 'right',
  },
  orderModalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  orderModalTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderModalTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  orderModalTotalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderModalTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  orderModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  orderModalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  orderModalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  orderModalCreateButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  orderModalCreateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderModalCreateButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  orderModalCreateButtonTextDisabled: {
    color: '#9ca3af',
  },
  // Estilos para el resumen de orden
  orderSummarySection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  orderSummaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  orderSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderSummaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
  },
  orderSummarySeparator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderSummaryDot: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  orderModalSeparator: {
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e9ecef',
  },
  orderModalSeparatorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos del modal de notas
  noteModalOverlay: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteModalContent: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    width: '90%',
    maxHeight: '60%',
  },
  noteModalBody: {
    padding: 16,
  },
  noteInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  noteModalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  noteModalCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  noteModalCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  noteModalSaveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  noteModalSaveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tableSelector: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    marginBottom: 10,
  },
  tableSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  tableSelectorPlaceholder: {
    fontSize: 14,
    color: '#6b7280',
  },
  tableModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  tableModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tableModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  tableModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableModalCloseButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  tableModalList: {
    maxHeight: 400,
  },
  tableModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tableModalItemSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  tableModalItemInfo: {
    flex: 1,
  },
  tableModalItemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  tableModalItemCapacity: {
    fontSize: 14,
    color: '#6b7280',
  },
  tableModalItemStatus: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tableModalItemStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#166534',
  },
  tableModalFooter: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tableModalCancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  tableModalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
