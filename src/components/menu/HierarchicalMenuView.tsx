'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Edit, Trash2, ChefHat, Utensils, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { CategoryForm } from './CategoryForm';
import { DishForm } from './DishForm';
import { VariantForm } from './VariantForm';
import { DynamicVariantsForm } from './DynamicVariantsForm';

import { CategoryService, DishService, VariantService } from '@/lib/services/menuService';
import { Category, Dish, Variant, CategoryFormData, DishFormData, VariantFormData } from '@/lib/types';

interface HierarchicalMenuViewProps {
  onRefresh?: () => void;
}

export function HierarchicalMenuView({ onRefresh }: HierarchicalMenuViewProps) {
  // Estados para datos
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  
  // Estados para UI
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedDishes, setExpandedDishes] = useState<Set<string>>(new Set());
  
  // Estados para búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estados para modales
  const [modalType, setModalType] = useState<'category' | 'dish' | 'variant' | 'multiple-variants' | null>(null);
  const [editingItem, setEditingItem] = useState<Category | Dish | Variant | null>(null);
  const [modalContext, setModalContext] = useState<{
    categoryId?: string;
    dishId?: string;
    isNew?: boolean;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
             const [categoriesRes, dishesRes, variantsRes] = await Promise.all([
         CategoryService.getAllWithInactive(),
         DishService.getAllWithInactive(),
         VariantService.getAllWithInactive()
       ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (dishesRes.data) setDishes(dishesRes.data);
      if (variantsRes.data) setVariants(variantsRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Funciones para expandir/colapsar
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleDish = (dishId: string) => {
    const newExpanded = new Set(expandedDishes);
    if (newExpanded.has(dishId)) {
      newExpanded.delete(dishId);
    } else {
      newExpanded.add(dishId);
    }
    setExpandedDishes(newExpanded);
  };

  // Funciones para abrir modales
  const openModal = (type: 'category' | 'dish' | 'variant' | 'multiple-variants', item?: Category | Dish | Variant, context?: {
    categoryId?: string;
    dishId?: string;
    isNew?: boolean;
  }) => {
    setModalType(type);
    setEditingItem(item || null);
    setModalContext(context || {});
  };

  const closeModal = () => {
    setModalType(null);
    setEditingItem(null);
    setModalContext({});
    setIsSubmitting(false);
  };

  // Funciones para manejar formularios
  const handleCategorySubmit = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      let response;

      if (editingItem && 'name' in editingItem) {
        response = await CategoryService.update(editingItem.id, data);
      } else {
        response = await CategoryService.create(data);
      }

      if (response.data) {
        await loadAllData();
        closeModal();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error guardando categoría:', error);
      console.error('editingItem:', editingItem);
      alert('Error al guardar la categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDishSubmit = async (data: DishFormData) => {
    try {
      setIsSubmitting(true);
      let response;

      if (editingItem && 'price' in editingItem) {
        response = await DishService.update(editingItem.id, data);
      } else {
        response = await DishService.create(data);
      }

      if (response.data) {
        await loadAllData();
        closeModal();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error guardando platillo:', error);
      alert('Error al guardar el platillo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVariantSubmit = async (data: VariantFormData) => {
    try {
      setIsSubmitting(true);
      let response;

      if (editingItem && 'dish_id' in editingItem) {
        response = await VariantService.update(editingItem.id, data);
      } else {
        response = await VariantService.create(data);
      }

      if (response.data) {
        await loadAllData();
        closeModal();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error guardando variante:', error);
      alert('Error al guardar la variante');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDynamicVariantsSubmit = async (variants: { name: string; priceAdjustment: number }[], selectionText: string, maxSelections: number) => {
    try {
      setIsSubmitting(true);
      
      // Crear múltiples variantes con la nueva estructura
      const promises = variants.map(variant => 
        VariantService.create({
          name: variant.name,
          dish_id: modalContext.dishId!,
          selection_text: selectionText,
          max_selections: maxSelections,
          price_adjustment: variant.priceAdjustment,
          active: true
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.data).length;

      if (successCount > 0) {
        await loadAllData();
        closeModal();
        onRefresh?.();
        alert(`Se crearon ${successCount} variantes exitosamente`);
      }
    } catch (error) {
      console.error('Error creando variantes:', error);
      alert('Error al crear las variantes');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funciones para eliminar
  const handleDeleteCategory = async (category: Category) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?\n\nEsta acción la pondrá como "Inactiva" y podrás recuperarla después.`)) {
      try {
        const response = await CategoryService.delete(category.id);
        if (response.data) {
          await loadAllData();
          onRefresh?.();
        }
      } catch (error) {
        console.error('Error eliminando categoría:', error);
        alert('Error al eliminar la categoría');
      }
    }
  };

  const handleHardDeleteCategory = async (category: Category) => {
    if (window.confirm(`⚠️ ADVERTENCIA: Esta acción NO se puede deshacer.\n\n¿Estás SEGURO de que quieres eliminar PERMANENTEMENTE la categoría "${category.name}"?\n\nEsta acción eliminará la categoría y todos sus platillos asociados de la base de datos.`)) {
      try {
        const response = await CategoryService.hardDelete(category.id);
        if (response.data) {
          await loadAllData();
          onRefresh?.();
        }
      } catch (error) {
        console.error('Error eliminando permanentemente la categoría:', error);
        alert('Error al eliminar permanentemente la categoría');
      }
    }
  };

  const handleDeleteDish = async (dish: Dish) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el platillo "${dish.name}"?\n\nEsta acción lo pondrá como "Inactivo" y podrás recuperarlo después.`)) {
      try {
        const response = await DishService.delete(dish.id);
        if (response.data) {
          await loadAllData();
          onRefresh?.();
        }
      } catch (error) {
        console.error('Error eliminando platillo:', error);
        alert('Error al eliminar el platillo');
      }
    }
  };

  const handleHardDeleteDish = async (dish: Dish) => {
    if (window.confirm(`⚠️ ADVERTENCIA: Esta acción NO se puede deshacer.\n\n¿Estás SEGURO de que quieres eliminar PERMANENTEMENTE el platillo "${dish.name}"?\n\nEsta acción eliminará el platillo y todas sus variantes asociadas de la base de datos.`)) {
      try {
        const response = await DishService.hardDelete(dish.id);
        if (response.data) {
          await loadAllData();
          onRefresh?.();
        }
      } catch (error) {
        console.error('Error eliminando permanentemente el platillo:', error);
        alert('Error al eliminar permanentemente el platillo');
      }
    }
  };

  const handleDeleteVariant = async (variant: Variant) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la variante "${variant.name}"?\n\nEsta acción la pondrá como "Inactiva" y podrás recuperarla después.`)) {
      try {
        const response = await VariantService.delete(variant.id);
        if (response.data) {
          await loadAllData();
          onRefresh?.();
        }
      } catch (error) {
        console.error('Error eliminando variante:', error);
        alert('Error al eliminar la variante');
      }
    }
  };

  const handleHardDeleteVariant = async (variant: Variant) => {
    if (window.confirm(`⚠️ ADVERTENCIA: Esta acción NO se puede deshacer.\n\n¿Estás SEGURO de que quieres eliminar PERMANENTEMENTE la variante "${variant.name}"?\n\nEsta acción eliminará la variante de la base de datos.`)) {
      try {
        const response = await VariantService.hardDelete(variant.id);
        if (response.data) {
          await loadAllData();
          onRefresh?.();
        }
      } catch (error) {
        console.error('Error eliminando permanentemente la variante:', error);
        alert('Error al eliminar permanentemente la variante');
      }
    }
  };

  // Funciones para toggle active
  const handleToggleCategoryActive = async (category: Category) => {
    try {
      const response = await CategoryService.toggleActive(category.id, !category.active);
      if (response.data) {
        await loadAllData();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado de la categoría');
    }
  };

  const handleToggleDishActive = async (dish: Dish) => {
    try {
      const response = await DishService.toggleActive(dish.id, !dish.active);
      if (response.data) {
        await loadAllData();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado del platillo');
    }
  };

  const handleToggleVariantActive = async (variant: Variant) => {
    try {
      const response = await VariantService.toggleActive(variant.id, !variant.active);
      if (response.data) {
        await loadAllData();
        onRefresh?.();
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado de la variante');
    }
  };

  // Funciones helper
  const getDishesByCategory = (categoryId: string) => {
    return dishes.filter(dish => dish.category_id === categoryId);
  };

  const getVariantsByDish = (dishId: string) => {
    return variants.filter(variant => variant.dish_id === dishId);
  };

  // Funciones de búsqueda y filtrado
  const filterCategoriesBySearch = (categories: Category[]) => {
    if (!searchTerm.trim()) return categories;
    
    const searchLower = searchTerm.toLowerCase();
    return categories.filter(category => {
      // Buscar en nombre de categoría
      if (category.name.toLowerCase().includes(searchLower)) return true;
      
      // Buscar en platillos de la categoría
      const categoryDishes = getDishesByCategory(category.id);
      const hasMatchingDish = categoryDishes.some(dish => 
        dish.name.toLowerCase().includes(searchLower)
      );
      
      // Buscar en variantes de los platillos
      const hasMatchingVariant = categoryDishes.some(dish => {
        const dishVariants = getVariantsByDish(dish.id);
        return dishVariants.some(variant => 
          variant.name.toLowerCase().includes(searchLower)
        );
      });
      
      return hasMatchingDish || hasMatchingVariant;
    });
  };

  const getPaginatedCategories = (categories: Category[]) => {
    const filteredCategories = filterCategoriesBySearch(categories);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      paginatedCategories: filteredCategories.slice(startIndex, endIndex),
      totalCategories: filteredCategories.length,
      totalPages: Math.ceil(filteredCategories.length / itemsPerPage)
    };
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Resetear a la primera página al buscar
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll al top de la lista
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
             {/* Header con botones de acción */}
       <div className="flex justify-between items-center">
         <div>
           <h2 className="text-xl font-semibold text-gray-900">Vista Jerárquica del Menú</h2>
           <p className="text-gray-900">Organiza tu menú de forma jerárquica: Categorías → Platillos → Variantes</p>
         </div>
         <div className="flex space-x-3">
           <Button onClick={() => openModal('category', undefined, { isNew: true })} className="flex items-center space-x-2">
             <Plus className="w-4 h-4" />
             <span>Nueva Categoría</span>
           </Button>
         </div>
       </div>

       {/* Barra de búsqueda */}
       <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
           </svg>
         </div>
         <input
           type="text"
           placeholder="Buscar categorías, platillos o variantes..."
           value={searchTerm}
           onChange={(e) => handleSearch(e.target.value)}
           className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
         />
         {searchTerm && (
           <button
             onClick={() => handleSearch('')}
             className="absolute inset-y-0 right-0 pr-3 flex items-center"
           >
             <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
         )}
       </div>

       {/* Vista jerárquica */}
       <div className="space-y-4">
         {(() => {
           const { paginatedCategories, totalCategories, totalPages } = getPaginatedCategories(categories);
           
           if (categories.length === 0) {
             return (
               <Card className="p-12 text-center">
                 <div className="text-gray-400 mb-4">
                   <ChefHat className="w-16 h-16 mx-auto" />
                 </div>
                 <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
                 <p className="text-gray-500 mb-4">Comienza creando tu primera categoría para organizar tu menú</p>
                 <Button onClick={() => openModal('category', undefined, { isNew: true })}>
                   Crear Primera Categoría
                 </Button>
               </Card>
             );
           }

           if (searchTerm && paginatedCategories.length === 0) {
             return (
               <Card className="p-12 text-center">
                 <div className="text-gray-400 mb-4">
                   <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                 </div>
                 <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron resultados</h3>
                 <p className="text-gray-500 mb-4">Intenta con otros términos de búsqueda</p>
                 <Button onClick={() => handleSearch('')} variant="outline">
                   Limpiar búsqueda
                 </Button>
               </Card>
             );
           }

           return (
             <>
               {/* Información de resultados */}
               {(searchTerm || totalPages > 1) && (
                 <div className="flex items-center justify-between text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                   <div>
                     {searchTerm ? (
                       <span>Mostrando {paginatedCategories.length} de {totalCategories} resultados para "{searchTerm}"</span>
                     ) : (
                       <span>Mostrando {paginatedCategories.length} de {totalCategories} categorías</span>
                     )}
                   </div>
                   {totalPages > 1 && (
                     <span>Página {currentPage} de {totalPages}</span>
                   )}
                 </div>
               )}

                              {/* Lista de categorías */}
               {paginatedCategories.map((category) => {
                 const categoryDishes = getDishesByCategory(category.id);
                 const isCategoryExpanded = expandedCategories.has(category.id);

            return (
              <Card key={category.id} className="overflow-hidden">
                {/* Header de categoría */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {isCategoryExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-900" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-900" />
                        )}
                      </button>
                      <div className="flex items-center space-x-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-900">{category.name}</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          category.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {category.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                                             <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => openModal('dish', undefined, { categoryId: category.id, isNew: true })}
                         className="text-blue-600 hover:text-blue-900"
                         title="Agregar platillo a esta categoría"
                       >
                        <Plus className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal('category', category)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                                             {category.active ? (
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleDeleteCategory(category)}
                           className="text-red-600 hover:text-red-900"
                           title="Eliminar (Pone como Inactiva)"
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       ) : (
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleHardDeleteCategory(category)}
                           className="text-red-800 hover:text-red-950 bg-red-50"
                           title="Eliminar Permanentemente"
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       )}
                    </div>
                  </div>
                </div>

                                 {/* Contenido expandible de platillos */}
                 {isCategoryExpanded && (
                   <div className="p-4 space-y-4">
                     {/* Sección de Platillos Activos */}
                     <div className="space-y-3">
                       <div className="flex items-center justify-between">
                         <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                           <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                           <span>ELEMENTOS ACTIVOS</span>
                           <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                             {categoryDishes.filter(dish => dish.active).length}
                           </span>
                         </h4>
                       </div>
                       
                       {(() => {
                         const activeDishes = categoryDishes.filter(dish => dish.active);
                         if (activeDishes.length === 0) {
                           return (
                             <div className="text-center py-4 text-gray-500">
                               <ChefHat className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                               <p className="text-sm">No hay platillos activos en esta categoría</p>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => openModal('dish', undefined, { categoryId: category.id, isNew: true })}
                                 className="mt-2"
                               >
                                 Agregar Primer Platillo
                               </Button>
                             </div>
                           );
                         }
                         
                         return activeDishes.map((dish) => {
                           const dishVariants = getVariantsByDish(dish.id);
                           const isDishExpanded = expandedDishes.has(dish.id);

                           return (
                             <div key={dish.id} className="border border-gray-200 rounded-lg">
                               {/* Header de platillo */}
                               <div className="p-3 bg-white border-b border-gray-200">
                                 <div className="flex items-center justify-between">
                                   <div className="flex items-center space-x-3">
                                     <button
                                       onClick={() => toggleDish(dish.id)}
                                       className="p-1 hover:bg-gray-100 rounded"
                                     >
                                       {isDishExpanded ? (
                                         <ChevronDown className="w-4 h-4 text-gray-500" />
                                       ) : (
                                         <ChevronRight className="w-4 h-4 text-gray-500" />
                                       )}
                                     </button>
                                     <div className="flex items-center space-x-2">
                                       <ChefHat className="w-4 h-4 text-green-600" />
                                       <span className="font-medium text-gray-800">{dish.name}</span>
                                       <span className="text-sm text-gray-900">${dish.price}</span>
                                       <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                         Activo
                                       </span>
                                     </div>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => openModal('multiple-variants', dish, { dishId: dish.id, isNew: true })}
                                       className="text-green-600 hover:text-green-900"
                                       title="Agregar variantes para este platillo"
                                     >
                                       <Plus className="w-4 h-4" />
                                     </Button>
                                     
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => openModal('dish', dish)}
                                       className="text-blue-600 hover:text-blue-900"
                                       title="Editar"
                                     >
                                       <Edit className="w-4 h-4" />
                                     </Button>
                                     
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => handleDeleteDish(dish)}
                                       className="text-red-600 hover:text-red-900"
                                       title="Eliminar (Pone como Inactivo)"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </Button>
                                   </div>
                                 </div>
                               </div>

                               {/* Contenido expandible de variantes */}
                               {isDishExpanded && (
                                 <div className="p-3 bg-gray-50 space-y-2">
                                   {dishVariants.length === 0 ? (
                                     <div className="text-center py-3 text-gray-500">
                                       <Utensils className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                                       <p className="text-sm">No hay variantes para este platillo</p>
                                       <Button
                                         variant="outline"
                                         size="sm"
                                         onClick={() => openModal('multiple-variants', dish, { dishId: dish.id, isNew: true })}
                                         className="mt-1"
                                       >
                                         Agregar Variantes
                                       </Button>
                                     </div>
                                   ) : (
                                     <>
                                       <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                         <p className="text-sm font-medium text-blue-800">
                                           {dishVariants[0]?.selection_text || 'Escoja una variante'}
                                         </p>
                                         <p className="text-xs text-blue-600">
                                           Selecciona {dishVariants[0]?.max_selections || 1} de {dishVariants.length} variante{dishVariants.length !== 1 ? 's' : ''} disponible{dishVariants.length !== 1 ? 's' : ''}
                                         </p>
                                       </div>
                                       
                                                                               {/* Sección de Variantes Activas */}
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <h5 className="text-xs font-medium text-gray-900 flex items-center space-x-2">
                                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                              <span>VARIANTES ACTIVAS</span>
                                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {dishVariants.filter(v => v.active).length}
                                              </span>
                                            </h5>
                                          </div>
                                          
                                          {dishVariants.filter(v => v.active).map((variant) => (
                                            <div key={variant.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                              <div className="flex items-center space-x-2">
                                                <Utensils className="w-4 h-4 text-purple-600" />
                                                <span className="font-medium text-gray-700">{variant.name}</span>
                                                <span className="text-sm text-gray-500">
                                                  ${(dishes.find(dish => dish.id === variant.dish_id)?.price || 0) + (variant.price_adjustment || 0)}
                                                  {variant.price_adjustment && variant.price_adjustment !== 0 && (
                                                    <span className={`text-xs ${variant.price_adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                      {variant.price_adjustment > 0 ? ` (+${variant.price_adjustment})` : ` (${variant.price_adjustment})`}
                                                    </span>
                                                  )}
                                                </span>
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                  Activa
                                                </span>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => openModal('variant', variant, { dishId: variant.dish_id })}
                                                  className="text-blue-600 hover:text-blue-900"
                                                  title="Editar"
                                                >
                                                  <Edit className="w-4 h-4" />
                                                </Button>
                                                
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleDeleteVariant(variant)}
                                                  className="text-red-600 hover:text-red-900"
                                                  title="Eliminar (Pone como Inactiva)"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        {/* Sección de Variantes Inactivas */}
                                        {(() => {
                                          const inactiveVariants = dishVariants.filter(v => !v.active);
                                          if (inactiveVariants.length === 0) return null;
                                          
                                          return (
                                            <div className="space-y-2 pt-3 border-t border-gray-200">
                                              <div className="flex items-center justify-between">
                                                <h5 className="text-xs font-medium text-gray-900 flex items-center space-x-2">
                                                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                  <span>VARIANTES INACTIVAS</span>
                                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    {inactiveVariants.length}
                                                  </span>
                                                </h5>
                                              </div>
                                              
                                              {inactiveVariants.map((variant) => (
                                                <div key={variant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                                                  <div className="flex items-center space-x-2">
                                                    <Utensils className="w-4 h-4 text-gray-500" />
                                                    <span className="font-medium text-gray-900">{variant.name}</span>
                                                    <span className="text-sm text-gray-500">
                                                      ${(dishes.find(dish => dish.id === variant.dish_id)?.price || 0) + (variant.price_adjustment || 0)}
                                                      {variant.price_adjustment && variant.price_adjustment !== 0 && (
                                                        <span className={`text-xs ${variant.price_adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                          {variant.price_adjustment > 0 ? ` (+${variant.price_adjustment})` : ` (${variant.price_adjustment})`}
                                                        </span>
                                                      )}
                                                    </span>
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                      Inactiva
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center space-x-2">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => openModal('variant', variant, { dishId: variant.dish_id })}
                                                      className="text-blue-600 hover:text-blue-900"
                                                      title="Editar"
                                                    >
                                                      <Edit className="w-4 h-4" />
                                                    </Button>
                                                    
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => handleHardDeleteVariant(variant)}
                                                      className="text-red-800 hover:text-red-950 bg-red-50"
                                                      title="Eliminar Permanentemente"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          );
                                        })()}
                                     </>
                                   )}
                                 </div>
                               )}
                             </div>
                           );
                         });
                       })()}
                     </div>

                     {/* Sección de Platillos Inactivos */}
                     {(() => {
                       const inactiveDishes = categoryDishes.filter(dish => !dish.active);
                       if (inactiveDishes.length === 0) return null;
                       
                       return (
                         <div className="space-y-3 pt-4 border-t border-gray-200">
                           <div className="flex items-center justify-between">
                             <h4 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                               <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                               <span>ELEMENTOS INACTIVOS</span>
                               <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                 {inactiveDishes.length}
                               </span>
                             </h4>
                           </div>
                           
                                                       {inactiveDishes.map((dish) => {
                              const dishVariants = getVariantsByDish(dish.id);
                              const isDishExpanded = expandedDishes.has(dish.id);
                              const hasVariants = dishVariants.length > 0;

                              return (
                                <div key={dish.id} className="border border-gray-200 rounded-lg bg-gray-50">
                                  {/* Header del platillo inactivo */}
                                  <div className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        {hasVariants && (
                                          <button
                                            onClick={() => toggleDish(dish.id)}
                                            className="p-1 hover:bg-gray-200 rounded"
                                          >
                                            {isDishExpanded ? (
                                              <ChevronDown className="w-4 h-4 text-gray-500" />
                                            ) : (
                                              <ChevronRight className="w-4 h-4 text-gray-500" />
                                            )}
                                          </button>
                                        )}
                                        <div className="flex items-center space-x-2">
                                          <ChefHat className="w-4 h-4 text-gray-500" />
                                          <span className="font-medium text-gray-900">{dish.name}</span>
                                          <span className="text-sm text-gray-500">${dish.price}</span>
                                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                            Inactivo
                                          </span>
                                          {hasVariants && (
                                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                              {dishVariants.length} variante{dishVariants.length !== 1 ? 's' : ''}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openModal('dish', dish)}
                                          className="text-blue-600 hover:text-blue-900"
                                          title="Editar"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleHardDeleteDish(dish)}
                                          className="text-red-800 hover:text-red-950 bg-red-50"
                                          title="Eliminar Permanentemente"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Contenido expandible de variantes inactivas */}
                                  {hasVariants && isDishExpanded && (
                                    <div className="p-3 bg-gray-100 border-t border-gray-200 space-y-2">
                                      <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
                                        <p className="text-sm font-medium text-red-800">
                                          Variantes de este platillo inactivo
                                        </p>
                                        <p className="text-xs text-red-600">
                                          Estas variantes también están inactivas
                                        </p>
                                      </div>
                                      
                                      {dishVariants.map((variant) => (
                                        <div key={variant.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                          <div className="flex items-center space-x-2">
                                            <Utensils className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium text-gray-900">{variant.name}</span>
                                            <span className="text-sm text-gray-500">
                                              ${(dishes.find(d => d.id === variant.dish_id)?.price || 0) + (variant.price_adjustment || 0)}
                                              {variant.price_adjustment && variant.price_adjustment !== 0 && (
                                                <span className={`text-xs ${variant.price_adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                  {variant.price_adjustment > 0 ? ` (+${variant.price_adjustment})` : ` (${variant.price_adjustment})`}
                                                </span>
                                              )}
                                            </span>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                              variant.active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                              {variant.active ? 'Activa' : 'Inactiva'}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => openModal('variant', variant, { dishId: variant.dish_id })}
                                              className="text-blue-600 hover:text-blue-900"
                                              title="Editar"
                                            >
                                              <Edit className="w-4 h-4" />
                                            </Button>
                                            
                                            {variant.active ? (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteVariant(variant)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Eliminar (Pone como Inactiva)"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            ) : (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleHardDeleteVariant(variant)}
                                                className="text-red-800 hover:text-red-950 bg-red-50"
                                                title="Eliminar Permanentemente"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                         </div>
                       );
                     })()}
                   </div>
                 )}
               </Card>
             );
           })}

           {/* Paginación */}
           {totalPages > 1 && (
             <div className="flex items-center justify-center space-x-2 mt-6">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => handlePageChange(currentPage - 1)}
                 disabled={currentPage === 1}
               >
                 Anterior
               </Button>
               
               {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                 <Button
                   key={page}
                   variant={currentPage === page ? "primary" : "outline"}
                   size="sm"
                   onClick={() => handlePageChange(page)}
                   className="w-10 h-10 p-0"
                 >
                   {page}
                 </Button>
               ))}
               
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => handlePageChange(currentPage + 1)}
                 disabled={currentPage === totalPages}
               >
                 Siguiente
               </Button>
             </div>
           )}
         </>
       );
     })()}
   </div>

             {/* Modales */}
       {modalType === 'category' && (
         <Modal
           isOpen={true}
           onClose={closeModal}
           title={editingItem ? 'Editar Categoría' : 'Nueva Categoría'}
           size="md"
         >
           <CategoryForm
             initialData={editingItem as CategoryFormData}
             onSubmit={handleCategorySubmit}
             onCancel={closeModal}
             loading={isSubmitting}
           />
         </Modal>
       )}

       {modalType === 'dish' && (
         <Modal
           isOpen={true}
           onClose={closeModal}
           title={editingItem ? 'Editar Platillo' : 'Nuevo Platillo'}
           size="md"
         >
           <DishForm
             initialData={editingItem as DishFormData}
             categories={categories}
             onSubmit={handleDishSubmit}
             onCancel={closeModal}
             loading={isSubmitting}
             preSelectedCategoryId={editingItem ? undefined : modalContext.categoryId}
           />
         </Modal>
       )}

               {modalType === 'variant' && (
          <Modal
            isOpen={true}
            onClose={closeModal}
            title={editingItem ? 'Editar Variante' : 'Nueva Variante'}
            size="md"
          >
            <VariantForm
              initialData={editingItem as VariantFormData}
              dishes={dishes}
              onSubmit={handleVariantSubmit}
              onCancel={closeModal}
              loading={isSubmitting}
              preSelectedDishId={editingItem ? undefined : modalContext.dishId}
            />
          </Modal>
        )}

                                  {modalType === 'multiple-variants' && (
                   <Modal
                     isOpen={true}
                     onClose={closeModal}
                     title="Agregar Variantes al Platillo"
                     size="lg"
                   >
                    <DynamicVariantsForm
                      dish={editingItem as Dish}
                      onSubmit={handleDynamicVariantsSubmit}
                      onCancel={closeModal}
                      loading={isSubmitting}
                                         />
                   </Modal>
                 )}


     </div>
   );
 }

