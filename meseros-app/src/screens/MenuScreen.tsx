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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuService, Category, DishWithVariants } from '../services/menuService';

interface Dish {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image?: string;
  available: boolean;
}

interface CartItem {
  dish: DishWithVariants;
  quantity: number;
  notes?: string;
  selectedVariants?: any[];
}

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const [dishes, setDishes] = useState<DishWithVariants[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredDishes, setFilteredDishes] = useState<DishWithVariants[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [selectedDish, setSelectedDish] = useState<DishWithVariants | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar menú desde la base de datos
  const loadMenu = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await MenuService.getFullMenu();
      
      if (error) {
        console.error('Error cargando menú:', error);
        Alert.alert('Error', 'Error cargando el menú');
        return;
      }
      
      if (data) {
        setCategories(data.categories);
        setDishes(data.dishes);
        setFilteredDishes(data.dishes);
      }
    } catch (error) {
      console.error('Error cargando menú:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  useEffect(() => {
    let filtered = dishes;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(dish => dish.category_id === selectedCategory);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(dish =>
        dish.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDishes(filtered);
  }, [selectedCategory, searchTerm, dishes]);

  const addToCart = (dish: DishWithVariants) => {
    // Si el platillo tiene variantes, mostrar modal de selección
    if (dish.variants && dish.variants.length > 0) {
      setSelectedDish(dish);
      setShowVariants(true);
      return;
    }
    
    // Si no tiene variantes, agregar directamente
    const existingItem = cart.find(item => item.dish.id === dish.id);
    
    if (existingItem) {
      setCart(prev => prev.map(item =>
        item.dish.id === dish.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart(prev => [...prev, { dish, quantity: 1 }]);
    }
  };

  const addToCartWithVariant = (dish: DishWithVariants, selectedVariants: any[]) => {
    const existingItem = cart.find(item => 
      item.dish.id === dish.id && 
      JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
    );
    
    if (existingItem) {
      setCart(prev => prev.map(item =>
        item.dish.id === dish.id && 
        JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart(prev => [...prev, { 
        dish, 
        quantity: 1, 
        selectedVariants: selectedVariants || [] 
      }]);
    }
    
    setShowVariants(false);
    setSelectedDish(null);
  };

  const removeFromCart = (dishId: string) => {
    setCart(prev => prev.filter(item => item.dish.id !== dishId));
  };

  const updateQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(dishId);
      return;
    }

    setCart(prev => prev.map(item =>
      item.dish.id === dishId
        ? { ...item, quantity }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.dish.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const createOrder = () => {
    if (cart.length === 0) {
      Alert.alert('Carrito Vacío', 'Agrega al menos un platillo al carrito');
      return;
    }

    Alert.alert(
      'Crear Comanda',
      `¿Crear comanda con ${getCartItemCount()} item(s) por $${getCartTotal().toFixed(2)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear',
          onPress: () => {
            // Aquí se crearía la comanda
            Alert.alert('Éxito', 'Comanda creada correctamente');
            setCart([]);
            setShowCart(false);
          }
        }
      ]
    );
  };

  const renderDish = (dish: DishWithVariants) => (
    <View key={dish.id} style={styles.dishCard}>
      <View style={styles.dishInfo}>
        <Text style={styles.dishName}>{dish.name}</Text>
        <Text style={styles.dishDescription}>
          {dish.category?.name || 'Sin categoría'}
        </Text>
        <View style={styles.dishFooter}>
          <Text style={styles.dishPrice}>${dish.price.toFixed(2)}</Text>
          {!dish.active && (
            <Text style={styles.unavailableText}>No disponible</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.addButton,
          !dish.active && styles.addButtonDisabled
        ]}
        onPress={() => addToCart(dish)}
        disabled={!dish.active}
      >
        <Text style={[
          styles.addButtonText,
          !dish.active && styles.addButtonTextDisabled
        ]}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCartItem = (item: CartItem) => (
    <View key={item.dish.id} style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.dish.name}</Text>
        <Text style={styles.cartItemPrice}>${item.dish.price.toFixed(2)}</Text>
      </View>
      <View style={styles.cartItemControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.dish.id, item.quantity - 1)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.dish.id, item.quantity + 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header con búsqueda integrada */}
      <View style={styles.header}>
        <Text style={styles.title}>Menú</Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => setShowCart(true)}
        >
          <Text style={styles.cartButtonText}>Carrito ({getCartItemCount()})</Text>
        </TouchableOpacity>
      </View>

      {/* Búsqueda integrada en header */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar platillos..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Categorías */}
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
            styles.categoryText,
            selectedCategory === 'all' && styles.categoryTextActive
          ]}>
            Todos
          </Text>
        </TouchableOpacity>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de platillos en dos columnas */}
      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando menú...</Text>
          </View>
        ) : filteredDishes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No hay platillos disponibles</Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm ? 'No se encontraron platillos con ese nombre' : 'No hay platillos en esta categoría'}
            </Text>
          </View>
        ) : (
          <View style={styles.dishesGrid}>
            {filteredDishes.map(renderDish)}
          </View>
        )}
      </ScrollView>

      {/* Modal del carrito */}
      {showCart && (
        <View style={styles.cartModal}>
          <View style={styles.cartContent}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartTitle}>Carrito</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCart(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.cartItems}>
              {cart.length === 0 ? (
                <Text style={styles.emptyCartText}>El carrito está vacío</Text>
              ) : (
                cart.map(renderCartItem)
              )}
            </ScrollView>

            {cart.length > 0 && (
              <View style={styles.cartFooter}>
                <Text style={styles.cartTotal}>
                  Total: ${getCartTotal().toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={styles.createOrderButton}
                  onPress={createOrder}
                >
                  <Text style={styles.createOrderButtonText}>Crear Comanda</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Modal de variantes */}
      {showVariants && selectedDish && (
        <View style={styles.variantsModal}>
          <View style={styles.variantsContent}>
            <View style={styles.variantsHeader}>
              <Text style={styles.variantsTitle}>{selectedDish.name}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowVariants(false);
                  setSelectedDish(null);
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.variantsList}>
              {selectedDish.variants?.map((variant) => (
                <TouchableOpacity
                  key={variant.id}
                  style={styles.variantItem}
                  onPress={() => {
                    const finalPrice = selectedDish.price + variant.price_adjustment;
                    addToCartWithVariant(selectedDish, [variant]);
                  }}
                >
                  <View style={styles.variantInfo}>
                    <Text style={styles.variantName}>{variant.name}</Text>
                    <Text style={styles.variantPrice}>
                      {variant.price_adjustment > 0 ? `+$${variant.price_adjustment.toFixed(2)}` : 
                       variant.price_adjustment < 0 ? `$${variant.price_adjustment.toFixed(2)}` : 
                       'Sin costo adicional'}
                    </Text>
                  </View>
                  <Text style={styles.variantArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.addWithoutVariantButton}
              onPress={() => addToCartWithVariant(selectedDish, [])}
            >
              <Text style={styles.addWithoutVariantText}>Agregar sin variantes</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cartButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cartButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  categoriesContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
  },
  categoryButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    minWidth: 80,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 8,
  },
  dishesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  dishCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dishInfo: {
    marginBottom: 8,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  dishDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  dishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  unavailableText: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButtonTextDisabled: {
    color: '#9ca3af',
  },
  cartModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  cartContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  cartItems: {
    maxHeight: 400,
    padding: 20,
  },
  emptyCartText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 40,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginHorizontal: 16,
  },
  cartFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cartTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  createOrderButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createOrderButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  variantsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  variantsContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  variantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  variantsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  variantsList: {
    maxHeight: 300,
    padding: 20,
  },
  variantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  variantPrice: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  variantArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  addWithoutVariantButton: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  addWithoutVariantText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});