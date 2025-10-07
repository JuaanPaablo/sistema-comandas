'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  ChefHat,
  Package,
  Calculator,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  TrendingUp,
  Filter,
  List,
  Grid,
  X
} from 'lucide-react';
import { InventoryItemService, InventoryService, InventoryCategoryService, BatchService } from '@/lib/services/inventoryService';
import { RecipeService } from '@/lib/services/recipeService';
import { DishService, VariantService } from '@/lib/services/menuService';
import { Recipe, RecipeFormData, Dish, Variant, InventoryItem } from '@/lib/types';
import { usePagination } from '@/hooks/usePagination';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

const recipeSchema = z.object({
  dish_id: z.string().min(1, 'El platillo es requerido'),
  variant_id: z.string().optional(),
  inventory_id: z.string().min(1, 'Selecciona un inventario'),
  category_id: z.string().min(1, 'Selecciona una categoría'),
  inventory_item_id: z.string().min(1, 'Selecciona un producto'),
  batch_id: z.string().optional(),
  quantity: z.number().min(0.001, 'La cantidad debe ser mayor a 0'),
  unit: z.string().min(1, 'La unidad es requerida'),
  active: z.boolean()
});

type RecipeWithDetails = Recipe & {
  dish_name: string;
  variant_name?: string;
  ingredient_name: string;
  ingredient_unit: string;
  current_stock: number;
  can_produce: number;
  cost_per_unit: number;
  total_cost: number;
  suggested_price: number;
  profit: number;
  profit_margin: number;
  selected_batch?: any; // Lote seleccionado por FIFO
};

export default function RecipesModule() {
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeWithDetails[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [allVariants, setAllVariants] = useState<Variant[]>([]);
  const [filteredVariants, setFilteredVariants] = useState<Variant[]>([]);
  const [ingredients, setIngredients] = useState<InventoryItem[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDish, setSelectedDish] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);
  
  // Estados para vista (tabla o tarjetas)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Estados para modal de filtros
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    dish: '',
    variant: ''
  });

  const {
    register: registerRecipe,
    handleSubmit: handleSubmitRecipe,
    reset: resetRecipe,
    watch,
    setValue,
    formState: { errors: recipeErrors }
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      dish_id: '',
      variant_id: '',
      inventory_item_id: '',
      batch_id: '',
      quantity: 0,
      unit: '',
      active: true
    }
  });

  const watchedDishId = watch('dish_id');
  const watchedInventoryId = watch('inventory_id');
  const watchedCategoryId = watch('category_id');
  const watchedIngredientId = watch('inventory_item_id');


  // Actualizar unit cuando se selecciona un ingrediente
  useEffect(() => {
    if (watchedIngredientId) {
      const selectedIngredient = ingredients.find(ing => ing.id === watchedIngredientId);
      if (selectedIngredient) {
        setValue('unit', selectedIngredient.unit);
      }
    }
  }, [watchedIngredientId, ingredients, setValue]);

  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [recipesRes, dishesRes, variantsRes, inventoriesRes, categoriesRes] = await Promise.all([
        RecipeService.getAll(),
        DishService.getAll(),
        VariantService.getAll(),
        InventoryService.getAll(),
        InventoryCategoryService.getAll()
      ]);

      // Cargar ingredientes con relaciones
      const ingredientsRes = await InventoryItemService.getAll();
      let enrichedIngredients: any[] = [];
      
      if (ingredientsRes.data) {
        // Enriquecer ingredientes con relaciones
        enrichedIngredients = await Promise.all(
          ingredientsRes.data.map(async (item) => {
            const inventory = inventoriesRes.data?.find(inv => inv.id === item.inventory_id);
            const category = categoriesRes.data?.find(cat => cat.id === item.category_id);
            
            // Cargar lotes para este producto
            const batchesRes = await BatchService.getByItem(item.id);
            const batches = batchesRes.data || [];
            
            // Calcular stock total
            const totalStock = batches.reduce((sum, batch) => sum + (batch.quantity || 0), 0);
            
            return {
              ...item,
              inventory,
              category,
              batches,
              stock: totalStock
            };
          })
        );
        setIngredients(enrichedIngredients);
      }

      // Procesar recetas DESPUÉS de cargar ingredientes
      if (recipesRes.data && dishesRes && enrichedIngredients.length > 0) {
        // Enriquecer recetas con detalles
        const enrichedRecipes = recipesRes.data.map(recipe => {
          const dish = dishesRes.find(d => d.id === recipe.dish_id);
          const variant = variantsRes?.find(v => v.id === recipe.variant_id);
          const ingredient = enrichedIngredients.find(i => i.id === recipe.inventory_item_id);
          
          // Usar el stock calculado correctamente desde los ingredientes enriquecidos
          const currentStock = ingredient?.stock || 0;
          const canProduce = currentStock > 0 ? Math.floor(currentStock / recipe.quantity) : 0;
          
          // 🚀 SISTEMA FIFO AUTOMÁTICO - Usar cost_per_unit del lote
          let costPerUnit = 0;
          let selectedBatch = null;
          
          if (ingredient?.batches && ingredient.batches.length > 0) {
            // Si la receta tiene un lote específico, usar ese
            if (recipe.batch_id) {
              selectedBatch = ingredient.batches.find(batch => batch.id === recipe.batch_id);
              costPerUnit = selectedBatch?.cost_per_unit || 0;
            } else {
              // 🎯 FIFO: Usar el lote más próximo a caducar con stock > 0
              const availableBatches = ingredient.batches
                .filter(batch => batch.quantity > 0)
                .sort((a, b) => {
                  // Ordenar por fecha de caducidad (más próximo primero)
                  const dateA = new Date(a.expiry_date || '9999-12-31');
                  const dateB = new Date(b.expiry_date || '9999-12-31');
                  return dateA.getTime() - dateB.getTime();
                });
              
              if (availableBatches.length > 0) {
                selectedBatch = availableBatches[0];
                costPerUnit = selectedBatch.cost_per_unit || 0;
              }
            }
          }
          
          const totalCost = recipe.quantity * costPerUnit;
          
          // Cálculos adicionales para la interfaz
          const profitMargin = 0.6; // 60% de margen
          const suggestedPrice = totalCost > 0 ? totalCost / (1 - profitMargin) : 0;
          const profit = suggestedPrice - totalCost;

          return {
            ...recipe,
            dish_name: dish?.name || 'Platillo desconocido',
            variant_name: variant?.name,
            ingredient_name: ingredient?.name || 'Ingrediente desconocido',
            ingredient_unit: ingredient?.unit || 'unidad',
            current_stock: currentStock,
            can_produce: canProduce,
            cost_per_unit: costPerUnit,
            total_cost: totalCost,
            suggested_price: suggestedPrice,
            profit: profit,
            profit_margin: profitMargin,
            selected_batch: selectedBatch // Para debugging
          };
        });

        setRecipes(enrichedRecipes);
        setFilteredRecipes(enrichedRecipes);
      }

      setDishes(dishesRes);

      setAllVariants(variantsRes);
      setFilteredVariants(variantsRes);

      if (inventoriesRes.data) {
        setInventories(inventoriesRes.data);
      }

      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar variantes por platillo seleccionado
  useEffect(() => {
    if (watchedDishId) {
      const dishVariants = allVariants.filter(variant => variant.dish_id === watchedDishId);
      setFilteredVariants(dishVariants);
    } else {
      setFilteredVariants(allVariants);
    }
  }, [watchedDishId, allVariants]);

  // Filtrar recetas
  useEffect(() => {
    let filtered = recipes;

    if (searchTerm) {
      filtered = filtered.filter(recipe =>
        recipe.dish_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.variant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDish) {
      filtered = filtered.filter(recipe => recipe.dish_id === selectedDish);
    }

    if (selectedVariant) {
      filtered = filtered.filter(recipe => recipe.variant_id === selectedVariant);
    }

    setFilteredRecipes(filtered);
  }, [searchTerm, selectedDish, selectedVariant, recipes]);

  // Hook de paginación
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedRecipes,
    goToPage,
    resetPage
  } = usePagination({ data: filteredRecipes || [], itemsPerPage: 10 });

  // Funciones para modal de filtros
  const openFilterModal = () => {
    setActiveFilters({
      dish: selectedDish,
      variant: selectedVariant
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setSelectedDish(activeFilters.dish);
    setSelectedVariant(activeFilters.variant);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({ dish: '', variant: '' });
    setSelectedDish('');
    setSelectedVariant('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.dish) count++;
    if (activeFilters.variant) count++;
    return count;
  };

  // Abrir modal para crear/editar receta
  const openRecipeModal = useCallback((recipe?: Recipe) => {
    if (createButtonLoading) return;
    
    setCreateButtonLoading(true);
    
    setTimeout(() => {
      if (recipe) {
        setEditingRecipe(recipe);
        resetRecipe({
          dish_id: recipe.dish_id,
          variant_id: recipe.variant_id || '',
          inventory_item_id: recipe.inventory_item_id,
          batch_id: recipe.batch_id || '',
          quantity: recipe.quantity,
          unit: recipe.unit,
          active: recipe.active
        });
      } else {
        setEditingRecipe(null);
        resetRecipe();
      }
      setShowRecipeModal(true);
      setCreateButtonLoading(false);
    }, 100);
  }, [createButtonLoading, resetRecipe]);

  // Cerrar modal
  const closeRecipeModal = () => {
    setShowRecipeModal(false);
    setEditingRecipe(null);
    resetRecipe();
  };

  // Crear o actualizar receta
  const onSubmitRecipe = useCallback(async (data: RecipeFormData) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Obtener la unidad del ingrediente seleccionado
      const selectedIngredient = ingredients.find(ing => ing.id === data.inventory_item_id);
      if (!selectedIngredient) {
        throw new Error('Ingrediente no encontrado');
      }

      const recipeData = {
        dish_id: data.dish_id,
        variant_id: data.variant_id || null,
        inventory_item_id: data.inventory_item_id,
        batch_id: data.batch_id || null, // Incluir batch_id para lote específico
        quantity: data.quantity,
        unit: selectedIngredient.unit,
        active: data.active
      };
      
      let response;
      if (editingRecipe) {
        response = await RecipeService.update(editingRecipe.id, recipeData);
      } else {
        response = await RecipeService.create(recipeData);
      }
      
      if (response.data) {
        toast.success('Receta guardada exitosamente');
        await loadData();
        closeRecipeModal();
      } else if (response.error) {
        console.error('Error de Supabase:', response.error);
        toast.error(`Error al guardar receta: ${response.error.message || 'Error desconocido'}`);
      } else {
        console.error('Respuesta inesperada:', response);
        toast.error('Error desconocido al guardar receta');
      }
    } catch (error) {
      console.error('Error guardando receta:', error);
      toast.error('Error inesperado al guardar la receta');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, ingredients, editingRecipe, loadData]);

  // Eliminar receta
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
      try {
        const response = await RecipeService.delete(id);
        if (response.data) {
          await loadData();
        }
      } catch (error) {
        console.error('Error eliminando receta:', error);
      }
    }
  };

  // Obtener estado de producción
  const getProductionStatus = (canProduce: number) => {
    if (canProduce === 0) {
      return { status: 'no-stock', color: 'bg-red-100 text-red-800', label: 'Sin stock', icon: XCircle };
    } else if (canProduce < 5) {
      return { status: 'low-stock', color: 'bg-yellow-100 text-yellow-800', label: 'Stock bajo', icon: AlertTriangle };
    } else {
      return { status: 'good', color: 'bg-green-100 text-green-800', label: 'Disponible', icon: CheckCircle };
    }
  };

  // Agrupar recetas por platillo
  const groupRecipesByDish = (recipes: RecipeWithDetails[]) => {
    const grouped = recipes.reduce((acc, recipe) => {
      const dishName = recipe.dish_name;
      if (!acc[dishName]) {
        acc[dishName] = {
          dish: recipe,
          recipes: []
        };
      }
      acc[dishName].recipes.push(recipe);
      return acc;
    }, {} as Record<string, { dish: RecipeWithDetails; recipes: RecipeWithDetails[] }>);

    return Object.values(grouped);
  };

  // 🚀 SISTEMA FIFO AUTOMÁTICO - Actualizar recetas cuando se acabe un lote
  const updateRecipesWithFIFO = async () => {
    try {
      console.log('🔄 Verificando actualizaciones FIFO automáticas...');
      
      for (const recipe of recipes) {
        const ingredient = ingredients.find(i => i.id === recipe.inventory_item_id);
        if (!ingredient?.batches) continue;

        // Verificar si el lote actual tiene stock
        const currentBatch = ingredient.batches.find(batch => batch.id === recipe.batch_id);
        const hasStock = currentBatch && currentBatch.quantity > 0;

        if (!hasStock && recipe.batch_id) {
          // 🎯 Buscar siguiente lote por FIFO
          const availableBatches = ingredient.batches
            .filter(batch => batch.quantity > 0)
            .sort((a, b) => {
              const dateA = new Date(a.expiry_date || '9999-12-31');
              const dateB = new Date(b.expiry_date || '9999-12-31');
              return dateA.getTime() - dateB.getTime();
            });

          if (availableBatches.length > 0) {
            const nextBatch = availableBatches[0];
            console.log(`🔄 Actualizando receta ${recipe.id}: Lote ${recipe.batch_id} → ${nextBatch.id}`);
            
            // Actualizar la receta con el nuevo lote
            await RecipeService.update(recipe.id, {
              ...recipe,
              batch_id: nextBatch.id
            });
          } else {
            console.log(`⚠️ No hay lotes disponibles para la receta ${recipe.id}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error en actualización FIFO automática:', error);
    }
  };

  // Ejecutar FIFO automático cada vez que se cargan los datos
  useEffect(() => {
    if (recipes.length > 0 && ingredients.length > 0) {
      updateRecipesWithFIFO();
    }
  }, [recipes, ingredients]);

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="px-12 py-8 mb-12">
      {/* Toolbar unificado */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar recetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 px-6 pl-12 text-gray-900 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        {/* Filtros */}
        <Button
          onClick={openFilterModal}
          variant="outline"
          className="h-12 px-6 text-gray-700 border-gray-300 hover:bg-gray-50"
        >
          <Filter className="w-5 h-5 mr-2" />
          Filtros
          {getActiveFiltersCount() > 0 && (
            <span className="ml-2 bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
              {getActiveFiltersCount()}
            </span>
          )}
        </Button>

        {/* Vista */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <Button
            onClick={() => setViewMode('table')}
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            className={`px-4 ${viewMode === 'table' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
          >
            <List className="w-4 h-4 mr-2" />
            Lista
          </Button>
          <Button
            onClick={() => setViewMode('cards')}
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            className={`px-4 ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
          >
            <Grid className="w-4 h-4 mr-2" />
            Tarjetas
          </Button>
        </div>

        {/* Nueva Receta */}
        <Button
          onClick={() => openRecipeModal()}
          disabled={createButtonLoading}
          className="h-12 px-6 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
        >
          {createButtonLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Abriendo...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              Nueva Receta
            </>
          )}
        </Button>
      </div>

      {/* Contenido principal */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-900 mt-4 text-lg">Cargando recetas...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-16">
          <div className="p-6 bg-purple-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No hay recetas</h3>
          <p className="text-gray-600 mb-8 text-lg">Crea recetas para conectar tu menú con el inventario</p>
          <Button 
            onClick={() => openRecipeModal()}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8 py-3 text-lg shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear Primera Receta
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <>
          {/* Vista organizada por platillos */}
          <div className="space-y-6">
            {groupRecipesByDish(paginatedRecipes).map((group, groupIndex) => (
              <Card key={groupIndex} className="overflow-hidden">
                {/* Header del platillo */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <ChefHat className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{group.dish.dish_name}</h3>
                        <p className="text-sm text-gray-600">
                          {group.recipes.length} ingrediente{group.recipes.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Producción mínima</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {Math.min(...group.recipes.map(r => r.can_produce))} unidades
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla de ingredientes del platillo */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Variante
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ingrediente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producción
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Costo Unit.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio Sug.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ganancia
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.recipes.map((recipe) => {
                        const productionStatus = getProductionStatus(recipe.can_produce);
                        return (
                          <tr key={recipe.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {recipe.variant_name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-6 w-6 rounded bg-green-100 flex items-center justify-center mr-3">
                                  <Package className="h-4 w-4 text-green-600" />
                                </div>
                                <span className="text-sm text-gray-900">{recipe.ingredient_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {recipe.quantity} {recipe.ingredient_unit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <Package className="w-4 h-4 text-blue-500 mr-2" />
                                <span className={recipe.current_stock > 0 ? 'text-green-600 font-medium' : 'text-red-600'}>
                                  {recipe.current_stock} {recipe.ingredient_unit}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <Calculator className="w-4 h-4 text-purple-500 mr-2" />
                                <span className={recipe.can_produce > 0 ? 'text-green-600 font-medium' : 'text-red-600'}>
                                  {recipe.can_produce} unidades
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 text-orange-500 mr-2" />
                                <span className="font-medium">
                                  ${recipe.cost_per_unit.toFixed(2)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <TrendingUp className="w-4 h-4 text-blue-500 mr-2" />
                                <span className="font-medium text-blue-600">
                                  ${recipe.suggested_price.toFixed(2)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                                <span className="font-medium text-green-600">
                                  ${recipe.profit.toFixed(2)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${productionStatus.color}`}>
                                <productionStatus.icon className="w-3 h-3 mr-1" />
                                {productionStatus.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRecipeModal(recipe)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(recipe.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>

          {/* Paginación */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredRecipes.length}
            itemsPerPage={10}
            onPageChange={goToPage}
            itemType="recetas"
          />
        </>
      ) : (
        /* Vista de tarjetas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedRecipes.map((recipe) => {
            const productionStatus = getProductionStatus(recipe.can_produce);
            return (
              <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <ChefHat className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">{recipe.dish_name}</CardTitle>
                        {recipe.variant_name && (
                          <p className="text-sm text-gray-600">{recipe.variant_name}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${productionStatus.color}`}>
                      <productionStatus.icon className="w-3 h-3 mr-1" />
                      {productionStatus.label}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Ingrediente */}
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{recipe.ingredient_name}</p>
                      <p className="text-sm text-gray-600">{recipe.quantity} {recipe.ingredient_unit}</p>
                    </div>
                  </div>

                  {/* Stock y Producción */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Package className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Stock</p>
                      <p className={`font-bold ${recipe.current_stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {recipe.current_stock} {recipe.ingredient_unit}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Calculator className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">Producción</p>
                      <p className={`font-bold ${recipe.can_produce > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {recipe.can_produce} unidades
                      </p>
                    </div>
                  </div>

                  {/* Costos */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-600">Costo Unit.</span>
                      </div>
                      <span className="font-medium">${recipe.cost_per_unit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Precio Sug.</span>
                      </div>
                      <span className="font-medium text-blue-600">${recipe.suggested_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">Ganancia</span>
                      </div>
                      <span className="font-medium text-green-600">${recipe.profit.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRecipeModal(recipe)}
                      className="flex-1 text-purple-600 hover:text-purple-700 border-purple-300 hover:border-purple-400"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(recipe.id)}
                      className="flex-1 text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Paginación para vista de tarjetas */}
      {!isLoading && filteredRecipes.length > 0 && viewMode === 'cards' && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredRecipes.length}
            itemsPerPage={10}
            onPageChange={goToPage}
            itemType="recetas"
          />
        </div>
      )}

      {/* Modal local para crear/editar receta */}
      {showRecipeModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeRecipeModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ChefHat className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {editingRecipe ? 'Editar Receta' : 'Nueva Receta'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {editingRecipe ? 'Modifica los datos de la receta' : 'Completa la información de la nueva receta'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={closeRecipeModal}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Contenido */}
            <div className="px-8 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmitRecipe(onSubmitRecipe)} className="space-y-8">
                {/* Primera fila: Platillo y Variante */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <ChefHat className="w-4 h-4 inline mr-2 text-purple-600" />
                      Platillo <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...registerRecipe('dish_id')}
                      className={`w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500 ${recipeErrors.dish_id ? 'border-red-500' : ''}`}
                    >
                      <option value="">Seleccionar platillo</option>
                      {dishes.map((dish) => (
                        <option key={dish.id} value={dish.id}>
                          {dish.name}
                        </option>
                      ))}
                    </select>
                    {recipeErrors.dish_id && (
                      <p className="text-red-500 text-sm mt-2">{recipeErrors.dish_id.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Package className="w-4 h-4 inline mr-2 text-purple-600" />
                      Variante (Opcional)
                    </label>
                    <select
                      {...registerRecipe('variant_id')}
                      disabled={!watchedDishId || filteredVariants.length === 0}
                      className={`w-full h-12 px-4 border border-gray-300 rounded-lg text-gray-900 focus:border-purple-500 focus:ring-purple-500 ${!watchedDishId || filteredVariants.length === 0 ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
                    >
                      <option value="">
                        {!watchedDishId 
                          ? 'Primero selecciona un platillo' 
                          : filteredVariants.length === 0 
                            ? 'Este platillo no tiene variantes' 
                            : 'Seleccionar variante'
                        }
                      </option>
                      {filteredVariants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Segunda fila: Inventario y Categoría */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Package className="w-4 h-4 inline mr-2 text-purple-600" />
                      Inventario <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...registerRecipe('inventory_id')}
                      className={`w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500 ${recipeErrors.inventory_id ? 'border-red-500' : ''}`}
                    >
                      <option value="">Seleccionar inventario</option>
                      {inventories.map((inventory) => (
                        <option key={inventory.id} value={inventory.id}>
                          {inventory.name}
                        </option>
                      ))}
                    </select>
                    {recipeErrors.inventory_id && (
                      <p className="text-red-500 text-sm mt-2">{recipeErrors.inventory_id.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Package className="w-4 h-4 inline mr-2 text-purple-600" />
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...registerRecipe('category_id')}
                      disabled={!watchedInventoryId}
                      className={`w-full h-12 px-4 border border-gray-300 rounded-lg text-gray-900 focus:border-purple-500 focus:ring-purple-500 ${!watchedInventoryId ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
                    >
                      <option value="">
                        {!watchedInventoryId ? 'Primero selecciona un inventario' : 'Seleccionar categoría'}
                      </option>
                      {categories
                        .filter(category => category.inventory_id === watchedInventoryId)
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                    </select>
                    {recipeErrors.category_id && (
                      <p className="text-red-500 text-sm mt-2">{recipeErrors.category_id.message}</p>
                    )}
                  </div>
                </div>

                {/* Tercera fila: Producto y Lote */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Package className="w-4 h-4 inline mr-2 text-purple-600" />
                      Producto <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...registerRecipe('inventory_item_id')}
                      disabled={!watchedCategoryId}
                      className={`w-full h-12 px-4 border border-gray-300 rounded-lg text-gray-900 focus:border-purple-500 focus:ring-purple-500 ${!watchedCategoryId ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
                    >
                      <option value="">
                        {!watchedCategoryId ? 'Primero selecciona una categoría' : 'Seleccionar producto'}
                      </option>
                      {ingredients
                        .filter(item => item.category_id === watchedCategoryId)
                        .map((ingredient) => (
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} - Stock: {ingredient.stock} {ingredient.unit}
                          </option>
                        ))}
                    </select>
                    {recipeErrors.inventory_item_id && (
                      <p className="text-red-500 text-sm mt-2">{recipeErrors.inventory_item_id.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Package className="w-4 h-4 inline mr-2 text-purple-600" />
                      Lote (Opcional)
                    </label>
                    <select
                      {...registerRecipe('batch_id')}
                      disabled={!watchedIngredientId}
                      className={`w-full h-12 px-4 border border-gray-300 rounded-lg text-gray-900 focus:border-purple-500 focus:ring-purple-500 ${!watchedIngredientId ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
                    >
                      <option value="">
                        {!watchedIngredientId ? 'Primero selecciona un producto' : 'Seleccionar lote específico'}
                      </option>
                      {ingredients
                        .find(item => item.id === watchedIngredientId)
                        ?.batches?.filter(batch => batch.quantity > 0)
                        .map((batch) => (
                          <option key={batch.id} value={batch.id}>
                            {batch.batch_number} - {batch.quantity} {ingredients.find(i => i.id === watchedIngredientId)?.unit} 
                            {batch.expiry_date && ` (Vence: ${new Date(batch.expiry_date).toLocaleDateString()})`}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      Si no seleccionas un lote específico, se usará el sistema FIFO
                    </p>
                  </div>
                </div>

                {/* Cuarta fila: Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-3">
                    <Calculator className="w-4 h-4 inline mr-2 text-purple-600" />
                    Cantidad <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...registerRecipe('quantity', { valueAsNumber: true })}
                      className={`w-full h-12 px-4 pr-20 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500 ${recipeErrors.quantity ? 'border-red-500' : ''} ${!watchedIngredientId ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                      placeholder="0.00"
                      disabled={!watchedIngredientId}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className="text-gray-500 text-sm font-medium">
                        {ingredients.find(i => i.id === watchedIngredientId)?.unit || 'unidad'}
                      </span>
                    </div>
                  </div>
                  {recipeErrors.quantity && (
                    <p className="text-red-500 text-sm mt-2">{recipeErrors.quantity.message}</p>
                  )}
                  {watchedIngredientId && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <Package className="w-4 h-4 inline mr-1" />
                        Stock disponible: <span className="font-semibold">{ingredients.find(i => i.id === watchedIngredientId)?.stock || 0} {ingredients.find(i => i.id === watchedIngredientId)?.unit || 'unidad'}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer con botones */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={closeRecipeModal}
                    className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <ChefHat className="w-4 h-4 mr-2" />
                        {editingRecipe ? 'Actualizar Receta' : 'Crear Receta'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de filtros */}
      {showFilterModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFilterModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Filter className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Filtros de Recetas</h2>
                    <p className="text-sm text-gray-600">Selecciona los filtros que deseas aplicar</p>
                  </div>
                </div>
                <Button
                  onClick={closeFilterModal}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Contenido */}
            <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Filtro por Platillo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platillo
                  </label>
                  <select
                    value={activeFilters.dish}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, dish: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">Todos los platillos</option>
                    {dishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Variante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variante
                  </label>
                  <select
                    value={activeFilters.variant}
                    onChange={(e) => setActiveFilters(prev => ({ ...prev, variant: e.target.value }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="">Todas las variantes</option>
                    {allVariants
                      .filter(variant => !activeFilters.dish || variant.dish_id === activeFilters.dish)
                      .map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Limpiar Filtros
                </Button>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={closeFilterModal}
                    variant="outline"
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={applyFilters}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      </div>
    </>
  );
}
