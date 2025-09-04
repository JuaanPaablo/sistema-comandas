// ===== TIPOS BASE =====
export interface BaseEntity {
  id: string;
  created_at: string;
}

export interface ActiveEntity extends BaseEntity {
  active: boolean;
}

// ===== MENÚ =====
export interface Category extends ActiveEntity {
  name: string;
}

export interface Dish extends ActiveEntity {
  name: string;
  price: number;
  category_id: string;
}

export interface Variant extends ActiveEntity {
  name: string;
  dish_id: string;
  selection_text: string;
  max_selections: number;
  price_adjustment: number;
}

// ===== INVENTARIO =====
export interface Inventory extends ActiveEntity {
  name: string;
}

export interface InventoryCategory extends ActiveEntity {
  name: string;
  inventory_id: string;
  updated_at: string;
}

export interface InventoryItem extends ActiveEntity {
  name: string;
  inventory_id: string;
  category_id: string;
  unit: string;
  stock: number;
  min_stock: number;
  unit_price: number;
  expiry_date: string | null;
}

export interface Batch extends BaseEntity {
  inventory_item_id: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  cost_per_unit: number;
  notes: string | null;
  active: boolean;
}

export interface StockMovement extends BaseEntity {
  inventory_item_id: string;
  batch_id: string | null;
  movement_type: string;
  quantity: number;
  reference: string;
  notes: string | null;
  reason: string;
  active: boolean;
}

export interface Transfer extends ActiveEntity {
  from_inventory_id: string;
  to_inventory_id: string;
  inventory_item_id: string;
  batch_id: string | null;
  quantity: number;
  status: string;
  notes: string | null;
  completed_at: string | null;
}

// ===== RECETAS =====
export interface Recipe extends BaseEntity {
  dish_id: string;
  variant_id: string | null;
  inventory_item_id: string;
  quantity: number;
}

// ===== VENTAS =====
export interface Order extends BaseEntity {
  order_number: string;
  total_amount: number;
  status: string;
  notes: string | null;
}

export interface OrderItem extends BaseEntity {
  order_id: string;
  dish_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// ===== ESTADOS DE FORMULARIOS =====
export interface CategoryFormData {
  name: string;
  active: boolean;
}

export interface DishFormData {
  name: string;
  price: number;
  category_id: string;
  active: boolean;
}

export interface VariantFormData {
  name: string;
  dish_id: string;
  selection_text: string;
  max_selections: number;
  price_adjustment: number;
  active: boolean;
}

export interface InventoryFormData {
  name: string;
  active: boolean;
}

export interface InventoryCategoryFormData {
  name: string;
  inventory_id: string;
  active: boolean;
}

export interface InventoryItemFormData {
  name: string;
  inventory_id: string;
  category_id: string;
  unit: string;
  stock: number;
  min_stock: number;
  unit_price: number;
  expiry_date: string;
  active: boolean;
}

export interface BatchFormData {
  inventory_item_id: string;
  batch_number: string;
  quantity: number;
  expiry_date: string;
  cost_per_unit: number;
  notes: string;
  active: boolean;
}

export interface StockMovementFormData {
  inventory_item_id: string;
  batch_id: string | null;
  movement_type: string;
  quantity: number;
  reference: string;
  notes: string;
  reason: string;
  active: boolean;
}

export interface TransferFormData {
  from_inventory_id: string;
  to_inventory_id: string;
  inventory_item_id: string;
  batch_id: string | null;
  quantity: number;
  status: string;
  notes: string;
  active: boolean;
}

export interface RecipeFormData {
  dish_id: string;
  variant_id: string | null;
  inventory_item_id: string;
  quantity: number;
}

export interface OrderFormData {
  order_number: string;
  total_amount: number;
  status: string;
  notes: string;
}

export interface OrderItemFormData {
  order_id: string;
  dish_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// ===== RESPUESTAS DE API =====
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: string | null;
}

// ===== TIPOS DE ENUM =====
export type MovementType = 'entrada' | 'salida' | 'ajuste' | 'transferencia';
export type OrderStatus = 'pending' | 'completed' | 'cancelled';
export type TransferStatus = 'pending' | 'in_transit' | 'completed' | 'cancelled';

// ===== TIPOS DE FILTROS =====
export interface DateRangeFilter {
  start_date: string;
  end_date: string;
}

export interface StockFilter {
  inventory_id?: string;
  category_id?: string;
  low_stock_only?: boolean;
}

export interface OrderFilter extends DateRangeFilter {
  status?: OrderStatus;
}
