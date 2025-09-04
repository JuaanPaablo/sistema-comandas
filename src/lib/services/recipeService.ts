import { supabase } from '../supabase/client';
import { Recipe, RecipeFormData, ApiResponse } from '../types';

// ===== SERVICIO DE RECETAS =====
export class RecipeService {
  // Obtener todas las recetas
  static async getAll(): Promise<ApiResponse<Recipe[]>> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener recetas por platillo
  static async getByDish(dishId: string): Promise<ApiResponse<Recipe[]>> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('dish_id', dishId)
        .order('created_at');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener recetas por variante
  static async getByVariant(variantId: string): Promise<ApiResponse<Recipe[]>> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('variant_id', variantId)
        .order('created_at');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener recetas por ingrediente
  static async getByIngredient(ingredientId: string): Promise<ApiResponse<Recipe[]>> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('inventory_item_id', ingredientId)
        .order('created_at');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Obtener receta por ID
  static async getById(id: string): Promise<ApiResponse<Recipe>> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Crear nueva receta
  static async create(recipeData: RecipeFormData): Promise<ApiResponse<Recipe>> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert(recipeData)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Actualizar receta
  static async update(id: string, recipeData: Partial<RecipeFormData>): Promise<ApiResponse<Recipe>> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .update(recipeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Eliminar receta
  static async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Agrupar recetas por platillo
  static async groupByDish(): Promise<ApiResponse<Record<string, Recipe[]>>> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('dish_id')
        .order('created_at');

      if (error) throw error;

      const grouped = data?.reduce((acc, recipe) => {
        const dishId = recipe.dish_id;
        if (!acc[dishId]) {
          acc[dishId] = [];
        }
        acc[dishId].push(recipe);
        return acc;
      }, {} as Record<string, Recipe[]>) || {};

      return { data: grouped, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Agrupar recetas por variante
  static async groupByVariant(): Promise<ApiResponse<Record<string, Recipe[]>>> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .not('variant_id', 'is', null)
        .order('variant_id')
        .order('created_at');

      if (error) throw error;

      const grouped = data?.reduce((acc, recipe) => {
        const variantId = recipe.variant_id;
        if (variantId && !acc[variantId]) {
          acc[variantId] = [];
        }
        if (variantId) {
          acc[variantId].push(recipe);
        }
        return acc;
      }, {} as Record<string, Recipe[]>) || {};

      return { data: grouped, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Calcular costo de receta
  static async calculateRecipeCost(recipeId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (error) throw error;

      // Aquí implementarías la lógica para calcular el costo
      // basado en el precio del ingrediente y la cantidad
      // Por ahora retornamos 0 como placeholder
      return 0;
    } catch (error) {
      return 0;
    }
  }

  // Verificar disponibilidad de ingredientes
  static async checkIngredientsAvailability(recipeId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (error) throw error;

      // Aquí implementarías la lógica para verificar
      // si hay suficiente stock de cada ingrediente
      // Por ahora retornamos true como placeholder
      return true;
    } catch (error) {
      return false;
    }
  }

  // Obtener recetas que usan un ingrediente específico
  static async getRecipesUsingIngredient(ingredientId: string): Promise<ApiResponse<Recipe[]>> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('inventory_item_id', ingredientId)
        .order('created_at');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Duplicar receta
  static async duplicate(recipeId: string, newDishId?: string, newVariantId?: string): Promise<ApiResponse<Recipe>> {
    try {
      const { data: originalRecipe, error: fetchError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (fetchError) throw fetchError;

      const newRecipeData: RecipeFormData = {
        dish_id: newDishId || originalRecipe.dish_id,
        variant_id: newVariantId || originalRecipe.variant_id,
        inventory_item_id: originalRecipe.inventory_item_id,
        quantity: originalRecipe.quantity
      };

      return this.create(newRecipeData);
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
}
