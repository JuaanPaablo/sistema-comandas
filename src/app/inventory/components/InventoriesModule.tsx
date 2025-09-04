'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  Warehouse, 
  Plus, 
  Edit, 
  Trash2, 
  Search
} from 'lucide-react';
import { InventoryService } from '@/lib/services/inventoryService';
import { Inventory, InventoryFormData } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const inventorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  active: z.boolean().default(true)
});

export default function InventoriesModule() {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [filteredInventories, setFilteredInventories] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: '',
      active: true
    }
  });

  // Cargar inventarios
  const loadInventories = async () => {
    try {
      setIsLoading(true);
      const response = await InventoryService.getAllWithInactive();
      if (response.data) {
        setInventories(response.data);
        setFilteredInventories(response.data);
      }
    } catch (error) {
      console.error('Error cargando inventarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventories();
  }, []);

  // Filtrar inventarios por búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredInventories(inventories);
    } else {
      const filtered = inventories.filter(inventory =>
        inventory.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInventories(filtered);
    }
  }, [searchTerm, inventories]);

  // Abrir modal para crear/editar
  const openModal = (inventory?: Inventory) => {
    if (inventory) {
      setEditingInventory(inventory);
      reset({
        name: inventory.name,
        active: inventory.active
      });
    } else {
      setEditingInventory(null);
      reset({
        name: '',
        active: true
      });
    }
    setShowModal(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setEditingInventory(null);
    reset();
  };

  // Crear o actualizar inventario
  const onSubmit = async (data: InventoryFormData) => {
    try {
      setIsSubmitting(true);
      
      if (editingInventory) {
        // Actualizar
        const response = await InventoryService.update(editingInventory.id, data);
        if (response.data) {
          await loadInventories();
          closeModal();
        }
      } else {
        // Crear
        const response = await InventoryService.create(data);
        if (response.data) {
          await loadInventories();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error guardando inventario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar inventario (soft delete)
  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este inventario?')) {
      try {
        const response = await InventoryService.delete(id);
        if (response.data) {
          await loadInventories();
        }
      } catch (error) {
        console.error('Error eliminando inventario:', error);
      }
    }
  };

  // Eliminar permanentemente
  const handleHardDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar PERMANENTEMENTE este inventario? Esta acción no se puede deshacer.')) {
      try {
        const response = await InventoryService.hardDelete(id);
        if (response.data === null) {
          await loadInventories();
        }
      } catch (error) {
        console.error('Error eliminando permanentemente:', error);
      }
    }
  };

  // Separar inventarios activos e inactivos
  const activeInventories = filteredInventories.filter(inv => inv.active);
  const inactiveInventories = filteredInventories.filter(inv => !inv.active);

  return (
    <div className="p-6">
      {/* Barra de búsqueda y botón nuevo */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="search-inventories"
            type="text"
            placeholder="Buscar inventarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => openModal()} size="sm" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Inventario
        </Button>
      </div>

      {/* Inventarios Activos */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Inventarios Activos ({activeInventories.length})
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando inventarios...</p>
          </div>
        ) : activeInventories.length === 0 ? (
          <Card className="p-8 text-center">
            <Warehouse className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No hay inventarios activos</h4>
            <p className="text-gray-600 mb-4">Crea tu primer inventario para comenzar a organizar tu stock</p>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primer Inventario
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
                {activeInventories.map((inventory) => (
                  <tr key={inventory.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Warehouse className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{inventory.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Activo
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(inventory.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(inventory)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(inventory.id)}
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

      {/* Inventarios Inactivos */}
      {inactiveInventories.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Inventarios Inactivos ({inactiveInventories.length})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-50 border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Nombre
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
                {inactiveInventories.map((inventory) => (
                  <tr key={inventory.id} className="hover:bg-gray-100">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Warehouse className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-500">{inventory.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Inactivo
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(inventory.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(inventory)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Reactivar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHardDelete(inventory.id)}
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
        title={editingInventory ? 'Editar Inventario' : 'Nuevo Inventario'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="inventory-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Inventario
            </label>
            <Input
              id="inventory-name"
              {...register('name')}
              placeholder="Ej: Cocina Principal, Bar, Almacén"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Solo mostrar casilla "activo" cuando se está editando un inventario inactivo */}
          {editingInventory && !editingInventory.active && (
            <div className="flex items-center">
              <input
                id="inventory-active"
                type="checkbox"
                {...register('active')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="inventory-active" className="ml-2 block text-sm text-gray-700">
                Reactivar Inventario
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (editingInventory ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
