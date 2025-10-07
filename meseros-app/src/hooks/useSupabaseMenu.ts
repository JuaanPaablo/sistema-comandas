import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/menuService';
import { Category, DishWithVariants, Variant } from '../services/menuService';

export function useSupabaseMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<DishWithVariants[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Cargar datos iniciales
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar categorías
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('name');

      if (categoriesError) throw categoriesError;

      // Cargar platillos con categorías
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('active', true)
        .order('name');

      if (dishesError) throw dishesError;

      // Obtener variantes para cada platillo
      const dishesWithVariants = await Promise.all(
        (dishesData || []).map(async (dish) => {
          const { data: variants, error: variantsError } = await supabase
            .from('variants')
            .select('*')
            .eq('dish_id', dish.id)
            .eq('active', true)
            .order('name');

          if (variantsError) {
            console.warn(`[Meseros] Error obteniendo variantes para ${dish.name}:`, variantsError);
            return { ...dish, variants: [] };
          }

          return {
            ...dish,
            variants: variants || []
          };
        })
      );

      // Cargar todas las variantes para el estado global
      const { data: allVariants, error: allVariantsError } = await supabase
        .from('variants')
        .select('*')
        .eq('active', true)
        .order('name');

      if (allVariantsError) {
        console.error('[Meseros] Error cargando todas las variantes:', allVariantsError);
        throw allVariantsError;
      }

      setCategories(categoriesData || []);
      setDishes(dishesWithVariants);
      setVariants(allVariants || []);
      setIsConnected(true);

    } catch (err) {
      console.error('[Meseros] Error cargando datos del menú:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Configurar suscripciones Real-time
    
    const categoriesChannel = supabase
      .channel('meseros_categories')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'categories'
      }, (payload) => {
        loadData(); // Recargar datos cuando hay cambios
      })
      .subscribe((status, err) => {
      });

    const dishesChannel = supabase
      .channel('meseros_dishes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dishes'
      }, (payload) => {
        loadData(); // Recargar datos cuando hay cambios
      })
      .subscribe((status, err) => {
      });

    const variantsChannel = supabase
      .channel('meseros_variants')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'variants'
      }, (payload) => {
        loadData(); // Recargar datos cuando hay cambios
      })
      .subscribe((status, err) => {
      });

    // Cleanup
    return () => {
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(dishesChannel);
      supabase.removeChannel(variantsChannel);
    };
  }, []);

  return {
    categories,
    dishes,
    variants,
    loading,
    error,
    isConnected,
    refetch: loadData
  };
}