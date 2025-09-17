import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Category {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dish {
  id: string;
  name: string;
  price: number;
  category_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Variant {
  id: string;
  name: string;
  dish_id: string;
  price_adjustment: number;
  active: boolean;
  created_at: string;
  selection_text: string;
  max_selections: number;
  updated_at: string;
}

export interface DishWithVariants extends Dish {
  variants?: Variant[];
}

export const MenuService = {
  // Obtener todas las categorías
  async getCategories(): Promise<{ data: Category[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      return { data: null, error };
    }
  },

  // Obtener todos los platillos con sus categorías
  async getDishes(): Promise<{ data: DishWithVariants[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('active', true)
        .order('name', { ascending: true });

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo platillos:', error);
      return { data: null, error };
    }
  },

  // Obtener variantes de un platillo
  async getDishVariants(dishId: string): Promise<{ data: Variant[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('variants')
        .select('*')
        .eq('dish_id', dishId)
        .eq('active', true)
        .order('name', { ascending: true });

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo variantes:', error);
      return { data: null, error };
    }
  },

  // Obtener menú completo con categorías, platillos y variantes
  async getFullMenu(): Promise<{ data: any; error: any }> {
    try {
      const [categoriesResult, dishesResult] = await Promise.all([
        this.getCategories(),
        this.getDishes()
      ]);

      if (categoriesResult.error || dishesResult.error) {
        return { 
          data: null, 
          error: categoriesResult.error || dishesResult.error 
        };
      }

      // Obtener variantes para cada platillo
      const dishesWithVariants = await Promise.all(
        (dishesResult.data || []).map(async (dish) => {
          const variantsResult = await this.getDishVariants(dish.id);
          return {
            ...dish,
            variants: variantsResult.data || []
          };
        })
      );

      return {
        data: {
          categories: categoriesResult.data || [],
          dishes: dishesWithVariants
        },
        error: null
      };
    } catch (error) {
      console.error('Error obteniendo menú completo:', error);
      return { data: null, error };
    }
  }
};
