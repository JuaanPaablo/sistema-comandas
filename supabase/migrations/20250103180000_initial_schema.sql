-- Esquema completo del sistema de comandas para BD local
-- Basado en el esquema real del proyecto

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de configuración contable
CREATE TABLE public.accounting_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_name character varying NOT NULL,
  company_ruc character varying NOT NULL,
  company_address text,
  company_phone character varying,
  company_email character varying,
  fiscal_regime character varying DEFAULT 'Régimen General'::character varying,
  fiscal_period character varying DEFAULT 'Enero - Diciembre'::character varying,
  iva_rate numeric DEFAULT 12.0,
  retention_rate numeric DEFAULT 1.0,
  base_currency character varying DEFAULT 'USD'::character varying,
  date_format character varying DEFAULT 'DD/MM/YYYY'::character varying,
  number_format character varying DEFAULT '1,234.56'::character varying,
  decimals integer DEFAULT 2,
  invoice_series character varying DEFAULT '001-001'::character varying,
  credit_note_series character varying DEFAULT '001-002'::character varying,
  debit_note_series character varying DEFAULT '001-003'::character varying,
  sri_authorization character varying,
  report_format character varying DEFAULT 'PDF'::character varying,
  include_logo boolean DEFAULT true,
  show_details boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT accounting_config_pkey PRIMARY KEY (id)
);

-- Tabla de empleados
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  position character varying NOT NULL CHECK ("position"::text = ANY (ARRAY['mesero'::character varying, 'cocinero'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT employees_pkey PRIMARY KEY (id)
);

-- Tabla de categorías
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  "order" integer DEFAULT 0,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- Tabla de platillos
CREATE TABLE public.dishes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  price numeric NOT NULL,
  category_id uuid,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  "order" integer DEFAULT 0,
  CONSTRAINT dishes_pkey PRIMARY KEY (id),
  CONSTRAINT dishes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);

-- Tabla de variantes
CREATE TABLE public.variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  dish_id uuid,
  price_adjustment numeric DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  selection_text text DEFAULT 'Escoja una variante'::text,
  max_selections integer DEFAULT 1,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT variants_pkey PRIMARY KEY (id),
  CONSTRAINT variants_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id)
);

-- Tabla de órdenes
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number character varying UNIQUE,
  total_amount numeric NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  employee_id uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  service_type character varying DEFAULT 'local'::character varying CHECK (service_type::text = ANY (ARRAY['local'::character varying, 'takeaway'::character varying]::text[])),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Tabla de mesas
CREATE TABLE public.tables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  number integer NOT NULL UNIQUE,
  capacity integer NOT NULL DEFAULT 4,
  status character varying DEFAULT 'available'::character varying CHECK (status::text = ANY (ARRAY['available'::character varying, 'occupied'::character varying, 'reserved'::character varying, 'cleaning'::character varying]::text[])),
  current_order_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tables_pkey PRIMARY KEY (id),
  CONSTRAINT tables_current_order_id_fkey FOREIGN KEY (current_order_id) REFERENCES public.orders(id)
);

-- Tabla de pantallas de cocina
CREATE TABLE public.kitchen_screens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT kitchen_screens_pkey PRIMARY KEY (id)
);

-- Tabla de items de orden
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  menu_item_id uuid,
  variant_id uuid,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  status character varying DEFAULT 'pending'::character varying,
  screen_id uuid,
  prepared_at timestamp with time zone,
  prepared_by uuid,
  menu_item_name character varying,
  notes text,
  dish_name character varying,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_dish_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.dishes(id),
  CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id),
  CONSTRAINT order_items_prepared_by_fkey FOREIGN KEY (prepared_by) REFERENCES public.employees(id),
  CONSTRAINT order_items_screen_id_fkey FOREIGN KEY (screen_id) REFERENCES public.kitchen_screens(id)
);

-- Tabla de comandas
CREATE TABLE public.comandas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  table_number text NOT NULL,
  employee_id uuid NOT NULL,
  employee_name character varying NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'ready'::character varying, 'served'::character varying, 'closed'::character varying]::text[])),
  total_amount numeric NOT NULL DEFAULT 0,
  items_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  served_at timestamp with time zone,
  notes text,
  priority character varying DEFAULT 'normal'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying]::text[])),
  estimated_time integer DEFAULT 0,
  actual_time integer DEFAULT 0,
  total_preparation_time integer DEFAULT 0,
  closed_at timestamp with time zone,
  payment_method character varying CHECK (payment_method::text = ANY (ARRAY['efectivo'::character varying, 'tarjeta'::character varying, 'transferencia'::character varying]::text[])),
  caja_employee_id uuid,
  ticket_number character varying,
  tipo_comprobante character varying DEFAULT '01'::character varying,
  codigo_establecimiento character varying,
  codigo_punto_emision character varying,
  secuencial character varying,
  clave_acceso character varying,
  autorizacion_sri character varying,
  fecha_autorizacion timestamp with time zone,
  estado_sri character varying DEFAULT 'pendiente'::character varying,
  mensaje_sri text,
  xml_generado text,
  xml_firmado text,
  ride_generado text,
  subtotal_0 numeric DEFAULT 0,
  subtotal_12 numeric DEFAULT 0,
  iva_12 numeric DEFAULT 0,
  total numeric DEFAULT 0,
  cliente_ruc character varying,
  cliente_razon_social character varying,
  cliente_direccion text,
  cliente_telefono character varying,
  cliente_email character varying,
  CONSTRAINT comandas_pkey PRIMARY KEY (id),
  CONSTRAINT comandas_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT comandas_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT comandas_caja_employee_id_fkey FOREIGN KEY (caja_employee_id) REFERENCES public.employees(id)
);

-- Tabla de items de comanda
CREATE TABLE public.comanda_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comanda_id uuid NOT NULL,
  order_item_id uuid NOT NULL,
  dish_id uuid NOT NULL,
  dish_name character varying NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'ready'::character varying, 'served'::character varying]::text[])),
  screen_id uuid,
  prepared_by uuid,
  prepared_at timestamp with time zone,
  served_at timestamp with time zone,
  notes text,
  priority character varying DEFAULT 'normal'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying]::text[])),
  estimated_time integer DEFAULT 0,
  actual_time integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  kitchen_notes text,
  preparation_time integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comanda_items_pkey PRIMARY KEY (id),
  CONSTRAINT comanda_items_comanda_id_fkey FOREIGN KEY (comanda_id) REFERENCES public.comandas(id),
  CONSTRAINT comanda_items_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id),
  CONSTRAINT comanda_items_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id),
  CONSTRAINT comanda_items_screen_id_fkey FOREIGN KEY (screen_id) REFERENCES public.kitchen_screens(id),
  CONSTRAINT comanda_items_prepared_by_fkey FOREIGN KEY (prepared_by) REFERENCES public.employees(id)
);

-- Tabla de asignaciones de pantalla-platillo
CREATE TABLE public.screen_dish_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  screen_id uuid NOT NULL,
  dish_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT screen_dish_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT screen_dish_assignments_screen_id_fkey FOREIGN KEY (screen_id) REFERENCES public.kitchen_screens(id),
  CONSTRAINT screen_dish_assignments_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id)
);

-- Tabla de inventarios
CREATE TABLE public.inventories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventories_pkey PRIMARY KEY (id)
);

-- Tabla de categorías de inventario
CREATE TABLE public.inventory_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  inventory_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_categories_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_categories_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventories(id)
);

-- Tabla de items de inventario
CREATE TABLE public.inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  inventory_id uuid,
  category_id uuid,
  unit character varying NOT NULL,
  min_stock numeric DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  stock numeric DEFAULT 0,
  unit_price numeric DEFAULT 0,
  expiry_date date,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_items_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventories(id),
  CONSTRAINT inventory_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.inventory_categories(id)
);

-- Tabla de lotes
CREATE TABLE public.batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_item_id uuid,
  batch_number character varying,
  quantity numeric NOT NULL,
  expiry_date date,
  cost_per_unit numeric,
  created_at timestamp with time zone DEFAULT now(),
  active boolean DEFAULT true,
  notes text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT batches_pkey PRIMARY KEY (id),
  CONSTRAINT batches_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id)
);

-- Tabla de movimientos de stock
CREATE TABLE public.stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  inventory_item_id uuid,
  batch_id uuid,
  movement_type character varying NOT NULL,
  quantity numeric NOT NULL,
  reference character varying,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  reason character varying NOT NULL DEFAULT 'Ajuste de inventario'::character varying,
  active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  employee_id uuid,
  inventory_id uuid,
  category_id uuid,
  CONSTRAINT stock_movements_pkey PRIMARY KEY (id),
  CONSTRAINT stock_movements_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id),
  CONSTRAINT stock_movements_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id),
  CONSTRAINT stock_movements_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT stock_movements_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventories(id),
  CONSTRAINT stock_movements_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.inventory_categories(id)
);

-- Tabla de recetas
CREATE TABLE public.recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  dish_id uuid NOT NULL,
  variant_id uuid,
  inventory_item_id uuid NOT NULL,
  batch_id uuid,
  quantity numeric NOT NULL,
  unit character varying NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recipes_pkey PRIMARY KEY (id),
  CONSTRAINT recipes_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(id),
  CONSTRAINT recipes_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.variants(id),
  CONSTRAINT recipes_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id),
  CONSTRAINT recipes_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id)
);

-- Tabla de transferencias
CREATE TABLE public.transfers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_inventory_id uuid,
  to_inventory_id uuid,
  inventory_item_id uuid,
  batch_id uuid,
  quantity numeric NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  employee_id uuid,
  category_id uuid,
  CONSTRAINT transfers_pkey PRIMARY KEY (id),
  CONSTRAINT transfers_from_inventory_id_fkey FOREIGN KEY (from_inventory_id) REFERENCES public.inventories(id),
  CONSTRAINT transfers_to_inventory_id_fkey FOREIGN KEY (to_inventory_id) REFERENCES public.inventories(id),
  CONSTRAINT transfers_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id),
  CONSTRAINT transfers_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id),
  CONSTRAINT transfers_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT transfers_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.inventory_categories(id)
);

-- Tabla de historial de logs
CREATE TABLE public.history_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  inventory_item_id uuid NOT NULL,
  inventory_id uuid NOT NULL,
  batch_id uuid,
  transfer_id uuid,
  movement_id uuid,
  product_name character varying NOT NULL,
  inventory_name character varying NOT NULL,
  batch_number character varying,
  quantity_before numeric,
  quantity_after numeric,
  quantity_changed numeric,
  description text NOT NULL,
  notes text,
  reference character varying,
  active boolean DEFAULT true,
  CONSTRAINT history_log_pkey PRIMARY KEY (id),
  CONSTRAINT history_log_inventory_item_id_fkey FOREIGN KEY (inventory_item_id) REFERENCES public.inventory_items(id),
  CONSTRAINT history_log_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventories(id),
  CONSTRAINT history_log_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id),
  CONSTRAINT history_log_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.transfers(id),
  CONSTRAINT history_log_movement_id_fkey FOREIGN KEY (movement_id) REFERENCES public.stock_movements(id)
);

-- Tabla de proveedores
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  contact_person character varying,
  email character varying,
  phone character varying,
  address text,
  payment_terms character varying DEFAULT '30 días'::character varying,
  status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying]::text[])),
  total_purchases numeric DEFAULT 0,
  pending_amount numeric DEFAULT 0,
  last_purchase_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id)
);

-- Tabla de sesiones de caja
CREATE TABLE public.cash_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  opening_amount numeric NOT NULL DEFAULT 0,
  closing_amount numeric DEFAULT 0,
  total_sales numeric DEFAULT 0,
  total_cash numeric DEFAULT 0,
  total_card numeric DEFAULT 0,
  total_transfer numeric DEFAULT 0,
  total_mobile numeric DEFAULT 0,
  status character varying NOT NULL DEFAULT 'open'::character varying CHECK (status::text = ANY (ARRAY['open'::character varying, 'closed'::character varying]::text[])),
  opened_at timestamp with time zone DEFAULT now(),
  closed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cash_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT cash_sessions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Tabla de ingresos
CREATE TABLE public.incomes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['venta'::character varying, 'cobro'::character varying, 'devolucion'::character varying, 'otros'::character varying]::text[])),
  amount numeric NOT NULL,
  payment_method character varying NOT NULL CHECK (payment_method::text = ANY (ARRAY['efectivo'::character varying, 'tarjeta'::character varying, 'transferencia'::character varying, 'movil'::character varying]::text[])),
  description text,
  reference character varying,
  comanda_id uuid,
  cash_session_id uuid,
  employee_id uuid NOT NULL,
  customer_name character varying,
  customer_document character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT incomes_pkey PRIMARY KEY (id),
  CONSTRAINT incomes_comanda_id_fkey FOREIGN KEY (comanda_id) REFERENCES public.comandas(id),
  CONSTRAINT incomes_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id),
  CONSTRAINT incomes_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Tabla de gastos
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['compra'::character varying, 'gasto_operativo'::character varying, 'salario'::character varying, 'servicios'::character varying, 'otros'::character varying]::text[])),
  amount numeric NOT NULL,
  payment_method character varying NOT NULL CHECK (payment_method::text = ANY (ARRAY['efectivo'::character varying, 'tarjeta'::character varying, 'transferencia'::character varying, 'cheque'::character varying]::text[])),
  description text NOT NULL,
  reference character varying,
  supplier_id uuid,
  cash_session_id uuid,
  employee_id uuid NOT NULL,
  category character varying,
  invoice_number character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT expenses_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id),
  CONSTRAINT expenses_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Tabla de contabilidad de empleados
CREATE TABLE public.employee_accounting (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL UNIQUE,
  salary numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 0,
  payment_method character varying NOT NULL DEFAULT 'efectivo'::character varying CHECK (payment_method::text = ANY (ARRAY['efectivo'::character varying, 'transferencia'::character varying, 'cheque'::character varying]::text[])),
  total_commission numeric DEFAULT 0,
  last_payment_date date,
  status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'inactive'::character varying]::text[])),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT employee_accounting_pkey PRIMARY KEY (id),
  CONSTRAINT employee_accounting_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Tabla de reportes financieros
CREATE TABLE public.financial_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  period character varying NOT NULL,
  period_type character varying NOT NULL CHECK (period_type::text = ANY (ARRAY['semana'::character varying, 'mes'::character varying, 'trimestre'::character varying, 'año'::character varying]::text[])),
  total_income numeric DEFAULT 0,
  total_expenses numeric DEFAULT 0,
  net_profit numeric DEFAULT 0,
  profit_margin numeric DEFAULT 0,
  active_customers integer DEFAULT 0,
  active_suppliers integer DEFAULT 0,
  total_sales numeric DEFAULT 0,
  total_purchases numeric DEFAULT 0,
  generated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT financial_reports_pkey PRIMARY KEY (id)
);

-- Tabla de datos fiscales de la empresa
CREATE TABLE public.company_fiscal_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ruc character varying NOT NULL UNIQUE,
  razon_social character varying NOT NULL,
  nombre_comercial character varying,
  direccion_matriz text NOT NULL,
  direccion_establecimiento text,
  codigo_establecimiento character varying,
  codigo_punto_emision character varying,
  telefono character varying,
  email character varying,
  ambiente character varying DEFAULT 'pruebas'::character varying CHECK (ambiente::text = ANY (ARRAY['pruebas'::character varying, 'produccion'::character varying]::text[])),
  tipo_emision character varying DEFAULT 'normal'::character varying CHECK (tipo_emision::text = ANY (ARRAY['normal'::character varying, 'indisponibilidad'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_fiscal_data_pkey PRIMARY KEY (id)
);

-- Tabla de configuración de impuestos
CREATE TABLE public.tax_configuration (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo_impuesto character varying NOT NULL,
  codigo_porcentaje character varying NOT NULL,
  nombre character varying NOT NULL,
  porcentaje numeric NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tax_configuration_pkey PRIMARY KEY (id)
);

-- Tabla de secuencias de facturación
CREATE TABLE public.invoice_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  tipo_comprobante character varying NOT NULL,
  codigo_establecimiento character varying NOT NULL,
  codigo_punto_emision character varying NOT NULL,
  secuencial_actual bigint DEFAULT 0,
  secuencial_maximo bigint DEFAULT 999999999,
  activo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoice_sequences_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_sequences_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company_fiscal_data(id)
);

-- Tabla de facturas
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['factura'::character varying, 'nota_credito'::character varying, 'nota_debito'::character varying]::text[])),
  number character varying NOT NULL,
  amount numeric NOT NULL,
  subtotal_0 numeric DEFAULT 0,
  subtotal_12 numeric DEFAULT 0,
  iva_12 numeric DEFAULT 0,
  total numeric NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'paid'::character varying, 'cancelled'::character varying]::text[])),
  customer_name character varying,
  customer_document character varying,
  customer_address text,
  customer_phone character varying,
  customer_email character varying,
  comanda_id uuid,
  employee_id uuid NOT NULL,
  serie character varying,
  autorizacion_sri character varying,
  fecha_autorizacion timestamp with time zone,
  xml_generado text,
  xml_firmado text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_comanda_id_fkey FOREIGN KEY (comanda_id) REFERENCES public.comandas(id),
  CONSTRAINT invoices_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id)
);

-- Tabla de items de factura
CREATE TABLE public.invoice_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comanda_id uuid,
  codigo_principal character varying,
  codigo_auxiliar character varying,
  descripcion character varying NOT NULL,
  cantidad numeric NOT NULL,
  precio_unitario numeric NOT NULL,
  descuento numeric DEFAULT 0,
  precio_total_sin_impuestos numeric NOT NULL,
  codigo_impuesto character varying,
  codigo_porcentaje character varying,
  tarifa numeric,
  base_imponible numeric,
  valor_impuesto numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoice_items_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_items_comanda_id_fkey FOREIGN KEY (comanda_id) REFERENCES public.comandas(id)
);

-- Tabla de tickets
CREATE TABLE public.tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['venta'::character varying, 'cobro'::character varying, 'devolucion'::character varying, 'corte_caja'::character varying]::text[])),
  number character varying NOT NULL,
  amount numeric NOT NULL,
  customer_name character varying,
  employee_id uuid NOT NULL,
  cash_session_id uuid,
  printed_at timestamp with time zone,
  status character varying NOT NULL DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'printed'::character varying, 'cancelled'::character varying]::text[])),
  items jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tickets_pkey PRIMARY KEY (id),
  CONSTRAINT tickets_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id),
  CONSTRAINT tickets_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id)
);

-- Tabla de logs SRI
CREATE TABLE public.sri_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comanda_id uuid,
  tipo_operacion character varying,
  estado character varying,
  mensaje text,
  respuesta_sri text,
  fecha_operacion timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sri_logs_pkey PRIMARY KEY (id),
  CONSTRAINT sri_logs_comanda_id_fkey FOREIGN KEY (comanda_id) REFERENCES public.comandas(id)
);

-- Datos de ejemplo básicos
INSERT INTO public.employees (id, name, position) VALUES 
    (gen_random_uuid(), 'Admin', 'mesero'),
    (gen_random_uuid(), 'Mesero 1', 'mesero'),
    (gen_random_uuid(), 'Cocinero 1', 'cocinero')
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (id, name, "order") VALUES 
    (gen_random_uuid(), 'Entradas', 1),
    (gen_random_uuid(), 'Platos Principales', 2),
    (gen_random_uuid(), 'Postres', 3),
    (gen_random_uuid(), 'Bebidas', 4)
ON CONFLICT DO NOTHING;

INSERT INTO public.tables (id, number, capacity) VALUES 
    (gen_random_uuid(), 1, 4),
    (gen_random_uuid(), 2, 4),
    (gen_random_uuid(), 3, 6),
    (gen_random_uuid(), 4, 2),
    (gen_random_uuid(), 5, 8)
ON CONFLICT DO NOTHING;

INSERT INTO public.kitchen_screens (id, name, description) VALUES 
    (gen_random_uuid(), 'Pantalla Principal', 'Pantalla principal de cocina'),
    (gen_random_uuid(), 'Pantalla Postres', 'Pantalla especializada en postres')
ON CONFLICT DO NOTHING;
