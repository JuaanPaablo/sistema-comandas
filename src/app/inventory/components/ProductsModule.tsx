'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search
} from 'lucide-react';
import { InventoryItemService, InventoryService, InventoryCategoryService } from '@/lib/services/inventoryService';
import { InventoryItem, Inventory, InventoryCategory, InventoryItemFormData } from '@/lib/types';
import { usePagination } from '@/hooks/usePagination';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Tipo extendido para productos con stock calculado
type InventoryItemWithStock = InventoryItem & { current_stock: number };

const inventoryItemSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  inventory_id: z.string().min(1, 'El inventario es requerido'),
  category_id: z.string().min(1, 'La categoría es requerida'),
  unit: z.string().min(1, 'La unidad es requerida'),
  stock: z.number().min(0, 'El stock no puede ser negativo'),
  min_stock: z.number().min(0, 'El stock mínimo no puede ser negativo'),
  unit_price: z.number().min(0.01, 'El precio debe ser mayor a 0'),
  expiry_date: z.string()
    .min(1, 'La fecha de caducidad es requerida')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
      return selectedDate >= today;
    }, 'La fecha de caducidad debe ser hoy o en el futuro'),
  active: z.boolean()
});

const unitOptions = [
  { value: 'g', label: 'Gramos (g)' },
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'units', label: 'Unidades' },
  { value: 'boxes', label: 'Cajas' },
  { value: 'packs', label: 'Paquetes' }
];

export default function ProductsModule() {
  const [products, setProducts] = useState<InventoryItemWithStock[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<InventoryItemWithStock[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<InventoryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInventory, setSelectedInventory] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: '',
      inventory_id: '',
      category_id: '',
      unit: 'units',
      stock: 0,
      min_stock: 0,
      unit_price: 0,
      expiry_date: '',
      active: true
    }
  });

  const watchedInventoryId = watch('inventory_id');

  // Filtrar categorías para el formulario basándose en el inventario seleccionado
  const formFilteredCategories = watchedInventoryId 
    ? categories.filter(category => category.inventory_id === watchedInventoryId)
    : categories;

  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [productsRes, inventoriesRes, categoriesRes] = await Promise.all([
        InventoryItemService.getAllWithStock(),
        InventoryService.getAll(),
        InventoryCategoryService.getAll()
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (inventoriesRes.data) setInventories(inventoriesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar categorías por inventario seleccionado
  useEffect(() => {
    if (selectedInventory) {
      const filtered = categories.filter(category => category.inventory_id === selectedInventory);
      setFilteredCategories(filtered);
      // Resetear categoría seleccionada si no está disponible en el inventario actual
      if (selectedCategory && !filtered.find(cat => cat.id === selectedCategory)) {
        setSelectedCategory('');
      }
    } else {
      setFilteredCategories(categories);
    }
  }, [selectedInventory, categories, selectedCategory]);

  // Resetear categoría cuando cambie el inventario en el formulario
  useEffect(() => {
    if (watchedInventoryId) {
      setValue('category_id', '');
    }
  }, [watchedInventoryId, setValue]);

  // Filtrar productos
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedInventory) {
      filtered = filtered.filter(product => product.inventory_id === selectedInventory);
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedInventory, selectedCategory, products]);

  // Hook de paginación
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedProducts,
    goToPage,
    resetPage
  } = usePagination({ data: filteredProducts || [], itemsPerPage: 10 });



  // Abrir modal para crear/editar
  const openModal = (product?: InventoryItem) => {
    if (product) {
      setEditingProduct(product);
      reset({
        name: product.name,
        inventory_id: product.inventory_id,
        category_id: product.category_id,
        unit: product.unit,
        stock: product.stock,
        min_stock: product.min_stock,
        unit_price: product.unit_price,
        expiry_date: product.expiry_date || '',
        active: product.active
      });
    } else {
      setEditingProduct(null);
      reset({
        name: '',
        inventory_id: '',
        category_id: '',
        unit: 'units',
        stock: 0,
        min_stock: 0,
        unit_price: 0,
        expiry_date: '',
        active: true
      });
    }
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    reset();
  };

  // Crear o actualizar producto
  const onSubmit = async (data: InventoryItemFormData) => {
    try {
      setIsSubmitting(true);
      
              if (editingProduct) {
          // Actualizar - solo campos del producto, no del lote
          const cleanData = {
            name: data.name,
            inventory_id: data.inventory_id,
            category_id: data.category_id,
            unit: data.unit,
            min_stock: data.min_stock,
            active: data.active
          };
          
          const response = await InventoryItemService.update(editingProduct.id, cleanData);
          if (response.data) {
            await loadData();
            closeModal();
          }
        } else {
          // Crear - usar el nuevo método con lote automático
          const response = await InventoryItemService.createWithInitialBatch(data);
          if (response.data) {
            await loadData();
            closeModal();
          }
        }
    } catch (error) {
      console.error('Error guardando producto:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar producto (soft delete)
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        const response = await InventoryItemService.delete(id);
        if (response.data) {
          await loadData();
        }
      } catch (error) {
        console.error('Error eliminando producto:', error);
      }
    }
  };

  // Eliminar permanentemente
  const handleHardDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar PERMANENTEMENTE este producto? Esta acción no se puede deshacer.')) {
      try {
        const response = await InventoryItemService.hardDelete(id);
        if (response.data === null) {
          await loadData();
        }
      } catch (error) {
        console.error('Error eliminando permanentemente:', error);
      }
    }
  };

  // Obtener nombres para mostrar
  const getInventoryName = (id: string) => {
    return inventories.find(inv => inv.id === id)?.name || 'N/A';
  };

  const getCategoryName = (id: string) => {
    return categories.find(cat => cat.id === id)?.name || 'N/A';
  };

  // Separar productos activos e inactivos para conteos
  const activeProductsCount = filteredProducts.filter(product => product.active).length;
  const inactiveProductsCount = filteredProducts.filter(product => !product.active).length;

  return (
    <div className="p-6">
      {/* Barra de búsqueda y botón nuevo */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search-products"
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              id="filter-inventory"
              value={selectedInventory}
              onChange={(e) => setSelectedInventory(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="">Todos los inventarios</option>
              {inventories.map((inventory) => (
                <option key={inventory.id} value={inventory.id}>
                  {inventory.name}
                </option>
              ))}
            </Select>
            
            <Select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="">Todas las categorías</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        
        <Button onClick={() => openModal()} size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Productos Activos */}
      <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Productos Activos ({activeProductsCount})
          </h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-900 mt-2">Cargando productos...</p>
          </div>
        ) : activeProductsCount === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No hay productos activos</h4>
                          <p className="text-gray-900 mb-4">Crea tu primer producto para comenzar a gestionar tu inventario</p>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Producto
            </Button>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Inventario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProducts.filter(p => p.active).map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getInventoryName(product.inventory_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCategoryName(product.category_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.current_stock} {product.unit}
                      </div>
                      {product.min_stock > 0 && (
                        <div className="text-xs text-gray-500">
                          Mín: {product.min_stock} {product.unit}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(product)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Productos Inactivos */}
      {inactiveProductsCount > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Productos Inactivos ({inactiveProductsCount})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-50 border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Inventario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-50 divide-y divide-gray-200">
                {paginatedProducts.filter(p => !p.active).map((product) => (
                  <tr key={product.id} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-500">{product.name}</div>
                          <div className="text-sm text-gray-400">{product.unit}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getInventoryName(product.inventory_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getCategoryName(product.category_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {product.current_stock} {product.unit}
                      </div>
                      {product.min_stock > 0 && (
                        <div className="text-xs text-gray-400">
                          Mín: {product.min_stock} {product.unit}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Inactivo
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(product)}
                          className="text-green-600 hover:text-green-700"
                        >
                          Reactivar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHardDelete(product.id)}
                          className="text-red-600 hover:text-red-700 border-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredProducts.length}
        itemsPerPage={10}
        onPageChange={goToPage}
        itemType="productos"
      />

      {/* Modal para crear/editar */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto
            </label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ej: Tomates, Leche, Pan"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inventory_id" className="block text-sm font-medium text-gray-700 mb-1">
                Inventario
              </label>
              <Select
                id="inventory_id"
                {...register('inventory_id')}
                className={errors.inventory_id ? 'border-red-500' : ''}
              >
                <option value="">Seleccionar inventario</option>
                {inventories.map((inventory) => (
                  <option key={inventory.id} value={inventory.id}>
                    {inventory.name}
                  </option>
                ))}
              </Select>
              {errors.inventory_id && (
                <p className="text-red-500 text-sm mt-1">{errors.inventory_id.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <Select
                id="category_id"
                {...register('category_id')}
                className={errors.category_id ? 'border-red-500' : ''}
              >
                <option value="">Seleccionar categoría</option>
                {formFilteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
              {errors.category_id && (
                <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                Unidad
              </label>
              <Select
                id="unit"
                {...register('unit')}
                className={errors.unit ? 'border-red-500' : ''}
              >
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {errors.unit && (
                <p className="text-red-500 text-sm mt-1">{errors.unit.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Actual
              </label>
              <Input
                id="stock"
                type="number"
                {...register('stock', { valueAsNumber: true })}
                min="0"
                step="0.01"
                className={errors.stock ? 'border-red-500' : ''}
              />
              {errors.stock && (
                <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="min_stock" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Mínimo
              </label>
              <Input
                id="min_stock"
                type="number"
                {...register('min_stock', { valueAsNumber: true })}
                min="0"
                step="0.01"
                className={errors.min_stock ? 'border-red-500' : ''}
              />
              {errors.min_stock && (
                <p className="text-red-500 text-sm mt-1">{errors.min_stock.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700 mb-1">
                Precio Unitario
              </label>
              <Input
                id="unit_price"
                type="number"
                {...register('unit_price', { valueAsNumber: true })}
                min="0"
                step="0.01"
                placeholder="0.00"
                className={errors.unit_price ? 'border-red-500' : ''}
              />
              {errors.unit_price && (
                <p className="text-red-500 text-sm mt-1">{errors.unit_price.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Vencimiento
              </label>
              <Input
                id="expiry_date"
                type="date"
                {...register('expiry_date')}
                className={errors.expiry_date ? 'border-red-500' : ''}
              />
              {errors.expiry_date && (
                <p className="text-red-500 text-sm mt-1">{errors.expiry_date.message}</p>
              )}
            </div>
          </div>

          {/* Solo mostrar casilla "activo" cuando se está editando un producto inactivo */}
          {editingProduct && !editingProduct.active && (
            <div className="flex items-center">
              <input
                id="active"
                type="checkbox"
                {...register('active')}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                Reactivar Producto
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (editingProduct ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
