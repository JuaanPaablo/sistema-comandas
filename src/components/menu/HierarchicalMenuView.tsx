'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, Edit, Trash2, ChefHat, Utensils, Package, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CategoryForm } from './CategoryForm';
import { DishForm } from './DishForm';
import { VariantForm } from './VariantForm';
import { DynamicVariantsForm } from './DynamicVariantsForm';

import { CategoryService, DishService, VariantService, Category, Dish, Variant } from '@/lib/services/menuService';
import { CategoryFormData, DishFormData, VariantFormData } from '@/lib/types';
import { useSupabaseMenu } from '@/hooks/useSupabaseMenu';

interface HierarchicalMenuViewProps {
  onRefresh?: () => void;
}


// Componente para platillos
function SortableDish({ 
  dish, 
  dishVariants, 
  isDishExpanded, 
  onToggleDish, 
  onOpenModal, 
  onDeleteDish, 
  onDeleteVariant, 
  onHardDeleteVariant, 
  dishes 
}: {
  dish: Dish;
  dishVariants: Variant[];
  isDishExpanded: boolean;
  onToggleDish: (id: string) => void;
  onOpenModal: (type: 'category' | 'dish' | 'variant' | 'multiple-variants', item?: Category | Dish | Variant, context?: { categoryId?: string; dishId?: string; isNew?: boolean }) => void;
  onDeleteDish: (dish: Dish) => void;
  onDeleteVariant: (variant: Variant) => void;
  onHardDeleteVariant: (variant: Variant) => void;
  dishes: Dish[];
}) {
  return (
    <div className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group">
      {/* Header de platillo clickeable y compacto */}
      <div className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 group-hover:from-blue-50 group-hover:to-indigo-50 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div 
              className="flex items-center space-x-2 cursor-pointer flex-1"
              onClick={() => onToggleDish(dish.id)}
            >
              <div className="p-1 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors duration-200">
                <Utensils className="w-3 h-3 text-green-600" />
              </div>
              <div className="flex items-center space-x-2">
                {isDishExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-600" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                )}
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-green-900 transition-colors duration-200">
                  {dish.name}
                </h4>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                ${dish.price.toFixed(2)}
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                dish.active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {dish.active ? 'Activo' : 'Inactivo'}
              </span>
              <span className="text-xs text-gray-500">
                {dishVariants.length} var{dishVariants.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenModal('multiple-variants', undefined, { dishId: dish.id, isNew: true })}
              className="h-7 w-7 p-0 bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 shadow-sm"
              title="Agregar variantes"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenModal('dish', dish, { isNew: false })}
              className="h-7 w-7 p-0 bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100 hover:border-yellow-300 hover:text-yellow-700 shadow-sm"
              title="Editar platillo"
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeleteDish(dish)}
              className="h-7 w-7 p-0 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 shadow-sm"
              title="Eliminar platillo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido expandible del platillo */}
      {isDishExpanded && (
        <div className="p-3 bg-white">
          {/* Información de variantes */}
          {dishVariants.length > 0 && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="text-xs font-medium text-blue-900 mb-1">VARIANTES ACTIVAS {dishVariants.length}</h5>
              <p className="text-xs text-blue-700">
                Selecciona 1 de {dishVariants.length} variantes disponibles
              </p>
            </div>
          )}

          {/* Lista de variantes */}
          {dishVariants.length > 0 && (
            <div className="space-y-1">
              {dishVariants.map((variant) => (
                <div key={variant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                  <div className="flex items-center space-x-2">
                    <Utensils className="w-3 h-3 text-gray-500" />
                    <span className="text-sm text-gray-900">{variant.name}</span>
                    <span className="text-xs text-gray-500">
                      ${(dish.price + variant.price_adjustment).toFixed(2)}
                      {variant.price_adjustment !== 0 && (
                        <span className="text-gray-400">
                          ({variant.price_adjustment > 0 ? '+' : ''}{variant.price_adjustment.toFixed(2)})
                        </span>
                      )}
                    </span>
                    <span className={`inline-flex px-1 py-0.5 text-xs font-medium rounded-full ${
                      variant.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {variant.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenModal('variant', variant, { dishId: dish.id, isNew: false })}
                      className="h-6 w-6 p-0 bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100 hover:border-yellow-300 hover:text-yellow-700 shadow-sm"
                      title="Editar variante"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteVariant(variant)}
                      className="h-6 w-6 p-0 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 shadow-sm"
                      title="Eliminar variante"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mensaje si no hay variantes */}
          {dishVariants.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Utensils className="w-6 h-6 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No hay variantes para este platillo</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenModal('multiple-variants', undefined, { dishId: dish.id, isNew: true })}
                className="mt-2"
              >
                Agregar Variantes
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// Componente para categorías arrastrables
function SortableCategory({ 
  category, 
  categoryDishes, 
  isCategoryExpanded, 
  expandedDishes, 
  onToggleCategory, 
  onToggleDish, 
  onOpenModal, 
  onDeleteCategory, 
  onHardDeleteCategory, 
  onDeleteDish, 
  onHardDeleteDish, 
  onDeleteVariant, 
  onHardDeleteVariant, 
  onReassignDish, 
  dishes, 
  variants, 
  getDishesByCategory, 
  getVariantsByDish 
}: {
  category: Category;
  categoryDishes: Dish[];
  isCategoryExpanded: boolean;
  expandedDishes: Set<string>;
  onToggleCategory: (id: string) => void;
  onToggleDish: (id: string) => void;
  onOpenModal: (type: 'category' | 'dish' | 'variant' | 'multiple-variants', item?: Category | Dish | Variant, context?: { categoryId?: string; dishId?: string; isNew?: boolean }) => void;
  onDeleteCategory: (category: Category) => void;
  onHardDeleteCategory: (category: Category) => void;
  onDeleteDish: (dish: Dish) => void;
  onHardDeleteDish: (dish: Dish) => void;
  onDeleteVariant: (variant: Variant) => void;
  onHardDeleteVariant: (variant: Variant) => void;
  onReassignDish: (dishId: string, newCategoryId: string) => void;
  dishes: Dish[];
  variants: Variant[];
  getDishesByCategory: (categoryId: string) => Dish[];
  getVariantsByDish: (dishId: string) => Variant[];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group ${isDragging ? 'opacity-50 scale-105 shadow-xl' : ''}`}
    >
      {/* Header de categoría clickeable y compacto */}
      <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 group-hover:from-blue-50 group-hover:to-indigo-50 transition-all duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              {...attributes}
              {...listeners}
              className="p-2 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing transition-colors duration-200"
              title="Arrastra para reordenar"
            >
              <GripVertical className="w-4 h-4 text-gray-500 hover:text-gray-700" />
            </div>
            <div 
              className="flex items-center space-x-2 cursor-pointer flex-1"
              onClick={() => onToggleCategory(category.id)}
            >
              <div className="p-1 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                <Package className="w-3 h-3 text-blue-600" />
              </div>
              <div className="flex items-center space-x-2">
                {isCategoryExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-200">
                  {category.name}
                </h3>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                category.active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {category.active ? 'Activa' : 'Inactiva'}
              </span>
              <span className="text-sm text-gray-500">
                {categoryDishes.length} platillo{categoryDishes.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenModal('dish', undefined, { categoryId: category.id, isNew: true })}
              className="text-blue-600 hover:text-blue-900 hover:bg-blue-100 p-2"
              title="Agregar platillo"
            >
              <Plus className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenModal('category', category)}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2"
              title="Editar categoría"
            >
              <Edit className="w-4 h-4" />
            </Button>
            
            {category.active ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteCategory(category)}
                className="text-red-600 hover:text-red-900 hover:bg-red-100 p-2"
                title="Eliminar categoría"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onHardDeleteCategory(category)}
                className="text-red-800 hover:text-red-950 hover:bg-red-100 p-2"
                title="Eliminar permanentemente"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido expandible de platillos */}
      {isCategoryExpanded && (
        <div className="p-3 space-y-3">
          {/* Sección de Platillos Activos */}
          <div className="space-y-2">
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
                      onClick={() => onOpenModal('dish', undefined, { categoryId: category.id, isNew: true })}
                      className="mt-2"
                    >
                      Agregar Primer Platillo
                    </Button>
                  </div>
                );
              }
              
              return (
                <div className="space-y-2">
                  {activeDishes.map((dish) => {
                    const dishVariants = getVariantsByDish(dish.id);
                    const isDishExpanded = expandedDishes.has(dish.id);

                    return (
                      <SortableDish
                        key={dish.id}
                        dish={dish}
                        dishVariants={dishVariants}
                        isDishExpanded={isDishExpanded}
                        onToggleDish={onToggleDish}
                        onOpenModal={onOpenModal}
                        onDeleteDish={onDeleteDish}
                        onDeleteVariant={onDeleteVariant}
                        onHardDeleteVariant={onHardDeleteVariant}
                        dishes={dishes}
                      />
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export function HierarchicalMenuView({ onRefresh }: HierarchicalMenuViewProps) {
  // Hook de Supabase Real-time para datos del menú
  const { categories, dishes, variants, loading: isLoading, error, isConnected } = useSupabaseMenu();
  
  // Estados para UI
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedDishes, setExpandedDishes] = useState<Set<string>>(new Set());
  const [expandedUncategorized, setExpandedUncategorized] = useState(false);
  
  // Estados para drag & drop
  const [sortedCategories, setSortedCategories] = useState<Category[]>([]);
  
  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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

  // Estado para el modal de confirmación
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    loading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    loading: false
  });

  // Los datos se cargan automáticamente con el hook useRealtimeMenu
  
  // Sincronizar categorías ordenadas cuando cambian las categorías
  useEffect(() => {
    setSortedCategories(categories);
  }, [categories]);
  
  // Función para manejar el final del drag & drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedCategories.findIndex((item) => item.id === active.id);
      const newIndex = sortedCategories.findIndex((item) => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Actualizar el estado local inmediatamente
        const newOrder = arrayMove(sortedCategories, oldIndex, newIndex);
        setSortedCategories(newOrder);
        
        // Actualizar en la base de datos
        try {
          const orderUpdate = newOrder.map((cat, index) => ({ 
            id: cat.id, 
            order: index 
          }));
          
          console.log('🔄 Actualizando orden de categorías:', orderUpdate);
          console.log('📊 Estado actual de categorías:', categories.map(c => ({ id: c.id, name: c.name, order: c.order })));
          
          const result = await CategoryService.updateOrder(orderUpdate);
          
          console.log('📝 Resultado de la actualización:', result);
          
          if (result.error) {
            console.error('❌ Error actualizando orden:', result.error);
            // Revertir el cambio si hay error
            setSortedCategories(categories);
            alert(`Error al actualizar el orden de las categorías: ${JSON.stringify(result.error)}`);
          } else {
            console.log('✅ Orden actualizado exitosamente');
            // Refrescar los datos para sincronizar con la base de datos
            onRefresh?.();
          }
          
        } catch (error) {
          console.error('💥 Error actualizando orden de categorías:', error);
          // Revertir el cambio si hay error
          setSortedCategories(categories);
          alert(`Error al actualizar el orden de las categorías: ${error}`);
        }
      }
    }
  };
  
  // Separar platos con y sin categoría
  const dishesWithCategory = dishes.filter(dish => dish.category_id);
  const dishesWithoutCategory = dishes.filter(dish => !dish.category_id);
  

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

  const toggleUncategorized = () => {
    setExpandedUncategorized(!expandedUncategorized);
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
    setConfirmationModal({
      isOpen: true,
      title: 'Eliminar Categoría',
      message: `¿Estás seguro de que quieres eliminar la categoría "${category.name}"?\n\nLos platos asociados quedarán sin categoría y podrás reasignarlos después.`,
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, loading: true }));
        try {
          const response = await CategoryService.delete(category.id);
          if (response.data) {
            setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            onRefresh?.();
          } else if (response.error) {
            alert(`Error: ${response.error}`);
            setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
          }
        } catch (error) {
          console.error('Error eliminando categoría:', error);
          alert('Error al eliminar la categoría');
          setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  // Función para reasignar plato a categoría
  const handleReassignDish = async (dishId: string, newCategoryId: string) => {
    try {
      const result = await DishService.update(dishId, { category_id: newCategoryId });
      if (result.error) {
        alert(`Error reasignando plato: ${result.error}`);
        return;
      }
      
      onRefresh?.();
    } catch (error) {
      console.error('Error reasignando plato:', error);
      alert('Error reasignando plato');
    }
  };

  const handleHardDeleteCategory = async (category: Category) => {
    console.log('🔄 Ejecutando handleHardDeleteCategory mejorado para:', category.name);
    
    // Obtener platillos de la categoría
    const categoryDishes = getDishesByCategory(category.id);
    console.log('📊 Platillos encontrados:', categoryDishes);
    
    // Crear mensaje informativo
    let message = `⚠️ ADVERTENCIA: Esta acción NO se puede deshacer.\n\n¿Estás SEGURO de que quieres eliminar PERMANENTEMENTE la categoría "${category.name}"?\n\n`;
    
    if (categoryDishes.length > 0) {
      message += `Esta acción eliminará la categoría y los siguientes ${categoryDishes.length} platillo${categoryDishes.length !== 1 ? 's' : ''}:\n\n`;
      categoryDishes.forEach((dish, index) => {
        message += `${index + 1}. ${dish.name} - $${dish.price}\n`;
      });
      message += `\nTodos los platillos y sus variantes asociadas serán eliminados PERMANENTEMENTE de la base de datos.`;
    } else {
      message += `Esta categoría no tiene platillos asociados, solo se eliminará la categoría.`;
    }
    
    console.log('💬 Mensaje generado:', message);
    
    // Mostrar modal de confirmación personalizado
    setConfirmationModal({
      isOpen: true,
      title: 'Eliminar Categoría Permanentemente',
      message: message,
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, loading: true }));
        try {
          const response = await CategoryService.hardDelete(category.id);
          if (response.data) {
            setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            onRefresh?.();
          }
        } catch (error) {
          console.error('Error eliminando permanentemente la categoría:', error);
          alert('Error al eliminar permanentemente la categoría');
          setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  const handleDeleteDish = async (dish: Dish) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Eliminar Platillo',
      message: `¿Estás seguro de que quieres eliminar el platillo "${dish.name}"?\n\nEsta acción lo pondrá como "Inactivo" y podrás recuperarlo después.`,
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, loading: true }));
        try {
          const response = await DishService.delete(dish.id);
          if (response.data) {
            setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            onRefresh?.();
          }
        } catch (error) {
          console.error('Error eliminando platillo:', error);
          alert('Error al eliminar el platillo');
          setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  const handleHardDeleteDish = async (dish: Dish) => {
    console.log('🔄 Ejecutando handleHardDeleteDish mejorado para:', dish.name);
    
    // Obtener variantes del platillo
    const dishVariants = getVariantsByDish(dish.id);
    console.log('📊 Variantes encontradas:', dishVariants);
    
    // Crear mensaje informativo
    let message = `⚠️ ADVERTENCIA: Esta acción NO se puede deshacer.\n\n¿Estás SEGURO de que quieres eliminar PERMANENTEMENTE el platillo "${dish.name}"?\n\n`;
    
    if (dishVariants.length > 0) {
      message += `Esta acción eliminará el platillo y las siguientes ${dishVariants.length} variante${dishVariants.length !== 1 ? 's' : ''}:\n\n`;
      dishVariants.forEach((variant, index) => {
        const totalPrice = dish.price + variant.price_adjustment;
        message += `${index + 1}. ${variant.name} - $${totalPrice.toFixed(2)}`;
        if (variant.price_adjustment !== 0) {
          message += ` (${variant.price_adjustment > 0 ? '+' : ''}${variant.price_adjustment})`;
        }
        message += `\n`;
      });
      message += `\nTodas las variantes serán eliminadas PERMANENTEMENTE de la base de datos.`;
    } else {
      message += `Este platillo no tiene variantes asociadas, solo se eliminará el platillo.`;
    }
    
    console.log('💬 Mensaje generado:', message);
    
    // Mostrar modal de confirmación personalizado
    setConfirmationModal({
      isOpen: true,
      title: 'Eliminar Platillo Permanentemente',
      message: message,
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, loading: true }));
        try {
          const response = await DishService.hardDelete(dish.id);
          if (response.data) {
            setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            onRefresh?.();
          }
        } catch (error) {
          console.error('Error eliminando permanentemente el platillo:', error);
          alert('Error al eliminar permanentemente el platillo');
          setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  const handleDeleteVariant = async (variant: Variant) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Eliminar Variante',
      message: `¿Estás seguro de que quieres eliminar la variante "${variant.name}"?\n\nEsta acción la pondrá como "Inactiva" y podrás recuperarla después.`,
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, loading: true }));
        try {
          const response = await VariantService.delete(variant.id);
          if (response.data) {
            setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            onRefresh?.();
          }
        } catch (error) {
          console.error('Error eliminando variante:', error);
          alert('Error al eliminar la variante');
          setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  const handleHardDeleteVariant = async (variant: Variant) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Eliminar Variante Permanentemente',
      message: `⚠️ ADVERTENCIA: Esta acción NO se puede deshacer.\n\n¿Estás SEGURO de que quieres eliminar PERMANENTEMENTE la variante "${variant.name}"?\n\nEsta acción eliminará la variante de la base de datos.`,
      onConfirm: async () => {
        setConfirmationModal(prev => ({ ...prev, loading: true }));
        try {
          const response = await VariantService.hardDelete(variant.id);
          if (response.data) {
            setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            onRefresh?.();
          }
        } catch (error) {
          console.error('Error eliminando permanentemente la variante:', error);
          alert('Error al eliminar permanentemente la variante');
          setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  // Funciones para toggle active
  const handleToggleCategoryActive = async (category: Category) => {
    try {
      const response = await CategoryService.toggleActive(category.id, !category.active);
      if (response.data) {
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

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold">Error al cargar el menú</h3>
            <p className="text-gray-600 mt-2">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header compacto y elegante */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menú</h1>
          <p className="text-gray-600 mt-1">Organiza tu carta de manera intuitiva</p>
        </div>
        
        {/* Indicadores de estado compactos */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'En vivo' : 'Offline'}
            </span>
          </div>
          
          <div className="text-sm text-gray-500">
            {categories.length} cat • {dishes.length} plat • {variants.length} var
          </div>
          
          <Button 
            onClick={() => openModal('category', undefined, { isNew: true })} 
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2 px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </Button>
        </div>
      </div>

      {/* Barra de búsqueda mejorada */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar categorías, platillos o variantes..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-0 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearch('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

       {/* Vista jerárquica */}
       <div className="space-y-4">
         {(() => {
           const { paginatedCategories, totalCategories, totalPages } = getPaginatedCategories(categories);
           
           if (categories.length === 0) {
             return (
               <Card className="p-16 text-center border-0 shadow-sm">
                 <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                   <ChefHat className="w-12 h-12 text-blue-500" />
                 </div>
                 <h3 className="text-2xl font-semibold text-gray-900 mb-3">¡Comienza a crear tu menú!</h3>
                 <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                   Organiza tu restaurante creando categorías para agrupar tus platillos y ofrecer una mejor experiencia a tus clientes.
                 </p>
                 <Button 
                   onClick={() => openModal('category', undefined, { isNew: true })}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                 >
                   <Plus className="w-5 h-5 mr-2" />
                   Crear Primera Categoría
                 </Button>
               </Card>
             );
           }

           if (searchTerm && paginatedCategories.length === 0) {
             return (
               <Card className="p-16 text-center border-0 shadow-sm">
                 <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                   <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                 </div>
                 <h3 className="text-2xl font-semibold text-gray-900 mb-3">No se encontraron resultados</h3>
                 <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                   No hay categorías que coincidan con "<span className="font-medium text-gray-900">{searchTerm}</span>". 
                   Intenta con otros términos o crea una nueva categoría.
                 </p>
                 <div className="flex flex-col sm:flex-row gap-3 justify-center">
                   <Button 
                     variant="outline" 
                     onClick={() => handleSearch('')}
                     className="px-6 py-3 border-gray-300 hover:bg-gray-50"
                   >
                     Limpiar búsqueda
                   </Button>
                   <Button 
                     onClick={() => openModal('category', undefined, { isNew: true })}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                   >
                     <Plus className="w-4 h-4 mr-2" />
                     Nueva categoría
                   </Button>
                 </div>
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

               {/* Lista de categorías con drag & drop en dos columnas */}
               <DndContext
                 sensors={sensors}
                 collisionDetection={closestCenter}
                 onDragEnd={handleDragEnd}
                 onDragStart={() => console.log('Drag started')}
                 onDragOver={() => console.log('Drag over')}
               >
                 <SortableContext
                   items={paginatedCategories.map(cat => cat.id)}
                   strategy={verticalListSortingStrategy}
                 >
                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" style={{ gridAutoRows: 'max-content' }}>
                     {paginatedCategories.map((category, index) => {
                       const categoryDishes = getDishesByCategory(category.id);
                       const isCategoryExpanded = expandedCategories.has(category.id);

            return (
              <div key={category.id} className="w-full">
                <SortableCategory
                  category={category}
                  categoryDishes={categoryDishes}
                  isCategoryExpanded={isCategoryExpanded}
                  expandedDishes={expandedDishes}
                  onToggleCategory={toggleCategory}
                  onToggleDish={toggleDish}
                  onOpenModal={openModal}
                  onDeleteCategory={handleDeleteCategory}
                  onHardDeleteCategory={handleHardDeleteCategory}
                  onDeleteDish={handleDeleteDish}
                  onHardDeleteDish={handleHardDeleteDish}
                  onDeleteVariant={handleDeleteVariant}
                  onHardDeleteVariant={handleHardDeleteVariant}
                  onReassignDish={handleReassignDish}
                  dishes={dishes}
                  variants={variants}
                  getDishesByCategory={getDishesByCategory}
                  getVariantsByDish={getVariantsByDish}
                />
              </div>
            );
          })}
                   </div>
                 </SortableContext>
               </DndContext>

           {/* Paginación */}
           {totalPages > 1 && (
             <div className="flex items-center justify-center space-x-2 mt-6">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => handlePageChange(currentPage - 1)}
                 disabled={currentPage === 1}
                 className="px-4 py-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-gray-100 disabled:border-gray-200 shadow-sm"
               >
                 Anterior
               </Button>
               
               {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                 <Button
                   key={page}
                   variant={currentPage === page ? "primary" : "outline"}
                   size="sm"
                   onClick={() => handlePageChange(page)}
                   className={`w-10 h-10 p-0 font-medium shadow-sm ${
                     currentPage === page 
                       ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700" 
                       : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                   }`}
                 >
                   {page}
                 </Button>
               ))}
               
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => handlePageChange(currentPage + 1)}
                 disabled={currentPage === totalPages}
                 className="px-4 py-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-gray-100 disabled:border-gray-200 shadow-sm"
               >
                 Siguiente
               </Button>
             </div>
           )}

           {/* Platos sin categoría */}
           {dishesWithoutCategory.length > 0 && (
             <Card className="mt-6 border-orange-200 bg-orange-50 overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 group">
               {/* Header clickeable y compacto */}
               <div 
                 className="p-3 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 cursor-pointer hover:from-orange-100 hover:to-orange-200 transition-all duration-200"
                 onClick={toggleUncategorized}
               >
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     <div className="flex items-center space-x-2">
                       {expandedUncategorized ? (
                         <ChevronDown className="w-4 h-4 text-orange-600" />
                       ) : (
                         <ChevronRight className="w-4 h-4 text-orange-600" />
                       )}
                       <div className="p-1 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors duration-200">
                         <Utensils className="w-4 h-4 text-orange-600" />
                       </div>
                       <h3 className="text-base font-semibold text-orange-900 group-hover:text-orange-800 transition-colors duration-200">
                         Platos sin categoría
                       </h3>
                     </div>
                     
                     <div className="flex items-center space-x-2">
                       <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-200 text-orange-800">
                         Requieren reasignación
                       </span>
                       <span className="text-sm text-orange-700">
                         {dishesWithoutCategory.length} platillo{dishesWithoutCategory.length !== 1 ? 's' : ''}
                       </span>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Contenido expandible */}
               {expandedUncategorized && (
                 <div className="p-4 bg-white">
                   <div className="space-y-3">
                     {dishesWithoutCategory.map((dish) => (
                       <div key={dish.id} className="flex items-center justify-between p-3 bg-gray-50 border border-orange-200 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                         <div className="flex items-center space-x-3">
                           <Utensils className="w-4 h-4 text-orange-500" />
                           <div>
                             <span className="font-medium text-gray-900">{dish.name}</span>
                             <span className="ml-2 text-sm font-semibold text-gray-600">${dish.price}</span>
                           </div>
                         </div>
                         <div className="flex items-center space-x-3">
                           <select
                             onChange={(e) => {
                               if (e.target.value) {
                                 handleReassignDish(dish.id, e.target.value);
                               }
                             }}
                             className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                             defaultValue=""
                           >
                             <option value="">Seleccionar categoría...</option>
                             {categories.map((category) => (
                               <option key={category.id} value={category.id}>
                                 {category.name}
                               </option>
                             ))}
                           </select>
                           
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => openModal('dish', dish)}
                             className="h-7 w-7 p-0 bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100 hover:border-yellow-300 hover:text-yellow-700 shadow-sm"
                             title="Editar platillo"
                           >
                             <Edit className="w-3.5 h-3.5" />
                           </Button>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </Card>
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
                      dish={editingItem as Dish || dishes.find(d => d.id === modalContext.dishId) || null}
                      onSubmit={handleDynamicVariantsSubmit}
                      onCancel={closeModal}
                      loading={isSubmitting}
                    />
                   </Modal>
                 )}

        {/* Modal de confirmación personalizado */}
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
          onConfirm={confirmationModal.onConfirm}
          title={confirmationModal.title}
          message={confirmationModal.message}
          confirmText="Eliminar Permanentemente"
          cancelText="Cancelar"
          variant="danger"
          loading={confirmationModal.loading}
        />

     </div>
   );
 }

