import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  inventory_item_id: string;
  quantity_required: number;
  unit: string;
  inventory_item?: {
    id: string;
    name: string;
    unit: string;
  };
}

export interface Recipe {
  id: string;
  dish_id: string;
  variant_id?: string;
  inventory_item_id: string;
  batch_id?: string;
  quantity: number;
  unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  inventory_item?: {
    id: string;
    name: string;
    unit: string;
    current_stock: number;
    min_stock: number;
    active: boolean;
  };
}

export interface Batch {
  id: string;
  quantity: number;
  expiry_date: string;
  active: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  active: boolean;
  batches?: Batch[];
}

export interface DishAvailability {
  dishId: string;
  available: boolean;
  availableQuantity: number;
  status: 'available' | 'low_stock' | 'no_stock' | 'no_recipe';
  missingIngredients?: string[];
}

export const AvailabilityService = {
  // Obtener todas las recetas activas
  async getActiveRecipes(): Promise<{ data: Recipe[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          inventory_item:inventory_items(*)
        `)
        .eq('active', true)
        .order('dish_id', { ascending: true });

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo recetas:', error);
      return { data: null, error };
    }
  },

  // Obtener inventario actual con lotes
  async getCurrentInventory(): Promise<{ data: InventoryItem[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          batches:batches(
            id,
            quantity,
            expiry_date,
            active
          )
        `)
        .eq('active', true)
        .order('name', { ascending: true });

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo inventario:', error);
      return { data: null, error };
    }
  },

  // Calcular disponibilidad de un platillo específico
  async calculateDishAvailability(dishId: string): Promise<DishAvailability> {
    try {
      // Obtener receta del platillo
      const { data: recipes, error: recipesError } = await this.getActiveRecipes();
      
      if (recipesError || !recipes) {
        return {
          dishId,
          available: false,
          availableQuantity: 0,
          status: 'no_recipe',
          missingIngredients: ['Error al obtener recetas']
        };
      }

      const recipe = recipes.find(r => r.dish_id === dishId);
      
      if (!recipe) {
        return {
          dishId,
          available: false,
          availableQuantity: 0,
          status: 'no_recipe',
          missingIngredients: ['No hay receta disponible']
        };
      }

      // Obtener inventario actual
      const { data: inventory, error: inventoryError } = await this.getCurrentInventory();
      
      if (inventoryError || !inventory) {
        return {
          dishId,
          available: false,
          availableQuantity: 0,
          status: 'no_recipe',
          missingIngredients: ['Error al obtener inventario']
        };
      }

      // Calcular disponibilidad basada en ingredientes
      let maxServings = Infinity;
      const missingIngredients: string[] = [];

      for (const ingredient of recipe.ingredients || []) {
        const inventoryItem = inventory.find(item => item.id === ingredient.inventory_item_id);
        
        if (!inventoryItem) {
          missingIngredients.push(ingredient.inventory_item?.name || 'Ingrediente desconocido');
          maxServings = 0;
          continue;
        }

        if (inventoryItem.current_stock < ingredient.quantity_required) {
          missingIngredients.push(inventoryItem.name);
          maxServings = 0;
          continue;
        }

        // Calcular cuántas porciones se pueden hacer con este ingrediente
        const servingsFromThisIngredient = Math.floor(
          inventoryItem.current_stock / ingredient.quantity_required
        );
        
        maxServings = Math.min(maxServings, servingsFromThisIngredient);
      }

      // Determinar estado
      let status: 'available' | 'low_stock' | 'no_stock' | 'no_recipe';
      
      if (maxServings === 0) {
        status = 'no_stock';
      } else if (maxServings <= 3) {
        status = 'low_stock';
      } else {
        status = 'available';
      }

      return {
        dishId,
        available: maxServings > 0,
        availableQuantity: maxServings,
        status,
        missingIngredients: missingIngredients.length > 0 ? missingIngredients : undefined
      };

    } catch (error) {
      console.error('Error calculando disponibilidad:', error);
      return {
        dishId,
        available: false,
        availableQuantity: 0,
        status: 'no_recipe',
        missingIngredients: ['Error en el cálculo']
      };
    }
  },

  // Calcular disponibilidad de todos los platillos (OPTIMIZADO)
  async calculateAllDishesAvailability(dishIds: string[]): Promise<DishAvailability[]> {
    try {
      // Obtener todas las recetas de una vez
      const { data: recipes, error: recipesError } = await this.getActiveRecipes();
      if (recipesError || !recipes) {
        return dishIds.map(dishId => ({
          dishId,
          available: false,
          availableQuantity: 0,
          status: 'no_recipe' as const,
          missingIngredients: ['Error obteniendo recetas']
        }));
      }

      // Obtener inventario actual de una vez
      const { data: inventory, error: inventoryError } = await this.getCurrentInventory();
      if (inventoryError || !inventory) {
        return dishIds.map(dishId => ({
          dishId,
          available: false,
          availableQuantity: 0,
          status: 'no_recipe' as const,
          missingIngredients: ['Error obteniendo inventario']
        }));
      }

      // Calcular disponibilidad para todos los platillos
      const results: DishAvailability[] = [];
      
      for (const dishId of dishIds) {
        const dishRecipes = recipes.filter(r => r.dish_id === dishId);
        
        if (!dishRecipes || dishRecipes.length === 0) {
          results.push({
            dishId,
            available: false,
            availableQuantity: 0,
            status: 'no_recipe',
            missingIngredients: ['Sin receta asignada']
          });
          continue;
        }

        // Calcular disponibilidad para cada receta del platillo
        let maxAvailableQuantity = 0;
        let hasAvailableRecipe = false;
        let finalStatus = 'no_recipe';
        let missingIngredients: string[] = [];

        for (const recipe of dishRecipes) {
          const availability = this.calculateAvailabilityFromData(recipe, inventory);
          if (availability.available) {
            hasAvailableRecipe = true;
            maxAvailableQuantity = Math.max(maxAvailableQuantity, availability.availableQuantity);
            finalStatus = availability.status;
          } else {
            missingIngredients.push(...(availability.missingIngredients || []));
          }
        }

        results.push({
          dishId,
          available: hasAvailableRecipe,
          availableQuantity: maxAvailableQuantity,
          status: hasAvailableRecipe ? finalStatus as any : 'no_recipe',
          missingIngredients: hasAvailableRecipe ? [] : missingIngredients
        });
      }

      return results;
    } catch (error) {
      console.error('Error calculando disponibilidad de todos los platillos:', error);
      return dishIds.map(dishId => ({
        dishId,
        available: false,
        availableQuantity: 0,
        status: 'no_recipe' as const,
        missingIngredients: ['Error en el cálculo']
      }));
    }
  },

  // Calcular disponibilidad usando datos ya cargados (más rápido)
  calculateAvailabilityFromData(recipe: Recipe, inventory: InventoryItem[]): DishAvailability {
    try {
      if (!recipe.inventory_item) {
        return {
          dishId: recipe.dish_id,
          available: false,
          availableQuantity: 0,
          status: 'no_recipe',
          missingIngredients: ['Receta sin item de inventario']
        };
      }

      const inventoryItem = inventory.find(item => item.id === recipe.inventory_item_id);
      
      if (!inventoryItem || !inventoryItem.active) {
        return {
          dishId: recipe.dish_id,
          available: false,
          availableQuantity: 0,
          status: 'no_stock',
          missingIngredients: [recipe.inventory_item?.name || 'Ingrediente desconocido']
        };
      }

      // Calcular cantidad disponible en lotes
      const availableInBatches = inventoryItem.batches
        ?.filter(batch => batch.active && batch.quantity > 0 && new Date(batch.expiry_date) > new Date())
        ?.reduce((total, batch) => total + batch.quantity, 0) || 0;

      if (availableInBatches < recipe.quantity) {
        return {
          dishId: recipe.dish_id,
          available: false,
          availableQuantity: 0,
          status: 'no_stock',
          missingIngredients: [inventoryItem.name || 'Ingrediente insuficiente']
        };
      }

      const possibleQuantity = Math.floor(availableInBatches / recipe.quantity);
      const minAvailableQuantity = possibleQuantity;

      if (minAvailableQuantity === 0) {
        return {
          dishId: recipe.dish_id,
          available: false,
          availableQuantity: 0,
          status: 'no_stock',
          missingIngredients: ['Sin stock suficiente']
        };
      }

      if (minAvailableQuantity <= 5) {
        return {
          dishId: recipe.dish_id,
          available: true,
          availableQuantity: minAvailableQuantity,
          status: 'low_stock',
          missingIngredients: []
        };
      }

      return {
        dishId: recipe.dish_id,
        available: true,
        availableQuantity: minAvailableQuantity,
        status: 'available',
        missingIngredients: []
      };
    } catch (error) {
      console.error('Error calculando disponibilidad:', error);
      return {
        dishId: recipe.dish_id,
        available: false,
        availableQuantity: 0,
        status: 'no_recipe',
        missingIngredients: ['Error en el cálculo']
      };
    }
  }
};
