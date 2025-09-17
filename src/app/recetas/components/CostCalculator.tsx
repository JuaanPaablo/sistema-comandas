'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { 
  TrendingUp, 
  ChefHat, 
  Package, 
  DollarSign,
  Search,
  Calculator,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { InventoryItemService } from '@/lib/services/inventoryService';
import { RecipeService } from '@/lib/services/recipeService';
import { DishService, VariantService } from '@/lib/services/menuService';
import { Recipe, Dish, Variant, InventoryItem } from '@/lib/types';

type CostAnalysis = {
  dish_id: string;
  dish_name: string;
  variant_id?: string;
  variant_name?: string;
  ingredients: {
    inventory_item_id: string;
    ingredient_name: string;
    required_quantity: number;
    unit: string;
    cost_per_unit: number;
    total_cost: number;
  }[];
  total_cost: number;
  selling_price: number;
  profit_margin: number;
  profit_percentage: number;
  status: 'profitable' | 'break-even' | 'loss';
};

export default function CostCalculator() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [allVariants, setAllVariants] = useState<Variant[]>([]);
  const [filteredVariants, setFilteredVariants] = useState<Variant[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<InventoryItem[]>([]);
  const [analysis, setAnalysis] = useState<CostAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDish, setSelectedDish] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [profitMargin, setProfitMargin] = useState<number>(30); // Margen de ganancia por defecto

  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [dishesRes, variantsRes, recipesRes, ingredientsRes] = await Promise.all([
        DishService.getAll(),
        VariantService.getAll(),
        RecipeService.getAll(),
        InventoryItemService.getAllWithStock()
      ]);

      setDishes(dishesRes);
      setAllVariants(variantsRes);
      setFilteredVariants(variantsRes);
      setRecipes(recipesRes);
      setIngredients(ingredientsRes);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calcular análisis de costos
  const calculateCosts = () => {
    if (!recipes.length || !ingredients.length || !dishes.length) return;

    const analysisMap = new Map<string, CostAnalysis>();

    recipes.forEach(recipe => {
      const dish = dishes.find(d => d.id === recipe.dish_id);
      const variant = variants.find(v => v.id === recipe.variant_id);
      const ingredient = ingredients.find(i => i.id === recipe.inventory_item_id);

      if (!dish || !ingredient) return;

      const key = recipe.variant_id ? `${recipe.dish_id}-${recipe.variant_id}` : recipe.dish_id;

      if (!analysisMap.has(key)) {
        analysisMap.set(key, {
          dish_id: recipe.dish_id,
          dish_name: dish.name,
          variant_id: recipe.variant_id || undefined,
          variant_name: variant?.name,
          ingredients: [],
          total_cost: 0,
          selling_price: dish.price,
          profit_margin: 0,
          profit_percentage: 0,
          status: 'profitable'
        });
      }

      const analysis = analysisMap.get(key)!;
      const costPerUnit = ingredient.unit_price || 0;
      const ingredientCost = costPerUnit * recipe.quantity;

      analysis.ingredients.push({
        inventory_item_id: recipe.inventory_item_id,
        ingredient_name: ingredient.name,
        required_quantity: recipe.quantity,
        unit: ingredient.unit,
        cost_per_unit: costPerUnit,
        total_cost: ingredientCost
      });

      analysis.total_cost += ingredientCost;
    });

    // Calcular márgenes de ganancia
    analysisMap.forEach(analysis => {
      const sellingPrice = analysis.selling_price;
      const costPrice = analysis.total_cost;
      
      analysis.profit_margin = sellingPrice - costPrice;
      analysis.profit_percentage = costPrice > 0 ? ((sellingPrice - costPrice) / costPrice) * 100 : 0;

      if (analysis.profit_margin > 0) {
        analysis.status = 'profitable';
      } else if (analysis.profit_margin === 0) {
        analysis.status = 'break-even';
      } else {
        analysis.status = 'loss';
      }
    });

    setAnalysis(Array.from(analysisMap.values()));
  };

  useEffect(() => {
    calculateCosts();
  }, [recipes, ingredients, dishes, allVariants]);

  // Filtrar análisis
  const filteredAnalysis = analysis.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.dish_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.variant_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDish = selectedDish === '' || item.dish_id === selectedDish;
    const matchesVariant = selectedVariant === '' || item.variant_id === selectedVariant;

    return matchesSearch && matchesDish && matchesVariant;
  });

  // Obtener estado visual
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'profitable':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Rentable' };
      case 'break-even':
        return { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Punto de equilibrio' };
      case 'loss':
        return { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Pérdida' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle, label: 'Desconocido' };
    }
  };

  // Calcular precio sugerido con margen
  const calculateSuggestedPrice = (totalCost: number) => {
    return totalCost * (1 + profitMargin / 100);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-900 mt-2">Cargando análisis de costos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header con controles */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Cálculo de Costos</h2>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Margen de ganancia:</label>
              <Input
                type="number"
                value={profitMargin}
                onChange={(e) => setProfitMargin(Number(e.target.value))}
                min="0"
                max="100"
                className="w-20"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            <Button onClick={calculateCosts} size="sm">
              <Calculator className="w-4 h-4 mr-2" />
              Recalcular
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar platillos..."
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
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Rentables</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analysis.filter(a => a.status === 'profitable').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Punto de equilibrio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analysis.filter(a => a.status === 'break-even').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Con pérdida</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analysis.filter(a => a.status === 'loss').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{analysis.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de análisis */}
      {filteredAnalysis.length === 0 ? (
        <Card className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No hay análisis disponibles</h4>
          <p className="text-gray-900 mb-4">Crea recetas primero para ver el análisis de costos</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAnalysis.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            const suggestedPrice = calculateSuggestedPrice(item.total_cost);
            return (
              <Card key={`${item.dish_id}-${item.variant_id || 'no-variant'}`} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <ChefHat className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.dish_name}</CardTitle>
                        {item.variant_name && (
                          <p className="text-sm text-gray-900">Variante: {item.variant_name}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">${item.selling_price.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">precio actual</p>
                      </div>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusInfo.color}`}>
                        <statusInfo.icon className="w-4 h-4 mr-1" />
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Información de costos y ganancias */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-800 mb-2">💰 Costo total</h5>
                        <p className="text-2xl font-bold text-gray-900">${item.total_cost.toFixed(2)}</p>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-800 mb-2">📈 Ganancia</h5>
                        <p className={`text-2xl font-bold ${item.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${item.profit_margin.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-800 mb-2">📊 Margen %</h5>
                        <p className={`text-2xl font-bold ${item.profit_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.profit_percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Precio sugerido */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="font-medium text-blue-800 mb-2">💡 Precio sugerido con {profitMargin}% de margen</h5>
                      <p className="text-2xl font-bold text-blue-900">${suggestedPrice.toFixed(2)}</p>
                      <p className="text-sm text-blue-700">
                        Ganancia: ${(suggestedPrice - item.total_cost).toFixed(2)}
                      </p>
                    </div>

                    {/* Lista de ingredientes */}
                    <div>
                      <h5 className="font-medium text-gray-800 mb-3">Ingredientes y costos</h5>
                      <div className="space-y-2">
                        {item.ingredients.map((ingredient) => (
                          <div key={ingredient.inventory_item_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center">
                                <Package className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{ingredient.ingredient_name}</p>
                                <p className="text-sm text-gray-500">
                                  {ingredient.required_quantity} {ingredient.unit}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                ${ingredient.cost_per_unit.toFixed(2)} / {ingredient.unit}
                              </p>
                              <p className="font-medium text-gray-900">
                                ${ingredient.total_cost.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
