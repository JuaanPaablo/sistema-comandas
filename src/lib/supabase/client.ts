import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          active?: boolean;
          created_at?: string;
        };
      };
      dishes: {
        Row: {
          id: string;
          name: string;
          price: number;
          category_id: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          category_id: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          category_id?: string;
          active?: boolean;
          created_at?: string;
        };
      };
      variants: {
        Row: {
          id: string;
          name: string;
          dish_id: string;
          price_adjustment: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          dish_id: string;
          price_adjustment?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          dish_id?: string;
          price_adjustment?: number;
          active?: boolean;
          created_at?: string;
        };
      };
      inventories: {
        Row: {
          id: string;
          name: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          active?: boolean;
          created_at?: string;
        };
      };
      inventory_categories: {
        Row: {
          id: string;
          name: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          active?: boolean;
          created_at?: string;
        };
      };
      inventory_items: {
        Row: {
          id: string;
          name: string;
          inventory_id: string;
          category_id: string;
          unit: string;
          min_stock: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          inventory_id: string;
          category_id: string;
          unit: string;
          min_stock?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          inventory_id?: string;
          category_id?: string;
          unit?: string;
          min_stock?: number;
          active?: boolean;
          created_at?: string;
        };
      };
      batches: {
        Row: {
          id: string;
          inventory_item_id: string;
          batch_number: string;
          quantity: number;
          expiry_date: string;
          cost_per_unit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_item_id: string;
          batch_number: string;
          quantity: number;
          expiry_date: string;
          cost_per_unit: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          inventory_item_id?: string;
          batch_number?: string;
          quantity?: number;
          expiry_date?: string;
          cost_per_unit?: number;
          created_at?: string;
        };
      };
      stock_movements: {
        Row: {
          id: string;
          inventory_item_id: string;
          batch_id: string | null;
          movement_type: string;
          quantity: number;
          reference: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_item_id: string;
          batch_id?: string | null;
          movement_type: string;
          quantity: number;
          reference: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          inventory_item_id?: string;
          batch_id?: string | null;
          movement_type?: string;
          quantity?: number;
          reference?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      transfers: {
        Row: {
          id: string;
          from_inventory_id: string;
          to_inventory_id: string;
          inventory_item_id: string;
          batch_id: string | null;
          quantity: number;
          status: string;
          notes: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          from_inventory_id: string;
          to_inventory_id: string;
          inventory_item_id: string;
          batch_id?: string | null;
          quantity: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          from_inventory_id?: string;
          to_inventory_id?: string;
          inventory_item_id?: string;
          batch_id?: string | null;
          quantity?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      recipes: {
        Row: {
          id: string;
          dish_id: string;
          variant_id: string | null;
          inventory_item_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          dish_id: string;
          variant_id?: string | null;
          inventory_item_id: string;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          dish_id?: string;
          variant_id?: string | null;
          inventory_item_id?: string;
          quantity?: number;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          total_amount: number;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          total_amount: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          total_amount?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          dish_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          dish_id: string;
          variant_id?: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          dish_id?: string;
          variant_id?: string | null;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
