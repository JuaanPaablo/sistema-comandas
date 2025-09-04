import { supabase } from '../supabase/client';
import { Category, Dish, Variant, CategoryFormData, DishFormData, VariantFormData, ApiResponse } from '../types';

// ===== SERVICIO DE CATEGORÍAS =====
export class CategoryService {
  // Obtener todas las categorías activas
  static async getAll(): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener todas las categorías (incluyendo inactivas)
  static async getAllWithInactive(): Promise<ApiResponse<Category[]>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener categoría por ID
  static async getById(id: string): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Crear nueva categoría
  static async create(categoryData: CategoryFormData): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Actualizar categoría
  static async update(id: string, categoryData: Partial<CategoryFormData>): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Eliminar categoría (soft delete)
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Eliminar categoría permanentemente (hard delete)
  static async hardDelete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Activar/desactivar categoría
  static async toggleActive(id: string, active: boolean): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({ active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Verificar si la categoría tiene platillos
  static async hasDishes(id: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('dishes')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id)
        .eq('active', true);

      if (error) throw error;
      return (count || 0) > 0;
    } catch (error) {
      return false;
    }
  }
}

// ===== SERVICIO DE PLATILLOS =====
export class DishService {
  // Obtener todos los platillos activos
  static async getAll(): Promise<ApiResponse<Dish[]>> {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener todos los platillos (incluyendo inactivos)
  static async getAllWithInactive(): Promise<ApiResponse<Dish[]>> {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener platillos por categoría
  static async getByCategory(categoryId: string): Promise<ApiResponse<Dish[]>> {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('category_id', categoryId)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener platillo por ID
  static async getById(id: string): Promise<ApiResponse<Dish>> {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Crear nuevo platillo
  static async create(dishData: DishFormData): Promise<ApiResponse<Dish>> {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .insert(dishData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Actualizar platillo
  static async update(id: string, dishData: Partial<DishFormData>): Promise<ApiResponse<Dish>> {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .update(dishData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Eliminar platillo (soft delete)
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('dishes')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Eliminar platillo permanentemente (hard delete)
  static async hardDelete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Activar/desactivar platillo
  static async toggleActive(id: string, active: boolean): Promise<ApiResponse<Dish>> {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .update({ active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Buscar platillos por nombre
  static async searchByName(searchTerm: string): Promise<ApiResponse<Dish[]>> {
    try {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Verificar si el platillo tiene variantes
  static async hasVariants(id: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('variants')
        .select('*', { count: 'exact', head: true })
        .eq('dish_id', id)
        .eq('active', true);

      if (error) throw error;
      return (count || 0) > 0;
    } catch (error) {
      return false;
    }
  }
}

// ===== SERVICIO DE VARIANTES =====
export class VariantService {
  // Obtener todas las variantes activas
  static async getAll(): Promise<ApiResponse<Variant[]>> {
    try {
      const { data, error } = await supabase
        .from('variants')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener todas las variantes (incluyendo inactivas)
  static async getAllWithInactive(): Promise<ApiResponse<Variant[]>> {
    try {
      const { data, error } = await supabase
        .from('variants')
        .select('*')
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener variantes por platillo
  static async getByDish(dishId: string): Promise<ApiResponse<Variant[]>> {
    try {
      const { data, error } = await supabase
        .from('variants')
        .select('*')
        .eq('dish_id', dishId)
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener variante por ID
  static async getById(id: string): Promise<ApiResponse<Variant>> {
    try {
      const { data, error } = await supabase
        .from('variants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Crear nueva variante
  static async create(variantData: VariantFormData): Promise<ApiResponse<Variant>> {
    try {
      const { data, error } = await supabase
        .from('variants')
        .insert(variantData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Actualizar variante
  static async update(id: string, variantData: Partial<VariantFormData>): Promise<ApiResponse<Variant>> {
    try {
      const { data, error } = await supabase
        .from('variants')
        .update(variantData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Eliminar variante (soft delete)
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('variants')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Eliminar variante permanentemente (hard delete)
  static async hardDelete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('variants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Activar/desactivar variante
  static async toggleActive(id: string, active: boolean): Promise<ApiResponse<Variant>> {
    try {
      const { data, error } = await supabase
        .from('variants')
        .update({ active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Calcular precio final de la variante
  static calculateFinalPrice(dishPrice: number, priceAdjustment: number): number {
    return dishPrice + priceAdjustment;
  }
}
