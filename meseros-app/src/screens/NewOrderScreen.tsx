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
import { useRoute, useNavigation } from '@react-navigation/native';
import { MenuService, Category, DishWithVariants } from '../services/menuService';
import { AvailabilityService, DishAvailability, supabase } from '../services/availabilityService';
import { useOrdersStore } from '../store/ordersStore';
import { useSimpleAuthStore } from '../store/simpleAuthStore';
import { NotificationCenter } from '../components/NotificationCenter';
import { ComandaService } from '../services/comandaService';

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
  const { createOrder: createOrderInDB, addItemToOrder: addItemToOrderDB, sendOrderToKitchen } = useOrdersStore();
  
  // Parámetros de navegación para edición
  const editingOrder = route.params?.editingOrder;
  const isEditing = route.params?.isEditing || false;
  const [dishes, setDishes] = useState<DishWithVariants[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredDishes, setFilteredDishes] = useState<DishWithVariants[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [showVariants, setShowVariants] = useState(false);
  const [selectedDish, setSelectedDish] = useState<DishWithVariants | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [dishAvailability, setDishAvailability] = useState<DishAvailability[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Cargar menú desde la base de datos
  const loadMenu = async () => {
    try {
      setIsLoading(true);
      const menuResult = await MenuService.getFullMenu();
      
      if (menuResult.error) {
        console.error('Error cargando menú:', menuResult.error);
        setHasError(true);
        Alert.alert('Error', 'No se pudo cargar el menú');
        return;
      }

      const menuData = menuResult.data;
      if (menuData) {
        setDishes(menuData.dishes || []);
        setCategories(menuData.categories || []);
        setFilteredDishes(menuData.dishes || []);
        
        // Calcular disponibilidad de todos los platillos
        const dishIds = (menuData.dishes || []).map(dish => dish.id);
        const availability = await AvailabilityService.calculateAllDishesAvailability(dishIds);
        setDishAvailability(availability);
        
        // Cargar recetas e inventario para cálculo de variantes
        const recipesResult = await AvailabilityService.getActiveRecipes();
        const inventoryResult = await AvailabilityService.getCurrentInventory();
        
        if (recipesResult.data) setRecipes(recipesResult.data);
        if (inventoryResult.data) setInventory(inventoryResult.data);
      } else {
        console.warn('No hay datos de menú disponibles');
        setHasError(true);
        setDishes([]);
        setCategories([]);
        setFilteredDishes([]);
        setDishAvailability([]);
      }
    } catch (error) {
      console.error('Error cargando menú:', error);
      setHasError(true);
      Alert.alert('Error', 'No se pudo cargar el menú');
      setDishes([]);
      setCategories([]);
      setFilteredDishes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
    
    // Configurar actualizaciones en tiempo real
    const setupRealtimeUpdates = () => {
      // Escuchar cambios en recetas
      const recipesSubscription = supabase
        .channel('recipes_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'recipes' },
          () => {
            console.log('Cambio detectado en recetas, recargando...');
            loadMenu();
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
            loadMenu();
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
            loadMenu();
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
      
      await loadMenu();
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
    if (!tableNumber.trim()) {
      Alert.alert('Error', 'Por favor ingresa el número de mesa');
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

      // Crear orden directamente sin depender de mesas predefinidas
      // La mesa se maneja como texto en el campo notes
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          employee_id: employee.id,
          status: 'pending',
          total_amount: 0,
          notes: `Mesa: ${tableNumber}`,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creando orden:', orderError);
        Alert.alert('Error', 'No se pudo crear la orden');
        return;
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
        `Mesa: ${tableNumber}\nItems: ${getTotalItems()}\nTotal: $${getOrderTotal().toFixed(2)}\n\nComanda enviada a cocina`,
        [
          { text: 'OK', onPress: () => {
            setOrderItems([]);
            setTableNumber('');
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

  // Renderizar modal de variantes
  const renderOrderModal = () => (
    <Modal
      visible={showOrderModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowOrderModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.orderModalContent}>
          <View style={styles.orderModalHeader}>
            <Text style={styles.orderModalTitle}>Orden Completa</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowOrderModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.orderModalList}>
            {orderItems.map((item, index) => (
              <View key={index} style={styles.orderModalItem}>
                <View style={styles.orderModalItemInfo}>
                  <Text style={styles.orderModalItemName}>{item.name}</Text>
                  <Text style={styles.orderModalItemPrice}>
                    ${item.price.toFixed(2)} c/u
                  </Text>
                </View>
                <View style={styles.orderModalItemQuantity}>
                  <Text style={styles.orderModalQuantityText}>
                    {item.quantity}x
                  </Text>
                </View>
                <Text style={styles.orderModalItemTotal}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.orderModalFooter}>
            <View style={styles.orderModalTotal}>
              <Text style={styles.orderModalTotalLabel}>Total:</Text>
              <Text style={styles.orderModalTotalAmount}>
                ${getOrderTotal().toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.orderModalButtons}>
              <TouchableOpacity
                style={styles.orderModalCancelButton}
                onPress={() => setShowOrderModal(false)}
              >
                <Text style={styles.orderModalCancelButtonText}>Cerrar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.orderModalCreateButton}
                onPress={() => {
                  setShowOrderModal(false);
                  createOrder();
                }}
              >
                <Text style={styles.orderModalCreateButtonText}>Crear Orden</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Cargando menú...</Text>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Error cargando el menú</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMenu}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (dishes.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>No hay platillos disponibles</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMenu}>
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
        <Text style={styles.title}>{isEditing ? 'EDITAR COMANDA' : 'NUEVA COMANDA'}</Text>
        <NotificationCenter onItemDelivered={handleItemDelivered} />
      </View>

      {/* Input de mesa */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.tableInput}
          placeholder="Número de mesa o nombre del cliente"
          value={tableNumber}
          onChangeText={setTableNumber}
          placeholderTextColor="#999"
        />
      </View>

      {/* Búsqueda */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar platillos..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#999"
        />
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
            <TouchableOpacity style={styles.createOrderButton} onPress={createOrder}>
              <Text style={styles.createOrderButtonText}>CREAR ORDEN</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal de variantes */}
      {renderOrderModal()}
      {renderVariantsModal()}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    marginBottom: 20,
    textAlign: 'center',
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
  orderModalItemQuantity: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginHorizontal: 8,
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
});
