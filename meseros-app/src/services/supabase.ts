import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Usar variables de entorno de Expo (más seguro)
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ CONFIGURACIÓN REQUERIDA:');
  console.error('1. Crea archivo: meseros-app/.env');
  console.error('2. Agrega: EXPO_PUBLIC_SUPABASE_URL=tu-url');
  console.error('3. Agrega: EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave');
  console.error('4. Reinicia la app');
  throw new Error('Configura las variables de entorno en .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Tipos para la app de meseros
export interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position: 'mesero' | 'cocinero';
  status: 'active' | 'inactive' | 'vacation' | 'suspended';
  created_at: string;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  current_order_id?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  category_name: string;
  available: boolean;
  image_url?: string;
}

export interface Order {
  id: string;
  table_id: string;
  employee_id: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'paid';
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
}
