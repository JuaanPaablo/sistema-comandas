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
  selection_text?: string;
  max_selections?: number;
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
  inventory_id: string;
  category_id: string;
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
  category_id: string | null;
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
  batch_id: string | null;
  quantity: number;
  unit: string;
  active: boolean;
}

// ===== MESAS =====
export interface Table extends BaseEntity {
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  current_order_id?: string;
  updated_at: string;
}

export interface TableFormData {
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
}

// ===== VENTAS =====
export interface Order extends BaseEntity {
  order_number: string;
  total_amount: number;
  status: string;
  notes: string | null;
  service_type: 'local' | 'takeaway';
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
  expiry_date?: string;
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
  inventory_id: string;
  category_id: string;
  inventory_item_id: string;
  batch_id: string;
  movement_type: 'ajuste_positivo' | 'ajuste_negativo';
  quantity: number;
  reference?: string;
  notes?: string;
  reason: string;
  active: boolean;
}

export interface TransferFormData {
  from_inventory_id: string;
  to_inventory_id: string;
  category_id: string;
  inventory_item_id: string;
  batch_id: string;
  quantity: number;
  status: string;
  notes: string;
  active: boolean;
}

export interface RecipeFormData {
  dish_id: string;
  variant_id: string | null;
  inventory_item_id: string;
  batch_id: string | null;
  quantity: number;
  unit: string;
  active: boolean;
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

// =====================================================
// TIPOS PARA MÓDULO DE CONTABILIDAD
// =====================================================

export interface CashSession {
  id: string;
  employee_id: string;
  opening_amount: number;
  closing_amount?: number;
  total_sales: number;
  total_cash: number;
  total_card: number;
  total_transfer: number;
  total_mobile: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  employees?: {
    id: string;
    name: string;
    position: string;
  };
}

export interface CashSessionFormData {
  employee_id: string;
  opening_amount: number;
  notes?: string;
}

export interface Income {
  id: string;
  type: 'venta' | 'cobro' | 'devolucion' | 'otros';
  amount: number;
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia' | 'movil';
  description?: string;
  reference?: string;
  comanda_id?: string;
  cash_session_id?: string;
  employee_id: string;
  customer_name?: string;
  customer_document?: string;
  created_at: string;
  updated_at: string;
  employees?: {
    id: string;
    name: string;
    position: string;
  };
  cash_sessions?: {
    id: string;
    opened_at: string;
  };
  comandas?: {
    id: string;
    table_number: string;
    total_amount: number;
  };
}

export interface IncomeFormData {
  type: 'venta' | 'cobro' | 'devolucion' | 'otros';
  amount: number;
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia' | 'movil';
  description?: string;
  reference?: string;
  comanda_id?: string;
  cash_session_id?: string;
  employee_id: string;
  customer_name?: string;
  customer_document?: string;
}

export interface Expense {
  id: string;
  type: 'compra' | 'gasto_operativo' | 'salario' | 'servicios' | 'otros';
  amount: number;
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque';
  description: string;
  reference?: string;
  supplier_id?: string;
  cash_session_id?: string;
  employee_id: string;
  category?: string;
  invoice_number?: string;
  created_at: string;
  updated_at: string;
  employees?: {
    id: string;
    name: string;
    position: string;
  };
  cash_sessions?: {
    id: string;
    opened_at: string;
  };
  suppliers?: {
    id: string;
    name: string;
    contact_person: string;
  };
}

export interface ExpenseFormData {
  type: 'compra' | 'gasto_operativo' | 'salario' | 'servicios' | 'otros';
  amount: number;
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia' | 'cheque';
  description: string;
  reference?: string;
  supplier_id?: string;
  cash_session_id?: string;
  employee_id: string;
  category?: string;
  invoice_number?: string;
}

export interface Invoice {
  id: string;
  type: 'factura' | 'nota_credito' | 'nota_debito';
  number: string;
  amount: number;
  subtotal_0: number;
  subtotal_12: number;
  iva_12: number;
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  customer_name?: string;
  customer_document?: string;
  customer_address?: string;
  customer_phone?: string;
  customer_email?: string;
  comanda_id?: string;
  employee_id: string;
  serie?: string;
  autorizacion_sri?: string;
  fecha_autorizacion?: string;
  xml_generado?: string;
  xml_firmado?: string;
  created_at: string;
  updated_at: string;
  employees?: {
    id: string;
    name: string;
    position: string;
  };
  comandas?: {
    id: string;
    table_number: string;
    total_amount: number;
  };
}

export interface InvoiceFormData {
  type: 'factura' | 'nota_credito' | 'nota_debito';
  number: string;
  amount: number;
  subtotal_0: number;
  subtotal_12: number;
  iva_12: number;
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  customer_name?: string;
  customer_document?: string;
  customer_address?: string;
  customer_phone?: string;
  customer_email?: string;
  comanda_id?: string;
  employee_id: string;
  serie?: string;
  autorizacion_sri?: string;
}

export interface Ticket {
  id: string;
  type: 'venta' | 'cobro' | 'devolucion' | 'corte_caja';
  number: string;
  amount: number;
  customer_name?: string;
  employee_id: string;
  cash_session_id?: string;
  printed_at?: string;
  status: 'pending' | 'printed' | 'cancelled';
  items: TicketItem[];
  created_at: string;
  updated_at: string;
  employees?: {
    id: string;
    name: string;
    position: string;
  };
  cash_sessions?: {
    id: string;
    opened_at: string;
  };
}

export interface TicketItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface TicketFormData {
  type: 'venta' | 'cobro' | 'devolucion' | 'corte_caja';
  number: string;
  amount: number;
  customer_name?: string;
  employee_id: string;
  cash_session_id?: string;
  items: TicketItem[];
}

export interface EmployeeAccounting {
  id: string;
  employee_id: string;
  salary: number;
  commission_rate: number;
  payment_method: 'efectivo' | 'transferencia' | 'cheque';
  total_commission: number;
  last_payment_date?: string;
  status: 'active' | 'inactive';
  start_date: string;
  created_at: string;
  updated_at: string;
  employees?: {
    id: string;
    name: string;
    position: string;
  };
}

export interface EmployeeAccountingFormData {
  employee_id: string;
  salary: number;
  commission_rate: number;
  payment_method: 'efectivo' | 'transferencia' | 'cheque';
  status: 'active' | 'inactive';
  start_date: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms: string;
  status: 'active' | 'inactive';
  total_purchases: number;
  pending_amount: number;
  last_purchase_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierFormData {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms: string;
  status: 'active' | 'inactive';
}

export interface AccountingConfig {
  id: string;
  company_name: string;
  company_ruc: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  fiscal_regime: string;
  fiscal_period: string;
  iva_rate: number;
  retention_rate: number;
  base_currency: string;
  date_format: string;
  number_format: string;
  decimals: number;
  invoice_series: string;
  credit_note_series: string;
  debit_note_series: string;
  sri_authorization?: string;
  report_format: string;
  include_logo: boolean;
  show_details: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialReport {
  id: string;
  period: string;
  period_type: 'semana' | 'mes' | 'trimestre' | 'año';
  total_income: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  active_customers: number;
  active_suppliers: number;
  total_sales: number;
  total_purchases: number;
  generated_at: string;
  created_at: string;
}

export interface KPIMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: any;
  color: string;
  format: 'currency' | 'percentage' | 'number';
  description: string;
}

export interface ChartData {
  period: string;
  ingresos: number;
  egresos: number;
  utilidad: number;
}

// =====================================================
// TIPOS PARA REPORTES Y VISTAS
// =====================================================

export interface DailyCashSummary {
  date: string;
  sessions_count: number;
  total_opening: number;
  total_closing: number;
  total_sales: number;
  total_cash: number;
  total_card: number;
  total_transfer: number;
  total_mobile: number;
}

export interface IncomeByType {
  type: string;
  count: number;
  total_amount: number;
  avg_amount: number;
}

export interface ExpenseByType {
  type: string;
  count: number;
  total_amount: number;
  avg_amount: number;
}

export interface EmployeeCommissionSummary {
  employee_name: string;
  position: string;
  salary: number;
  commission_rate: number;
  total_commission: number;
  payment_method: string;
  last_payment_date?: string;
  status: string;
}

export interface SupplierPurchaseSummary {
  supplier_name: string;
  contact_person?: string;
  payment_terms: string;
  total_purchases: number;
  pending_amount: number;
  last_purchase_date?: string;
  status: string;
  purchase_count: number;
}
