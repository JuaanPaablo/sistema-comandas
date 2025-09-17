'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
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
  TrendingUp
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
  // Eliminamos displayMode ya que solo usaremos tabla

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

  // Abrir modal para crear/editar receta
  const openRecipeModal = (recipe?: Recipe) => {
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
  };

  // Cerrar modal
  const closeRecipeModal = () => {
    setShowRecipeModal(false);
    setEditingRecipe(null);
    resetRecipe();
  };

  // Crear o actualizar receta
  const onSubmitRecipe = async (data: RecipeFormData) => {
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
  };

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
    <div className="p-6">
      {/* Header con controles */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Recetas</h2>
            <p className="text-sm text-gray-600 mt-1">
              Organizadas por platillo para mejor control
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              {filteredRecipes.length} receta{filteredRecipes.length !== 1 ? 's' : ''}
            </div>
            <Button onClick={() => openRecipeModal()} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Receta
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar recetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select
            value={selectedDish}
            onChange={(e) => setSelectedDish(e.target.value)}
          >
            <option value="">Todos los platillos</option>
            {dishes.map((dish) => (
              <option key={dish.id} value={dish.id}>
                {dish.name}
              </option>
            ))}
          </Select>

          <Select
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
            disabled={!selectedDish}
          >
            <option value="">Todas las variantes</option>
            {filteredVariants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name}
              </option>
            ))}
          </Select>

          <div className="text-sm text-gray-500 flex items-center">
            <Package className="w-4 h-4 mr-2" />
            Filtros activos
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-900 mt-2">Cargando recetas...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No hay recetas</h4>
          <p className="text-gray-900 mb-4">Crea recetas para conectar tu menú con el inventario</p>
          <Button onClick={() => openRecipeModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primera Receta
          </Button>
        </Card>
      ) : (
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
      )}

      {/* Modal para crear/editar receta */}
      <Modal
        isOpen={showRecipeModal}
        onClose={closeRecipeModal}
        title={editingRecipe ? 'Editar Receta' : 'Nueva Receta'}
      >
        <form onSubmit={handleSubmitRecipe(onSubmitRecipe)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platillo
              </label>
              <Select
                {...registerRecipe('dish_id')}
                className={recipeErrors.dish_id ? 'border-red-500' : ''}
              >
                <option value="">Seleccionar platillo</option>
                {dishes.map((dish) => (
                  <option key={dish.id} value={dish.id}>
                    {dish.name}
                  </option>
                ))}
              </Select>
              {recipeErrors.dish_id && (
                <p className="text-red-500 text-sm mt-1">{recipeErrors.dish_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variante (Opcional)
              </label>
              <Select
                {...registerRecipe('variant_id')}
                disabled={!watchedDishId || filteredVariants.length === 0}
                className={`${recipeErrors.variant_id ? 'border-red-500' : ''} ${!watchedDishId || filteredVariants.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
              </Select>
            </div>
          </div>

          {/* Selección de Inventario */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inventario <span className="text-red-500">*</span>
            </label>
            <Select
              {...registerRecipe('inventory_id')}
              className={`${recipeErrors.inventory_id ? 'border-red-500' : ''}`}
            >
              <option value="">Seleccionar inventario</option>
              {inventories.map((inventory) => (
                <option key={inventory.id} value={inventory.id}>
                  {inventory.name}
                </option>
              ))}
            </Select>
            {recipeErrors.inventory_id && (
              <p className="text-red-500 text-sm mt-1">{recipeErrors.inventory_id.message}</p>
            )}
          </div>

          {/* Selección de Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría <span className="text-red-500">*</span>
            </label>
            <Select
              {...registerRecipe('category_id')}
              disabled={!watchedInventoryId}
              className={`${recipeErrors.category_id ? 'border-red-500' : ''} ${!watchedInventoryId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
            </Select>
            {recipeErrors.category_id && (
              <p className="text-red-500 text-sm mt-1">{recipeErrors.category_id.message}</p>
            )}
          </div>

          {/* Selección de Producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto <span className="text-red-500">*</span>
            </label>
            <Select
              {...registerRecipe('inventory_item_id')}
              disabled={!watchedCategoryId}
              className={`${recipeErrors.inventory_item_id ? 'border-red-500' : ''} ${!watchedCategoryId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
            </Select>
            {recipeErrors.inventory_item_id && (
              <p className="text-red-500 text-sm mt-1">{recipeErrors.inventory_item_id.message}</p>
            )}
          </div>

          {/* Selección de Lote */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lote (Opcional)
            </label>
            <Select
              {...registerRecipe('batch_id')}
              disabled={!watchedIngredientId}
              className={`${!watchedIngredientId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Si no seleccionas un lote específico, se usará el sistema FIFO
            </p>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0"
                {...registerRecipe('quantity', { valueAsNumber: true })}
                className={`${recipeErrors.quantity ? 'border-red-500' : ''} pr-20`}
                placeholder="0.00"
                disabled={!watchedIngredientId}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm">
                  {ingredients.find(i => i.id === watchedIngredientId)?.unit || 'unidad'}
                </span>
              </div>
            </div>
            {recipeErrors.quantity && (
              <p className="text-red-500 text-sm mt-1">{recipeErrors.quantity.message}</p>
            )}
            {watchedIngredientId && (
              <p className="text-xs text-gray-500 mt-1">
                Stock disponible: {ingredients.find(i => i.id === watchedIngredientId)?.stock || 0} {ingredients.find(i => i.id === watchedIngredientId)?.unit || 'unidad'}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeRecipeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (editingRecipe ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
