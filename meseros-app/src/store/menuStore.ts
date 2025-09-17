import { create } from 'zustand';
import { supabase, MenuItem } from '../services/supabase';

interface MenuState {
  menuItems: MenuItem[];
  categories: { id: string; name: string }[];
  isLoading: boolean;
  loadMenu: () => Promise<void>;
  getItemsByCategory: (categoryId: string) => MenuItem[];
}

export const useMenuStore = create<MenuState>((set, get) => ({
  menuItems: [],
  categories: [],
  isLoading: false,

  loadMenu: async () => {
    set({ isLoading: true });
    
    try {
      // Cargar categorías
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (categoriesError) {
        console.error('Error cargando categorías:', categoriesError);
        set({ isLoading: false });
        return;
      }

      // Cargar platillos con información de categoría
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select(`
          id,
          name,
          description,
          price,
          category_id,
          active,
          image_url,
          categories!inner(name)
        `)
        .eq('active', true)
        .order('name');

      if (dishesError) {
        console.error('Error cargando platillos:', dishesError);
        set({ isLoading: false });
        return;
      }

      // Transformar datos
      const menuItems: MenuItem[] = dishesData.map((dish: any) => ({
        id: dish.id,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        category_id: dish.category_id,
        category_name: dish.categories.name,
        available: dish.active,
        image_url: dish.image_url,
      }));

      set({
        menuItems,
        categories: categoriesData || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error cargando menú:', error);
      set({ isLoading: false });
    }
  },

  getItemsByCategory: (categoryId: string) => {
    const { menuItems } = get();
    return menuItems.filter(item => item.category_id === categoryId);
  },
}));
