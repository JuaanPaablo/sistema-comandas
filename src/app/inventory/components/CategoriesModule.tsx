'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { 
  Tags, 
  Plus, 
  Edit, 
  Trash2, 
  Search
} from 'lucide-react';
import { InventoryCategoryService, InventoryService } from '@/lib/services/inventoryService';
import { InventoryCategory, InventoryCategoryFormData, Inventory } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  inventory_id: z.string().min(1, 'El inventario es requerido'),
  active: z.boolean().default(true)
});

export default function CategoriesModule() {
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<InventoryCategory[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<InventoryCategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      inventory_id: '',
      active: true
    }
  });

  // Cargar categorías e inventarios
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [categoriesRes, inventoriesRes] = await Promise.all([
        InventoryCategoryService.getAllWithInactive(),
        InventoryService.getAll()
      ]);
      
      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
        setFilteredCategories(categoriesRes.data);
      }
      
      if (inventoriesRes.data) {
        setInventories(inventoriesRes.data);
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

  // Filtrar categorías por búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  // Abrir modal para crear/editar
  const openModal = (category?: InventoryCategory) => {
    if (category) {
      setEditingCategory(category);
      reset({
        name: category.name,
        inventory_id: category.inventory_id,
        active: category.active
      });
    } else {
      setEditingCategory(null);
      reset({
        name: '',
        inventory_id: '',
        active: true
      });
    }
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    reset();
  };

  // Crear o actualizar categoría
  const onSubmit = async (data: InventoryCategoryFormData) => {
    try {
      setIsSubmitting(true);
      
      if (editingCategory) {
        // Actualizar
        const response = await InventoryCategoryService.update(editingCategory.id, data);
        if (response.data) {
          await loadData();
          closeModal();
        }
      } else {
        // Crear
        const response = await InventoryCategoryService.create(data);
        if (response.data) {
          await loadData();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error guardando categoría:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar categoría (soft delete)
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        const response = await InventoryCategoryService.delete(id);
        if (response.data) {
          await loadCategories();
        }
      } catch (error) {
        console.error('Error eliminando categoría:', error);
      }
    }
  };

  // Eliminar permanentemente
  const handleHardDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar PERMANENTEMENTE esta categoría? Esta acción no se puede deshacer.')) {
      try {
        const response = await InventoryCategoryService.hardDelete(id);
        if (response.data === null) {
          await loadCategories();
        }
      } catch (error) {
        console.error('Error eliminando permanentemente:', error);
      }
    }
  };

  // Separar categorías activas e inactivas
  const activeCategories = filteredCategories.filter(cat => cat.active);
  const inactiveCategories = filteredCategories.filter(cat => !cat.active);

  return (
    <div className="p-6">
      {/* Barra de búsqueda y botón nuevo */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="search-categories"
            type="text"
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => openModal()} size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {/* Categorías Activas */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Categorías Activas ({activeCategories.length})
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando categorías...</p>
          </div>
        ) : activeCategories.length === 0 ? (
          <Card className="p-8 text-center">
            <Tags className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No hay categorías activas</h4>
            <p className="text-gray-600 mb-4">Crea tu primera categoría para comenzar a organizar tus productos</p>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Categoría
            </Button>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Inventario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Fecha de Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <Tags className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {inventories.find(inv => inv.id === category.inventory_id)?.name || 'Sin inventario'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Activa
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(category.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(category)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
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

      {/* Categorías Inactivas */}
      {inactiveCategories.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Categorías Inactivas ({inactiveCategories.length})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-50 border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Inventario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Fecha de Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-50 divide-y divide-gray-200">
                {inactiveCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Tags className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-500">{category.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {inventories.find(inv => inv.id === category.inventory_id)?.name || 'Sin inventario'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Inactiva
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(category.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(category)}
                          className="text-green-600 hover:text-green-700"
                        >
                          Reactivar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHardDelete(category.id)}
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

      {/* Modal para crear/editar */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="category-inventory" className="block text-sm font-medium text-gray-900 mb-1">
              Inventario
            </label>
            <Select
              id="category-inventory"
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
            <label htmlFor="category-name" className="block text-sm font-medium text-gray-900 mb-1">
              Nombre de la Categoría
            </label>
            <Input
              id="category-name"
              {...register('name')}
              placeholder="Ej: Verduras, Carnes, Bebidas, Condimentos"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Solo mostrar casilla "activo" cuando se está editando una categoría inactiva */}
          {editingCategory && !editingCategory.active && (
            <div className="flex items-center">
              <input
                id="category-active"
                type="checkbox"
                {...register('active')}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="category-active" className="ml-2 block text-sm text-gray-700">
                Reactivar Categoría
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (editingCategory ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
