import { supabase } from '@/lib/supabase';

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
  category_name?: string;
}

export interface Variant {
  id: string;
  name: string;
  dish_id: string;
  price_adjustment: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  selection_text?: string;
  max_selections?: number;
}

// Clases separadas para compatibilidad con el código existente
export class CategoryService {
  // Obtener todas las categorías (solo activas)
  static async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Obtener todas las categorías (incluyendo inactivas)
  static async getAllWithInactive(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Obtener todas las categorías (alias para compatibilidad)
  static async getAll(): Promise<Category[]> {
    return this.getAllWithInactive();
  }

  // Crear categoría
  static async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Category | null; error: string | null }> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  }

  // Alias para compatibilidad
  static async create(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Category | null; error: string | null }> {
    return this.createCategory(category);
  }

  // Actualizar categoría
  static async updateCategory(id: string, updates: Partial<Category>): Promise<{ data: Category | null; error: string | null }> {
    const { data, error } = await supabase
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  }

  // Alias para compatibilidad
  static async update(id: string, updates: Partial<Category>): Promise<{ data: Category | null; error: string | null }> {
    return this.updateCategory(id, updates);
  }

  // Eliminar categoría
  static async deleteCategory(id: string): Promise<{ data: boolean | null; error: string | null }> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  }

  // Alias para compatibilidad
  static async delete(id: string): Promise<{ data: boolean | null; error: string | null }> {
    return this.deleteCategory(id);
  }

  // Toggle active status
  static async toggleActive(id: string, active: boolean): Promise<{ data: Category | null; error: string | null }> {
    return this.updateCategory(id, { active });
  }

  // Hard delete (permanent)
  static async hardDelete(id: string): Promise<{ data: boolean | null; error: string | null }> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  }
}

export class DishService {
  // Obtener todos los platillos (solo activos)
  static async getDishes(): Promise<Dish[]> {
    const { data, error } = await supabase
      .from('dishes')
      .select(`
        *,
        categories!inner(name)
      `)
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    
    return data?.map(dish => ({
      ...dish,
      category_name: dish.categories.name
    })) || [];
  }

  // Obtener todos los platillos (incluyendo inactivos)
  static async getAllWithInactive(): Promise<Dish[]> {
    const { data, error } = await supabase
      .from('dishes')
      .select(`
        *,
        categories!inner(name)
      `)
      .order('name', { ascending: true });

    if (error) throw error;
    
    return data?.map(dish => ({
      ...dish,
      category_name: dish.categories.name
    })) || [];
  }

  // Obtener todos los platillos (alias para compatibilidad)
  static async getAll(): Promise<Dish[]> {
    return this.getAllWithInactive();
  }

  // Obtener platillos por categoría
  static async getDishesByCategory(categoryId: string): Promise<Dish[]> {
    const { data, error } = await supabase
      .from('dishes')
      .select(`
        *,
        categories!inner(name)
      `)
      .eq('category_id', categoryId)
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    
    return data?.map(dish => ({
      ...dish,
      category_name: dish.categories.name
    })) || [];
  }

  // Crear platillo
  static async createDish(dish: Omit<Dish, 'id' | 'created_at' | 'updated_at' | 'category_name'>): Promise<{ data: Dish | null; error: string | null }> {
    const { data, error } = await supabase
      .from('dishes')
      .insert(dish)
      .select(`
        *,
        categories!inner(name)
      `)
      .single();

    if (error) return { data: null, error: error.message };
    
    return {
      data: {
        ...data,
        category_name: data.categories.name
      },
      error: null
    };
  }

  // Alias para compatibilidad
  static async create(dish: Omit<Dish, 'id' | 'created_at' | 'updated_at' | 'category_name'>): Promise<{ data: Dish | null; error: string | null }> {
    return this.createDish(dish);
  }

  // Actualizar platillo
  static async updateDish(id: string, updates: Partial<Dish>): Promise<{ data: Dish | null; error: string | null }> {
    const { data, error } = await supabase
      .from('dishes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        categories!inner(name)
      `)
      .single();

    if (error) return { data: null, error: error.message };
    
    return {
      data: {
        ...data,
        category_name: data.categories.name
      },
      error: null
    };
  }

  // Alias para compatibilidad
  static async update(id: string, updates: Partial<Dish>): Promise<{ data: Dish | null; error: string | null }> {
    return this.updateDish(id, updates);
  }

  // Eliminar platillo
  static async deleteDish(id: string): Promise<{ data: boolean | null; error: string | null }> {
    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', id);

    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  }

  // Alias para compatibilidad
  static async delete(id: string): Promise<{ data: boolean | null; error: string | null }> {
    return this.deleteDish(id);
  }

  // Toggle active status
  static async toggleActive(id: string, active: boolean): Promise<{ data: Dish | null; error: string | null }> {
    return this.updateDish(id, { active });
  }

  // Hard delete (permanent)
  static async hardDelete(id: string): Promise<{ data: boolean | null; error: string | null }> {
    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', id);

    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  }
}

export class VariantService {
  // Obtener variantes de un platillo
  static async getDishVariants(dishId: string): Promise<Variant[]> {
    const { data, error } = await supabase
      .from('variants')
      .select('*')
      .eq('dish_id', dishId)
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Obtener todas las variantes (solo activas)
  static async getAll(): Promise<Variant[]> {
    const { data, error } = await supabase
      .from('variants')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Obtener todas las variantes (incluyendo inactivas)
  static async getAllWithInactive(): Promise<Variant[]> {
    const { data, error } = await supabase
      .from('variants')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Crear variante
  static async createVariant(variant: Omit<Variant, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Variant | null; error: string | null }> {
    const { data, error } = await supabase
      .from('variants')
      .insert(variant)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  }

  // Alias para compatibilidad
  static async create(variant: Omit<Variant, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Variant | null; error: string | null }> {
    return this.createVariant(variant);
  }

  // Actualizar variante
  static async updateVariant(id: string, updates: Partial<Variant>): Promise<{ data: Variant | null; error: string | null }> {
    const { data, error } = await supabase
      .from('variants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  }

  // Alias para compatibilidad
  static async update(id: string, updates: Partial<Variant>): Promise<{ data: Variant | null; error: string | null }> {
    return this.updateVariant(id, updates);
  }

  // Eliminar variante
  static async deleteVariant(id: string): Promise<{ data: boolean | null; error: string | null }> {
    const { error } = await supabase
      .from('variants')
      .delete()
      .eq('id', id);

    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  }

  // Alias para compatibilidad
  static async delete(id: string): Promise<{ data: boolean | null; error: string | null }> {
    return this.deleteVariant(id);
  }

  // Toggle active status
  static async toggleActive(id: string, active: boolean): Promise<{ data: Variant | null; error: string | null }> {
    return this.updateVariant(id, { active });
  }

  // Hard delete (permanent)
  static async hardDelete(id: string): Promise<{ data: boolean | null; error: string | null }> {
    const { error } = await supabase
      .from('variants')
      .delete()
      .eq('id', id);

    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  }
}

export class MenuService {
  // Obtener todas las categorías (alias para compatibilidad)
  static async getCategories(): Promise<Category[]> {
    return CategoryService.getCategories();
  }

  // Obtener todos los platillos (alias para compatibilidad)
  static async getDishes(): Promise<Dish[]> {
    return DishService.getDishes();
  }

  // Obtener menú completo con categorías, platillos y variantes
  static async getFullMenu(): Promise<{ categories: Category[], dishes: Dish[], variants: Variant[] }> {
    const [categories, dishes, variants] = await Promise.all([
      CategoryService.getCategories(),
      DishService.getDishes(),
      supabase.from('variants').select('*').eq('active', true)
    ]);

    if (variants.error) throw variants.error;

    return {
      categories,
      dishes,
      variants: variants.data || []
    };
  }
}