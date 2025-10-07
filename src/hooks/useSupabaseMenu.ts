import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Category, Dish, Variant } from '@/lib/services/menuService';

export function useSupabaseMenu() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
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
        .order('order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Cargar platillos
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select('*')
        .order('order', { ascending: true });

      if (dishesError) throw dishesError;

      // Cargar variantes
      const { data: variantsData, error: variantsError } = await supabase
        .from('variants')
        .select('*')
        .order('name');

      if (variantsError) throw variantsError;

      setCategories(categoriesData || []);
      setDishes(dishesData || []);
      setVariants(variantsData || []);
      setIsConnected(true);

    } catch (err) {
      console.error('❌ Error cargando datos del menú:', err);
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
      .channel('menu_categories')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'categories'
      }, () => {
        loadData(); // Recargar datos cuando hay cambios
      })
      .subscribe();

    const dishesChannel = supabase
      .channel('menu_dishes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dishes'
      }, () => {
        loadData(); // Recargar datos cuando hay cambios
      })
      .subscribe();

    const variantsChannel = supabase
      .channel('menu_variants')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'variants'
      }, () => {
        loadData(); // Recargar datos cuando hay cambios
      })
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(dishesChannel);
      supabase.removeChannel(variantsChannel);
    };
  }, []);

  // Combinar platillos con nombres de categoría
  const dishesWithCategoryName = useMemo(() => {
    return dishes.map(dish => ({
      ...dish,
      category_name: categories.find(cat => cat.id === dish.category_id)?.name || 'Sin Categoría'
    }));
  }, [dishes, categories]);

  return {
    categories,
    dishes: dishesWithCategoryName,
    variants,
    loading,
    error,
    isConnected,
    refetch: loadData
  };
}